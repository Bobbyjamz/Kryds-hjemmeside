"""
KrydsByg ScrapeGraphAI Proxy
============================

FastAPI-microservice der wrapper ScrapeGraphAI. LeadBot's Brain Layer (TypeScript
paa Vercel) kan ikke koere Python, saa denne service koerer separat (Railway) og
eksponerer et endpoint: POST /scrape.

Den loeser de 3 deaktiverede scrapers (Stepstone, Degulesider/Proff, Jobnet) - i
stedet for regex-moenstre der knaekker naar sider redesignes, forstaar
ScrapeGraphAI HTML semantisk via en LLM og udtraekker strukturerede data ud fra
en prompt.

Kontrakt (matcher lib/lead-finder/sources/scrapegraph.ts):

  POST /scrape
  { "url": "...", "prompt": "...", "max_results": 15 }
  -> { "ok": true, "items": [ {"title": "...", "company": "...", "city": "..."} ] }

Sikkerhed: kraever header x-proxy-secret = env SCRAPE_PROXY_SECRET. Uden -> 401.
"""

from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from scrapegraphai.graphs import SmartScraperGraph

app = FastAPI(title="KrydsByg ScrapeGraph Proxy", version="1.0.0")

PROXY_SECRET = os.environ.get("SCRAPE_PROXY_SECRET", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
SCRAPE_MODEL = os.environ.get("SCRAPE_MODEL", "openai/gpt-4o-mini")


class ScrapeRequest(BaseModel):
    url: str = Field(..., description="Side der skal scrapes")
    prompt: str = Field(..., description="Hvad ScrapeGraphAI skal udtraekke")
    max_results: int = Field(20, ge=1, le=100)


class ScrapeResponse(BaseModel):
    ok: bool
    items: list[dict[str, Any]]
    error: str | None = None


def _graph_config() -> dict[str, Any]:
    return {
        "llm": {"api_key": OPENAI_API_KEY, "model": SCRAPE_MODEL},
        "verbose": False,
        "headless": True,
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "model": SCRAPE_MODEL, "configured": bool(OPENAI_API_KEY)}


@app.post("/scrape", response_model=ScrapeResponse)
def scrape(body: ScrapeRequest, x_proxy_secret: str = Header(default="")) -> ScrapeResponse:
    if not PROXY_SECRET or x_proxy_secret != PROXY_SECRET:
        raise HTTPException(status_code=401, detail="Ugyldig proxy-secret")
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY mangler i proxy-env")

    full_prompt = (
        f"{body.prompt}. "
        f"Returner op til {body.max_results} resultater som en JSON-liste af objekter. "
        f"Brug feltnavnene: title, company, city. Spring raekker over uden en title."
    )

    try:
        graph = SmartScraperGraph(prompt=full_prompt, source=body.url, config=_graph_config())
        result = graph.run()
    except Exception as exc:
        return ScrapeResponse(ok=False, items=[], error=str(exc)[:300])

    return ScrapeResponse(ok=True, items=_normalize(result)[: body.max_results])


def _normalize(result: Any) -> list[dict[str, Any]]:
    """ScrapeGraphAI returnerer enten en liste, eller et dict med en liste indeni."""
    if isinstance(result, list):
        return [r for r in result if isinstance(r, dict)]
    if isinstance(result, dict):
        for value in result.values():
            if isinstance(value, list):
                return [r for r in value if isinstance(r, dict)]
        if result:
            return [result]
    return []
