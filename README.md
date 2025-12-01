# NOT WORKING! IF SOMEONE CAN FIND A GOOD DOCKER_HOST, THAT WOULD BE NICE!

## webvm (noVNC per-user container manager)

This repository provides a starter setup to run GUI desktops (with a web-accessible noVNC client) in per-user Docker containers, fronted by Traefik. A small manager service creates per-user containers and configures Traefik routing so each user's desktop is available at username.DOMAIN (HTTPS via Let's Encrypt if configured).

WARNING: This starter repo is useful for evaluation and internal deployments. It deliberately mounts the Docker socket to the manager, which is powerful and dangerous — treat with caution. For production consider an orchestrator (Kubernetes), a proper session broker (Guacamole, Nomad, or a self-hosted spawning service with least privilege) or VM-based isolation (KVM).

Contents
- docker-compose.yml — Traefik + manager (manager spawns desktop containers)
- traefik/ — optional static config fragments (not required for simple usage)
- manager/ — Node.js app that creates/removes desktop containers via Docker API
- data/ — host directory used to persist per-user home/data

Prerequisites
- Docker & Docker Compose
- A DNS wildcard or A records pointing *.DOMAIN to the server IP (for per-user subdomains). For local testing you can use /etc/hosts entries like:
  127.0.0.1 alice.localtest.me
  127.0.0.1 bob.localtest.me
  (or use xip.io / nip.io style hostnames)
- (Optional) Port 80 and 443 reachable from the public internet for Let's Encrypt

Quickstart (local testing)
1. Copy the example env:
   cp .env.example .env
   Edit .env to set DOMAIN and ADMIN_TOKEN.

2. Bring up Traefik and the manager:
   docker compose up -d

3. Create a user VM (example):
   curl -X POST "http://localhost:3000/api/v1/spawn" \
     -H "Authorization: Bearer ${ADMIN_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"username":"alice","vncPassword":"s3cret"}'

   After success you should be able to open:
   https://alice.${DOMAIN}/
   (or http://alice.localhost:6901 in some setups) — Traefik routes to the container's noVNC web endpoint.

4. Stop and remove a user VM:
   curl -X POST "http://localhost:3000/api/v1/remove" \
     -H "Authorization: Bearer ${ADMIN_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"username":"alice"}'

Files to review
- manager/index.js — main manager implementation
- docker-compose.yml — shows Traefik and manager
- .env.example — environment variables

Security & Production notes
- Protect the manager API (it's currently only bearer-token protected). Put it behind a firewall or an auth proxy.
- Disable the insecure Traefik API (--api.insecure=false) and secure the dashboard.
- Consider per-user resource limiting (cpus, memory) when creating containers.
- For multi-user, orchestration and autoscaling, use Kubernetes or a VM-based session broker.
- For very strong isolation, use real VMs (cloud VMs, KVM) rather than containers that share the kernel.

Alternatives / Improvements
- Use Apache Guacamole for an integrated RDP/VNC gateway and user management.
- Replace the manager with a safe service account that uses a limited API or operate the service in a separate network and control with additional auth.
- Add service to automatically stop idle containers.

```
