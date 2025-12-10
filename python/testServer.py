import os
from supabase import create_client, Client
from dotenv import load_dotenv

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(ROOT_DIR, ".env.local")
load_dotenv(ENV_PATH)

# Load env variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Environment variables not found!")
    exit()

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Simple test: read 1 row from pdf_file table
try:
    response = supabase.table("pdf_file").select("*").limit(1).execute()

    print("✅ Connected to Supabase!")
    print("Result:")
    print(response)
except Exception as e:
    print("❌ Error connecting to Supabase")
    print(e)

