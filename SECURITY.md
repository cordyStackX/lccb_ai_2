# Security Policy

## 🔒 Security Overview

LACO AI is an educational beta project designed with security and privacy as core principles. This document outlines our security practices, known vulnerabilities, and how to report security issues.

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
- **Email Verification**: Confirmation codes for signup and password reset
- **Session Management**: Secure token storage and validation
- **API Key Protection**: All backend endpoints require authentication tokens

### Data Protection
- **Temporary Storage**: PDFs automatically deleted after 5 minutes
- **No Persistent Files**: Documents not stored permanently on servers
- **Encrypted Connections**: HTTPS/TLS for all API communications
- **Environment Variables**: Sensitive credentials stored in `.env.local` (never committed)
- **Database Security**: Supabase Row Level Security (RLS) policies enabled

### API Security
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Input Validation**: All user inputs sanitized and validated
- **CORS Configuration**: Restricted cross-origin requests
- **SQL Injection Prevention**: Parameterized queries via Supabase client
- **XSS Protection**: Content sanitization and CSP headers

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
4. **Third-Party Dependencies**: Relies on external services (Supabase, Google Gemini)
5. **Temporary Storage**: Files stored temporarily in server filesystem
6. **No End-to-End Encryption**: PDFs not encrypted at rest during processing

### ⚠️ **DO NOT:**
- Upload sensitive, confidential, or personal information
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
- **Impact**: Potential security impact and affected components
- **Reproduction Steps**: Detailed steps to reproduce the issue
- **Proof of Concept**: Code snippets or screenshots (if applicable)
- **Suggested Fix**: If you have ideas for remediation
- **Environment**: Browser, OS, Node/Python versions

### Response Timeline

As an educational project maintained by a single developer:
- **Initial Response**: Within 7 days
- **Status Update**: Within 14 days
- **Fix Implementation**: Depends on severity and complexity
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
2. **Email Security**: Keep your email account secure (2FA recommended)
3. **Document Sensitivity**: Never upload confidential documents
4. **Logout**: Always logout after using the platform
5. **Public Networks**: Avoid using on public/untrusted WiFi
6. **Browser Security**: Keep your browser updated
7. **Suspicious Activity**: Report any unusual behavior immediately

### For Developers
1. **Environment Variables**: Never commit `.env.local` or `.env` files
2. **API Keys**: Rotate API keys regularly
3. **Dependencies**: Keep packages updated (`pnpm update`, `pip install -U`)
4. **Code Review**: Review changes before merging
5. **Secret Scanning**: Use `eslint-plugin-no-secrets` before commits
6. **HTTPS Only**: Always use secure connections
7. **Input Validation**: Sanitize all user inputs

---

## 🔧 Security Configuration

### Required Environment Variables

```env
# Must be kept secret - never commit!
GOOGLE_API_KEY=your_gemini_api_key
API_KEY=your_secure_random_key
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
- [ ] All secrets in environment variables (not in code)
- [ ] `.env.local` added to `.gitignore`
- [ ] Dependencies updated to latest secure versions
- [ ] ESLint security rules passing
- [ ] CORS properly configured
- [ ] API authentication tested
- [ ] Rate limiting implemented
- [ ] Error messages don't expose sensitive info

### Regular Maintenance
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Review access logs for suspicious activity
- [ ] Test authentication flows
- [ ] Verify file cleanup automation
- [ ] Check Supabase security policies
- [ ] Monitor third-party service status

---

## 🚨 Incident Response

### In Case of Security Breach

1. **Immediate Actions**:
   - Disable affected accounts/services
   - Rotate all API keys and secrets
   - Document the incident
   - Assess the impact

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
- ✅ Good for testing with non-sensitive documents
- ✅ Appropriate for academic demonstrations
- ❌ **NOT** suitable for production use
- ❌ **NOT** designed for sensitive data
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
- Initial security policy
- JWT authentication
- Temporary file cleanup
- Basic input validation
- API key protection

---

**Last Updated**: December 15, 2025  
**Maintained by**: cordyStackX  
**License**: Apache 2.0  
**Status**: Educational Beta
