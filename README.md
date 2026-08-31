# Meridian

AI research intelligence terminal. It ranks what to read — papers, lab notes, engineering posts, and open-source artifacts — by technical depth rather than virality.

## What it does

- Ingests official RSS/Atom feeds, the arXiv API, GitHub search/releases, and Hugging Face model listings
- Deduplicates coverage into clusters (one development, many sources)
- Classifies into a research taxonomy and scores importance
- Surfaces Today / This week / Deep reads / Breaking / Build this
- Knowledge graph, trends, weekly & monthly reports, model/org/source pages
- On-demand Grok briefings (“explain like an engineer”) using the injected `XAI_API_KEY`
- Personal bookmarks and follows stored locally in the browser

It does **not** store full copyrighted articles. Records are metadata, URLs, abstracts/snippets, and generated summaries.

## Stack

TanStack Start, React, Tailwind, Postgres (Neon in production, PGLite in preview).

## Data sources

See `src/lib/intelligence/sources.ts`. Preferred order: official API → RSS → public JSON. Scraping of article bodies is not used.

## Scoring

```
importance =
  0.25 technical depth
+ 0.20 novelty
+ 0.15 source credibility
+ 0.15 practical impact
+ 0.10 community adoption
+ 0.10 recency
+ 0.05 trend momentum
```

## Development

`npm run dev` — preview on port 8080  
`npm run build` — production build + migrations  
`npm run typecheck`

API keys are injected by the host (`DATABASE_URL`, `XAI_API_KEY`). Do not put secrets in the repo.
