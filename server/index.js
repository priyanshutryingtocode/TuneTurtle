import express from 'express';
import cors from 'cors';
import Genius from 'genius-lyrics'; 
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = 5000;

const Client = new Genius.Client(process.env.GENIUS_TOKEN); 

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

app.post("/api/analyze", async (req, res) => {
    const { artist, song } = req.body;

    try {
        console.log(`Searching for: ${song} by ${artist}`);

        const searches = await Client.songs.search(`${song} ${artist}`);
        if (!searches || searches.length === 0) {
            return res.status(404).json({ success: false, error: "Song not found." });
        }
        const firstSong = searches[0];
        let lyrics = await firstSong.lyrics();

        lyrics = lyrics.replace(/^[0-9]+ Contributors.*Lyrics/, '');
        const firstBracket = lyrics.indexOf('[');
        if (firstBracket !== -1) lyrics = lyrics.substring(firstBracket);
        lyrics = lyrics.trim();

        const prompt = `
        Analyze the following lyrics by ${artist}.
        Return ONLY a raw JSON object (no markdown formatting, no backticks) with this exact structure:
        {
            "score": number (between -10 and 10),
            "vibe": string (2-3 words describing the mood),
            "themes": array of strings (max 3 key themes),
            "meaning": string (A short, insightful paragraph of 3-4 sentences interpreting the deeper meaning behind the lyrics)
        }
        
        Lyrics:
        ${lyrics.substring(0, 3000)}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const aiData = JSON.parse(cleanJson);

        res.json({
            success: true,
            track: { 
                song: firstSong.title, 
                artist: firstSong.artist.name,
                image: firstSong.image 
            },
            lyrics: lyrics,
            analysis: aiData 
        });

    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ success: false, error: "Analysis failed." });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});