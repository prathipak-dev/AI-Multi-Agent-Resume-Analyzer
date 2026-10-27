import urllib.request, urllib.parse, json

# Login
data = urllib.parse.urlencode({'username': 'demo@test.com', 'password': 'demo123456'}).encode()
req = urllib.request.Request('http://localhost:8000/api/v1/auth/login', data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'}, method='POST')
r = urllib.request.urlopen(req)
token = json.loads(r.read().decode())['access_token']
print("LOGIN OK")
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# Get a job ID to use
req_jobs = urllib.request.Request('http://localhost:8000/api/v1/jobs/', headers=headers)
r_jobs = urllib.request.urlopen(req_jobs)
jobs = json.loads(r_jobs.read().decode())
job_id = jobs[0]['id'] if jobs else 'jooble-101'
job_title = jobs[0].get('title', 'Unknown')
print(f"Using job: {job_id} - {job_title}")

# Generate application package
payload = json.dumps({'job_id': job_id}).encode()
req2 = urllib.request.Request(
    'http://localhost:8000/api/v1/application/generate',
    data=payload,
    headers=headers,
    method='POST'
)
try:
    r2 = urllib.request.urlopen(req2)
    result = json.loads(r2.read().decode())
    print("APPLICATION GENERATE OK:")
    print(f"  job_title: {result.get('job_title')}")
    print(f"  company: {result.get('company')}")
    print(f"  cover_letter chars: {len(result.get('cover_letter', ''))}")
    print(f"  hr_email chars: {len(result.get('hr_email', ''))}")
    print(f"  tailored_resume chars: {len(result.get('tailored_resume', ''))}")
    print(f"  status: {result.get('status')}")
except Exception as e:
    print(f"APPLICATION ERROR: {e}")
    if hasattr(e, 'read'):
        print('Details:', e.read().decode())
