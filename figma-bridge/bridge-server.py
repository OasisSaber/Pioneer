"""
Wonderwall-Pi Figma Bridge Server (Python 3.14 compatible)
Allows AI Agents to send commands to the Figma Plugin via local HTTP.

Security model (local-only bridge):
- Binds to 127.0.0.1 only; never exposed to the network.
- CORS is restricted to an explicit origin allowlist (local dev servers / Figma).
- Every POST requires a bridge token:
  * use FIGMA_BRIDGE_TOKEN env var if set, otherwise an ephemeral token is
    generated per launch and printed to the console;
  * clients must send it as the `X-Bridge-Token` header.
"""

import asyncio
import json
import secrets
import http.server
import socketserver
import threading
import os
import sys

MAX_BODY_BYTES = 1 * 1024 * 1024

# Browser origins allowed to talk to the bridge (CORS). Requests without an
# Origin header (curl / local agents) are not subject to CORS.
ALLOWED_ORIGINS = (
    "https://www.figma.com",
    "https://figma.com",
)


def _origin_allowed(origin):
    return (
        origin in ALLOWED_ORIGINS
        or origin.startswith("http://localhost:")
        or origin.startswith("http://127.0.0.1:")
    )


class FigmaBridgeHTTPHandler(http.server.SimpleHTTPRequestHandler):
    bridge_token = ""

    def _cors_headers(self):
        origin = self.headers.get("Origin")
        if origin and _origin_allowed(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Bridge-Token")
            self.send_header("Vary", "Origin")

    def end_headers(self):
        self._cors_headers()
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        token = self.headers.get("X-Bridge-Token", "")
        if not secrets.compare_digest(token, self.bridge_token):
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "invalid or missing X-Bridge-Token"}).encode("utf-8"))
            return

        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > MAX_BODY_BYTES:
            self.send_response(413)
            self.end_headers()
            return
        post_data = self.rfile.read(content_length).decode("utf-8")
        try:
            cmd = json.loads(post_data)
            print(f"[Figma Bridge] Received command: {cmd.get('type')}")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "queued", "command": cmd}).encode("utf-8"))
        except Exception as e:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(str(e).encode("utf-8"))


def start_server(port=8765, host="127.0.0.1"):
    token = os.environ.get("FIGMA_BRIDGE_TOKEN") or secrets.token_urlsafe(24)
    FigmaBridgeHTTPHandler.bridge_token = token
    # Local-only bind: never accept connections from other interfaces.
    with socketserver.TCPServer((host, port), FigmaBridgeHTTPHandler) as httpd:
        print("=" * 50)
        print(f"🟢 Wonderwall-Pi Figma Bridge Server running on http://{host}:{port}")
        print(f"🔑 Bridge token (send as X-Bridge-Token header): {token}")
        print("=" * 50)
        httpd.serve_forever()


if __name__ == "__main__":
    start_server()
