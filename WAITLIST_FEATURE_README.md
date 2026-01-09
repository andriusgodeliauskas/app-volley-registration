# Waitlist Management System - Feature Documentation

**Version:** 1.0
**Date:** 2026-01-09
**Status:** Production Ready ✅

---

## 📋 Overview

The **Waitlist Management System** is a comprehensive feature that automatically manages event registrations when capacity limits are reached. It includes intelligent deposit-based priority, automatic promotion/demotion, and a clear user interface for viewing waitlisted users.

---

## ✨ Key Features

### 1. **Automatic Waitlist Management**
- ✅ Users are automatically placed on waitlist when event is full
- ✅ Automatic promotion from waitlist when spots open up
- ✅ Automatic demotion when event capacity is reduced

### 2. **Deposit Priority System**
- ✅ Users with active deposits get priority over non-depositors
- ✅ **Registration:** Depositors replace last non-depositor when event is full
- ✅ **Promotion:** Depositors promoted first from waitlist (FIFO - oldest first)
- ✅ **Demotion:** Non-depositors demoted first to waitlist (LIFO - newest first)

### 3. **Separate Waitlist UI**
- ✅ Dedicated "Registruoti į eilę" section on event details page
- ✅ Clear visual distinction (yellow borders, badges)
- ✅ Shows waitlist position and count
- ✅ No longer hidden in registration history

### 4. **Admin Event Capacity Changes**
- ✅ **Increase max_players:** Automatic promotion from waitlist
- ✅ **Decrease max_players:** Automatic demotion to waitlist
- ✅ Deposit priority respected in both cases

### 5. **Cancellation Auto-Promotion**
- ✅ When any user cancels registration, system automatically promotes from waitlist
- ✅ Deposit priority maintained (depositors promoted first)

---

## 🔄 Automatic Workflows

### Scenario 1: User Registers to Full Event (WITH Deposit)
```
1. Event has 3/3 spots filled (user A, B, C - none have deposits)
2. User D (HAS deposit) registers
3. System automatically:
   - Finds last non-depositor (user C)
   - Moves user C to waitlist
   - Registers user D with 'registered' status

Result: Users A, B, D = registered | User C = waitlist
```

### Scenario 2: User Registers to Full Event (NO Deposit)
```
1. Event has 3/3 spots filled
2. User E (NO deposit) registers
3. System automatically:
   - Adds user E to waitlist with index 4

Result: Users A, B, C = registered | User E = waitlist
```

### Scenario 3: Admin Increases Event Capacity
```
Before: max_players = 3, registered = 3, waitlist = 2 (user D with deposit, user E without)
Admin changes: max_players = 5

System automatically:
1. Checks waitlist for depositors → finds user D
2. Promotes user D to 'registered' (PRIORITY 1)
3. Checks remaining slots (5 - 4 = 1)
4. Promotes user E to 'registered' (PRIORITY 2)

Result: max_players = 5, registered = 5, waitlist = 0
```

### Scenario 4: Admin Decreases Event Capacity
```
Before: max_players = 5, registered = 5 (users A, B have deposits; C, D, E don't)
Admin changes: max_players = 3

System automatically:
1. Calculates excess: 5 - 3 = 2
2. Demotes non-depositors first (newest first - LIFO):
   - User E → waitlist
   - User D → waitlist

Result: Users A, B, C = registered | Users D, E = waitlist
```

### Scenario 5: User Cancels Registration
```
Before: max_players = 3, registered = 3, waitlist = 2 (user D with deposit, user E without)
User B cancels registration

System automatically:
1. Cancels user B (status = 'canceled')
2. Checks waitlist for depositors → finds user D
3. Promotes user D to 'registered'

Result: Users A, C, D = registered | User E = waitlist | User B = canceled
```

### Scenario 6: Re-registration (Admin Registers from Waitlist)
```
Before: User D is on waitlist (HAS deposit), Event is full (3/3)
Admin clicks to register user D

System automatically:
1. Detects user D has deposit
2. Event is full, checks for non-depositor
3. Finds last non-depositor (user C)
4. Moves user C to waitlist
5. Registers user D

Result: Users A, B, D = registered | User C = waitlist
```

---

## 🎨 User Interface

### Main Event Page
**"Registruoti Žaidėjai" Section:**
- Shows only users with `status = 'registered'`
- White background, normal styling
- Indices: 1, 2, 3...

**"REGISTRUOTI Į EILĘ" Section (NEW):**
- Shows only users with `status = 'waitlist'`
- Yellow border and background (`.border-warning`, `.bg-light`)
- Badge showing waitlist count
- Grayscale avatar filter
- Indices continue after max_players (e.g., if max=3, waitlist starts at 4, 5, 6...)
- Shows "Laukia nuo" (waiting since) timestamp

**"Registracijų Istorija" Section:**
- Shows ALL statuses (registered, waitlist, canceled)
- Includes status change timestamps
- Visible only to admins and for historical tracking

