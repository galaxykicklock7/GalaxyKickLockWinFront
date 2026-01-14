# Frontend Security Improvements

## Implemented Security Measures

### 1. Rate Limiting (`src/utils/rateLimiter.js`)
- **Login**: 5 attempts per minute, 5-minute block after exceeding
- **Signup**: 3 attempts per 5 minutes, 5-minute block after exceeding
- **Admin Login**: 5 attempts per minute
- **Admin Signup**: 3 attempts per 5 minutes
- Automatic cleanup of old data every 5 minutes
- Successful login/signup resets the rate limiter

### 2. Input Validation & Sanitization (`src/utils/inputValidator.js`)
- **XSS Prevention**: Removes `<>`, `javascript:`, event handlers
- **SQL Injection Detection**: Detects common SQL injection patterns
- **Username Validation**: 3-50 chars, alphanumeric + underscore/hyphen only
- **Password Validation**: 8-128 characters
- **Token Validation**: 10-200 characters
- All inputs sanitized before processing

### 3. Security Headers (vercel.json)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-XSS-Protection**: Enabled with blocking mode
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Blocks camera, microphone, geolocation
- **Content-Security-Policy**: Restricts resource loading

### 4. Enhanced Authentication
- Rate limiting on all auth endpoints
- Input validation before API calls
- SQL injection detection
- Generic error messages (don't reveal if username exists)
- Session validation with backend
- Auto-logout on expired sessions

## Limitations (Frontend-Only)

### Cannot Be Fixed Without Backend:
1. **httpOnly Cookies**: Requires backend to set secure cookies
2. **CSRF Tokens**: Requires backend to generate/validate tokens
3. **Secure Session Storage**: httpOnly cookies need backend
4. **API Key Protection**: Supabase ANON_KEY is meant to be public

## Supabase Security Model

The `VITE_SUPABASE_ANON_KEY` is **intentionally public**:
- It's the anonymous key, not a secret key
- Protected by Row Level Security (RLS) policies
- RLS ensures users can only access their own data
- This is Supabase's recommended security model

## Rate Limiting Details

### User Authentication:
- **Login**: 5 failed attempts → 5-minute block
- **Signup**: 3 attempts per 5 minutes → 5-minute block
- Successful auth resets the counter

### Admin Authentication:
- **Admin Login**: 5 failed attempts → 5-minute block
- **Admin Signup**: 3 attempts per 5 minutes → 5-minute block

### Config Changes:
- **No rate limiting** (as requested)
- Users can change config as needed

## Testing Rate Limiting

### Test Login Rate Limit:
1. Try logging in with wrong password 5 times
2. 6th attempt will show: "Too many login attempts. Please try again in 300 seconds."
3. Wait 5 minutes or successful login resets counter

### Test Signup Rate Limit:
1. Try signing up 3 times within 5 minutes
2. 4th attempt will show: "Too many signup attempts. Please try again in X seconds."

## Security Best Practices Applied

✅ Input validation and sanitization
✅ Rate limiting on authentication
✅ SQL injection detection
✅ XSS prevention
✅ Security headers
✅ Generic error messages
✅ Session validation
✅ Auto-logout on expiry

## Future Improvements (Requires Backend)

For production-grade security, consider:
1. Build a backend API (Node.js/Express)
2. Implement httpOnly cookie sessions
3. Add CSRF protection
4. Move Supabase calls to backend
5. Implement server-side rate limiting
6. Add request signing/verification
7. Use environment-specific API keys

## Notes

- Rate limiting data stored in memory (resets on page refresh)
- For persistent rate limiting, need backend with Redis/database
- Current implementation is client-side only
- Determined attackers can bypass client-side protections
- Backend implementation recommended for production
