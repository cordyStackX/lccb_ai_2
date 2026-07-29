# Security Policy

## 🔒 Security Overview

LACO AI is an educational beta project designed with security and privacy as core principles. This document outlines our security practices, known vulnerabilities, and how to report security issues.

LACO AI separates every uploaded document into one of two categories, and security controls differ accordingly:
- **Public PDF** — used by the embeddable chatbot widget and Business accounts; assumed non-sensitive
- **Sensitive PDF** — protected academic/institutional data (LCCB only), gated behind role + email verification

---

## 🛡️ Supported Versions

As this is a **beta educational project**, we currently support only the latest version on the `main` branch.

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| Beta (main) | :white_check_mark: | Active Development |
| Previous commits | :x: | Not Supported |

---

## 🔐 Security Measures

### Authentication & Authorization
- **JWT-based Authentication**: Secure token-based user sessions
- **Password Encryption**: Industry-standard bcrypt hashing
- **Email Verification**: Confirmation codes for signup and password reset; email also acts as the identity used to match a user against their own Sensitive PDF records before disclosure
- **Session Management**: Secure token storage and validation
- **API Key Protection**: All backend endpoints require authentication tokens
- **Anonymous Widget Access**: The `/chat_bot` embed is intentionally unauthenticated but scoped server-side to a single Business's Public PDFs — it can never reach Sensitive PDF data, other Business accounts, or system internals

### Data Protection
- **Persistent Storage**: PDFs (Public and Sensitive) are stored in Supabase Storage until manually deleted via the context menu — not auto-purged
- **Bucket Separation**: Public and Sensitive PDFs are routed to separate storage buckets/paths so the Public-only widget path cannot read Sensitive data
- **Encrypted Connections**: HTTPS/TLS for all API communications
- **Environment Variables**: Sensitive credentials stored in `.env.local` (never committed)
- **Database Security**: Supabase Row Level Security (RLS) policies enabled
- **No End-to-End Encryption**: PDFs are not encrypted at rest during AI processing — do not upload sensitive material as a Public PDF (see Warnings below)

### API Security
- **Rate Limiting**: Protection against abuse and DoS attacks (1 request/second per IP)
- **Input Validation**: All user inputs sanitized and validated
- **CORS Configuration**: Restricted cross-origin requests
- **SQL Injection Prevention**: Parameterized queries via Supabase client
- **XSS Protection**: Content sanitization and CSP headers
- **Sensitive-Record Gate**: Any endpoint returning row-level student data (grades, attendance, contact info) requires the caller's verified email to match the record's email before returning data — applies regardless of role, including admin

### Code Security
- **Dependency Scanning**: Regular updates to patch vulnerabilities
- **ESLint Security Rules**: `eslint-plugin-no-secrets` to detect exposed secrets
- **TypeScript**: Type safety to prevent runtime errors
- **No Hardcoded Secrets**: All sensitive data in environment variables

---

## ⚠️ Known Security Limitations

As a **beta educational project**, please be aware of these limitations:

### Current Limitations
1. **No Production Hardening**: Not designed for production environments
2. **Limited Security Auditing**: No formal security audits conducted
3. **Beta Quality**: May contain undiscovered vulnerabilities
4. **Third-Party Dependencies**: Relies on external services (Supabase, OpenAI)
5. **Persistent Storage**: PDFs remain in Supabase Storage until manually deleted — there is no automatic expiry
6. **No End-to-End Encryption**: PDFs not encrypted at rest during processing
7. **Manual Public/Sensitive Classification**: The Public vs. Sensitive label is set by the uploading admin at upload time and is not independently verified by the system — a misclassified upload will be treated according to the label given, not its actual content

### ⚠️ **DO NOT:**
- Upload sensitive, confidential, or personal information as a **Public PDF**
- Use for production or commercial purposes
- Store critical business documents
- Process legal, medical, or financial documents
- Upload copyrighted material without authorization
- Use for any illegal activities

---

## 🐛 Reporting a Vulnerability

We take security seriously, even in our educational project. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. **Do NOT** disclose the vulnerability publicly until it's been addressed

3. **Report via GitHub Security Advisory**:
   - Go to: https://github.com/cordyStackX/lccb_ai_2/security/advisories
   - Click "Report a vulnerability"
   - Provide detailed information about the vulnerability

4. **Or contact via GitHub**:
   - Open a private discussion with @cordyStackX
   - Title: `[SECURITY] Brief description`
   - Include reproduction steps and potential impact

### What to Include in Your Report

Please provide as much information as possible:
- **Description**: Clear explanation of the vulnerability
- **Impact**: Potential security impact and affected components — note whether it affects Public PDF data, Sensitive PDF data, or both
- **Reproduction Steps**: Detailed steps to reproduce the issue
- **Proof of Concept**: Code snippets or screenshots (if applicable)
- **Suggested Fix**: If you have ideas for remediation
- **Environment**: Browser, OS, Node/Python versions

### Response Timeline

