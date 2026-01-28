import requests
import json

try:
    response = requests.get('http://localhost:11434/api/tags')
    models = response.json().get('models', [])
    print("Available models:")
    for m in models:
        print(f"'{m['name']}'")
except Exception as e:
    print(f"Error fetching models: {e}")
