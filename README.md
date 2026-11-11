# niksyskills

A personal registry for agent skills. Every folder in `skills/` with a `SKILL.md` becomes a
documentation page, a stable raw URL, and a one-line install command. Built with Next.js 16
and [Astryx](https://astryx.atmeta.com).

## Add a skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` in the YAML frontmatter.
2. Put any supporting files next to it (for example `references/`).
3. Deploy. The site, `/skills.json`, `/llms.txt`, and the installer pick it up automatically.

Optional frontmatter keys the site understands: `tags` (list), `collection` (string, overrides
the auto-derived group), `capabilities` (list, overrides the badge heuristics: `read-only`,
`uses-git`, `writes-files`, `runs-checks`).

## Install a skill from the site

```bash
curl -fsSL https://<your-domain>/install.sh | bash -s -- git-commit-message
curl -fsSL https://<your-domain>/install.sh | bash -s -- session-handoff --target codex --project
curl -fsSL https://<your-domain>/install.sh | bash -s -- --list
```

Install targets and their directories live in `lib/targets.ts`. Flags: `--target claude|codex|cursor|gemini|agents`,
`--project` (install into the current repo), `--dir <path>`.

## Endpoints for agents

| Path | What it is |
| --- | --- |
| `/llms.txt` | Plain-text index with install instructions |
| `/skills.json` | JSON index of every skill |
| `/install.sh` | Bash installer |
| `/skills/<name>/manifest.json` | Files and metadata for one skill |
| `/skills/<name>/files.txt` | One relative path per line (used by the installer) |
| `/skills/<name>/raw/<path>` | Raw file contents |

## Development

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

Set `NEXT_PUBLIC_SITE_URL=https://<your-domain>` in production so generated commands use the public
origin even when the request is proxied.
