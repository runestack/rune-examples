# Full-stack: Spring Boot + React + Postgres

A complete three-tier application on Rune:

```
                    ┌─────────────────────── Rune (namespace: demo) ───────────────────────┐
                    │                                                                       │
 browser ──HTTP──▶  │  web (nginx + React SPA)  ──/api/*──▶  api (Spring Boot) ──▶ postgres │
        notes.local │  expose: notes.local                   ×2 replicas          + volume  │
                    │                                                                       │
                    └───────────────────────────────────────────────────────────────────────┘
```

- **`web/`** — React (Vite) SPA served by nginx. nginx proxies `/api/*` to the API via Rune's embedded DNS (`api.demo.rune`).
- **`api/`** — Spring Boot 3 / Java 21 REST API (`/api/notes`), health-checked via Actuator probes.
- **`deploy/app.yaml`** — the whole stack as one plain castfile. Start here.
- **`runeset/`** — the same stack packaged as a runeset with values and releases. Graduate to this.

What it demonstrates: multi-service deployment, service discovery over `*.rune` DNS, secrets injected as env vars, service dependencies, HTTP + TCP health probes, persistent volumes via `claimTemplate`, external exposure, and runeset packaging.

## Prerequisites

- A running `runed` and a configured `rune` CLI ([quick start](https://docs.runestack.io/start/quick-start)). For a laptop, start the server with `--dev-mode`.
- Docker (the images are built locally; no registry needed on a single node).

## 1. Build the images

```sh
docker build -t notes-api:dev ./api
docker build -t notes-web:dev ./web
```

## 2. Deploy

Plain castfile:

```sh
rune lint deploy/app.yaml
rune cast deploy/app.yaml
```

Or as a runeset release (templated images/replicas/host, upgradeable, rollback-able):

```sh
rune cast ./runeset --render                  # inspect what will be created
rune cast ./runeset --release notes \
  --set postgres.password=$(openssl rand -hex 16)
```

## 3. Watch it come up

```sh
rune get services -n demo
```

Dependencies order the rollout: `postgres` first, then `api` (waits for the TCP probe), then `web`.

```
NAME      TYPE       STATUS   INSTANCES  EXTERNAL     GENERATION  AGE
postgres  container  Running  1/1        -            1           1m
api       container  Running  2/2        -            1           1m
web       container  Running  1/1        notes.local  1           1m
```

## 4. Use it

```sh
# Point the hostname at the node (laptop example):
echo "127.0.0.1 notes.local" | sudo tee -a /etc/hosts

curl -X POST http://notes.local/api/notes \
  -H 'Content-Type: application/json' \
  -d '{"text": "deployed on rune"}'

open http://notes.local        # the React app
```

In dev mode the ingress binds `:8080` instead of `:80`, so use `http://notes.local:8080`.

## 5. Poke around

```sh
rune logs api -n demo -f                 # stream API logs
rune exec postgres -n demo -- psql -U notes -c 'select * from note;'
rune scale api 4 -n demo                 # scale the API tier
rune volume list -n demo                 # pgdata-postgres-0 survives restarts
```

## 6. Tear down

```sh
rune release delete notes --yes          # runeset install
# or, for the castfile install:
rune delete -f deploy/app.yaml
```

## Local development (no Rune)

```sh
docker run -d -p 5432:5432 -e POSTGRES_DB=notes -e POSTGRES_USER=notes -e POSTGRES_PASSWORD=notes postgres:16-alpine
(cd api && ./mvnw spring-boot:run)       # or: mvn spring-boot:run
(cd web && npm install && npm run dev)   # Vite proxies /api to :8080
```

## Notes

- The namespace (`demo`) and the API DNS name (`api.demo.rune` in [web/nginx.conf](web/nginx.conf)) are fixed. If you change the namespace, update the nginx proxy target and the `SPRING_DATASOURCE_URL`.
- The secret password defaults to `change-me-please` so the example works out of the box — always `--set postgres.password=...` for anything real.
- For a real domain with automatic TLS, run the node with `--node-role=edge` and uncomment the `tls: auto` block in the web service. See [Expose a service](https://docs.runestack.io/guides/expose-service).
