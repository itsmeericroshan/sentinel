"""
Synthetic plant data generator.

Generates a 60-tick timeline per zone. One zone (cobA) carries an
injected compound-risk ramp modeled on the Visakhapatnam pattern: gas
pressure climbs, ventilation degrades, and a hot-work permit opens
partway through — none of which alone crosses a single-sensor threshold.
"""

import random

ZONES = [
    # x, y, w, h are percentage coordinates (0-100) on the plant layout SVG,
    # matching a realistic coke-oven battery plant footprint: batteries
    # adjacent to the gas holder (shared gas main), maintenance/permit
    # offices set back from the hot zone, worker assembly near the perimeter.
    {"id": "cobA", "name": "Coke Oven Battery A", "x": 32, "y": 38, "w": 22, "h": 26},
    {"id": "cobB", "name": "Coke Oven Battery B", "x": 32, "y": 68, "w": 22, "h": 26},
    {"id": "gasHolder", "name": "Gas Holder Station", "x": 60, "y": 30, "w": 16, "h": 20},
    {"id": "maint", "name": "Maintenance Bay 2", "x": 60, "y": 58, "w": 16, "h": 18},
    {"id": "permit", "name": "Permit Control Office", "x": 82, "y": 30, "w": 14, "h": 16},
    {"id": "assembly", "name": "Worker Assembly Zone", "x": 82, "y": 58, "w": 14, "h": 30},
]

TOTAL_TICKS = 60
INCIDENT_ZONE = "cobA"


def _rand(a, b):
    return a + random.random() * (b - a)


def gen_zone_timeline(zone_id: str):
    ticks = []
    is_incident_zone = zone_id == INCIDENT_ZONE
    for t in range(TOTAL_TICKS):
        if is_incident_zone and t >= 30:
            progress = min(1.0, (t - 30) / 22)
            gas = 35 + progress * 55 + _rand(-3, 3)
            vent = 75 - progress * 45 + _rand(-3, 3)
            permit = 1 if t >= 38 else 0
            maint = 1 if 33 <= t <= 50 else 0
            prox = 30 + progress * 35
        else:
            gas = _rand(15, 40)
            vent = _rand(65, 90)
            permit = 1 if random.random() < 0.05 else 0
            maint = 1 if random.random() < 0.07 else 0
            prox = _rand(10, 35)

        ticks.append({
            "gas": max(0, min(100, gas)),
            "vent": max(0, min(100, vent)),
            "permit": permit,
            "maint": maint,
            "prox": max(0, min(100, prox)),
        })
    return ticks


TIMELINES = {z["id"]: gen_zone_timeline(z["id"]) for z in ZONES}
