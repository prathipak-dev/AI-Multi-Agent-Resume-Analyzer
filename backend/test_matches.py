import urllib.request, urllib.parse, json, sys

# Login
data = urllib.parse.urlencode({'username': 'demo@test.com', 'password': 'demo123456'}).encode()
req = urllib.request.Request('http://localhost:8000/api/v1/auth/login', data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'}, method='POST')
r = urllib.request.urlopen(req)
token = json.loads(r.read().decode())['access_token']
print(f"LOGIN OK")
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# Run match pipeline
print("Running /matches/run pipeline...")
req2 = urllib.request.Request(
    'http://localhost:8000/api/v1/matches/run',
    data=b'{}',
    headers=headers,
    method='POST'
)
try:
    r2 = urllib.request.urlopen(req2)
    result = json.loads(r2.read().decode())
    matched = result.get('matched_jobs', [])
    print(f"MATCHES RUN OK: {len(matched)} matched jobs")
    if matched:
        print(f"Top match: {matched[0].get('title')} - {matched[0].get('overall_match_score')}%")
    print(f"Missing skills: {result.get('missing_skills', [])[:3]}")
    print(f"ATS Score: {result.get('ats_score')}")
except Exception as e:
    print(f"MATCHES ERROR: {e}")
    if hasattr(e, 'read'):
        print('Details:', e.read().decode())
