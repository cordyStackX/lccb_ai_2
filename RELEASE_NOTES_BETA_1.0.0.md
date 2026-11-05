# LACO AI Beta 1.0.0 — First Release

The first beta release of LACO AI brings document analysis, business workspaces, and student-specific academic record handling together in one application.

## Highlights

- **PDF processing:** Upload PDFs, follow processing progress, review generated summaries and question-and-answer suggestions, and manage documents from the admin workspace.
- **Sensitive student records:** Extract academic records from restricted PDFs, match them to uniquely registered student IDs, and organize them in a student bookshelf.
- **Late student registration support:** Use **Check all PDFs** to rescan stored PDFs after students register and file newly matched records without reuploading the documents.
- **Student privacy controls:** Student academic chat authenticates the student and supplies the AI only with bookshelf records matching that student’s registered ID.
- **Plan updates:** Free Trial includes 50 PDF pages and 10,000 API requests; Pro is ₱249/month with 5,000 pages per account; Enterprise is ₱1,499/year with 10,000 pages per account. Pro and Enterprise include unlimited API requests.
- **Admin and business UI:** Updated navigation, dashboards, tables, empty states, document review, and plan usage presentation.
- **Payment lifecycle:** Plan renewals update the business plan’s start and expiration dates after administrator approval.

## Privacy and AI processing

Sensitive PDFs and extracted bookshelf contents are encrypted at rest. Student IDs in account records are plaintext identifiers used for matching. Sensitive PDF pages are sent to OpenAI for extraction; academic chat sends only the authenticated student’s matched records as context. AI-generated academic answers can be incorrect and should be verified against official records.

## Beta notes

This is a beta release. PDF extraction and AI answers may be incomplete, and operational behavior may change in future releases. Do not place confidential information in Public Documents.
