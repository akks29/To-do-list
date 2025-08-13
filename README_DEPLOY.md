# Deployment (Vercel)

## 1) Create project on Vercel
- Push this repo to GitHub
- Import on Vercel → Framework: Vite
- Build Command: `npm run build`
- Output Dir: `dist`

## 2) Environment variables
- Add `PPLX_API_KEY` with your Perplexity key

## 3) Serverless API
- API route: `api/perplexity.ts` (Edge runtime)
- Frontend calls `/api/perplexity` instead of Perplexity directly

## 4) Local dev
- Dev server: `npm run dev`
- The API route only exists on Vercel. For local testing, either deploy a preview or add a local proxy if needed.

## 5) Notes
- Do not commit secrets. The key is read from `process.env.PPLX_API_KEY` in the serverless function.
