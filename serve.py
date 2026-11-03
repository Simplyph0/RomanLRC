"""Serve RomanLRC locally and open it in the browser. Usage: python3 serve.py [port]"""
import http.server, os, sys, threading, webbrowser

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))
srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), http.server.SimpleHTTPRequestHandler)
threading.Timer(0.5, lambda: webbrowser.open(f"http://127.0.0.1:{port}/")).start()
print(f"RomanLRC at http://127.0.0.1:{port}/  (Ctrl+C to stop)")
srv.serve_forever()
