# Auto-Cleanup When Admin Revokes Token

## Feature Overview
When an admin removes/revokes a user's token, the frontend automatically detects this and performs complete cleanup to prevent wasted resources.

---

## How It Works

### 1. Session Validation (Every 30 seconds)
The app continuously validates the user's session with the backend:
```javascript
// Runs every 30 seconds
validateSession() → checks if token is still valid
```

### 2. Token Revocation Detection
When admin deletes/revokes a user's token:
- Backend's `validate_session` function returns `token_deleted: true` or `token_invalid: true`
- Frontend detects this in the validation response

### 3. Auto-Cleanup Sequence
Once token revocation is detected, the system automatically:

```
1. Disconnect from system (if connected)
   ↓
2. Cancel running workflow (if active)
   ↓
3. Clear deployment state
   ↓
4. Clear backend URL
   ↓
5. Stop workflow monitoring
   ↓
6. Logout user
   ↓
7. Show message: "Your access has been revoked by admin"
```

---

## Technical Implementation

### Session Validation Function
```javascript
validateSessionWithBackend() {
  // Check if token is valid
  const result = await supabase.rpc('validate_session', {
    p_session_token: session.session_token
  });
  
  // Detect token revocation
  if (result.token_deleted || result.token_invalid) {
    return { 
      valid: false, 
      reason: 'Your access has been revoked by admin' 
    };
  }
}
```

### Auto-Cleanup Function
```javascript
performAutoCleanup(reason) {
  // 1. Disconnect
  if (connected) {
    await disconnect();
  }
  
  // 2. Cancel workflow
  const workflowRunId = localStorage.getItem('workflowRunId');
  if (workflowRunId) {
    await cancelWorkflowRun(workflowRunId);
  }
  
  // 3. Clear state
  localStorage.removeItem('deploymentStatus');
  localStorage.removeItem('workflowRunId');
  clearBackendUrl();
  stopMonitoring();
  
  // 4. Logout
  setAuthenticated(false);
  showToast(reason, 'error');
}
```

---

## User Experience

### Scenario: Admin Revokes Token

**User's View:**
1. User is actively using the app (connected, workflow running)
2. Admin deletes user's token from admin panel
3. Within 30 seconds, user sees:
   - Toast message: "Your access has been revoked by admin"
   - Automatically logged out
   - Redirected to login page
4. All backend resources cleaned up automatically

**No manual action required from user!**

---

## Cleanup Actions Performed

### 1. Disconnect WebSocket
- Closes all active WebSocket connections
- Sends disconnect command to backend
- Prevents orphaned connections

### 2. Cancel GitHub Workflow
- Finds running workflow by ID
- Calls GitHub API to cancel workflow
- Stops backend server immediately
- Prevents continued resource usage

### 3. Clear Local State
```javascript
localStorage.removeItem('deploymentStatus');
localStorage.removeItem('workflowRunId');
localStorage.removeItem('backendSubdomain');
localStorage.removeItem('localTestMode');
localStorage.removeItem('galaxyKickLockSession');
```

### 4. Clear Backend URL
- Removes stored backend URL
- Resets connection state
- Disables all controls

### 5. Stop Monitoring
- Stops workflow status polling
- Clears monitoring intervals
- Prevents unnecessary API calls

---

## Validation Frequency

### Every 30 Seconds
- Checks session validity with backend
- Detects token revocation quickly
- Balances responsiveness vs API load

### On Tab Focus
- Also validates when user switches back to tab
- Catches revocations that happened while tab was inactive

---

## Error Messages

### Token Revoked by Admin
```
"Your access has been revoked by admin"
```

### Session Expired
```
"Your session has expired"
```

### Logged in Elsewhere
```
"You have been logged in on another device"
```

---

## Backend Requirements

The backend's `validate_session` function must return:
```sql
CREATE OR REPLACE FUNCTION validate_session(p_session_token TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  token_deleted BOOLEAN,
  token_invalid BOOLEAN,
  error TEXT
) AS $$
BEGIN
  -- Check if session exists
  -- Check if user's token still exists
  -- Check if token is expired
  -- Return appropriate flags
END;
$$ LANGUAGE plpgsql;
```

---

## Testing

### Test 1: Token Revocation
1. User logs in and activates system
2. Admin deletes user's token
3. Wait 30 seconds
4. ✅ User should be auto-logged out
5. ✅ Workflow should be cancelled
6. ✅ Message: "Your access has been revoked by admin"

### Test 2: Multiple Users
1. User A and User B both logged in
2. Admin deletes User A's token
3. ✅ User A logged out automatically
4. ✅ User B remains logged in (unaffected)

### Test 3: Active Workflow
1. User activates system (workflow running)
2. Admin deletes token
3. ✅ Workflow cancelled automatically
4. ✅ User logged out
5. ✅ Check GitHub Actions - workflow should be cancelled

---

## Benefits

### Cost Savings
- Prevents workflows from running after token revocation
- Stops backend resources immediately
- No orphaned connections or processes

### Security
- Immediate access revocation
- No lingering sessions
- Clean state on logout

### User Experience
- Automatic cleanup (no manual steps)
- Clear error message
- Smooth logout process

---

## Summary

When admin revokes a user's token:
1. ✅ Frontend detects within 30 seconds
2. ✅ Automatically disconnects
3. ✅ Automatically cancels workflow
4. ✅ Automatically clears state
5. ✅ Automatically logs out
6. ✅ Shows clear message

**Zero manual intervention required!**
