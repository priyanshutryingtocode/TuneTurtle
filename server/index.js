import express from 'express';
import cors from 'cors';
import Sentiment from 'sentiment';
import Genius from 'genius-lyrics'; // Import the new library
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

// Initialize Genius Client with your Token
// Make sure to add GENIUS_TOKEN=your_token_here in your .env file
const Client = new Genius.Client(process.env.GENIUS_TOKEN); 
const sentiment = new Sentiment();

app.use(cors());
app.use(express.json());

app.post("/api/analyze", async (req, res) => {
    const { artist, song } = req.body;

    try {
        console.log(`Searching for: ${song} by ${artist}`);

        // 1. Search Genius for the song
        const searches = await Client.songs.search(`${song} ${artist}`);

        // If no results found
        if (!searches || searches.length === 0) {
            return res.status(404).json({ success: false, error: "Song not found." });
        }

        // Pick the first result (most accurate)
        const firstSong = searches[0];

        // 2. Fetch Lyrics
        let lyrics = await firstSong.lyrics();

        if (!lyrics) throw new Error("Lyrics not found");

        const firstHeaderIndex = lyrics.indexOf('[');

        if (firstHeaderIndex > 0) 
        {
            lyrics = lyrics.substring(firstHeaderIndex);
        }

        if (!lyrics) throw new Error("Lyrics not found");

        // 3. Perform Sentiment Analysis
        const analysis = sentiment.analyze(lyrics);

        // Determine Vibe
        let vibe = "Neutral 😐";
        if (analysis.score > 5) vibe = "Happy/Positive 😃";
        else if (analysis.score < -5) vibe = "Sad/Melancholic 😔";

        // 4. Send rich data back (Genius gives us Cover Art too!)
        res.json({
            success: true,
            track: { 
                song: firstSong.title, 
                artist: firstSong.artist.name,
                image: firstSong.image // <-- Bonus: Album Art!
            },
            lyrics: lyrics,
            analysis: {
                score: analysis.score,
                vibe: vibe,
                positive_words: analysis.positive,
                negative_words: analysis.negative
            }
        });

    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ success: false, error: "Server error or Lyrics unavailable." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});