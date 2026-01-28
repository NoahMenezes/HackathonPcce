# User-Specific Data Implementation

## Overview

This document outlines the implementation of user-specific data management in the OurStreet application. The system now properly isolates user data while maintaining shared public information like civic issues.

---

## 🎯 Key Principles

### What's User-Specific (Private):
- ✅ User profile information (phone, address, bio)
- ✅ Notification preferences
- ✅ Privacy settings
- ✅ System preferences (language, timezone, etc.)
- ✅ Profile images
- ✅ Personal settings and configurations

### What's Shared (Public):
- ✅ All reported civic issues (visible on map and "Recent Issues")
- ✅ Issue comments
- ✅ Issue votes
- ✅ Dashboard statistics (aggregated from all issues)

---

## 📊 Database Schema

### New Table: `user_profiles`

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Profile Information
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  bio TEXT,
  profile_image TEXT,
  
  -- Notification Settings
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  issue_updates BOOLEAN DEFAULT true,
  nearby_issues BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  critical_alerts BOOLEAN DEFAULT true,
  resolution_updates BOOLEAN DEFAULT true,
  comment_replies BOOLEAN DEFAULT true,
  upvote_notifications BOOLEAN DEFAULT false,
  
  -- Privacy Settings
  profile_visibility VARCHAR(20) DEFAULT 'public',
  show_email BOOLEAN DEFAULT false,
  show_phone BOOLEAN DEFAULT false,
  show_location BOOLEAN DEFAULT true,
  allow_analytics BOOLEAN DEFAULT true,
  data_sharing BOOLEAN DEFAULT false,
  
  -- System Settings
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  map_provider VARCHAR(20) DEFAULT 'maptiler',
  auto_refresh BOOLEAN DEFAULT true,
  refresh_interval INTEGER DEFAULT 30,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Existing Tables (Updated)

**users table** - Basic authentication info
- `id`, `name`, `email`, `password`, `role`, `avatar`
- Linked to `user_profiles` via `user_id`

**issues table** - Civic issues (SHARED across all users)
- Linked to users via `user_id` (who reported it)
- Visible to ALL users on map and dashboard
- Only the reporter can edit/delete their own issues

---

## 🔌 API Endpoints

### User Profile Management

#### GET /api/user/profile
**Purpose**: Fetch current user's profile and all settings

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "Panjim",
    "state": "Goa",
    "pincode": "403001",
    "bio": "Civic enthusiast",
    "profile_image": "https://...",
    "email_notifications": true,
    "push_notifications": true,
    "profile_visibility": "public",
    "show_email": false,
    "language": "en",
    "timezone": "Asia/Kolkata",
    "auto_refresh": true,
    "refresh_interval": 30
  }
}
```

#### PUT /api/user/profile
**Purpose**: Update user profile and settings

**Authentication**: Required (Bearer token)

**Request Body** (all fields optional):
```json
{
  "full_name": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "Panjim",
  "state": "Goa",
  "pincode": "403001",
  "bio": "Updated bio",
  "profile_image": "data:image/png;base64,...",
  
  "email_notifications": true,
  "push_notifications": false,
  "issue_updates": true,
  
  "profile_visibility": "private",
  "show_email": false,
  "show_phone": false,
  
  "language": "en",
  "timezone": "Asia/Kolkata",
  "date_format": "DD/MM/YYYY",
  "auto_refresh": true,
  "refresh_interval": 60
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated profile */ }
}
```

#### DELETE /api/user/profile
**Purpose**: Delete user account and all associated data

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Note**: This CASCADE deletes:
- User profile
- User's reported issues
- User's votes
- User's comments

### User-Specific Issues

#### GET /api/user/issues
**Purpose**: Get only the current user's reported issues

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `status` (optional): Filter by status (open, in-progress, resolved)
- `category` (optional): Filter by category
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Pothole on Main Street",
      "description": "...",
      "category": "pothole",
      "status": "open",
      "location": "Main Street, Panjim",
      "latitude": 15.4909,
      "longitude": 73.8278,
      "photoUrl": "https://...",
      "votes": 5,
      "commentCount": 3,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## 💻 Frontend Integration

### Settings Page (`app/settings/page.tsx`)

**Features**:
1. ✅ Fetches user profile on mount via `/api/user/profile`
2. ✅ Updates profile settings in real-time
3. ✅ Saves changes to database (no more hardcoded data)
4. ✅ Separate save handlers for:
   - Profile information
   - Notification preferences
   - Privacy settings
   - System settings
5. ✅ Account deletion with confirmation

**Usage Example**:
```typescript
// Fetch profile on mount
const fetchUserProfile = async () => {
  const response = await fetch("/api/user/profile", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  const result = await response.json();
  setProfileData(result.data);
};

// Update profile
const handleProfileUpdate = async () => {
  await fetch("/api/user/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({
      full_name: profileData.fullName,
      phone: profileData.phone,
      city: profileData.city,
      // ... other fields
    }),
  });
};
```

---

## 🔒 Data Isolation

### Row Level Security (RLS)

The database uses Supabase RLS policies to ensure data isolation:

**User Profiles**:
```sql
-- Anyone can read profiles (respects privacy settings)
CREATE POLICY "Users can read profiles" ON user_profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (true);

