import express from 'express';
import cors from 'cors';
import Genius from 'genius-lyrics';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const Client = new Genius.Client(process.env.GENIUS_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.use(cors());
app.use(express.json());

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
    const { artist, song } = req.body;
    try 
    {
        console.log(`\n🎵 Searching for: ${song} by ${artist}`);

        const searches = await Client.songs.search(`${song} ${artist}`);
        if (!searches || searches.length === 0) 
        {
            return res.status(404).json({ success: false, error: "Song not found." });
        }
        
        const firstSong = searches[0];

        await firstSong.fetch();

        const writers = (firstSong.writer_artists || []).map(p => p.name);
        const producers = (firstSong.producer_artists || []).map(p => p.name).slice(0, 3);
        const album = firstSong.album ? firstSong.album.name : null;

        console.log(`\n🔎 Metadata Found:`);
        console.log(`   - Date: ${firstSong.releasedAt}`);
        console.log(`   - Album: ${album || 'None'}`);
        console.log(`   - Producers: ${producers.length > 0 ? producers.join(', ') : 'None'}`);
        console.log(`   - Writers: ${writers.length > 0 ? writers.join(', ') : 'None'}`);

        let lyrics = "";
        try 
        {
            lyrics = await firstSong.lyrics();
        } 
        catch (err) 
        {
            console.log("Genius blocked the scrape (403). Falling back to Open API...");
            
            try {

                const cleanArtist = encodeURIComponent(artist);
                const cleanSong = encodeURIComponent(song);
                const fallbackRes = await fetch(`https://api.lyrics.ovh/v1/${cleanArtist}/${cleanSong}`);
                const fallbackData = await fallbackRes.json();
                
                if (!fallbackData.lyrics)
                {
                    throw new Error("Not found in fallback");
                }

                lyrics = fallbackData.lyrics;
                
            } catch (fallbackErr) {
                return res.status(500).json
                ({ 
                    success: false, 
                    error: "Cloudflare blocked the lyrics fetch. Please try a different song." 
                });
            }
        }

        lyrics = lyrics.replace(/^[0-9]+ Contributors.*Lyrics/, '');
        const firstBracket = lyrics.indexOf('[');
        if (firstBracket !== -1) lyrics = lyrics.substring(firstBracket);
        lyrics = lyrics.trim();

        

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
        ${lyrics.substring(0, 3000)}
        `;

        const result = await generateWithRetry(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const aiData = JSON.parse(cleanJson);

        res.json({
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
        });

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

app.listen(PORT, () => 
{
    console.log(`Server running on http://localhost:${PORT}`);
});