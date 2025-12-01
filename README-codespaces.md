# Running the webvm repo from GitHub Codespaces

This document explains how to run the webvm repo from a Codespace. Because Codespaces run in an isolated container, you will point the docker CLI in the Codespace at a remote Docker daemon (a cloud VM or your machine).

Two main approaches (choose one)
- Recommended for testing / realistic runs: Use a remote Docker host (cloud VM or laptop running Docker). In Codespace set DOCKER_HOST to point to that host and run docker-compose from the Codespace — containers will be created on the remote host.
- Developer-only: Run the manager in the Codespace (node index.js). The manager will still need to talk to a Docker daemon; set DOCKER_HOST to a remote host.

Step-by-step (quickstart with an insecure remote Docker on a cloud VM)
1) Provision a cloud VM (Ubuntu) and install Docker:
   sudo apt-get update
   sudo apt-get install -y ca-certificates curl gnupg lsb-release
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
     https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io

2) (Insecure, for quick testing only) Configure Docker to listen on TCP 2375:
   Create /etc/docker/daemon.json with:
   {
     "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
   }
   sudo systemctl restart docker
   NOTE: This is insecure because it allows anonymous root-level access. For production use TLS or SSH tunnels.

3) In GitHub -> Your repository -> Settings -> Codespaces -> Repository secrets, add a secret:
   DOCKER_HOST = tcp://<VM_PUBLIC_IP>:2375

   (Alternatively you can export DOCKER_HOST in the Codespace terminal each session.)

4) Open a Codespace on this repo. The devcontainer installs docker CLI and docker-compose.

5) Verify docker works from the Codespace:
   docker version

6) Start the stack on the remote Docker host (from Codespace):
   docker-compose -f docker-compose.yml up -d

7) The remote host will now run Traefik and the manager. Configure DNS so user subdomains (alice.example.com) point to the remote host IP, or for quick local testing use /etc/hosts entries that point at the remote host.

8) Use the manager API from the Codespace (or anywhere) to spawn a user:
   curl -X POST "http://<manager_host>:3000/api/v1/spawn" \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"username":"alice","vncPassword":"s3cret"}'

SSH tunnel (safer) alternative
- Instead of exposing Docker TCP publicly, you can run an SSH tunnel from the Codespace to the remote host and forward a local port to the remote Docker TCP port and then set DOCKER_HOST to point at the local forwarded port.
- Example (from Codespace):
  ssh -L 23750:localhost:2375 user@remote-host
  export DOCKER_HOST=tcp://localhost:23750
  docker version

Running only the manager in Codespace (developer mode)
- If you only want to run the manager locally in the Codespace (useful for developing manager code), set DOCKER_HOST to a remote Docker and run:
  cd manager
  npm install
  npm start
- The manager will accept API requests at port 3000 in the Codespace (forwarded port 3000); however it will still create containers on the Docker host pointed at by DOCKER_HOST.

Notes, production & security
- Do not use an insecure Docker TCP listener in production. Use Docker with TLS certificates or an SSH tunnel. Better: deploy the stack on a real server (cloud VM, dedicated host) and use Codespaces only for development.
- Keep Traefik dashboard and manager API protected and behind auth/firewall.
- If you want to use Codespaces to run everything without a remote Docker host, consider using a VM (or local machine) instead of Codespaces — Codespaces are meant for development, not hosting privileged sibling containers.
```
