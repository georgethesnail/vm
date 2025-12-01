const express = require('express');
const bodyParser = require('body-parser');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const shortid = require('shortid');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const app = express();
app.use(bodyParser.json());

const DOMAIN = process.env.DOMAIN || 'localtest.me';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-token';
const TEMPLATE_IMAGE = 'dorowu/ubuntu-desktop-lxde-vnc:latest';
const DATA_DIR = '/data'; // host-mounted via compose

// simple auth middleware
function auth(req, res, next) {
  const h = req.headers['authorization'] || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  const token = h.slice(7);
  if (token !== ADMIN_TOKEN) return res.status(403).json({ error: 'invalid token' });
  next();
}

// helper: ensure data dir exists
function ensureUserData(username) {
  const d = path.join(DATA_DIR, username);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true, mode: 0o700 });
  return d;
}

// Create a container for a username
app.post('/api/v1/spawn', auth, async (req, res) => {
  const username = (req.body.username || '').toLowerCase();
  if (!username.match(/^[a-z0-9-]{2,30}$/)) {
    return res.status(400).json({ error: 'invalid username (a-z0-9-, 2-30 chars)' });
  }
  const vncPassword = req.body.vncPassword || shortid.generate();
  const containerName = `webvm_${username}`;

  try {
    // Remove if already exists
    try {
      const existing = docker.getContainer(containerName);
      const eInfo = await existing.inspect().catch(() => null);
      if (eInfo) {
        return res.status(409).json({ error: 'container already exists', container: containerName });
      }
    } catch (err) {}

    ensureUserData(username);

    // Traefik labels to route username.DOMAIN to container's 6901 noVNC web port
    const labels = {};
    const routerName = `webvm-${username}`;
    const host = `${username}.${DOMAIN}`;
    labels['traefik.enable'] = 'true';
    labels[`traefik.http.routers.${routerName}.rule`] = `Host(\`${host}\`)`;
    labels[`traefik.http.routers.${routerName}.entrypoints`] = 'websecure';
    labels[`traefik.http.routers.${routerName}.tls`] = 'true';
    labels[`traefik.http.services.${routerName}.loadbalancer.server.port`] = '6901';
    labels['traefik.docker.network'] = 'web';

    const binds = [
      // mount user's data dir
      `${path.join(DATA_DIR, username)}:/home/ubuntu/data`
    ];

    const container = await docker.createContainer({
      name: containerName,
      Image: TEMPLATE_IMAGE,
      Env: [`VNC_PASSWORD=${vncPassword}`, `RESOLUTION=1280x800`],
      HostConfig: {
        Binds: binds
      },
      Labels: labels,
      NetworkingConfig: {
        EndpointsConfig: {
          web: {}
        }
      }
    });

    await container.start();

    return res.json({
      status: 'created',
      username,
      container: containerName,
      vncPassword,
      url: `https://${host}/`
    });
  } catch (err) {
    console.error('spawn error', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Remove a user's container
app.post('/api/v1/remove', auth, async (req, res) => {
  const username = (req.body.username || '').toLowerCase();
  if (!username) return res.status(400).json({ error: 'username required' });
  const containerName = `webvm_${username}`;
  try {
    const c = docker.getContainer(containerName);
    await c.stop().catch(() => {});
    await c.remove().catch(() => {});
    return res.json({ status: 'removed', container: containerName });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// List managed containers
app.get('/api/v1/list', auth, async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true, filters: { name: ['webvm_'] } });
    return res.json({ containers });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`webvm manager listening on ${port}`);
});
