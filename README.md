# Rune Examples

Real applications — in real languages and frameworks — deployed on [Rune](https://github.com/runestack/rune).

Each example is self-contained: application source, a `Dockerfile`, and the Rune specs to deploy it. Clone the directory, build the image, `rune cast`, done. The Rune-specific part of every example is deliberately small — that's the point.

> Looking for examples of *Rune features* (init steps, process runner, registry auth, CI)? Those live in the main repo under [`runestack/rune/examples`](https://github.com/runestack/rune/tree/dev/examples). This repo is about deploying *your stack* on Rune.

## Catalog

Organized by application shape, not by language — the Rune spec for a stateless HTTP API is nearly identical whether the app is Java, Rust, or Python. Pick the shape that matches your app, then the closest language.

### Full-stack applications

| Example | Stack | Shows |
| --- | --- | --- |
| [fullstack-spring-react](fullstack-spring-react/) | Spring Boot · React · Postgres | Multi-service, `*.rune` DNS, secrets, dependencies, volumes, expose, runesets |

### Stateless HTTP services

| Example | Stack | Shows |
| --- | --- | --- |
| [go-http](go-http/) | Go · net/http | The smallest possible spec; static binary in a `scratch` image; load-balanced replicas |
| [node-express](node-express/) | Node.js · Express | `envFrom`: config injected from a configmap, changed without rebuilding |
| _planned: rust-axum_ | Rust · Axum | Minimal API service |
| _planned: python-fastapi_ | Python · FastAPI | Minimal API service |
| _planned: zig-http_ | Zig · std.http | Minimal API service |

### Static sites & SPAs

| Example | Stack | Shows |
| --- | --- | --- |
| _planned: react-vite-spa_ | React · Vite · nginx | SPA with API proxy |
| _planned: nextjs-static_ | Next.js static export | Static hosting |

### Workers & background jobs

| Example | Stack | Shows |
| --- | --- | --- |
| _planned: worker-redis-queue_ | any · Redis | Queue consumer, scale-to-N |

### Observability backends

Reference runesets for running a [RuneSight](https://docs.runestack.io/observability/overview) log backend *on* Rune itself — cast the runeset, point `observability:` in your runefile at the in-cluster DNS name, logs flow.

| Example | Backend | Tier | Shows |
| --- | --- | --- | --- |
| [clickhouse](clickhouse/) | ClickHouse 24.8 | Advanced (SQL, percentiles) | Stateful service, secret-fed env, config XML via configmap mount, S3 tiering via storage policy |
| [loki](loki/) | Grafana Loki 3.x | Core | Single-binary Loki, config templated from values, init-step volume chown, straight-to-S3 option |

Want one that isn't here? [Open an issue](../../issues) — or better, [contribute it](CONTRIBUTING.md). `TEMPLATE/` gets you most of the way.

## Anatomy of an example

```
my-example/
├── README.md          # what it shows, how to run it
├── app/ (or api/, web/, …)   # application source — intentionally boring
│   └── Dockerfile
├── deploy/
│   └── app.yaml       # plain castfile — the simplest path
└── runeset/           # optional: the same stack packaged with values
```

## Versioning

Examples track the latest Rune release. Every example is linted (`rune lint`) and rendered (`rune cast --render`) in CI against the current CLI.
