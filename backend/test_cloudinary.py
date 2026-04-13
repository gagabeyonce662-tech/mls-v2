import requests
import re

cloudinary_url = "cloudinary://778436278492611:FvF7tr99gYJMu4HKhyhYrCZM3YU@dbnyyvaot"

# Extract credentials using regex
match = re.match(r"cloudinary://(.*?):(.*?)@(.*?)$", cloudinary_url)
if not match:
    print("Invalid Cloudinary URL format")
    exit(1)

api_key, api_secret, cloud_name = match.groups()

# Test the Ping API (Basic Auth)
# URL: https://api.cloudinary.com/v1_1/<cloud_name>/ping
url = f"https://api.cloudinary.com/v1_1/{cloud_name}/ping"

try:
    response = requests.get(url, auth=(api_key, api_secret))
    
    if response.status_code == 200:
        print(f"SUCCESS: Cloudinary Health Check PASSED for cloud: {cloud_name}")
        print(f"Response: {response.json()}")
    else:
        print(f"ERROR: Cloudinary Health Check FAILED (Status {response.status_code})")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"ERROR: Error connecting to Cloudinary: {e}")
