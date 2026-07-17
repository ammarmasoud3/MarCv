# MarCV 📄✨

> An AI-powered CV builder that lets you craft, enhance, and export a professional PDF résumé — all in the browser.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | HTML · Vanilla CSS · Vanilla JS     |
| Backend    | Node.js · Express                   |
| AI         | Groq API (native `fetch`, no SDK)   |
| PDF export | Puppeteer                           |
| Config     | dotenv                              |

---

## Project Structure

```
MarCV/
├── public/                  # Static frontend assets served by Express
│   ├── index.html           # Main SPA shell
│   ├── css/
│   │   └── style.css        # Global styles
│   └── js/
│       ├── main.js          # App bootstrap & UI logic
│       └── api.js           # Fetch helpers for the backend API
│
├── server/                  # Express backend
│   ├── index.js             # Entry point – starts the HTTP server
│   ├── routes/
│   │   ├── cv.js            # POST /api/cv – AI enhancement endpoint
│   │   └── pdf.js           # POST /api/pdf – PDF generation endpoint
│   ├── controllers/
│   │   ├── cvController.js  # Groq API business logic
│   │   └── pdfController.js # Puppeteer business logic
│   ├── services/
│   │   ├── groqService.js   # Raw fetch wrapper for Groq REST API
│   │   └── puppeteerService.js # Browser launch & PDF export helpers
│   ├── middleware/
│   │   └── errorHandler.js  # Central Express error handler
│   └── utils/
│       └── helpers.js       # Shared utility functions
│
├── templates/
│   └── cv-template.html     # HTML template rendered by Puppeteer → PDF
│
├── .env.example             # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd MarCV
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
PORT=3000
```

> Get a free Groq API key at [console.groq.com](https://console.groq.com).

### 3. Run in development mode

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

### 4. Run in production

```bash
npm start
```

---

## API Endpoints

| Method | Endpoint    | Description                              |
|--------|-------------|------------------------------------------|
| POST   | `/api/cv`   | Send raw CV data, receive AI-enhanced version from Groq |
| POST   | `/api/pdf`  | Send CV data, receive a downloadable PDF file |

---

## Environment Variables

| Variable       | Required | Default           | Description                  |
|----------------|----------|-------------------|------------------------------|
| `GROQ_API_KEY` | Yes      | —                 | Your Groq API key            |
| `GROQ_MODEL`   | No       | `llama-3.1-8b-instant`  | Groq chat completion model   |
| `PORT`         | No       | `3000`            | Port the Express server runs on |

---

## Scripts

| Command       | Description                          |
|---------------|--------------------------------------|
| `npm start`   | Start the server (production)        |
| `npm run dev` | Start with nodemon (auto-restart)    |

---

## License

MIT
