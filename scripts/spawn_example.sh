#!/usr/bin/env bash
# Example usage of the manager API to spawn a user VM
# Edit ADMIN_TOKEN and DOMAIN to match your .env

ADMIN_TOKEN=${ADMIN_TOKEN:-replace-with-a-strong-secret}
MANAGER_HOST=${MANAGER_HOST:-localhost:3000}
USERNAME=${1:-alice}
VNC_PASSWORD=${2:-s3cret}

curl -s -X POST "http://${MANAGER_HOST}/api/v1/spawn" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"vncPassword\":\"${VNC_PASSWORD}\"}" | jq .