As an educational project maintained by a single developer:
- **Initial Response**: Within 7 days
- **Status Update**: Within 14 days
- **Fix Implementation**: Depends on severity and complexity — issues allowing Sensitive PDF or cross-account data exposure are treated as highest priority
- **Public Disclosure**: After fix is deployed and verified

### Recognition

We appreciate security researchers who help improve our project:
- You'll be credited in the SECURITY.md file (with your permission)
- Mentioned in release notes for security fixes
- Added to our acknowledgments section

---

## 🔍 Security Best Practices for Users

### For Users
1. **Strong Passwords**: Use unique, complex passwords
2. **Email Security**: Keep your email account secure (2FA recommended) — your email is also your identity key for sensitive records
3. **Document Sensitivity**: Never upload confidential documents as a Public PDF; only LCCB-verified Sensitive PDF uploads are protected
4. **Logout**: Always logout after using the platform
5. **Public Networks**: Avoid using on public/untrusted WiFi
6. **Browser Security**: Keep your browser updated
7. **Suspicious Activity**: Report any unusual behavior immediately

### For Developers
1. **Environment Variables**: Never commit `.env.local` or `.env` files
2. **API Keys**: Rotate API keys regularly
3. **Dependencies**: Keep packages updated (`pnpm update`, `pip install -U`)
4. **Code Review**: Review changes before merging — pay special attention to any route that reads Sensitive PDF buckets or the `chat_bot` widget path
5. **Secret Scanning**: Use `eslint-plugin-no-secrets` before commits
6. **HTTPS Only**: Always use secure connections
7. **Input Validation**: Sanitize all user inputs

---

## 🔧 Security Configuration

### Required Environment Variables

```env
# Must be kept secret - never commit!
OPENAI_API_KEY=your_openai_api_key
API_KEY=your_secure_random_key
JWT_SECRET=your_jwt_secret_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
SUPABASE_URL=your_supabase_url
```

### Generating Secure API Keys

```bash
# Generate secure random key (Linux/Mac)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Security Headers (Next.js)

Recommended security headers in `next.config.ts`:

```typescript
{
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
}
```

---

## 📋 Security Checklist

### Before Deployment
- [x] All secrets in environment variables (not in code)
- [x] `.env.local` added to `.gitignore`
- [x] Dependencies updated to latest secure versions
- [x] ESLint security rules passing
- [x] CORS properly configured
- [x] API authentication tested
- [x] Rate limiting implemented
- [x] Error messages don't expose sensitive info
- [x] Confirmed `chat_bot` widget routes cannot read Sensitive PDF buckets under any input
- [x] Confirmed sensitive-record endpoints enforce email match regardless of role

### Regular Maintenance
- [x] Update dependencies monthly
- [x] Rotate API keys quarterly
- [x] Review access logs for suspicious activity
- [x] Test authentication flows
- [x] Spot-check Public/Sensitive PDF classification for misfiled uploads
- [x] Check Supabase security policies
- [x] Monitor third-party service status

---

## 🚨 Incident Response

### In Case of Security Breach

1. **Immediate Actions**:
   - Disable affected accounts/services
   - Rotate all API keys and secrets
   - Document the incident
   - Assess the impact, including whether any Sensitive PDF data was exposed

2. **Investigation**:
   - Check logs for unauthorized access
   - Identify affected users
   - Determine root cause
   - Document findings

3. **Remediation**:
   - Fix the vulnerability
   - Deploy security patch
   - Notify affected users (if applicable)
   - Update security documentation

4. **Prevention**:
   - Implement additional safeguards
   - Update security practices
   - Conduct post-mortem review
   - Share lessons learned

---

## 📚 Security Resources

### External Security Guidelines
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)

### Tools & Libraries
- **eslint-plugin-no-secrets**: Detect hardcoded secrets
- **Supabase RLS**: Row Level Security policies
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT implementation

---

## 🎓 Educational Security Notice

**IMPORTANT**: This is a **beta educational project**. While we implement reasonable security measures, this platform is:

- ✅ Suitable for learning and experimentation
- ✅ Good for testing with non-sensitive documents (Public PDF)
- ✅ Appropriate for academic demonstrations
- ❌ **NOT** suitable for production use
- ❌ **NOT** designed for sensitive data outside the verified LCCB Sensitive PDF scope
- ❌ **NOT** formally audited or certified

**Use at your own risk. We provide no guarantees or warranties regarding security.**

---

## 📞 Contact

For security concerns:
- **GitHub**: [@cordyStackX](https://github.com/cordyStackX)
- **Repository**: [lccb_ai_2/security](https://github.com/cordyStackX/lccb_ai_2/security)
- **License**: Apache License 2.0

---

## 📝 Version History

### Beta Version (Current)
- Public/Sensitive PDF classification and storage separation
- Email-based identity verification for sensitive-record disclosure
- JWT authentication
- Persistent storage until manual deletion (corrected from earlier temporary-storage draft)
- Basic input validation
- API key protection

---

**Last Updated**: July 30, 2026  
**Maintained by**: cordyStackX  
**License**: Apache 2.0  
**Status**: Educational Beta