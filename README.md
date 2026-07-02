# ResearchPilot AI - Multi-Agent Literature Survey & Research Gap Assistant

ResearchPilot AI is a multi-agent academic research assistant designed to automate literature reviews, construct paper comparison matrices, and detect novel research directions (research gaps) suitable for IEEE-level publication.

This application is split into:
1.  **Backend (FastAPI):** Python service that parses uploaded PDF papers and runs cooperative agent pipelines.
2.  **Client (React + Vite):** Sleek, high-aesthetic glassmorphism dashboard with live agent monitoring and interactive matrices/gap-cards.

---

## 🛠️ Project Structure
```
Major Project/
├── backend/
│   ├── app.py                # FastAPI endpoints
│   ├── requirements.txt      # Python dependencies
│   ├── agents/               # LLM agents (orchestrator, gap detector)
│   └── utils/                # PDF text parsing (PyMuPDF)
└── client/
    ├── index.html
    ├── package.json          # React/Vite dependencies
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx           # Dashboard UI
        └── index.css         # Styling system & animations
```

---

## 🚀 Running the Project

### 1. Start the Backend (FastAPI)
Open a terminal in the `backend/` directory:

1.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configure API Key (Optional):**
    Set your OpenAI API key as an environment variable to use real LLM agents (otherwise, it will fall back to high-quality local mock agents):
    ```powershell
    $env:OPENAI_API_KEY="your_api_key_here"
    ```

3.  **Start the server:**
    ```bash
    python app.py
    ```
    The backend will run on `http://localhost:8000`. You can check the documentation at `http://localhost:8000/docs`.

---

### 2. Start the Client (Vite)
Open another terminal in the `client/` directory:

1.  **Install node packages:**
    Due to a known `esbuild` spawn issue on Windows, we bypass lifecycle scripts during installation, then run the installer manually:
    ```bash
    npm install --ignore-scripts
    node node_modules/esbuild/install.js
    ```

2.  **Run development server:**
    To bypass Node/npm spawn wrapper issues on Windows, execute `vite` directly using `npx`:
    ```bash
    npx vite
    ```
    The dashboard will run on `http://localhost:3000`.

---

## 💡 How to Use
1.  Open the web interface at `http://localhost:3000`.
2.  Upload 1 or more PDF papers (IEEE format recommended) using the drag-and-drop panel.
3.  (Optional) Click **LLM Settings** in the top right to configure your custom API Key or a local LLM Base URL (e.g. Ollama).
4.  Click **Analyze Literature**. 
5.  Watch the **Agent Pipeline Monitoring** console stream status updates from the *PDF Reader Agent*, *Comparison Agent*, and *Research Gap Agent*.
6.  Once completed, switch between:
    *   **IEEE Research Gaps:** Visual cards summarizing 3 unique, high-novelty project ideas, complete with proposed titles, evidence basis, suggested datasets, and evaluation metrics.
    *   **Literature Comparison Matrix:** A complete table organizing paper objectives, methods, datasets, results, and limitations side-by-side.
