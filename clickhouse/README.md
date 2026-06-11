# ClickHouse — RuneSight Advanced-tier backend

A single-node [ClickHouse](https://clickhouse.com/) server packaged as a runeset, sized for one job: being the **Advanced-tier log backend** for Rune's native observability (RuneSight). Cast it, point your runefile at it, and the Log Explorer gains raw SQL, percentiles, and cheap high-cardinality filtering.

This is the "run the backend ON Rune" path — ClickHouse deploys as an ordinary Rune workload: a service, a secret, a configmap, and a persistent volume. A managed ClickHouse (or one you already run) works the same way; only the DSN changes.

## Install

```sh
rune cast ./runeset \
  --release clickhouse \
  --create-namespace \
  --set clickhouse.password=$CLICKHOUSE_PASSWORD
```

What you get:

- `clickhouse` service in the `observability` namespace — native port `9000`, HTTP port `8123`
- A persistent volume (default `20Gi`) on `/var/lib/clickhouse`
- A `clickhouse-credentials` secret (`runesight` user by default)
- A 4Gi memory limit (ClickHouse respects the container cgroup)

## Point Rune at it

Add to your runefile and restart `runed`:

```yaml
observability:
  enabled: true
  backend: clickhouse
  retention_days: 30                 # DELETE TTL — drop parts older than this
  clickhouse:
    dsn: clickhouse://runesight:<password>@clickhouse.observability.rune:9000/runesight
    auto_migrate: true               # creates the database + logs table on first connect
```

`clickhouse.observability.rune` is the in-cluster DNS name (`<service>.<namespace>.rune`). With `auto_migrate: true` (the default) Rune creates the `runesight` database and `logs` table itself — no manual schema step. Set it to `false` if a DBA owns the schema; the table must then exist before `runed` starts ingesting.

That's the whole flow: cast the runeset → set `backend` + `dsn` → logs flow, and the dashboard unlocks the Advanced tier (SQL mode, percentile aggregations, arbitrary-field filters).

## Values

| Value | Default | Notes |
| --- | --- | --- |
| `clickhouse.image` | `clickhouse/clickhouse-server:24.8` | Pin your own. |
| `clickhouse.database` | `runesight` | Must match `clickhouse.database` in the runefile. |
| `clickhouse.user` | `runesight` | Created by the image entrypoint on first boot. |
| `clickhouse.password` | — | **Required.** `--set clickhouse.password=...` |
| `clickhouse.volumeSize` | `20Gi` | The hot-data volume. |
| `clickhouse.memoryLimit` | `4Gi` | Container memory limit. |
| `clickhouse.extraConfigXml` | `<clickhouse><listen_host>::</listen_host></clickhouse>` | One line of server config XML — see S3 tiering below. |

> The config mount shadows the image's `config.d/docker_related_config.xml`, which is what normally sets `listen_host`. Any value you supply for `extraConfigXml` **must keep `<listen_host>::</listen_host>`** or the server stops accepting remote connections.

## S3 tiering (optional)

Rune has **no S3 client** in the observability path — object storage is always ClickHouse's own concern, configured server-side as a storage policy. Anything S3-compatible works (S3, MinIO, R2, Spaces, GCS interop). Rune's only part is the table's TTL clause: with `storage_policy` set in the runefile, parts older than `hot_days` move to the policy's S3 volume.

**1. Give ClickHouse the storage policy** — replace `extraConfigXml` with this one-liner (one line because it's injected into YAML; fill in endpoint + credentials):

```
<clickhouse><listen_host>::</listen_host><storage_configuration><disks><s3_disk><type>s3</type><endpoint>https://BUCKET.s3.REGION.amazonaws.com/runesight/</endpoint><access_key_id>KEY</access_key_id><secret_access_key>SECRET</secret_access_key><metadata_path>/var/lib/clickhouse/disks/s3_disk/</metadata_path></s3_disk></disks><policies><runesight_tiered><volumes><hot><disk>default</disk></hot><s3><disk>s3_disk</disk></s3></volumes><move_factor>0.1</move_factor></runesight_tiered></policies></storage_configuration></clickhouse>
```

The same XML, readable (what ClickHouse actually sees in `config.d/extra.xml`):

```xml
<clickhouse>
  <listen_host>::</listen_host>
  <storage_configuration>
    <disks>
      <s3_disk>
        <type>s3</type>
        <endpoint>https://BUCKET.s3.REGION.amazonaws.com/runesight/</endpoint>
        <access_key_id>KEY</access_key_id>
        <secret_access_key>SECRET</secret_access_key>
        <metadata_path>/var/lib/clickhouse/disks/s3_disk/</metadata_path>
      </s3_disk>
    </disks>
    <policies>
      <runesight_tiered>
        <volumes>
          <hot>
            <disk>default</disk>
          </hot>
          <s3>
            <disk>s3_disk</disk>
          </s3>
        </volumes>
        <move_factor>0.1</move_factor>
      </runesight_tiered>
    </policies>
  </storage_configuration>
</clickhouse>
```

Apply it via a values file (keeps the XML out of your shell history):

```sh
rune cast ./runeset --release clickhouse -f s3.values.yaml \
  --set clickhouse.password=$CLICKHOUSE_PASSWORD
```

**2. Tell Rune to tier** — in the runefile:

```yaml
observability:
  enabled: true
  backend: clickhouse
  retention_days: 90                 # delete after 90 days (wherever parts live)
  clickhouse:
    dsn: clickhouse://runesight:<password>@clickhouse.observability.rune:9000/runesight
    storage_policy: runesight_tiered # must match the policy name in the XML
    s3_volume: s3                    # must match the volume name in the XML
    hot_days: 7                      # parts older than this move to S3
```

The result is a table TTL of `... + INTERVAL 7 DAY TO VOLUME 's3', ... + INTERVAL 90 DAY DELETE`: seven hot days on the local volume, then S3 until deletion.

> Credentials in the XML land in a configmap. For production, prefer bucket-scoped keys, or keep the runeset's default config and manage `storage_configuration` outside Rune entirely — the runefile side (`storage_policy`/`s3_volume`/`hot_days`) is identical either way.

## Day two

```sh
rune release status clickhouse -n observability   # owned resources + revision
rune logs clickhouse -n observability             # server logs
rune release delete clickhouse -n observability --keep-volumes --yes
```

The volume's data survives `--keep-volumes`; recasting the runeset and pointing at the same volume picks the data back up.

## Notes

- **Cluster-internal by default.** Ports 9000/8123 are reachable inside the cluster network only; nothing is exposed publicly. The image's `default` user exists with an empty password — if you harden it, do so via `users.d` config; don't remove the `runesight` user the DSN depends on.
- **Sizing.** One node, MergeTree, `LowCardinality` columns and a token bloom-filter index on `line` — comfortable for single-cluster log volumes. If you outgrow one node you've outgrown this runeset; ClickHouse clustering is out of scope here.
- The adapter itself is integration-tested in the main repo (testcontainers); this runeset is the deployment-level reference.
