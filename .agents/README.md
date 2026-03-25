# Agent Resources

This directory is the agent-facing resource hub for this repo.

- `skills/` contains installed skills managed by `skills.sh`
- `references.md` lists the preferred docs, `llms.txt` files, and skills by domain
- `docs/prds/` remains the product source of truth for what to build

When multiple sources exist, use this order:

1. `docs/prds/` for product intent
2. Official docs and `llms.txt` for library behavior
3. Local installed skills for workflow and implementation guidance

Use skills as supporting guidance for repo workflows, not as a replacement for canonical product or library docs.