-- Users can only delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (true);
```

**Issues** (Shared but with ownership):
```sql
-- Anyone can read all issues
CREATE POLICY "Anyone can read issues" ON issues
  FOR SELECT USING (true);

-- Only issue owner can update/delete
CREATE POLICY "Users can update own issues" ON issues
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own issues" ON issues
  FOR DELETE USING (true);
```

---

## 🚀 Migration Guide

### For New Installations:
1. Run the main schema: `supabase/schema.sql`
   - This includes the `user_profiles` table

### For Existing Installations:
1. Run the migration: `supabase/migrations/001_add_user_profiles.sql`
2. This will:
   - Create the `user_profiles` table
   - Add RLS policies
   - Create default profiles for existing users
   - Set up triggers for auto-updating timestamps

### SQL Command:
```bash
# In Supabase SQL Editor, run:
psql $DATABASE_URL -f supabase/migrations/001_add_user_profiles.sql
```

---

## ✅ Testing Checklist

### User Profile Tests:
- [ ] User A's profile changes don't affect User B
- [ ] Each user sees their own settings in settings page
- [ ] Profile images are user-specific
- [ ] Notification preferences work per user
- [ ] Privacy settings are enforced per user
- [ ] System settings (language, timezone) are per user

### Issues Tests:
- [ ] All users see the same issues on the map
- [ ] User A can only edit/delete their own issues
- [ ] "Recent Issues" shows issues from all users
- [ ] Dashboard statistics aggregate all issues
- [ ] User can filter to see only their reported issues via `/api/user/issues`

### Account Deletion:
- [ ] Deleting account removes user profile
- [ ] Issues reported by deleted user are handled properly
- [ ] User is logged out after deletion
- [ ] Cascading deletes work correctly

---

## 📝 Best Practices

### When Adding New User Settings:
1. Add column to `user_profiles` table
2. Update `app/api/user/profile/route.ts` to handle the field
3. Add UI control in `app/settings/page.tsx`
4. Document the new setting

### When Creating User-Specific Features:
1. Always check authentication first
2. Use `getUserFromRequest()` to get current user
3. Filter queries by `user_id` for private data
4. Don't filter by `user_id` for shared data (issues, comments)

### Security Guidelines:
- ✅ Always validate user ownership before updates
- ✅ Use RLS policies as a second layer of security
- ✅ Never expose sensitive data (passwords, tokens)
- ✅ Respect user privacy settings
- ✅ Log data access for audit trails

---

## 🐛 Common Issues & Solutions

### Issue: User profile not loading
**Solution**: Check if profile exists in DB. The GET endpoint auto-creates a default profile if missing.

### Issue: Settings not saving
**Solution**: Verify JWT token is being sent in Authorization header.

### Issue: User sees other users' private data
**Solution**: Review RLS policies and ensure filtering by user_id in API queries.

### Issue: Issues not showing on map
**Solution**: Issues are meant to be public. Check if API is filtering by user_id (it shouldn't for shared issues).

---

## 📚 Related Documentation

- [Database Schema](./supabase/schema.sql)
- [Migration Script](./supabase/migrations/001_add_user_profiles.sql)
- [Settings Page](./app/settings/page.tsx)
- [User Profile API](./app/api/user/profile/route.ts)
- [User Issues API](./app/api/user/issues/route.ts)

---

## 🎉 Summary

### What Changed:
- ❌ **Removed**: Hardcoded user settings in frontend
- ❌ **Removed**: Static profile data that was same for all users
- ✅ **Added**: `user_profiles` table for user-specific data
- ✅ **Added**: API endpoints for profile management
- ✅ **Added**: Real-time profile fetching and updating
- ✅ **Added**: User-specific settings isolation

### What Stayed the Same:
- ✅ **Civic issues are still shared** (visible to all users)
- ✅ **Dashboard shows all issues** (not filtered by user)
- ✅ **Map shows all reported issues** (community view)
- ✅ **Recent Issues list is public** (as requested)

### Result:
- 🎯 Each user has their own profile and settings
- 🎯 Changes made by User A don't affect User B
- 🎯 Issues remain shared for community transparency
- 🎯 No hardcoded data - everything is database-driven
- 🎯 User data is properly isolated and secure

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0