---

## 🔧 Technical Implementation

### Backend Files Modified

#### `api/register_event.php`
**Changes:**
1. **Deposit check moved before registration logic** (line 105-114)
   - Ensures deposit status is known for both new and re-registrations
2. **Re-registration deposit priority** (lines 130-211)
   - When admin registers user from waitlist, checks deposit priority
   - Replaces non-depositor if depositor and event is full
3. **New registration deposit priority** (lines 203-238)
   - When depositor registers to full event, replaces last non-depositor
4. **Automatic promotion on cancellation** (lines 285-320)
   - When anyone cancels, promotes from waitlist with deposit priority

**Key Functions:**
- `handleRegister()`: Manages registration with deposit priority
- `handleCancelRegistration()`: Cancels and auto-promotes from waitlist

#### `api/admin_event_update.php`
**Changes:**
1. **Automatic promotion when capacity increased** (lines 136-184)
   - Priority 1: Depositors (oldest first - FIFO)
   - Priority 2: Non-depositors (oldest first - FIFO)
2. **Automatic demotion when capacity decreased** (lines 186-232)
   - Priority 1: Non-depositors (newest first - LIFO)
   - Priority 2: Depositors (newest first - LIFO)

**Key Logic:**
```php
// Get current counts
$confirmedCount = COUNT(status='registered')
$waitingCount = COUNT(status='waitlist')

// If max_players increased
if ($maxPlayers > $oldMaxPlayers) {
    $availableSlots = $maxPlayers - $confirmedCount;
    // Promote depositors first, then non-depositors
}

// If max_players decreased
if ($maxPlayers < $oldMaxPlayers) {
    $excessCount = $confirmedCount - $maxPlayers;
    // Demote non-depositors first, then depositors
}
```

#### `api/event_details.php`
**Changes:**
1. **Separate waitlist query** (lines 101-122)
   - Fetches users with `status = 'waitlist'`
   - Adds proper indices starting after max_players
2. **Added waitlist to API response** (line 148)
   - Returns `waitlist` array alongside `attendees`

**API Response Structure:**
```json
{
  "success": true,
  "data": {
    "event": { ... },
    "attendees": [ /* status='registered' */ ],
    "waitlist": [ /* status='waitlist' */ ],
    "registration_history": [ /* all statuses */ ]
  }
}
```

### Frontend Files Modified

#### `frontend/src/pages/EventDetails.jsx`
**Changes:**
1. **Added waitlist destructuring** (line 190)
   ```javascript
   const { event, attendees, waitlist, registration_history } = data;
   ```
2. **Removed filtering logic** (removed `attendees.filter()`)
   - `attendees` now contains ONLY registered users
   - `waitlist` contains ONLY waitlist users
3. **New waitlist section UI** (lines 474-524)
   - Dedicated section with yellow styling
   - Shows waitlist count badge
   - Displays "Laukia nuo" timestamp
   - Admin can cancel from waitlist

#### `frontend/src/translations.js`
**Added Keys:**
- `'event.waitlist_queue': 'Registruoti į eilę'` (LT)
- `'event.waitlist_queue': 'Registruoti į eilę'` (EN)

---

## 🗄️ Database Schema

### `registrations` Table
**Key Columns:**
- `status` ENUM: `'registered'`, `'waitlist'`, `'canceled'`
- `created_at`: Original registration timestamp (preserved on re-registration)
- `updated_at`: Status change timestamp
- `registered_by`: User who registered (self or admin)

**Important Notes:**
- `created_at` is **preserved** during re-registration to maintain FIFO/LIFO order
- Status transitions: `waitlist` ↔ `registered` ↔ `canceled`

### `deposits` Table
**Key Columns:**
- `user_id`: User with deposit
- `status` ENUM: `'active'`, `'inactive'`, `'refunded'`
- `amount`: Deposit amount

**Deposit Priority Logic:**
```sql
-- Check if user has active deposit
SELECT id FROM deposits
WHERE user_id = ? AND status = 'active'
LIMIT 1

-- Find non-depositor to replace
SELECT r.id FROM registrations r
LEFT JOIN deposits d ON r.user_id = d.user_id AND d.status = 'active'
WHERE r.event_id = ? AND r.status = 'registered' AND d.id IS NULL
ORDER BY r.created_at DESC
LIMIT 1
```

---

## 🧪 Testing Scenarios

### Test 1: Basic Waitlist
1. Create event with max_players = 3
2. Register users A, B, C → all 'registered'
3. Register user D → should go to 'waitlist' (index 4)
4. User B cancels → user D should auto-promote to 'registered'

### Test 2: Deposit Priority on Registration
1. Event has 3/3 spots (none have deposits)
2. User D with deposit registers
3. **Expected:** User D gets 'registered', last non-depositor goes to 'waitlist'

