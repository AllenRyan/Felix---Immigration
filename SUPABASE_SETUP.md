# Supabase Authentication Setup Guide

This guide will walk you through setting up Supabase authentication for the Inspra AI application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- The application codebase with Supabase dependencies installed

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Inspra AI (or your preferred name)
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (takes 1-2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll find the following credentials:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: A long string starting with `eyJ...`
   - **service_role** key: Another long string starting with `eyJ...` (click "Reveal" to see it)

3. Copy these values to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key_here
```

## Step 3: Create Database Tables

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the following SQL:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to insert profiles
CREATE POLICY "Admins can insert profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update profiles
CREATE POLICY "Admins can update profiles"
  ON user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

4. Click "Run" to execute the SQL

## Step 4: Create Your First Admin User

Since there's no signup page, you'll need to manually create the first admin user:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click "Add user" → "Create new user"
3. Enter:
   - **Email**: Your admin email
   - **Password**: A secure password (you'll use this to log in)
   - Check "Auto Confirm User"
4. Click "Create user"
5. Copy the User ID (UUID) that appears
6. Go to **Table Editor** → **user_profiles**
7. Click "Insert" → "Insert row"
8. Fill in:
   - **id**: Paste the User ID you copied
   - **email**: Your admin email (same as above)
   - **role**: `admin`
   - **created_at**: Leave as default
   - **updated_at**: Leave as default
9. Click "Save"

### Option B: Using SQL Editor

1. Go to **SQL Editor** in Supabase
2. Run the following SQL (replace the email and password):

```sql
-- Create the admin user (this returns the user_id)
SELECT auth.uid() FROM auth.users WHERE email = 'your-admin-email@example.com';

-- If the user doesn't exist, you'll need to create via dashboard first
-- Then update their role:
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

## Step 5: Configure Email Settings (Optional)

By default, Supabase sends confirmation emails. Since we're manually confirming users:

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates if desired
3. For production, set up a custom SMTP provider in **Authentication** → **Settings**

## Step 6: Test the Authentication

1. Start your Next.js application:
   ```bash
   pnpm dev
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to `/login`
4. Log in with your admin credentials
5. You should see the main app with your email in the sidebar
6. Click the Settings icon (only visible to admins) to access the admin dashboard
7. Test inviting a new user

## Step 7: Invite Additional Users

1. Log in as admin
2. Click the Settings icon in the sidebar
3. Click "Invite User"
4. Enter email, password, and select role
5. Click "Invite User"
6. The user can now log in with those credentials

## Database Schema Reference

### `user_profiles` Table

| Column       | Type      | Description                              |
|------------- |---------- |----------------------------------------- |
| id           | UUID      | Primary key, references auth.users(id)   |
| email        | TEXT      | User's email address                     |
| role         | TEXT      | Either 'admin' or 'user'                 |
| created_at   | TIMESTAMP | When the profile was created             |
| updated_at   | TIMESTAMP | When the profile was last updated        |

## Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **Protected Routes**: Middleware checks authentication on all routes except `/login`
- **Admin-Only Routes**: `/admin` routes check for admin role
- **Admin-Only API**: All `/api/admin/*` endpoints verify admin role
- **Session Management**: Supabase handles secure session cookies
- **Password Requirements**: Minimum 6 characters (configurable)

## Troubleshooting

### "Unauthorized - please log in" Error

- Make sure you're logged in
- Check that your Supabase credentials in `.env.local` are correct
- Verify your session hasn't expired (30 days by default)

### Can't Access Admin Dashboard

- Verify your user has `role = 'admin'` in the `user_profiles` table
- Check the browser console for errors
- Make sure you're logged in

### User Creation Fails

- Check that the email doesn't already exist
- Verify your `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase logs in the dashboard under **Logs** → **API**

### Environment Variables Not Loading

- Restart your dev server after changing `.env.local`
- Make sure variable names start with `NEXT_PUBLIC_` for client-side access
- Check for typos in variable names

## Production Checklist

Before deploying to production:

- [ ] Set up custom SMTP for email delivery
- [ ] Enable email rate limiting in Supabase
- [ ] Set up proper domain allowlisting
- [ ] Configure password strength requirements
- [ ] Set up database backups
- [ ] Enable database Point-in-Time Recovery (PITR)
- [ ] Set up monitoring and alerts
- [ ] Review and test all RLS policies
- [ ] Use environment-specific Supabase projects (dev/staging/prod)

## Support

For Supabase-specific issues:
- Documentation: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions

For application-specific issues:
- Check the application README
- Review the code in `lib/supabase/` and `lib/auth/`
