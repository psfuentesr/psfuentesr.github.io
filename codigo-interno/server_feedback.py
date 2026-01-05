#!/usr/bin/env python3
"""
Servidor simple para recibir reportes desde el widget de la app y guardarlos
en disco. Opcionalmente, si se configuran variables de entorno con token GitHub,
también crea automáticamente un issue en GitHub para revisión interna.

Uso:
  python codigo-interno/server_feedback.py

Variables de entorno (opcionales):
  GITHUB_TOKEN - token deGitHub con permisos para crear issues
  GITHUB_REPO  - repo objetivo en formato owner/repo (ej: frenetico55555/pfa_simulator_web)

Guarda archivos: feedback_reports.json (lista de reportes)
"""

import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
import logging

try:
    # Para hacer requests a GitHub API sin dependencia externa
    from urllib.request import Request, urlopen
except Exception:
    Request = None

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


class FeedbackHandler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/report':
            return self.handle_report()
        return super().do_POST()

    def handle_report(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            payload = self.rfile.read(length).decode('utf-8')
            data = json.loads(payload)

            # Add server timestamp
            data['received_at'] = json.dumps({'ts': None})

            # Load existing or create new
            filename = 'feedback_reports.json'
            reports = []
            if os.path.exists(filename):
                try:
                    with open(filename, 'r', encoding='utf-8') as f:
                        reports = json.load(f)
                except Exception:
                    reports = []

            # append and write back
            reports.append(data)
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(reports, f, ensure_ascii=False, indent=2)

            issue_info = None
            gh_token = os.environ.get('GITHUB_TOKEN')
            gh_repo = os.environ.get('GITHUB_REPO')

            if gh_token and gh_repo and Request is not None:
                # Create a GitHub Issue
                title = (data.get('type', 'report') + ' - ' + (data.get('description') or '') )[:120]
                body = json.dumps(data, indent=2, ensure_ascii=False)
                issue_payload = json.dumps({ 'title': title, 'body': body })
                url = f'https://api.github.com/repos/{gh_repo}/issues'
                req = Request(url, data=issue_payload.encode('utf-8'), headers={
                    'Authorization': f'token {gh_token}',
                    'User-Agent': 'pfa-feedback-server',
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json'
                })
                try:
                    resp = urlopen(req)
                    result = json.loads(resp.read().decode('utf-8'))
                    issue_info = { 'url': result.get('html_url'), 'number': result.get('number') }
                except Exception as e:
                    logging.error('error creando issue en GitHub: %s', e)

            # Responder OK
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = { 'status': 'ok', 'saved_as': filename, 'issue': issue_info }
            self.wfile.write(json.dumps(response).encode('utf-8'))

        except json.JSONDecodeError:
            logging.exception('JSON inválido recibido')
            self.send_error(400, 'JSON inválido')
        except Exception as e:
            logging.exception('Error en manejo de reporte')
            self.send_error(500, str(e))


def main():
    PORT = int(os.environ.get('PFA_FEEDBACK_PORT', 8001))
    print('Iniciando feedback server en http://localhost:%d' % PORT)
    server = HTTPServer(('localhost', PORT), FeedbackHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServidor detenido')


if __name__ == '__main__':
    main()
