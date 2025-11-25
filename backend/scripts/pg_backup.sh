set -euo pipefail
TIMESTAMP=$(date +%F_%H-%M)
OUTDIR=${PG_DUMP_DIR:-/var/backups/saas}
mkdir -p "$OUTDIR"
PG_CONN="${DATABASE_URL:-}"
if [ -z "$PG_CONN" ]; then
  echo "DATABASE_URL missing"
  exit 1
fi
FNAME="$OUTDIR/saasdb_${TIMESTAMP}.sql.gz"
/usr/bin/pg_dump "$PG_CONN" | gzip > "$FNAME"
KEEP_DAYS=${PG_BACKUP_KEEP_DAYS:-30}
find "$OUTDIR" -type f -mtime +"$KEEP_DAYS" -name '*.sql.gz' -delete
echo "Backup saved to $FNAME"
