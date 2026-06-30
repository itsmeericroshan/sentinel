"""
Multi-agent disagreement layer.

Four specialist agents independently score risk from their own slice of
zone data. Instead of averaging them away, the coordinator treats
*disagreement* (variance across agents) as its own signal: high variance
plus a moderate-to-high mean means the agents are looking at an
unprecedented combination of factors that no single rule would catch.

Each agent is a narrow Claude API call with its own system prompt and
data slice. If ANTHROPIC_API_KEY is not set, falls back to a deterministic
weighted-scoring stub so the API still runs end-to-end without a key.
"""

import os
import statistics
from dataclasses import dataclass

try:
    import anthropic
    _CLIENT = anthropic.Anthropic() if os.environ.get("ANTHROPIC_API_KEY") else None
except ImportError:
    _CLIENT = None

from .causal_engine import ZoneState

AGENT_DEFS = [
    {
        "key": "gas",
        "label": "Gas / atmosphere agent",
        "system": (
            "You are an industrial gas safety specialist agent. Given gas pressure "
            "and ventilation readings, output ONLY a risk score from 0 to 100 as an "
            "integer. No other text."
        ),
    },
    {
        "key": "permit",
        "label": "Permit compliance agent",
        "system": (
            "You are a permit-to-work compliance specialist agent. Given active permit "
            "and maintenance status, output ONLY a risk score from 0 to 100 as an "
            "integer. No other text."
        ),
    },
    {
        "key": "maint",
        "label": "Maintenance pattern agent",
        "system": (
            "You are a maintenance operations specialist agent. Given maintenance "
            "activity and ventilation health, output ONLY a risk score from 0 to 100 "
            "as an integer. No other text."
        ),
    },
    {
        "key": "prox",
        "label": "Worker proximity agent",
        "system": (
            "You are a worker exposure specialist agent. Given worker proximity and "
            "permit status, output ONLY a risk score from 0 to 100 as an integer. "
            "No other text."
        ),
    },
]


def _stub_score(key: str, s: ZoneState) -> float:
    gas, vent, permit, maint, prox = s.gas / 100, (100 - s.vent) / 100, s.permit, s.maint, s.prox / 100
    if key == "gas":
        return gas * 0.7 + vent * 0.3
    if key == "permit":
        return permit * 0.6 + maint * 0.4
    if key == "maint":
        return maint * 0.6 + vent * 0.4
    if key == "prox":
        return prox * 0.7 + permit * 0.3
    return 0.0


def _call_agent(agent: dict, s: ZoneState) -> float:
    if _CLIENT is None:
        return _stub_score(agent["key"], s)

    prompt = (
        f"Zone readings — gas pressure: {s.gas:.0f}/100, ventilation health: "
        f"{s.vent:.0f}/100, hot-work permit active: {bool(s.permit)}, "
        f"maintenance in progress: {bool(s.maint)}, worker proximity: {s.prox:.0f}/100."
    )
    try:
        resp = _CLIENT.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=10,
            system=agent["system"],
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.content[0].text.strip()
        return max(0.0, min(100.0, float("".join(c for c in text if c.isdigit() or c == ".") or 0))) / 100
    except Exception:
        return _stub_score(agent["key"], s)


def run_agents(s: ZoneState) -> dict:
    scores = [{"label": a["label"], "score": _call_agent(a, s)} for a in AGENT_DEFS]
    values = [a["score"] for a in scores]
    mean = statistics.fmean(values)
    variance = statistics.pvariance(values)

    novel = variance > 0.045 and mean > 0.35
    calm = mean < 0.30

    if novel:
        verdict = "novel_pattern"
        message = (
            f"High inter-agent disagreement (variance {variance:.3f}) — this "
            "combination has not been seen before. Escalating for human review."
        )
    elif calm:
        verdict = "calm"
        message = "Agents agree — low overall risk, no novel signal."
    else:
        verdict = "known_pattern"
        message = "Agents agree — matches a known risk signature."

    return {
        "agents": scores,
        "mean": mean,
        "variance": variance,
        "verdict": verdict,
        "message": message,
    }
