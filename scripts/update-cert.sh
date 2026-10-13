#!/bin/sh
# Syncs Let's Encrypt cert into faceit-api app dir so the non-root pm2 process can read it.
# Runs from cron as root; restarts the API only when the cert actually changed.
set -e
SRC_DIR=/etc/letsencrypt/live/lacurte.ro-0001
DST_DIR=/var/www/faceit-api/certs

if cmp -s "$SRC_DIR/fullchain.pem" "$DST_DIR/faceit-api.crt" && \
   cmp -s "$SRC_DIR/privkey.pem" "$DST_DIR/faceit-api.key"; then
  exit 0
fi

cp -f "$SRC_DIR/fullchain.pem" "$DST_DIR/faceit-api.crt"
cp -f "$SRC_DIR/privkey.pem" "$DST_DIR/faceit-api.key"
chown niki:niki "$DST_DIR/faceit-api.crt" "$DST_DIR/faceit-api.key"
chmod 644 "$DST_DIR/faceit-api.crt"
chmod 600 "$DST_DIR/faceit-api.key"
sudo -u niki -H /home/niki/.local/bin/pm2 restart faceit-api >/dev/null 2>&1 || true
echo "cert synced + api restarted"
