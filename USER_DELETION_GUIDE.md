# User Deletion with Proper Cleanup

## Overview
When admin deletes a user, the system performs complete cleanup and prevents username reuse.

---

## What Happens When Admin Deletes User

### Step 1: Invalidate All Sessions
```sql
UPDATE public.user_sessions
SET is_active = false
WHERE user_id = p_user_id AND is_active = true;
```
- Forces immediate logout on all devices
- User sees: "Your account has been removed by admin"
- Auto-cleanup triggered (disconnect, cancel workflow, logout)

### Step 2: Remove Token Reference
```sql
UPDATE public.users
SET token_id = NULL,
    subscription_months = NULL,
    token_expiry_date = NOW() - INTERVAL '1 day'
WHERE id = p_user_id;
```
- Removes association with token
- Token can be reused for new user

### Step 3: Soft Delete User
```sql
UPDATE public.users
SET is_active = false,
    username = 'DELETED_' || username || '_' || timestamp,
    password_hash = 'DELETED'
WHERE id = p_user_id;
```
- Marks user as inactive
- Renames username to prevent reuse
- Example: `john` becomes `DELETED_john_1768383049`

---

## User Experience

### Scenario 1: User is Logged In

**Admin Action:** Deletes user from admin panel

**User Experience:**
1. Within 30 seconds, user sees toast: "Your account has been removed by admin"
2. Automatically disconnected from system
3. Workflow automatically cancelled
4. Logged out automatically
5. Redirected to login page

### Scenario 2: User Tries to Login After Deletion

**User Action:** Enters username and password

**System Response:**
```
Error: "This account has been removed by admin. Please contact support."
```

### Scenario 3: User Tries to Signup with Same Username

**User Action:** Tries to register with deleted username

**System Response:**
```
Error: "This username was previously used and cannot be registered again. 
Please choose a different username."
```

---

## Database Changes Required

Run the `user_deletion_fix.sql` file in your Supabase SQL Editor to update:

### 1. delete_user Function
- Invalidates all sessions
- Removes token reference
- Soft deletes user (prevents username reuse)

### 2. authenticate_user Function
- Checks if user is deleted
- Returns clear error message

### 3. register_user Function
- Checks for deleted usernames
- Prevents reuse with clear message

### 4. validate_session Function
- Detects user deletion
- Returns `user_deleted: true` flag
- Provides reason for frontend

---

## Error Messages

### Login Errors

**Deleted User:**
```
"This account has been removed by admin. Please contact support."
```

**Expired Token:**
```
"Your subscription has expired. Please contact admin."
```

**Invalid Credentials:**
```
"Invalid username or password"
```

### Signup Errors

**Deleted Username:**
```
"This username was previously used and cannot be registered again. 
Please choose a different username."
```

**Username Exists:**
```
"Username already exists"
```

**Token Already Used:**
```
"Token has already been used"
```

### Session Validation

**User Deleted:**
```
"Your account has been removed by admin"
```

**Token Revoked:**
```
"Your access has been revoked by admin"
```

**Session Expired:**
```
"Session expired"
```

---

## Frontend Auto-Cleanup

When user deletion is detected (via session validation):

```javascript
performAutoCleanup('Your account has been removed by admin') {
  // 1. Disconnect
  await disconnect();
  
  // 2. Cancel workflow
  await cancelWorkflowRun(workflowRunId);
  
  // 3. Clear state
  localStorage.clear();
  clearBackendUrl();
  stopMonitoring();
  
  // 4. Logout
  setAuthenticated(false);
  showToast(reason, 'error');
}
```

---

## Testing

### Test 1: Delete Active User
1. User logs in and activates system
2. Admin deletes user
3. Wait 30 seconds
4. ✅ User sees: "Your account has been removed by admin"
5. ✅ User is logged out automatically
6. ✅ Workflow is cancelled

### Test 2: Login After Deletion
1. Admin deletes user
2. User tries to login
3. ✅ Error: "This account has been removed by admin. Please contact support."

### Test 3: Signup with Deleted Username
1. Admin deletes user "john"
2. New user tries to signup as "john"
3. ✅ Error: "This username was previously used and cannot be registered again..."

### Test 4: Username is Renamed
1. Admin deletes user "john"
2. Check database
3. ✅ Username is now "DELETED_john_1768383049"
4. ✅ Original "john" cannot be used again

---

## Benefits

### Security
- Immediate session invalidation
- No lingering access
- Clear audit trail (soft delete)

### Cost Savings
- Workflows cancelled automatically
- No orphaned resources
- Clean state on deletion

### User Experience
- Clear error messages
- No confusion about account status
- Prevents username conflicts

### Admin Control
- Complete user removal
- Token can be reused
- Username protected from reuse

---

## Summary

When admin deletes a user:
1. ✅ All sessions invalidated immediately
2. ✅ User auto-logged out (within 30 seconds)
3. ✅ Workflow auto-cancelled
4. ✅ Username cannot be reused
5. ✅ Clear error messages on login/signup
6. ✅ Token freed for reuse

**Complete cleanup with zero manual intervention!**
