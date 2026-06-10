# Contributing an example

Examples here are *deployment recipes*: a small, real app in your language/framework plus the Rune specs to run it. The app should be boring; the Rune part should be exemplary.

## Ground rules

1. **Self-contained.** Everything needed lives in your example directory: app source, `Dockerfile`, Rune specs, README. No shared code between examples.
2. **Minimal app, real shape.** One endpoint or one page is enough — but it must actually build and run. Prefer the framework's idiomatic defaults over cleverness.
3. **Local-first.** `docker build` + `rune cast` on a single dev-mode node must be the whole story. No registries, no cloud accounts, no DNS prerequisites (use `*.local` hosts).
4. **Specs must validate.** `rune lint` must pass on every castfile, and `rune cast --render` must succeed on any runeset. CI enforces this.
5. **Health checks always.** Every service declares a liveness probe. Use your framework's native health endpoint (Actuator, `/healthz`, etc.).
6. **Secrets are secrets.** Database passwords and tokens go through Rune secrets — never plain `env:` literals (a clearly-marked `change-me-please` default is acceptable for out-of-the-box UX).
7. **README follows the house format.** What it shows → prerequisites → build → deploy → verify → tear down. Copy one from an existing example.

## Steps

```sh
cp -r TEMPLATE my-framework-name
```

1. Replace `app/` with a minimal app in your stack. Keep dependencies lean.
2. Write the `Dockerfile` (multi-stage; final image as small as practical; non-root user if the base image supports it).
3. Adapt `deploy/app.yaml` — service name, port, health probe path.
4. Run it end to end on a dev-mode node. Paste the real `rune get services` output into your README.
5. `rune lint deploy/` and open a PR.

## Naming

`<shape>-<stack>` or just `<stack>` when unambiguous: `rust-axum`, `python-fastapi`, `fullstack-spring-react`, `worker-redis-queue`.

## What doesn't belong here

- Examples of Rune *features* in isolation (init steps, RBAC, …) → [`runestack/rune/examples`](https://github.com/runestack/rune/tree/dev/examples)
- Infrastructure provisioning → the `terraform-*-rune` modules
- Anything requiring proprietary services to run
