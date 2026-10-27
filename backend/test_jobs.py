import urllib.request, json, sys

req = urllib.request.Request('http://localhost:8000/api/v1/jobs/')
r = urllib.request.urlopen(req)
jobs = json.loads(r.read().decode())
print(f'Total jobs: {len(jobs)}')
job = jobs[0]
print(f'Fields: {list(job.keys())}')
print(f'Title: {job["title"]}')
print(f'Domain: {job.get("domain")}')
print(f'Has overall_match_score: {"overall_match_score" in job}')
print(f'Has id: {"id" in job}')
print(f'extracted_skills: {job.get("extracted_skills", [])}')
