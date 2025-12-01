# Lightweight devcontainer image with docker CLI, docker-compose, node (for manager)
FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu-22.04

ARG USERNAME=vscode

# Install docker cli, docker-compose plugin and jq
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     ca-certificates \
     curl \
     git \
     iproute2 \
     jq \
     socat \
     unzip \
     openssh-client \
     ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install Docker CLI (from Docker repository)
RUN mkdir -p /tmp/docker-cli && \
    curl -fsSL "https://download.docker.com/linux/static/stable/x86_64/docker-24.0.5.tgz" -o /tmp/docker-cli/docker.tgz && \
    tar -xz -C /tmp/docker-cli -f /tmp/docker-cli/docker.tgz && \
    cp /tmp/docker-cli/docker/* /usr/local/bin/ && \
    rm -rf /tmp/docker-cli

# Install docker-compose (plugin)
RUN curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose \
  && chmod +x /usr/local/bin/docker-compose

# node is already available in the base images, but ensure npm is present
RUN apt-get update && apt-get install -y --no-install-recommends nodejs npm && rm -rf /var/lib/apt/lists/*

# Make sure /workspaces exists and is owned by vscode user
RUN mkdir -p /workspace && chown ${USERNAME}:${USERNAME} /workspace

USER ${USERNAME}
WORKDIR /workspace
