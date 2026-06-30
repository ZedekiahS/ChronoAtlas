# AI Setup

ChronoAtlas uses the server-side API only. Do not put model API keys in frontend code.

## Provider

Set one provider:

```env
AI_PROVIDER=deepseek
```

Supported values:

- `deepseek`
- `openai`

## DeepSeek

Recommended for mainland China deployments:

```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=replace_with_deepseek_key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

## OpenAI

Optional for supported regions or international deployments:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=replace_with_openai_key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

## Local Test

Start the API after setting environment variables:

```bash
npm run api
```

Retrieve evidence without calling a model:

```bash
curl "http://127.0.0.1:5174/api/ai/retrieve?q=赤壁之战有哪些史料依据&eventId=china-208-red-cliffs&region=china&year=208&limit=5"
```

Generate an evidence-bound answer:

```bash
curl -X POST "http://127.0.0.1:5174/api/ai/evidence-answer" \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"赤壁之战有哪些史料依据？\",\"locale\":\"zh\",\"limit\":5,\"context\":{\"eventId\":\"china-208-red-cliffs\",\"region\":\"china\",\"year\":208}}"
```

The answer endpoint first runs structured retrieval. If no evidence is found, it returns an insufficient-evidence answer and does not call the model.

## Security

- Keep real keys in local environment variables or deployment secrets.
- Do not commit `.env`.
- Rotate any key that was pasted into chat, logs, screenshots, or issue trackers.
- The frontend calls only ChronoAtlas APIs. It never receives provider API keys.
