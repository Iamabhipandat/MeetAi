import sys
import os

# Add parent directory to python path so app.* modules can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import app

# Vercel Serverless looks for the 'app' ASGI object
