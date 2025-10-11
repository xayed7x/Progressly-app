import requests
import json

url = "http://127.0.0.1:8000/api/ai/chat"
payload = {
    "messages": [
        {"role": "user", "content": "Hello, how are you?"}
    ]
}
proxies = {
    "http": None,
    "https": None,
}

try:
    response = requests.post(url, json=payload, stream=True, proxies=proxies)
    response.raise_for_status()  # Raise an exception for bad status codes

    print("Response from server:")
    for chunk in response.iter_content(chunk_size=8192):
        if chunk:
            print(chunk.decode('utf-8'), end='')

except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")
