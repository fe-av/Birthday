from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import socket
import threading
import time
import webbrowser


HOST = "127.0.0.1"
PORT = 8000


def find_port(start_port):
    port = start_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            if sock.connect_ex((HOST, port)) != 0:
                return port
        port += 1


def main():
    port = find_port(PORT)
    server = ThreadingHTTPServer((HOST, port), SimpleHTTPRequestHandler)
    url = f"http://{HOST}:{port}/index.html"

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.4)
    webbrowser.open(url)

    print(f"Birthday Quest is running at {url}")
    print("Press Ctrl+C to stop.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        server.shutdown()
        print("\nStopped.")


if __name__ == "__main__":
    main()
