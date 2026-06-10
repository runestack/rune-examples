# Go (net/http) on Rune

A minimal stateless HTTP service in Go — standard library only, compiled to a static binary in a `scratch` image (~7 MB).

```
browser/client ──▶ go-hello ×2 (net/http)  [namespace: demo]
                   expose: go-hello.local
```

What it demonstrates: the smallest possible service spec — image, port, liveness probe, expose. The `/api/hello` response includes the instance hostname, so with `scale: 2` you can watch Rune's VIP load-balance requests across replicas.

## Prerequisites

- A running `runed` and configured `rune` CLI ([quick start](https://docs.runestack.io/start/quick-start)).
- Docker.

## 1. Build

```sh
docker build -t go-hello:dev ./app
```

## 2. Deploy

```sh
rune lint deploy/app.yaml
rune cast deploy/app.yaml
rune get services -n demo
```

## 3. Verify

```sh
echo "127.0.0.1 go-hello.local" | sudo tee -a /etc/hosts

curl http://go-hello.local/api/hello
# {"message":"hello from go on rune","instance":"a1b2c3d4e5f6"}

# Run it a few times — the instance hostname alternates across the 2 replicas.
```

In dev mode the ingress binds `:8080`, so use `http://go-hello.local:8080`.

## 4. Tear down

```sh
rune delete -f deploy/app.yaml
```
