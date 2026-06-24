import express from 'express';
import cors from 'cors';
import Genius from 'genius-lyrics';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const REQUEST_TIMEOUT_MS = 12000;
const MAX_INPUT_LENGTH = 120;
const MAX_LYRICS_LENGTH = 3000;

const Client = new Genius.Client(process.env.GENIUS_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.use(cors({
    origin: function (origin, callback) {

        if (!origin) return callback(null, true);

        if (origin === process.env.CLIENT_ORIGIN) {
            return callback(null, true);
        }

        if (origin.startsWith("http://localhost:")) {
            return callback(null, true);
        }

        if (origin.endsWith("vercel.app")) {
            return callback(null, true);
        }

        console.error(`CORS Blocked: The origin ${origin} is not allowed.`);
        return callback(new Error('CORS policy violation'), false);
    }
}));

app.use(express.json({ limit: "64kb" }));

function validateSongRequest(artist, song)
{
    const cleanArtist = typeof artist === "string" ? artist.trim() : "";
    const cleanSong = typeof song === "string" ? song.trim() : "";

    if (!cleanArtist || !cleanSong)
    {
        return { error: "Artist and song title are required." };
    }

    if (cleanArtist.length > MAX_INPUT_LENGTH || cleanSong.length > MAX_INPUT_LENGTH)
    {
        return { error: "Artist and song title must be shorter than 120 characters." };
    }

    return { artist: cleanArtist, song: cleanSong };
}

function withTimeout(promise, label, timeoutMs = REQUEST_TIMEOUT_MS)
{
    let timeoutId;
    const timeout = new Promise((_, reject) =>
    {
        timeoutId = setTimeout(() =>
        {
            reject(new Error(`${label} timed out.`));
        }, timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function fetchJsonWithTimeout(url, label)
{
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try
    {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok)
        {
            throw new Error(`${label} returned ${response.status}.`);
        }

        return await response.json();
    }
    finally
    {
        clearTimeout(timeoutId);
    }
}

function extractJsonObject(text)
{
    const cleanText = text.replace(/```json|```/g, "").trim();
    const firstBrace = cleanText.indexOf("{");
    const lastBrace = cleanText.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace)
    {
        throw new Error("AI response did not include JSON.");
    }

    return cleanText.slice(firstBrace, lastBrace + 1);
}

function normalizeAnalysis(aiData)
{
    const recommendations = Array.isArray(aiData.recommendations)
        ? aiData.recommendations.slice(0, 3).map((rec) => ({
            song: String(rec.song || "").trim(),
            artist: String(rec.artist || "").trim(),
            reason: String(rec.reason || "").trim()
        })).filter((rec) => rec.song && rec.artist)
        : [];

    return {
        score: Math.max(-10, Math.min(10, Number(aiData.score) || 0)),
        vibe: String(aiData.vibe || "Mixed mood").trim().slice(0, 60),
        themes: Array.isArray(aiData.themes)
            ? aiData.themes.slice(0, 3).map((theme) => String(theme).trim()).filter(Boolean)
            : [],
        meaning: String(aiData.meaning || "No meaning summary was generated.").trim(),
        recommendations
    };
}

async function generateWithRetry(prompt, retries = 3, delay = 2000) 
{
    for (let i = 0; i < retries; i++) 
    {
        try 
        {
            const result = await model.generateContent(prompt);
            return result;
        } catch (err) 
        {
            const isLastAttempt = i === retries - 1;
            if (err.message.includes("503") && !isLastAttempt) 
            {
                console.log(`Gemini busy (503). Retrying in ${delay/1000}s...`);
                await new Promise(res => setTimeout(res, delay));
                continue;
            }
            throw err;
        }
    }
}

app.post("/api/analyze", async (req, res) =>
{
    const requestData = validateSongRequest(req.body.artist, req.body.song);
    if (requestData.error)
    {
        return res.status(400).json({ success: false, error: requestData.error });
    }

    const { artist, song } = requestData;

    try 
    {
        console.log(`\nSearching for: ${song} by ${artist}`);

        const searches = await withTimeout(
            Client.songs.search(`${song} ${artist}`),
            "Genius search"
        );
        if (!searches || searches.length === 0) 
        {
            return res.status(404).json({ success: false, error: "Song not found." });
        }
        
        const firstSong = searches[0];

        await withTimeout(firstSong.fetch(), "Genius metadata fetch");

        const writers = (firstSong.writer_artists || []).map(p => p.name);
        const producers = (firstSong.producer_artists || []).map(p => p.name).slice(0, 3);
        const album = firstSong.album ? firstSong.album.name : null;

        console.log(`\n🔎 Metadata Found:`);
        console.log(`   - Date: ${firstSong.releasedAt}`);
        console.log(`   - Album: ${album || 'None'}`);
        console.log(`   - Producers: ${producers.length > 0 ? producers.join(', ') : 'None'}`);
        console.log(`   - Writers: ${writers.length > 0 ? writers.join(', ') : 'None'}`);


        let lyrics = "";
        try {
            // Attempt 1: Genius Web Scraper
            lyrics = await withTimeout(firstSong.lyrics(), "Genius lyrics fetch");
            console.log("Lyrics fetched from Genius");
        } 
        catch (err) {
            console.log(`Genius blocked (${err.message}). Engaging smart fallback...`);
            
            try {
                // 1. Clean the title to improve search accuracy
                // Removes things like "(feat. Artist)" or "- Remastered 2020"
                const cleanTitle = firstSong.title
                    .replace(/\s*\(.*?\)/g, '') 
                    .replace(/\s*-.*$/, '')    
                    .trim();
                
                const query = encodeURIComponent(`${firstSong.artist.name} ${cleanTitle}`);
                
                // 2. Use the Search endpoint instead of the Exact Get endpoint
                const fallbackResults = await fetchJsonWithTimeout(
                    `https://lrclib.net/api/search?q=${query}`,
                    "LRCLIB Search"
                );
                
                if (!fallbackResults || fallbackResults.length === 0) {
                    throw new Error("No results from fallback search");
                }
                
                // 3. Find the first result that actually contains plain text lyrics
                const validTrack = fallbackResults.find(track => track.plainLyrics && track.plainLyrics.length > 50);
                
                if (!validTrack) {
                    throw new Error("Tracks found, but none contained text lyrics");
                }
                
                lyrics = validTrack.plainLyrics;
                console.log("Lyrics successfully fetched from LRCLIB Search!");
                
            } catch (fallbackErr) {
                console.error("Fallback completely failed:", fallbackErr.message);
                return res.status(500).json({ 
                    success: false, 
                    error: "Could not retrieve lyrics. Cloudflare blocked the primary source, and the fallback database missed." 
                });
            }
        }

        lyrics = lyrics.replace(/^[0-9]+ Contributors.*Lyrics/, '');
        const firstBracket = lyrics.indexOf('[');
        if (firstBracket !== -1) lyrics = lyrics.substring(firstBracket);
        lyrics = lyrics.trim();

        if (!lyrics)
        {
            return res.status(404).json({ success: false, error: "Lyrics were found but came back empty." });
        }
        

        const prompt = `
        Analyze the following lyrics by ${artist}.
        Return ONLY a raw JSON object (no markdown formatting) with this structure:
        {
            "score": number (between -10 and 10),
            "vibe": string (2-3 words describing the mood),
            "themes": array of strings (max 3 key themes),
            "meaning": string (A short, insightful paragraph of 3-4 sentences),
            "recommendations": [
                { "song": string, "artist": string, "reason": string },
                { "song": string, "artist": string, "reason": string },
                { "song": string, "artist": string, "reason": string }
            ]
        }
        
        Lyrics:
        ${lyrics.substring(0, MAX_LYRICS_LENGTH)}
        `;

        const result = await generateWithRetry(prompt);
        const responseText = result.response.text();
        const aiData = normalizeAnalysis(JSON.parse(extractJsonObject(responseText)));

        const responseData = {
            success: true,
            track:
            { 
                song: firstSong.title, 
                artist: firstSong.artist.name,
                image: firstSong.image,
                url: firstSong.url,
                releaseDate: firstSong.releasedAt, 
                producers: producers,
                writers: writers,
                album: album               
            },
            lyrics: lyrics,
            analysis: aiData
        };

        res.json(responseData);

    } catch (err) 
    {
        console.error("Error:", err.message);
        if (err.message.includes("503")) 
        {
            return res.status(503).json({ success: false, error: "Google AI is overloaded. Please try again." });
        }
        res.status(500).json({ success: false, error: "Analysis failed." });
    }
});

// Add this in server/index.js (below your /api/analyze route)

app.post("/api/chat", async (req, res) => {
    const { message, history, lyrics, track } = req.body;

    if (!message || !lyrics) {
        return res.status(400).json({ success: false, error: "Missing required chat data." });
    }

    try {
        // Construct the initial system context so Gemini knows what song we are discussing
        const systemInstruction = `You are a music lore expert. The user is asking about the song "${track?.song}" by ${track?.artist}. 
        Use the following lyrics to answer their questions. Keep answers concise, insightful, and engaging.
        
        Lyrics Context:
        ${lyrics.substring(0, 3000)}`;

        // Map the frontend history format to Gemini's required format
        const formattedHistory = [
            { role: "user", parts: [{ text: systemInstruction }] },
            { role: "model", parts: [{ text: "Understood. I am ready to discuss the track." }] },
            ...(history || []).map(msg => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.text }]
            }))
        ];

        // Initialize the chat session
        const chatSession = model.startChat({
            history: formattedHistory,
            generationConfig: { maxOutputTokens: 300 } 
        });

        // Send the new message
        const result = await chatSession.sendMessage(message);
        const responseText = result.response.text();

        res.json({ success: true, text: responseText });

    } catch (err) {
        console.error("Chat Error:", err.message);
        res.status(500).json({ success: false, error: "Failed to generate chat response." });
    }
});

app.listen(PORT, () => 
{
    console.log(`Server running on http://localhost:${PORT}`);
});
