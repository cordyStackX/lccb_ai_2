import os
from flask import Flask
from dotenv import load_dotenv
from openai import OpenAI
from flask_cors import CORS
from supabase import create_client, Client

# -----------------------------------------
# Load .env.local from project root
# -----------------------------------------
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
ENV_PATH = os.path.join(ROOT_DIR, ".env.local")
load_dotenv(ENV_PATH)

# -----------------------------------------
# Environment variables
# -----------------------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EXPECTED_API_KEY = os.getenv("API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is missing in .env.local")

if not EXPECTED_API_KEY:
    raise ValueError("API_KEY must be set for security authentication")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL not found")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY not found")

# -----------------------------------------
# Init Flask
# -----------------------------------------
app = Flask(__name__)
CORS(app)  # allow Next.js to access the Flask server

# -----------------------------------------
# Clients
# -----------------------------------------
client = OpenAI(api_key=OPENAI_API_KEY)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
