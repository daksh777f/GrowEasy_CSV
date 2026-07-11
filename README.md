# GrowEasy AI CSV Importer

A sophisticated, AI-powered CSV importer built for modern real estate CRMs. It robustly maps arbitrary user-provided CSV spreadsheets into a strict backend data schema.

## Architecture & Technology Stack

The project operates as a full-stack Next.js and Express application:

1. **Frontend (`/frontend`)**
   - **Next.js App Router**: Powers the UI components.
   - **Tailwind CSS**: Styling and layout.
   - **PapaParse**: Client-side CSV parser. Allows the browser to ingest huge files natively without overloading network bandwidth.
   - **TanStack Virtualizer**: Used to lazily render the `<table>` DOM elements. A raw CSV of 10,000 leads will instantly crash a standard React component if rendered all at once. The virtualizer fixes this by only rendering the rows visible in the viewport.
   - **Server-Sent Events (SSE)**: The frontend subscribes to real-time `EventSource` webhooks to provide live visual progress updates on the AI processing step.

2. **Backend (`/backend`)**
   - **Node.js & Express**: Provides the CSV processing API endpoint.
   - **Multer**: For raw multipart/form-data CSV uploads.
   - **Cerebras AI SDK**: An extremely fast LLM inference engine (`llama-3.3-70b`). The extraction relies heavily on native LLM processing. We use strict `json_object` format to force structural conformity.
   - **Vitest**: Used to unit test the deterministic logic (mapping heuristics, regex splitters, data normalization routines).
   - **Zod**: Validates the final extracted dataset against rigorous strict typing.

## The Hybrid Processing Pipeline

Instead of dumping an entire raw CSV into an LLM at once (which causes hallucination, token exhaustion, and context window failure), this platform employs a hybrid pipeline:

1. **Deterministic Pre-Mapping pass:**
   Before the AI even looks at the file, the backend compares raw CSV column headers against an exact synonym dictionary and Levenshtein fuzzy-matching algorithm. `Email Address` and `Mobile No.` are instantly detected natively without the cost of an LLM.

2. **Targeted AI Header Mapping:**
   Any remaining, unmapped columns that the deterministic layer didn't recognize (e.g., `Status (FB)`) are fed into Cerebras AI. Using a small context window and a JSON structure prompt, Cerebras infers what the column represents in relation to the CRM schema.

3. **Batched Concurrency Record Extraction:**
   The mapped rows are then extracted into formal structured objects. We process the rows using the `p-limit` library to send parallel batched requests to Groq API. This provides extreme multi-threading and avoids OpenAI context window fatigue.

4. **Normalization & Post-Validation:**
   The generated AI responses are passed through a Node function that normalizes logic rules. For instance, if a user provided multiple emails (`john@example.com, john2@example.com`), the normalization extracts the first to the primary key and routes the secondary email to `crm_note`. The final record is passed through Zod validation. If Zod fails, the row is rejected safely instead of crashing the system.

## Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd groweasy-csv-importer
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file with PORT=3001 and your GROQ_API_KEY
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend will run on `localhost:3000` and proxy API calls to the backend on `localhost:3001`.*

## Docker Setup

The project includes `Dockerfile`s for both frontend and backend, orchestrated via `docker-compose`.

```bash
# To run the entire stack via Docker
GROQ_API_KEY=your_actual_key docker-compose up --build
```
*This will spin up both the Next.js frontend (port 3000) and the Express backend (port 3001).*

## Deployment

The repository is built to be deployed on serverless and container-based platforms seamlessly:

- **Frontend (Vercel):** The Next.js frontend is natively ready for Vercel. Connect the GitHub repository to Vercel and it will automatically deploy the `/frontend` directory.
- **Backend (Railway/Render):** The Express backend can be deployed effortlessly on Railway or Render. Connect the repository, specify the `/backend` root directory, and set the environment variables (`PORT` and `GROQ_API_KEY`). The `Dockerfile` provided allows containerized deployment anywhere.
