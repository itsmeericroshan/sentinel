"""
SENTINEL backend — FastAPI application.

Endpoints:
  GET  /api/zones                       -> list zones with current risk
  GET  /api/zones/{zone_id}             -> full detail for one zone
  POST /api/zones/{zone_id}/counterfactual -> revoke-permit counterfactual
  GET  /api/zones/{zone_id}/agents      -> multi-agent disagreement scores
  GET  /api/zones/{zone_id}/citation    -> RAG regulatory grounding
  POST /api/zones/{zone_id}/emergency-report -> generate incident report PDF
  POST /api/tick                        -> advance the simulated clock
  GET  /api/alerts                      -> active alert log with SLA state
  POST /api/alerts/{alert_id}/ack       -> acknowledge an alert
"""

import time
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .data_gen import ZONES, TIMELINES, TOTAL_TICKS
from .causal_engine import ZoneState, causal_risk, single_sensor_baseline, counterfactual_revoke_permit
from .agents import run_agents
from .rag import retrieve

app = FastAPI(title="SENTINEL — Industrial Safety Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STATE = {"tick": 0, "alerts": {}, "alert_counter": 0}
ALERT_THRESHOLD = 0.65
SLA_SECONDS = 25


def _zone_state(zone_id: str, tick: int) -> ZoneState:
    if zone_id not in TIMELINES:
        raise HTTPException(404, "unknown zone")
    s = TIMELINES[zone_id][tick % TOTAL_TICKS]
    return ZoneState(gas=s["gas"], vent=s["vent"], permit=s["permit"], maint=s["maint"], prox=s["prox"])


def _maybe_raise_alerts():
    for z in ZONES:
        s = _zone_state(z["id"], STATE["tick"])
        r = causal_risk(s)
        if r >= ALERT_THRESHOLD:
            existing = [a for a in STATE["alerts"].values() if a["zone_id"] == z["id"] and not a["resolved"]]
            if not existing:
                STATE["alert_counter"] += 1
                aid = STATE["alert_counter"]
                STATE["alerts"][aid] = {
                    "id": aid, "zone_id": z["id"], "zone_name": z["name"],
                    "risk": r, "tick": STATE["tick"], "created": time.time(),
                    "acked": False, "resolved": False,
                }


@app.get("/api/zones")
def list_zones():
    out.append({
            "id": z["id"], "name": z["name"],
            "x": z["x"], "y": z["y"], "w": z["w"], "h": z["h"],
            "risk": causal_risk(s),
            "baseline_flag": single_sensor_baseline(s),
        })
    return {"tick": STATE["tick"], "zones": out}


@app.get("/api/zones/{zone_id}")
def zone_detail(zone_id: str):
    s = _zone_state(zone_id, STATE["tick"])
    return {
        "id": zone_id,
        "tick": STATE["tick"],
        "readings": s.__dict__,
        "risk": causal_risk(s),
        "baseline_flag": single_sensor_baseline(s),
    }


@app.post("/api/zones/{zone_id}/counterfactual")
def zone_counterfactual(zone_id: str):
    s = _zone_state(zone_id, STATE["tick"])
    return counterfactual_revoke_permit(s)


@app.get("/api/zones/{zone_id}/agents")
def zone_agents(zone_id: str):
    s = _zone_state(zone_id, STATE["tick"])
    return run_agents(s)


@app.get("/api/zones/{zone_id}/citation")
def zone_citation(zone_id: str):
    s = _zone_state(zone_id, STATE["tick"])
    query = (
        f"gas {s.gas:.0f} ventilation {s.vent:.0f} permit {s.permit} "
        f"maintenance {s.maint} proximity {s.prox:.0f}"
    )
    return {"results": retrieve(query)}


@app.post("/api/zones/{zone_id}/emergency-report")
def emergency_report(zone_id: str):
    from .orchestrator import generate_incident_report
    s = _zone_state(zone_id, STATE["tick"])
    r = causal_risk(s)
    zone_name = next((z["name"] for z in ZONES if z["id"] == zone_id), zone_id)
    query = f"gas {s.gas:.0f} ventilation {s.vent:.0f} permit {s.permit}"
    citations = retrieve(query)
    report = generate_incident_report(
        zone_name=zone_name,
        risk_score=r,
        readings={"gas": s.gas, "vent": s.vent, "permit": s.permit, "maint": s.maint, "prox": s.prox},
        rag_citations=citations,
        tick=STATE["tick"],
    )
    return report


class TickRequest(BaseModel):
    reset_to: Optional[int] = None


@app.post("/api/tick")
def advance_tick(req: TickRequest):
    STATE["tick"] = req.reset_to if req.reset_to is not None else (STATE["tick"] + 1) % TOTAL_TICKS
    _maybe_raise_alerts()
    return {"tick": STATE["tick"]}


@app.get("/api/alerts")
def list_alerts():
    out = []
    now = time.time()
    for a in STATE["alerts"].values():
        elapsed = now - a["created"]
        remaining = max(0, SLA_SECONDS - elapsed)
        escalated = remaining <= 0 and not a["acked"]
        out.append({**a, "remaining_seconds": remaining, "escalated": escalated})
    return {"alerts": sorted(out, key=lambda a: -a["created"])}


@app.post("/api/alerts/{alert_id}/ack")
def ack_alert(alert_id: int):
    if alert_id not in STATE["alerts"]:
        raise HTTPException(404, "unknown alert")
    STATE["alerts"][alert_id]["acked"] = True
    return STATE["alerts"][alert_id]


@app.get("/api/health")
def health():
    return {"status": "ok"}
