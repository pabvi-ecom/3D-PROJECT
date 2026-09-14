FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ca-certificates \
    curl \
    xz-utils \
    libxi6 \
    libxrender1 \
    libxfixes3 \
    libxcursor1 \
    libxinerama1 \
    libxrandr2 \
    libsm6 \
    libgl1 \
    libxkbcommon0 \
    && rm -rf /var/lib/apt/lists/*

# Blender oficial (misma versión usada en local) — el de apt es viejo y su
# Python interno no trae numpy, hace falta para el importador de glTF.
RUN curl -sL https://download.blender.org/release/Blender5.2/blender-5.2.1-linux-x64.tar.xz -o /tmp/blender.tar.xz \
    && mkdir -p /opt/blender \
    && tar -xf /tmp/blender.tar.xz -C /opt/blender --strip-components=1 \
    && rm /tmp/blender.tar.xz
ENV PATH="/opt/blender:${PATH}"

# numpy para el Python que trae Blender dentro (no el del sistema).
RUN /opt/blender/5.2/python/bin/python3* -m ensurepip && \
    /opt/blender/5.2/python/bin/python3* -m pip install --no-cache-dir numpy

RUN pip3 install --no-cache-dir flask gunicorn requests google-cloud-storage

WORKDIR /app
COPY server.py add_nameplate.py /app/

ENV PORT=8080
CMD ["gunicorn", "-b", "0.0.0.0:8080", "-w", "1", "--timeout", "300", "server:app"]