### Test 3: Admin Capacity Increase
1. Event: max=3, registered=3, waitlist=2 (1 with deposit, 1 without)
2. Admin increases max_players to 5
3. **Expected:** Depositor promoted first, then non-depositor

### Test 4: Admin Capacity Decrease
1. Event: max=5, registered=5 (2 with deposits, 3 without)
2. Admin decreases max_players to 3
3. **Expected:** 2 non-depositors (newest first) moved to waitlist

### Test 5: Re-registration with Deposit
1. User D on waitlist (has deposit), event full (3/3)
2. Admin clicks "Register" for user D
3. **Expected:** Last non-depositor moved to waitlist, user D gets 'registered'

### Test 6: UI Display
1. Navigate to event details page
2. **Expected:**
   - "Registruoti Žaidėjai" section shows registered users (indices 1, 2, 3)
   - "REGISTRUOTI Į EILĘ" section shows waitlist users (indices 4, 5, 6...)
   - Yellow styling, badge count, grayscale avatars for waitlist

---

## 📊 Priority Rules Summary

| Scenario | Priority Order |
|----------|---------------|
| **Registration to full event** | Depositors replace non-depositors (last registered) |
| **Promotion from waitlist** | 1. Depositors (oldest first - FIFO)<br>2. Non-depositors (oldest first - FIFO) |
| **Demotion to waitlist** | 1. Non-depositors (newest first - LIFO)<br>2. Depositors (newest first - LIFO) |
| **Cancellation auto-promotion** | Same as promotion from waitlist |

**Why FIFO for promotion?**
Fair queue system - earliest waitlist users get priority.

**Why LIFO for demotion?**
Last registered users are least committed - demote newest first.

**Why depositors first/last?**
Depositors paid upfront commitment - they get priority treatment.

---

## 🚀 Deployment

### Files to Deploy

**Backend:**
- `api/register_event.php`
- `api/admin_event_update.php`
- `api/event_details.php`

**Frontend:**
- Entire frontend build (`frontend/dist/`)
- Contains updated EventDetails.jsx and translations

### Deployment Commands
```powershell
# Staging
./prepare-deploy-staging.ps1

# Production
./prepare-deploy.ps1
```

### Post-Deployment Verification
1. ✅ Register to full event with deposit → should replace non-depositor
2. ✅ Admin increase capacity → should auto-promote from waitlist
3. ✅ Admin decrease capacity → should auto-demote to waitlist
4. ✅ Cancel registration → should auto-promote from waitlist
5. ✅ Check event details page → separate waitlist section visible

---

## 🔒 Security Considerations

### Authorization Checks
- ✅ Only authenticated users can register
- ✅ Users can only register themselves or their children
- ✅ Super admins can register anyone
- ✅ Only super admins can change event capacity

### Transaction Safety
- ✅ All operations use database transactions (`beginTransaction`, `commit`, `rollBack`)
- ✅ Row-level locking (`FOR UPDATE`) prevents race conditions
- ✅ Atomic operations ensure data consistency

### Input Validation
- ✅ Event ID, User ID validated and sanitized
- ✅ Status values validated against ENUM
- ✅ SQL injection prevented via prepared statements

---

## 📝 Changelog

### Version 1.0 (2026-01-09)
**Initial Release**
- Automatic waitlist management
- Deposit priority system
- Separate waitlist UI section
- Admin capacity change automation
- Cancellation auto-promotion
- Re-registration deposit priority

**Commits:**
- `4cdb54e`: FEATURE: Automatic Waitlist Management with Deposit Priority
- `e87fb69`: FEATURE: Separate Waitlist Section in Event Details

---

## 🐛 Known Issues

None at this time.

---

## 🔮 Future Enhancements

### Possible Improvements
1. **Email Notifications**
   - Notify users when promoted from waitlist
   - Notify users when demoted to waitlist

2. **Waitlist Position Indicator**
   - Show user their exact position in queue
   - Show estimated chance of promotion

3. **Waitlist Auto-Expiry**
   - Remove from waitlist if no response within X hours
   - Auto-promote next person

4. **Bulk Promotion**
   - Admin can manually promote specific waitlist users
   - Override automatic priority rules

---

## 👨‍💻 Developer Notes

### Code Quality
- All code follows project conventions
- Proper error handling and logging
- Comprehensive inline comments
- Security best practices applied

### Performance
- Optimized SQL queries with proper indexing
- Minimal database round-trips
- Efficient frontend rendering

### Maintainability
- Clear separation of concerns
- Reusable components
- Well-documented functions
- Easy to extend for future features

---

## 📞 Support

For issues or questions:
- GitHub Issues: [app-volley-registration/issues](https://github.com/andriusgodeliauskas/app-volley-registration/issues)
- Email: andrius.godeliauskas@gmail.com

---

**Last Updated:** 2026-01-09
**Author:** Andrius Godeliauskas
**Co-Authored-By:** Claude Sonnet 4.5
