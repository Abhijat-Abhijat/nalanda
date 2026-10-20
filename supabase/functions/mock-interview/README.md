# mock-interview edge function

Scores a mock interview answer against a rubric with Claude (`claude-sonnet-5-5`). It stores nothing.

## Deploy

```sh
supabase functions deploy mock-interview
supabase secrets set ANTHROPIC_API_KEY=<key> ALLOWED_ORIGINS=https://<your-site>
```

Keep JWT verification on (do not pass `--no-verify-jwt`). Then build the front end with:

```sh
VITE_MOCK_INTERVIEW_URL=https://<project>.supabase.co/functions/v1/mock-interview
VITE_MOCK_INTERVIEW_KEY=<project anon key>
```

Without the URL, the AI mock interview page falls back to self-assessment against the rubric.

## Abuse protection

- Callers send only a prompt id and an answer; the question and rubric are looked up on the server, so the function cannot be used as a general model proxy.
- The function allows 20 requests per hour per IP. The counter lives in the isolate's memory and resets when Supabase recycles it, so also set a spending limit on the Anthropic key.
