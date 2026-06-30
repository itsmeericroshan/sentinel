"""
RAG regulatory + incident-precedent layer.

Embeds a small corpus of paraphrased regulatory guidance and synthetic
near-miss reports into ChromaDB, and retrieves the most relevant clause
plus precedent whenever a zone crosses elevated risk.
"""

import chromadb
from chromadb.utils import embedding_functions

_CLIENT = chromadb.Client()
_EMBED_FN = embedding_functions.DefaultEmbeddingFunction()

_CORPUS = [
    {
        "id": "reg_hotwork_gas",
        "text": (
            "Hot-work permits should not remain active in zones showing elevated "
            "combustible gas readings without a verified ventilation override, "
            "consistent with standard hot-work and confined-space separation "
            "principles reflected in OISD and Factory Act guidance."
        ),
        "type": "regulation",
    },
    {
        "id": "reg_ventilation",
        "text": (
            "Sustained ventilation degradation in an active process zone should "
            "trigger automatic review of any nearby permitted activity, per "
            "standard industrial ventilation safety practice."
        ),
        "type": "regulation",
    },
    {
        "id": "precedent_compound",
        "text": (
            "Synthetic precedent: a compound pattern of rising gas pressure, an "
            "active hot-work permit, and degraded ventilation co-occurred shortly "
            "before a coke-oven battery incident, where each individual sensor "
            "reading remained within its own normal range."
        ),
        "type": "precedent",
    },
    {
        "id": "precedent_nearmiss",
        "text": (
            "Synthetic near-miss: ventilation health dropped below safe levels "
            "near an active maintenance crew; the zone was re-inspected and no "
            "incident occurred, but the pattern was logged for future reference."
        ),
        "type": "precedent",
    },
]

_collection = _CLIENT.get_or_create_collection(
    name="sentinel_regulatory_corpus", embedding_function=_EMBED_FN
)

if _collection.count() == 0:
    _collection.add(
        ids=[c["id"] for c in _CORPUS],
        documents=[c["text"] for c in _CORPUS],
        metadatas=[{"type": c["type"]} for c in _CORPUS],
    )


def retrieve(query: str, n_results: int = 2) -> list[dict]:
    results = _collection.query(query_texts=[query], n_results=n_results)
    out = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        out.append({"text": doc, "type": meta["type"]})
    return out
