"""
Servicio HTTP mínimo que envuelve Blender headless. Recibe la URL de un
modelo .glb (el que devuelve Tripo, con la placa en blanco) y un nombre,
ejecuta add_nameplate.py, sube el resultado a un bucket público de GCS y
devuelve su URL.
"""
import os
import subprocess
import tempfile
import uuid

import requests
from flask import Flask, request, jsonify
from google.cloud import storage

app = Flask(__name__)
BUCKET = os.environ.get("BUCKET_NAME", "sculptly-models")
SHARED_SECRET = os.environ.get("SHARED_SECRET", "")


@app.route("/health")
def health():
    return "ok"


@app.route("/produce", methods=["POST"])
def produce():
    if SHARED_SECRET and request.headers.get("X-Shared-Secret") != SHARED_SECRET:
        return jsonify({"error": "unauthorized"}), 401

    data = request.get_json(force=True)
    model_url = data.get("model_url")
    name = (data.get("name") or "").strip()
    if not model_url or not name:
        return jsonify({"error": "model_url and name are required"}), 400

    with tempfile.TemporaryDirectory() as tmp:
        in_path = os.path.join(tmp, "in.glb")
        out_path = os.path.join(tmp, "out.glb")

        r = requests.get(model_url, timeout=120)
        r.raise_for_status()
        with open(in_path, "wb") as f:
            f.write(r.content)

        result = subprocess.run(
            ["blender", "--background", "--python", "/app/add_nameplate.py", "--",
             in_path, name, out_path],
            capture_output=True, text=True, timeout=280,
        )
        if result.returncode != 0 or not os.path.exists(out_path):
            return jsonify({"error": "blender failed", "stdout": result.stdout[-4000:], "stderr": result.stderr[-4000:]}), 500

        client = storage.Client()
        bucket = client.bucket(BUCKET)

        job_id = str(uuid.uuid4())
        blob = bucket.blob(f"{job_id}.glb")
        blob.upload_from_filename(out_path, content_type="model/gltf-binary")
        glb_url = f"https://storage.googleapis.com/{BUCKET}/{job_id}.glb"

        stl_url = None
        stl_path = out_path.rsplit(".", 1)[0] + ".stl"
        if os.path.exists(stl_path):
            stl_blob = bucket.blob(f"{job_id}.stl")
            stl_blob.upload_from_filename(stl_path, content_type="model/stl")
            stl_url = f"https://storage.googleapis.com/{BUCKET}/{job_id}.stl"

        return jsonify({"ok": True, "model_url": glb_url, "stl_url": stl_url})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
