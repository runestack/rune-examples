# Node.js (Express) on Rune

A minimal stateless Express service, with its configuration injected from a Rune configmap as environment variables.

```
browser/client ──▶ node-hello ×2 (express)  [namespace: demo]
                   expose: node-hello.local      env ← configmap
```

What it demonstrates: a stateless HTTP service plus `envFrom` — keys in the `node-hello-settings` configmap land in the container as env vars, so config changes don't require an image rebuild.

## Prerequisites

- A running `runed` and configured `rune` CLI ([quick start](https://docs.runestack.io/start/quick-start)).
- Docker.

## 1. Build

```sh
docker build -t node-hello:dev ./app
```

## 2. Deploy

```sh
rune lint deploy/app.yaml
rune cast deploy/app.yaml
rune get services -n demo
```

## 3. Verify

```sh
echo "127.0.0.1 node-hello.local" | sudo tee -a /etc/hosts

curl http://node-hello.local/api/hello
# {"message":"hello from node on rune","instance":"f6e5d4c3b2a1"}
```

In dev mode the ingress binds `:8080`, so use `http://node-hello.local:8080`.

## 4. Change config without rebuilding

```sh
rune create config node-hello-settings -n demo --from-literal=GREETING="howdy from a configmap"
rune restart node-hello -n demo      # instances pick up env on restart

curl http://node-hello.local/api/hello
# {"message":"howdy from a configmap", ...}
```

## 5. Tear down

```sh
rune delete -f deploy/app.yaml
```
