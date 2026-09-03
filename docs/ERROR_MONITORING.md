# Error Monitoring Strategy

CAP Mastery uses a provider-neutral pilot boundary. User-facing route failures show a stable recovery message and never display raw database, network, account, or exception text. Development logs emit only:

- `area`: broad product area;
- `operation`: a fixed developer-authored action name;
- `category`: `network`, `access`, `validation`, or `unexpected`.

Do not log email, name, user/session/question IDs, prompts, choices, answers, correctness, source text, URLs containing tokens, JWTs, credentials, exception messages, or stack traces to a remote provider. Supabase audit records likewise contain safe action summaries rather than secrets or content.

For the small pilot, support records should include time, app version/platform, page name, the safe message shown, whether retry worked, and a user description. Never ask a cadet to send a password or screenshot containing answers. Escalate repeated sign-in/access failures, inability to save answers, suspected cross-account data, or any suspected credential/answer leak immediately; pause the pilot for a privacy/security incident.

No remote monitoring SDK or DSN is configured. If a provider is chosen later, document its data region, retention, child-data settings, access list, sampling, deletion process, and scrubber test before enabling it. Add its DSN only through an approved environment store and confirm the client bundle contains no privileged key.
