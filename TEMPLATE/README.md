# <Stack name> on Rune

> Template — copy this directory, then replace every `<placeholder>`. Delete this line.

A minimal <framework> service deployed on Rune.

```
browser/client ──▶ <name> (<framework>)  [namespace: demo]
```

## Prerequisites

- A running `runed` and configured `rune` CLI ([quick start](https://docs.runestack.io/start/quick-start)).
- Docker.

## 1. Build

```sh
docker build -t <name>:dev ./app
```

## 2. Deploy

```sh
rune lint deploy/app.yaml
rune cast deploy/app.yaml
```

## 3. Verify

```sh
rune get services -n demo
# paste real output here

curl http://<host>.local/<endpoint>
```

## 4. Tear down

```sh
rune delete -f deploy/app.yaml
```
