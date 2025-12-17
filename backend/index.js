import express from 'express';
import bodyParser from 'body-parser';
import ejs from 'ejs';


const app = express();
const PORT = 3000;  
const API_URL = "https://api.lyrics.ovh/v1/";

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});     

