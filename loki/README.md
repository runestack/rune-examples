# Loki — RuneSight Core-tier backend

Single-binary [Grafana Loki](https://grafana.com/oss/loki/) packaged as a runeset — a **Core-tier log backend** for Rune's native observability (RuneSight). Cast it, point your runefile at it, and Rune's log pipeline writes to Loki instead of the embedded store, with Loki owning storage and retention.

This is the "run the backend ON Rune" path — Loki deploys as an ordinary Rune workload: a service, a configmap, and a persistent volume. Grafana Cloud Logs or a Loki you already run works the same way; only the URL changes.

## Install

```sh
rune cast ./runeset --release loki --create-namespace
```

What you get:

- `loki` service in the `observability` namespace, HTTP port `3100`
- A persistent volume (default `10Gi`) on `/loki` for chunks + TSDB index
- Retention enforced by Loki's compactor (default `168h` = 7 days)
- A 1Gi memory limit — single-binary Loki is light at single-cluster volume

## Point Rune at it

Add to your runefile and restart `runed`:

```yaml
observability:
  enabled: true
  backend: loki
  loki:
    url: http://loki.observability.rune:3100
    tenant_id: ""        # set if your Loki enforces multi-tenancy (X-Scope-OrgID)
```

`loki.observability.rune` is the in-cluster DNS name (`<service>.<namespace>.rune`). That's the whole flow: cast the runeset → set `backend` + `url` → logs flow, and the Log Explorer queries Loki under the hood (Core tier: full selectors, line filters, `logfmt`/`json` parsers, rates and counts).

> Retention is Loki's job, not Rune's — `observability.retention_days` in the runefile does not apply to the Loki backend. Tune `loki.retention` here instead.

## Values

| Value | Default | Notes |
| --- | --- | --- |
| `loki.image` | `grafana/loki:3.1.1` | Pin your own. |
| `loki.volumeSize` | `10Gi` | Chunks + index volume (filesystem mode). |
| `loki.memoryLimit` | `1Gi` | Container memory limit. |
| `loki.retention` | `168h` | Compactor-enforced retention (Loki duration syntax). |
| `loki.storage` | filesystem flow-mapping | Single-line YAML injected into `common.storage` — see S3 below. |
| `loki.objectStore` | `filesystem` | Must name the store `loki.storage` configures (`filesystem` or `s3`). |

## Straight to S3 (optional)

Loki is S3-native: chunks and index can skip the volume entirely and live in object storage. Rune has **no S3 client** in the observability path — this is purely Loki's own configuration, so anything S3-compatible works (S3, MinIO, R2, Spaces, GCS interop).

`s3.values.yaml`:

```yaml
loki:
  objectStore: s3
  storage: "{s3: {endpoint: s3.eu-west-1.amazonaws.com, region: eu-west-1, bucketnames: my-loki-bucket, access_key_id: KEY, secret_access_key: SECRET, s3forcepathstyle: false}}"
```

```sh
rune cast ./runeset --release loki -f s3.values.yaml
```

The value is a single-line YAML flow mapping because it's injected into the config block verbatim — Loki reads it exactly as if you'd written the nested `common.storage.s3` section by hand. For MinIO or other path-style endpoints set `s3forcepathstyle: true` and use the full `http://minio.example:9000` endpoint.

The volume still backs the compactor working directory and WAL, so keep it even in S3 mode (it can be small).

## Day two

```sh
rune release status loki -n observability   # owned resources + revision
rune logs loki -n observability             # Loki's own logs
rune release delete loki -n observability --keep-volumes --yes
```

## Notes

- **First boot does a `chown`.** The loki image runs as uid `10001`; a fresh volume is root-owned. An init step (`busybox chown`) hands `/loki` over before the main container starts — you'll see it once per fresh volume in `rune logs --init-step`.
- **Single binary, single replica.** `replication_factor: 1`, in-memory ring. This is the right shape for one cluster's logs; if you need HA Loki you're past what a reference runeset should hide from you.
- **Multi-tenancy is off** (`auth_enabled: false`) — the usual choice when Loki serves one Rune cluster on a private network. If you front it with a multi-tenant Loki, set `tenant_id` in the runefile instead.
