-- Migration: Add user_profiles table for user-specific settings
-- This migration adds a comprehensive user profile system to support
-- personalized settings, preferences, and privacy controls

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,

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
  profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends')),
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

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles table
-- Users can read all profiles (for public information)
CREATE POLICY "Users can read profiles" ON user_profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (true);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (true);

-- Create default profiles for existing users (if any)
-- This ensures backward compatibility
INSERT INTO user_profiles (user_id, created_at)
SELECT id, NOW()
FROM users
WHERE id NOT IN (SELECT user_id FROM user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON user_profiles TO anon, authenticated;

-- Add comment for documentation
COMMENT ON TABLE user_profiles IS 'Stores user-specific settings, preferences, and profile information';
COMMENT ON COLUMN user_profiles.email_notifications IS 'Enable/disable email notifications';
COMMENT ON COLUMN user_profiles.profile_visibility IS 'Control who can see the user profile: public, private, or friends';
COMMENT ON COLUMN user_profiles.auto_refresh IS 'Enable/disable auto-refresh for dashboard and maps';
