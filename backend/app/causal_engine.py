"""
Causal risk engine for SENTINEL.

Builds a small causal Bayesian network over the factors that combine to
produce compound industrial risk (the exact failure pattern behind the
Visakhapatnam Steel Plant coke-oven incident: gas pressure + active
hot-work permit + degraded ventilation, none individually flagged).

Falls back to a pure-python weighted causal model if pgmpy is not
installed, so the API still runs in restricted environments — but the
pgmpy network is the real model used whenever available.
"""

from dataclasses import dataclass

try:
    from pgmpy.models import DiscreteBayesianNetwork
    from pgmpy.factors.discrete import TabularCPD
    from pgmpy.inference import VariableElimination
    PGMPY_AVAILABLE = True
except ImportError:
    PGMPY_AVAILABLE = False


@dataclass
class ZoneState:
    gas: float          # 0-100, gas/atmospheric pressure reading
    vent: float         # 0-100, ventilation health (higher = better)
    permit: int         # 0 or 1, hot-work permit currently active
    maint: int          # 0 or 1, maintenance activity in progress
    prox: float         # 0-100, worker proximity / exposure


def _discretize(state: ZoneState) -> dict:
    """Bucket continuous readings into Low/Med/High states for the DAG."""
    def bucket(v, lo=33, hi=66):
        if v < lo:
            return 0  # low
        if v < hi:
            return 1  # medium
        return 2  # high

    return {
        "gas": bucket(state.gas),
        "vent": 2 - bucket(state.vent),  # invert: low ventilation = high deficit
        "permit": state.permit,
        "maint": state.maint,
        "prox": bucket(state.prox),
    }


def _build_network():
    """
    DAG structure:
      gas, vent, permit, maint, prox  -->  ignition_risk

    Edges encode the causal claim: ignition risk is driven by these five
    upstream factors, with conditional probabilities weighted heavier
    when gas + permit + vent co-occur (the compound pattern).
    """
    model = DiscreteBayesianNetwork(
        [("gas", "risk"), ("vent", "risk"), ("permit", "risk"),
         ("maint", "risk"), ("prox", "risk")]
    )

    cpd_gas = TabularCPD("gas", 3, [[0.5], [0.3], [0.2]])
    cpd_vent = TabularCPD("vent", 3, [[0.6], [0.25], [0.15]])
    cpd_permit = TabularCPD("permit", 2, [[0.85], [0.15]])
    cpd_maint = TabularCPD("maint", 2, [[0.8], [0.2]])
    cpd_prox = TabularCPD("prox", 3, [[0.5], [0.3], [0.2]])

    # 3*3*2*2*3 = 108 parent combinations -> generate risk CPD programmatically
    states = [(g, v, p, m, x)
              for g in range(3) for v in range(3) for p in range(2)
              for m in range(2) for x in range(3)]

    low_col, high_col = [], []
    for g, v, p, m, x in states:
        score = g * 0.30 + v * 0.25 + p * 0.20 + m * 0.10 + x * 0.15
        score = score / 2.0  # normalize roughly to 0-1
        compound = 1.6 if (g == 2 and p == 1 and v >= 1) else 1.0
        risk_high = min(0.97, max(0.03, score * compound))
        high_col.append(risk_high)
        low_col.append(1 - risk_high)

    cpd_risk = TabularCPD(
        "risk", 2, [low_col, high_col],
        evidence=["gas", "vent", "permit", "maint", "prox"],
        evidence_card=[3, 3, 2, 2, 3],
    )

    model.add_cpds(cpd_gas, cpd_vent, cpd_permit, cpd_maint, cpd_prox, cpd_risk)
    model.check_model()
    return model


_MODEL = _build_network() if PGMPY_AVAILABLE else None
_INFER = VariableElimination(_MODEL) if PGMPY_AVAILABLE else None


def _weighted_fallback(state: ZoneState, override_permit=None) -> float:
    gas = state.gas / 100
    vent = (100 - state.vent) / 100
    permit = state.permit if override_permit is None else override_permit
    maint = state.maint
    prox = state.prox / 100
    base = gas * 0.35 + vent * 0.25 + maint * 0.15 + prox * 0.10 + permit * 0.15
    compound = 1.6 if (gas > 0.6 and permit and vent > 0.5) else 1.0
    return min(1.0, base * compound)


def causal_risk(state: ZoneState, override_permit=None) -> float:
    """Returns ignition/incident risk probability in [0, 1]."""
    if not PGMPY_AVAILABLE:
        return _weighted_fallback(state, override_permit)

    evidence = _discretize(state)
    if override_permit is not None:
        evidence["permit"] = override_permit

    result = _INFER.query(variables=["risk"], evidence=evidence, show_progress=False)
    return float(result.values[1])  # P(risk = high)


def single_sensor_baseline(state: ZoneState) -> int:
    """Naive baseline: flags only when gas alone crosses a high threshold."""
    return 1 if state.gas > 82 else 0


def counterfactual_revoke_permit(state: ZoneState) -> dict:
    before = causal_risk(state)
    after = causal_risk(state, override_permit=0)
    return {"before": before, "after": after, "delta": before - after}
