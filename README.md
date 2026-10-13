# 🌾 Sugarcane Farmer AI Assistant (Model Context Protocol)

A full-stack TypeScript application that integrates a **PostgreSQL** database with an **OpenAI** model using the **Model Context Protocol (MCP)**. Users can ask natural-language questions about sugarcane farmers, village crop supplies, and payment statuses through both an interactive Web Chat interface and a Command-Line Interface (CLI).

---

## 🏗️ Architecture & Request Flow

The application demonstrates the official Model Context Protocol architecture, using MCP as the standardized tool-access layer between the AI model and the PostgreSQL database:

```
[ User Browser / Frontend ]
       │
       ▼ (HTTP POST /api/chat)
[ Express API Server (api.ts) ]
       │
       ▼ (Dynamic prompt & function definitions)
[ OpenAI Responses API (gpt-4.1-mini) ]
       │
       ▼ (Model decides to call tool: get_farmer_data)
[ MCP Client (client.ts) ]
       │
       ▼ (Stdio JSON-RPC Transport with DB credentials)
[ MCP Server Subprocess (server.ts) ]
       │
       ▼ (Safe read-only SQL: SELECT ... FROM farmers)
[ PostgreSQL Database (sanjivani_sugar_factory) ]
       │
       ▼ (Farmer rows returned to MCP Server)
[ MCP Client feeds tool output back to OpenAI ]
       │
       ▼ (Synthesized natural language answer with ₹ and tons)
[ Express API returns JSON to Frontend ]
       │
       ▼
[ React Chat UI displays the answer to the User ]
```

---

## 📁 Project Structure

```text
sugarcane-mcp/
├── server.ts             # MCP Server exposing the 'get_farmer_data' tool
├── client.ts             # MCP Client & OpenAI orchestration (CLI & API service)
├── api.ts                # Express backend REST API (/api/health, /api/chat)
├── package.json          # Project configuration, dependencies, and npm scripts
├── .env.example          # Environment variable template with placeholders
├── .gitignore            # Git exclusion rules (protects .env, node_modules, dist)
├── sql/
│   └── schema.sql        # PostgreSQL database table definition and seed records
└── frontend/             # Modern React + TypeScript + Vite chat interface
    ├── src/
    │   ├── App.tsx       # Chat interface, sample question chips, DB badge
    │   ├── index.css     # Clean agricultural design system (green palette)
    │   └── main.tsx      # React DOM entrypoint
    ├── vite.config.ts    # Vite configuration with /api backend proxy
    └── package.json      # Frontend dependencies
```

### Core Components Explained

* **`server.ts`**: The MCP Server built with `@modelcontextprotocol/server`. It registers the `get_farmer_data` tool and runs over standard I/O (`StdioServerTransport`). It executes read-only SQL queries on the `farmers` table.
* **`client.ts`**: The MCP Client built with `@modelcontextprotocol/client`. It dynamically spawns the MCP server child process, discovers registered tools, sends user queries to OpenAI, invokes the requested tool, and deduplicates records deterministically by `(name, village)`.
* **`api.ts`**: The Express backend that exposes:
  * `GET /api/health` — Verifies server health and live PostgreSQL database connectivity.
  * `POST /api/chat` — Validates user queries and coordinates with `client.ts`.
  * Serves the pre-compiled frontend in unified production mode.
* **`frontend/`**: A React 18 + TypeScript + Vite interface featuring live database status indicators, sample question chips, automatic scrolling, and markdown-styled message rendering.

---

## ⚙️ Prerequisites

* **Node.js**: v20.0.0 or higher
* **PostgreSQL**: v14 or higher running locally
* **OpenAI API Key**: Access to `gpt-4.1-mini` or compatible models

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies

