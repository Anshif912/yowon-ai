# YOWON AI

**Autonomous AI Jury Platform**

Multi-agent evaluation system that assesses hackathon projects for production deployment readiness using local Ollama models and real-time SSE progress streaming.

## Architecture

```
React Frontend (Vite + Tailwind)
        â”‚  SSE / REST
        â–¼
FastAPI Backend
        â”‚
        â”œâ”€â”€ Coordinator (deterministic brief builder)
        â”œâ”€â”€ 5 Parallel Specialist Agents (qwen2.5:3b)
        â”‚     â”œâ”€â”€ Engineering (Technical)
        â”‚     â”œâ”€â”€ Security
        â”‚     â”œâ”€â”€ Presentation
        â”‚     â”œâ”€â”€ Innovation
        â”‚     â””â”€â”€ Risk
        â”œâ”€â”€ Score Engine (deterministic weighted math)
        â””â”€â”€ Chief Evaluator (qwen3:8b â€” synthesis + cross-exam)
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) running locally

```bash
ollama pull qwen2.5:3b
ollama pull qwen3:8b
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Configuration

Environment variables in `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_SPECIALIST_MODEL` | `qwen2.5:3b` | Engineering, Security, Innovation, Presentation, Risk |
| `OLLAMA_CHIEF_MODEL` | `qwen3:8b` | Chief synthesis agent |
| `OLLAMA_PARALLEL` | `3` | Concurrent specialist workers |
| `AGENT_TIMEOUT_SEC` | `40` | Per-agent timeout |
| `AGENT_MAX_RETRIES` | `2` | Retry attempts on failure |
| `FAILED_AGENT_SCORE` | `35` | Conservative fallback (not 50) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload-project` | Upload project files |
| POST | `/evaluate/{id}` | Start evaluation |
| GET | `/progress/{id}/stream` | SSE real-time progress |
| GET | `/report/{id}` | JSON report |
| GET | `/report/{id}/pdf` | PDF download |

## Key Features

- **Real-time SSE progress** â€” agent start/complete events, elapsed time, completion %
- **Resilient pipeline** â€” agent failures don't crash evaluation; conservative fallbacks
- **JSON repair** â€” handles malformed LLM output
- **Deterministic scoring** â€” weighted math prevents hallucinated scores
- **Premium UI** â€” agent network visualization, live timeline, verdict reveal
- **PDF reports** â€” branded executive summary with deployment roadmap

## Performance Targets

- Evaluation: < 60 seconds (with qwen2.5:3b specialists)
- Progress updates: real-time via SSE (150ms server poll)
- UI response: < 100ms (React memoization, no fake progress)
