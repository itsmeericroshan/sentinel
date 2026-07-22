# SENTINEL — AI-Powered Industrial Safety Intelligence

Built for **ET AI Hackathon 2026** — Track 1: AI-Powered Industrial Safety
Intelligence for Zero-Harm Operations.

https://sentinel-n7atawlih-eric-roshan-t-s-projects.vercel.app/

## The problem

Eight workers died at the Visakhapatnam Steel Plant coke-oven battery in
January 2025 — a facility with functioning gas detectors, permit-to-work
controls, and SCADA. The sensors worked. The data existed. Nobody connected
gas pressure readings to an active hot-work permit in time. That gap between
*data present* and *decision made* is what this platform closes.

## What makes this different

Most "AI safety" demos compute a single risk score from sensor thresholds.
SENTINEL does three things that go further:

1. **Causal, not just correlational, risk modeling.** The risk engine
   (`backend/app/causal_engine.py`) is a Bayesian network built with `pgmpy`
   over gas pressure, ventilation, permit status, maintenance activity, and
   worker proximity — so it can answer *"if this permit were revoked right
   now, how would risk change?"*, not just *"is this unusual?"*
2. **Disagreement as a signal, not noise.** Four independent specialist
   agents (`backend/app/agents.py`, calling the Claude API) each score risk
   from their own slice of the data. High variance across agents — not just
   a high average — flags genuinely unprecedented combinations that no
   single rule would catch.
3. **Counterfactual replay.** The frontend can replay a synthetic
   compound-risk timeline modeled on the Vizag pattern and report exactly
   how many ticks of lead time the system would have provided before a
   single-sensor system reacted.

## Architecture

```
FastAPI backend (Python)
├── causal_engine.py   — pgmpy Bayesian network + counterfactual queries
├── agents.py           — 4 specialist Claude API agents + coordinator
├── rag.py               — ChromaDB regulatory + precedent retrieval
├── data_gen.py          — synthetic plant timeline generator
└── main.py              — REST API tying it together

React frontend (Vite + Tailwind + Recharts)
├── ZoneMap.jsx           — live geospatial risk heatmap
├── DetailPanel.jsx       — per-zone factors + counterfactual control
├── AgentPanel.jsx        — multi-agent disagreement bar chart
├── CitationPanel.jsx     — RAG regulatory grounding
└── AlertLog.jsx          — SLA countdown + auto-escalation
```

## Running it locally

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Optional — enables live Claude API agent scoring instead of the
# deterministic fallback scorer:
export ANTHROPIC_API_KEY=your_key_here

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`. The dashboard polls the backend every
2.5 seconds and advances the simulated plant clock automatically.

> Note: `pgmpy` and `chromadb` pull in real dependencies (numpy, scipy,
> networkx, sqlite). If you don't have internet access to install them,
> `causal_engine.py` falls back to an equivalent weighted-causal model so
> the API still runs end-to-end.

## Pushing this to GitHub

```bash
cd sentinel
git add -A
git commit -m "SENTINEL — industrial safety intelligence prototype"
git branch -M main
git remote add origin https://github.com/<your-username>/sentinel.git
git push -u origin main
```

## Deploying it live (free hosting — backend on Render, frontend on Vercel)

### 1. Deploy the backend on Render

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Blueprint**.
3. Select your `sentinel` repository. Render will detect `render.yaml`
   at the repo root automatically.
4. It will show one service, `sentinel-backend`, building from the
   `backend` folder. Click **Apply**.
5. (Optional) Add your `ANTHROPIC_API_KEY` under the service's
   **Environment** tab if you want live Claude API agent scoring instead
   of the deterministic fallback.
6. Wait for the build to finish (a few minutes — installing pgmpy and
   chromadb takes a while the first time). Once live, copy the URL Render
   gives you, e.g. `https://sentinel-backend.onrender.com`.
7. Visit `https://<your-backend-url>/api/health` — it should return
   `{"status":"ok"}`. If it does, the backend is live.

> Free Render services sleep after inactivity and take ~30-60 seconds to
> wake on the first request. Open the URL once a few minutes before your
> demo so it's already warm.

### 2. Deploy the frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** → **Project**, select your `sentinel` repository.
3. Under **Root Directory**, click **Edit** and set it to `frontend`.
4. Under **Environment Variables**, add:
   - Key: `VITE_API_BASE`
   - Value: your Render backend URL from step 1 (no trailing slash)
5. Click **Deploy**.
6. Once finished, Vercel gives you a public URL like
   `https://sentinel-yourname.vercel.app` — that's your live demo link.

That URL is what you share with judges. Both services redeploy
automatically whenever you push new commits to `main`.

## Judging criteria alignment

| Criterion | How this addresses it |
|---|---|
| Innovation | Causal counterfactual engine + agent-disagreement-as-signal, not a single threshold score |
| Business impact | Replay mode reports actual lead time vs. a single-sensor baseline, directly tied to false-negative reduction |
| Technical excellence | Real pgmpy Bayesian network, real multi-agent API calls, real vector retrieval — not hardcoded outputs |
| Scalability | Zones are config-driven; adding a new zone or plant is one entry in `data_gen.py` |
| User experience | Live geospatial map, one-click counterfactuals, and visible SLA escalation rather than a raw dashboard of numbers |

## Honest limitations (say this in your pitch — it builds credibility)

- Sensor data is synthetic, generated to demonstrate the compound-risk
  pattern; it is not connected to real SCADA hardware in this prototype.
- The regulatory corpus in `rag.py` is a small illustrative set, not a full
  ingestion of OISD/DGMS/Factory Act documents.
- Agent scoring falls back to a deterministic stub without an Anthropic API
  key, so the demo works offline, but live agent reasoning needs a key.
