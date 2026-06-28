#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import sys

BRAIN_API_KEY = "webness_shared_secret_vps_local_2026"

def make_request(url, method="GET", body=None, headers=None):
    if headers is None:
        headers = {}
    headers["Content-Type"] = "application/json"
    headers["Authorization"] = f"Bearer {BRAIN_API_KEY}"
    headers["X-Webness-Key"] = BRAIN_API_KEY
    
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode("utf-8"))
        except Exception:
            err_body = e.reason
        return e.code, err_body
    except Exception as e:
        return 0, str(e)

def run_tests():
    print("🧪 Starting Webness Local Brain Validation Tests...\n")
    
    # Test 1: Health check port 8080 (public)
    print("Test 1: Health check Port 8080 (Public)")
    status, res = make_request("http://127.0.0.1:8080/health")
    print(f"Status: {status}")
    print(f"Response: {json.dumps(res, indent=2)}\n")
    
    # Test 2: Health check port 8642 (public)
    print("Test 2: Health check Port 8642 (Public)")
    status, res = make_request("http://127.0.0.1:8642/health")
    print(f"Status: {status}")
    print(f"Response: {json.dumps(res, indent=2)}\n")
    
    # Test 3: Chat Completions port 8642 (OpenAI format, mock/non-streaming)
    print("Test 3: Chat Completions Port 8642 (Hermes OpenAI format)")
    chat_body = {
        "model": "qwen2.5-coder:3b",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello local brain!"}
        ],
        "stream": False
    }
    status, res = make_request("http://127.0.0.1:8642/v1/chat/completions", method="POST", body=chat_body)
    print(f"Status: {status}")
    print(f"Response: {json.dumps(res, indent=2)}\n")
    
    # Test 4: File List
    print("Test 4: Secure File List API")
    status, res = make_request("http://127.0.0.1:8080/v1/files/list?path=.")
    print(f"Status: {status}")
    print(f"Response: {json.dumps(res, indent=2)}\n")

    # Test 5: Import Codex/Antigravity Data
    print("Test 5: Codex/Antigravity Data Import API")
    import_body = {
        "title": "Codex Alignment Session",
        "content": "Make sure all dashboard pages use Outfit typography and curated HSL dark mode variables.",
        "source": "codex",
        "tags": ["design", "brand-guide"]
    }
    status, res = make_request("http://127.0.0.1:8080/v1/import", method="POST", body=import_body)
    print(f"Status: {status}")
    print(f"Response: {json.dumps(res, indent=2)}\n")

    print("🎉 Validation tests completed.")

if __name__ == "__main__":
    run_tests()
