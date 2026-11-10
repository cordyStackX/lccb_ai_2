from collections import defaultdict
from datetime import datetime, timedelta, timezone
from flask import jsonify, request
from .context import EXPECTED_API_KEY, supabase


SUCCESSFUL_PAYMENT_STATUSES = {"success", "successful", "paid", "active", "completed", "complete"}
ANALYTICS_EXCLUDED_EMAILS = {"admin@admin.com"}


def _rows(table, fields):
    result = supabase.table(table).select(fields).execute()
    return result.data or []


def _date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except (TypeError, ValueError):
        return None


def dashboard_analysis():
    """Return aggregate-only admin metrics; no passwords or payment account details leave Supabase."""
    data = request.json or {}
    if data.get("token") != EXPECTED_API_KEY:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    try:
        auth, students, businesses, documents, private_documents, logs, payments = (
            _rows("auth", "email,role,status,created_at"),
            _rows("auth_student", "email,department"),
            _rows("auth_business", "email,current_plan"),
            _rows("chatbot_pdf_file", "email,created_at"),
            _rows("chatbot_pdf_file_private", "email,created_at"),
            _rows("system_logs", "request,api_request,uploaded_pdf,created_at"),
            _rows("payments", "email,amount,vat,status,plan_type,created_at"),
        )
    except Exception as error:
        return jsonify({"success": False, "error": f"Could not load dashboard data: {error}"}), 500

    # Keep the system administrator/test account out of customer reporting.
    def included(row, email_key="email"):
        return str(row.get(email_key) or "").strip().lower() not in ANALYTICS_EXCLUDED_EMAILS

    auth = [row for row in auth if included(row)]
    students = [row for row in students if included(row)]
    businesses = [row for row in businesses if included(row)]
    documents = [row for row in documents if included(row)]
    private_documents = [row for row in private_documents if included(row)]
    logs = [row for row in logs if included(row, "request")]
    payments = [row for row in payments if included(row)]

    today = datetime.now(timezone.utc).date()
    week_dates = [today - timedelta(days=offset) for offset in range(6, -1, -1)]
    month_dates = []
    for offset in range(11, -1, -1):
        year = today.year
        month = today.month - offset
        while month <= 0:
            year -= 1
            month += 12
        month_dates.append((year, month))

    def weekly_series(rows, value):
        totals = defaultdict(float)
        for row in rows:
            row_date = _date(row.get("created_at"))
            if row_date:
                totals[row_date] += value(row)
        return [{"name": item.strftime("%b %-d"), "value": totals[item]} for item in week_dates]

    def monthly_series(rows, value):
        totals = defaultdict(float)
        for row in rows:
            row_date = _date(row.get("created_at"))
            if row_date:
                totals[(row_date.year, row_date.month)] += value(row)
        return [{"name": datetime(year, month, 1).strftime("%b %y"), "value": totals[(year, month)]} for year, month in month_dates]

    completed_payments = [row for row in payments if str(row.get("status", "")).lower() in SUCCESSFUL_PAYMENT_STATUSES]
    pending_payments = [row for row in payments if str(row.get("status", "")).lower() == "pending"]
    department_counts = defaultdict(int)
    for student in students:
        department_counts[student.get("department") or "Unassigned"] += 1
    role_counts = defaultdict(int)
    for account in auth:
        role_counts[account.get("role") or "Unassigned"] += 1
    usage_by_email = defaultdict(int)
    for log in logs:
        usage_by_email[log.get("request") or "Unknown"] += int(log.get("api_request") or 0)

    # `amount` is already VAT-inclusive; never add the separate VAT field again.
    total_revenue = sum(float(row.get("amount") or 0) for row in completed_payments)
    pending_revenue = sum(float(row.get("amount") or 0) for row in pending_payments)
    total_documents = len(documents) + len(private_documents)
    total_api_usage = sum(int(row.get("api_request") or 0) for row in logs)
    total_uploaded = sum(int(row.get("uploaded_pdf") or 0) for row in logs)
    active_accounts = sum(1 for account in auth if str(account.get("status", "")).lower() == "active")

    insights = []
    if pending_payments:
        insights.append(f"{len(pending_payments)} payment request{'s' if len(pending_payments) != 1 else ''} awaiting review, worth ₱{pending_revenue:,.2f}.")
    if total_api_usage:
        top_email, top_usage = max(usage_by_email.items(), key=lambda item: item[1])
        insights.append(f"Most active user: {top_email} with {top_usage:,} AI requests.")
    if not insights:
        insights.append("Data will appear here as accounts, payments, and documents are created.")

    return jsonify({
        "success": True,
        "data": {
            "metrics": {
                "registeredAccounts": len(auth), "activeAccounts": active_accounts,
                "documents": total_documents, "uploadedDocuments": total_uploaded,
                "apiUsage": total_api_usage, "businessAccounts": len(businesses),
                "sales": total_revenue, "pendingSales": pending_revenue,
                "completedPayments": len(completed_payments), "pendingPayments": len(pending_payments),
            },
            "charts": {
                "accounts": {"week": weekly_series(auth, lambda _: 1), "year": monthly_series(auth, lambda _: 1)},
                "documents": {"week": weekly_series(documents + private_documents, lambda _: 1), "year": monthly_series(documents + private_documents, lambda _: 1)},
                "sales": {"week": weekly_series(completed_payments, lambda row: float(row.get("amount") or 0)), "year": monthly_series(completed_payments, lambda row: float(row.get("amount") or 0))},
            },
            "breakdowns": {
                "departments": [{"name": name, "value": value} for name, value in department_counts.items()],
                "roles": [{"name": name, "value": value} for name, value in role_counts.items()],
                "paymentStatus": [{"name": "Collected", "value": len(completed_payments)}, {"name": "Pending", "value": len(pending_payments)}],
            },
            "topUsers": [{"email": email, "usage": usage} for email, usage in sorted(usage_by_email.items(), key=lambda item: item[1], reverse=True)[:20]],
            "insights": insights,
        },
    }), 200
