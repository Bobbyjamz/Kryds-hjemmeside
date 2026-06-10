# KrydsByg ScrapeGraph Proxy

AI-drevet scraping-microservice til LeadBot. Wrapper [ScrapeGraphAI](https://github.com/ScrapeGraphAI/Scrapegraph-ai)
saa LeadBot (TypeScript/Vercel) kan udtraekke leads fra sider hvis HTML er for
ustabil til regex (Stepstone, Degulesider, Proff, Jobnet).

## Hvorfor separat service?

ScrapeGraphAI er Python. Vercel-funktioner er Node. Derfor koerer denne proxy
separat (Railway) og LeadBot kalder den over HTTP via `SCRAPEGRAPH_PROXY_URL`.

## Endpoints

- `GET /health` - status + om OPENAI_API_KEY er sat
- `POST /scrape` - body `{ url, prompt, max_results }`, header `x-proxy-secret`

## Deploy paa Railway

1. `railway init` i denne mappe (eller importer repo, sat root til `scrape-proxy`)
2. Saet Variables:
   - `SCRAPE_PROXY_SECRET` - lang tilfaeldig streng (samme i LeadBot env)
   - `OPENAI_API_KEY` - til LLM-udtraek
   - `SCRAPE_MODEL` - valgfri, default `openai/gpt-4o-mini`
3. Deploy. Railway giver en URL, fx `https://kryds-scrape.up.railway.app`
4. I LeadBot (Vercel) saet:
   - `SCRAPEGRAPH_PROXY_URL=https://kryds-scrape.up.railway.app`
   - `SCRAPE_PROXY_SECRET=` (samme som ovenfor)
   - `SCRAPEGRAPH_ENABLED=true`

## Lokal test

```bash
pip install -r requirements.txt
export SCRAPE_PROXY_SECRET=test OPENAI_API_KEY=sk-...
uvicorn main:app --reload
curl -X POST localhost:8000/scrape -H "x-proxy-secret: test" \
  -H "content-type: application/json" \
  -d '{"url":"https://www.stepstone.dk/jobs/toemrer/i-koebenhavn","prompt":"Udtraek jobopslag","max_results":10}'
```

## Sikkerhed

- Uden korrekt `x-proxy-secret` -> 401.
- Proxyen scraper kun de URLs LeadBot beder om (kuraterede kilder + Brain-targets).
