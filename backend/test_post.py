import requests

url = "http://127.0.0.1:8000/face/register"
headers = {"Authorization": "Bearer BAD_TOKEN"}

print("Test with FormData behavior (multipart boundary):")
files = {"user_id": (None, "cc7d84ed-6c2b-40f0-9c64-51b1a2393914"), "image_b64": (None, "data:image/jpeg;base64,1234")}
response = requests.post(url, files=files)
print(response.status_code, response.text)
