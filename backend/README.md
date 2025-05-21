# Phishing Detector Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export SAFE_BROWSING_API_KEY="YOUR_KEY"
uvicorn app.main:app --reload
```
