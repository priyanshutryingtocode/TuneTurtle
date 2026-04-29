# TuneTurtle 🐢🎵

TuneTurtle is a AI-powered lyrics analysis and music recommendation platform. By leveraging the power of Google's Gemini API, it provides insights into the themes, emotions, and meanings behind any song while suggesting similar tracks to explore.

## 🚀 Features

* **Lyrics Search & Retrieval**: Instantly find lyrics for millions of songs using the Genius API, with a robust fallback to LRCLIB to ensure high availability. 
* **AI Sentiment Analysis**: Provides a "Vibe Check" with a sentiment score ranging from -10 (sad) to +10 (happy). 
* **Deep Meaning Insight**: Generates insightful paragraphs explaining the core message and hidden meanings of the lyrics. 
* **Smart Recommendations**: Get personalized song suggestions based on the lyrical mood and themes of your search.
* **Rich Metadata**: Displays track details including album art, release dates, producers, and writers. 

## 🛠️ Tech Stack

### Frontend
* **React 19** with **Vite** for a fast, modern development experience. 
* **Framer Motion** for smooth UI animations and transitions. 
* **Lucide React** for consistent and beautiful iconography. 
* **Recharts** for visualizing the sentiment score "Vibe Check".

### Backend
* **Node.js & Express** powering the API layer. 
* **Gemini 2.5 Flash** (via `@google/generative-ai`) for high-speed AI analysis. 
* **Genius-Lyrics** for primary song metadata and scraping. 

## 📦 Installation

### Prerequisites
* Node.js installed on your machine.
* A **Genius API Token** and a **Google Gemini API Key**. 

### Setup
1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    cd TuneTurtle
    ```

2.  **Configure the Backend:**
    * Navigate to the `/server` directory. 
    * Create a `.env` file and add the following: 
        ```env
        PORT=5000
        GENIUS_TOKEN=your_genius_token_here
        GEMINI_API_KEY=your_gemini_api_key_here
        ```
    * Install dependencies and start the server: 
        ```bash
        npm install
        npm run dev
        ```

3.  **Configure the Frontend:**
    * Navigate to the `/client` directory. 
    * Install dependencies and start the development server: 
        ```bash
        npm install
        npm run dev
        ```

## 🖥️ How it Works

1.  **Search**: Enter an artist and song name in the search bar. 
2.  **Lyrical Fetching**: The backend searches Genius for the song. If primary scraping is blocked, it automatically switches to the LRCLIB API to retrieve the text. 
3.  **AI Analysis**: The lyrics are sent to Gemini 2.5 Flash with a custom prompt to extract sentiment, themes, and meanings in a structured JSON format. 
4.  **Visualization**: The frontend receives the analysis and updates the "Vibe Check" gauge and background theme accordingly. 