```powershell
# Clone the repository
git clone https://github.com/bhandariprathmesh/ai_workshop_mcp_project.git
cd ai_workshop_mcp_project

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

### 2. Configure PostgreSQL Database

1. Open **pgAdmin** or **psql**.
2. Create the factory database:
   ```sql
   CREATE DATABASE sanjivani_sugar_factory;
   ```
3. Run the schema script located in `sql/schema.sql` to create the `farmers` table and seed sample records:
   ```powershell
   psql -U postgres -d sanjivani_sugar_factory -f sql/schema.sql
   ```

---

### 3. Setup Environment Variables

Copy `.env.example` to `.env` in the root folder:

```powershell
Copy-Item .env.example .env
```

Open `.env` in a text editor and fill in your actual credentials:

```env
OPENAI_API_KEY=your_actual_openai_api_key_here
PGHOST=localhost
PGPORT=5432
PGDATABASE=sanjivani_sugar_factory
PGUSER=postgres
PGPASSWORD=your_actual_postgres_password_here
PORT=5000
```

> ⚠️ **Security Warning**: Never commit your `.env` file to Git. It is automatically ignored by `.gitignore`.

---

## 💻 Running the Application

### Option A: Development Mode (Recommended for Demos)

Run the backend and frontend in separate terminals for hot-reloading:

* **Terminal 1 — Backend API Server:**
  ```powershell
  npm run start:api
  ```
  *Listening on: `http://localhost:5000`*

* **Terminal 2 — Frontend Dev Server:**
  ```powershell
  npm run dev:frontend
  ```
  *Open in browser: `http://localhost:5173`*

---

### Option B: Single Command (Unified Production Mode)

Build the frontend and run the entire application from a single port:

```powershell
npm run build:frontend
npm start
```
*Open in browser: `http://localhost:5000`*

---

### Option C: Standalone Command-Line (CLI)

You can run queries directly from the terminal without launching the web server:

```powershell
# Default question
npx tsx client.ts

# Custom dynamic question
npx tsx client.ts "Which farmer supplied the most sugarcane?"
```

---

## 💬 Sample Questions & Output

### 1. Pending Payments
* **User Question:** *"Which farmers have pending payments?"*
* **AI Output:**
  ```text
  Farmers with pending payments:
  1. Ramesh Shinde (Kopargaon) — ₹45,000.00
  2. Vijay Jadhav (Rahata) — ₹32,000.00
  3. Ashok More (Shirdi) — ₹15,000.00
  4. Prakash Wagh (Kolpewadi) — ₹60,000.00
  5. Dattatray Patil (Sangamner) — ₹25,000.00
  6. Ganesh Bhosale (Pohegaon) — ₹18,500.00
  7. Mahesh Chavan (Vaijapur) — ₹40,000.00

  Total pending amount: ₹2,35,500.00 across 7 distinct farmers.
  ```

### 2. Village Supply Comparison
* **User Question:** *"How much sugarcane was supplied from Kopargaon?"*
* **AI Output:**
  ```text
  Sugarcane supplied from Kopargaon comes from 2 distinct farmers:
  - Ramesh Shinde: 125.50 tons
  - Nitin Deshmukh: 190.50 tons

  Total sugarcane supplied from Kopargaon is 316.00 tons.
  ```

---

## 🛠️ Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `OpenAIError: Missing credentials` | `OPENAI_API_KEY` is not set in `.env` | Ensure `.env` exists in the root folder with a valid OpenAI API key. |
| `DB connection FAIL: SASL: SCRAM...` | `PGPASSWORD` is incorrect or empty | Verify your PostgreSQL password in `.env` and restart the server. |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL service is stopped | Start PostgreSQL service from Windows Services (`services.msc`). |
| `MCP Tool Error` | Database or table does not exist | Run `sql/schema.sql` inside `sanjivani_sugar_factory`. |
| Port 5000 or 5173 in use | A previous process is still running | Change `PORT` in `.env` or terminate the existing node process. |

---

## 📜 License

This project is created for educational and workshop demonstration purposes under the ISC License.
