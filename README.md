# LACO AI — Beta 1.0.0

**First beta release** of LACO AI, an AI-powered document assistant for La Consolacion College Bacolod (LCCB), with a separate business workspace for general document analysis.

[![Release](https://img.shields.io/badge/release-Beta%201.0.0-blue)](https://github.com/cordyStackX/lccb_ai_2/releases)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

> **Beta software:** Features and behavior may change. AI-generated content can be incomplete or incorrect. Verify academic information against official school records. Do not upload confidential information to Public Documents.

## Overview

LACO AI lets users add PDFs, ask questions about document content, and review generated summaries and question-and-answer suggestions. The application keeps general **Public Documents** separate from restricted **Sensitive Documents** used for student academic records.

### Public documents

Public PDFs support general document analysis and the embeddable chatbot. They must not contain student records, credentials, or other information that should remain private.

### Sensitive student records

Authorized administrators can upload restricted academic PDFs. The system extracts student IDs and record content, then files each record in a student bookshelf only when the ID matches one unique registered student account. If an ID is not registered yet, an administrator can register the student and choose **Check all PDFs** to rescan already uploaded PDFs—no reupload is needed.

Student academic chat requires an authenticated student account. Before a request reaches the chat AI, the backend filters bookshelf records to the student’s own registered ID. Sensitive PDFs and extracted bookshelf contents are encrypted at rest. Student IDs in account records are stored as plaintext identifiers for matching. PDF pages are sent to OpenAI for extraction; student chat sends only that student’s matched records as context.

## Features

- PDF upload, processing progress, search, review, and management
- Per-page PDF extraction and AI-generated summaries and question-and-answer suggestions
- Separate Public and Sensitive document areas
- Student bookshelf that groups extracted records by verified student ID
- **Check all PDFs** to match stored academic PDFs against newly registered student accounts
- Student chat restricted to records matching the authenticated student’s ID
- Admin tools for user approvals, payments, logs, and sensitive document management
- Business plans with account-level page allowances:
  - **Free Trial:** 50 PDF pages and 10,000 API requests during the one-month trial
  - **Pro:** ₱249/month, 5,000 PDF pages per account, unlimited API requests
  - **Enterprise:** ₱1,499/year, 10,000 PDF pages per account, unlimited API requests

## Technology

- **Web app:** Next.js 16, React 19, TypeScript
- **Python API:** Flask
- **AI:** OpenAI API
- **Database and storage:** Supabase PostgreSQL and Supabase Storage
- **PDF processing:** PyPDF2 and Python utilities
- **Deployment:** Next.js can run on Vercel; the Python API can run on Render or another compatible host

## Run locally

### Requirements

- Node.js 20 or newer and pnpm
- Python 3.11 or newer
- Supabase project configured for the application’s tables, storage buckets, and access policies
- OpenAI API key

### Install dependencies

```bash
pnpm install
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r python/python_txt_file/requirements.txt
```

### Configure environment

Create `.env.local` in the repository root. Keep secrets out of Git and never use a Supabase service key in browser-exposed variables.

```env
# Shared server-side configuration
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
API_KEY=YOUR_PRIVATE_API_KEY
PDF_ENCRYPT_PASSWORD=YOUR_PRIVATE_PDF_PASSWORD

# Python AI service
OPENAI_API_KEY=YOUR_OPENAI_API_KEY

# Web application
JWT_SECRET=YOUR_JWT_SECRET
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Python API URL, including its trailing slash
RENDER_API=http://localhost:10000/

# Configure these when using email and bot verification features
GMAIL_USERNAME=
GMAIL_APP_PASSWORD=
ADMIN_ALIAS=
NEXT_PUBLIC_GMAIL_USERNAME=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

Use the corresponding production URLs and secrets in your deployment provider. Configure the same `API_KEY` and `PDF_ENCRYPT_PASSWORD` for the web app and Python service.

### Start the services

In the repository root, start Next.js:

```bash
pnpm dev
```

In another terminal, start the Python API:

```bash
source .venv/bin/activate
cd python
python main.py
```

The web app uses `http://localhost:3000`. The Python API defaults to port `10000` (set `PORT` to change it). Set `RENDER_API` to the Python API URL reachable by Next.js.

## Sensitive data and privacy

- Only authorized administrators should upload sensitive academic PDFs.
- Uploaders must have the authority to process the records in a PDF.
- Sensitive PDFs are processed with OpenAI to extract record information. OpenAI also receives a student’s question and the records matched to that student when answering academic questions.
- A record without a valid ID that uniquely matches one registered student is skipped. Register the student, then use **Check all PDFs** to process stored PDFs again.
- Student chat does not receive other students’ bookshelf records as context. Do not use the service to seek another student’s records.
- Deleting a sensitive PDF removes its associated bookshelf records. Account and record deletion requests should be directed to the administrator.
- Public Documents are not a place for confidential, personal, or academic records.

Read the [Privacy Policy](https://lccb-ai-2.vercel.app/privacy) and [Terms and Conditions](https://lccb-ai-2.vercel.app/terms) for more information.

## Beta 1.0.0 release highlights

- Redesigned and standardized admin and business workspace screens.
- Added clearer document tables, centered empty states, and document review controls.
- Added PDF page-based business plan allowances and updated plan prices.
- Added payment renewal dates when an administrator approves a renewal.
- Added per-page PDF processing progress, summaries, and context-based question-and-answer generation.
- Added sensitive student-record extraction, ID matching, encrypted bookshelf storage, and student-specific academic chat filtering.
- Added **Check all PDFs** so administrators can match existing PDFs after students register.

See [Release Notes](RELEASE_NOTES_BETA_1.0.0.md) for the release description.

## License and contribution

LACO AI is distributed under the [Apache License 2.0](LICENSE). Contributions are welcome; please open an issue to discuss substantial changes before submitting a pull request.

## Links

- [Repository](https://github.com/cordyStackX/lccb_ai_2)
- [Releases](https://github.com/cordyStackX/lccb_ai_2/releases)
- [Issues](https://github.com/cordyStackX/lccb_ai_2/issues)
- [Development preview](https://lccb-ai-2-git-developingarea-cordystackg.vercel.app/)
