import express from 'express';
import bodyParser from 'body-parser';

import axios from "axios";

const app = express();
const PORT = 3000;  


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


app.get("/", (req, res) => {
    res.render("index", { 
        lyrics: null, 
        song: null, 
        artist: null, 
        error: null 
    });
});

app.post("/get-lyrics", async (req, res) => {
    const { artist, song } = req.body;

    try {

        const response = await axios.get(`https://api.lyrics.ovh/v1/${artist}/${song}`);
        
        const lyricsData = response.data.lyrics; 

        if (lyricsData) {
            res.render("index", { 
                lyrics: lyricsData, 
                song: song, 
                artist: artist, 
                error: null 
            });
        } else {
            throw new Error("Lyrics not found."); 
        }

    } catch (err) {
        console.error("Error fetching lyrics:", err.message);
        
        res.render("index", { 
            lyrics: null, 
            song: null, 
            artist: null, 
            error: "Could not find lyrics. Please check the spelling or try another song." 
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});     

