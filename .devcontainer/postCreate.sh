#!/usr/bin/env bash
set -e

echo "=== webvm Codespace postCreate ==="
echo
echo "This Codespace is configured to develop the manager and run docker client against a remote Docker daemon."
echo
echo "Important: You must set DOCKER_HOST (and optionally DOCKER_TLS_VERIFY/DOCKER_CERT_PATH) in this Codespace environment"
echo "so the docker CLI can talk to a machine that actually runs containers (a VM or your local Docker Desktop)."
echo
echo "Helpful checks:"
echo "- docker version (will fail if DOCKER_HOST not set):"
docker version || true
echo
echo "If you want to run the full stack remotely, do this:"
echo "  1) Ensure a remote Docker host (cloud VM or your laptop) is running and reachable."
echo "     For quick testing you can enable Docker TCP on the remote host (insecure) or create an SSH tunnel (preferred)."
echo "  2) Set DOCKER_HOST environment variable in Codespaces (via Repository > Codespaces > Secrets or export in terminal):"
echo "     export DOCKER_HOST=tcp://<your-docker-host>:2375"
echo "  3) From the repo root in this Codespace run:"
echo "     docker-compose -f docker-compose.yml up -d"
echo
echo "To run only the manager (so it creates containers on the remote Docker), run:"
echo "  cd manager && npm install && npm start"
echo
echo "See README-codespaces.md for full step-by-step instructions."
