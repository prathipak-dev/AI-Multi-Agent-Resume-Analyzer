import urllib.request, urllib.parse, json

# Login first
data = urllib.parse.urlencode({'username': 'demo@test.com', 'password': 'demo123456'}).encode()
req = urllib.request.Request('http://localhost:8000/api/v1/auth/login', data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'}, method='POST')
r = urllib.request.urlopen(req)
token = json.loads(r.read().decode())['access_token']
print(f"LOGIN OK - token: {token[:30]}...")

# Create a test resume text
resume_text = b"""John Doe | Senior Software Engineer
Email: john@example.com | GitHub: github.com/johndoe

SKILLS
Python, FastAPI, React, Next.js, Docker, PostgreSQL, Redis, TypeScript, LangChain, AWS

EXPERIENCE
Software Engineer Intern | TechCorp | June 2024 - Aug 2024
- Built REST APIs using FastAPI and Python improving response time by 40%
- Deployed applications using Docker and AWS EC2
- Integrated PostgreSQL database with SQLAlchemy ORM async

PROJECTS
AI Career Platform | LangGraph + FastAPI + Next.js
- Built multi-agent AI system using LangGraph and Groq API
- Implemented resume parsing with 85% ATS compatibility score
- Developed Next.js frontend with real-time job matching via vector embeddings

EDUCATION
B.Tech Computer Science | IIT Madras | 2021-2025
CGPA: 8.7/10
"""

# Build multipart form manually
boundary = b'----testboundary12345'
crlf = b'\r\n'
body = (
    b'--' + boundary + crlf +
    b'Content-Disposition: form-data; name="file"; filename="test_resume.txt"' + crlf +
    b'Content-Type: text/plain' + crlf +
    crlf +
    resume_text +
    crlf +
    b'--' + boundary + b'--' + crlf
)

req2 = urllib.request.Request(
    'http://localhost:8000/api/v1/resume/upload',
    data=body,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'multipart/form-data; boundary=----testboundary12345'
    },
    method='POST'
)

try:
    r2 = urllib.request.urlopen(req2)
    result = json.loads(r2.read().decode())
    print('RESUME UPLOAD OK:')
    print(f'  ATS Score: {result.get("ats_score")}')
    print(f'  Resume Score: {result.get("resume_score")}')
    print(f'  Domain: {result.get("target_domain")}')
    print(f'  Skills: {result.get("parsed_skills", [])[:8]}')
    print(f'  File: {result.get("file_name")}')
    print(f'  Experience count: {len(result.get("parsed_experience", []))}')
    print(f'  Education count: {len(result.get("parsed_education", []))}')
except Exception as e:
    print(f'RESUME UPLOAD ERROR: {e}')
    if hasattr(e, 'read'):
        print('Details:', e.read().decode())
