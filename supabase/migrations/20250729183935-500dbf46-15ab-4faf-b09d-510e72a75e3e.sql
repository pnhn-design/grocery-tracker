-- Create admin user account
-- Note: This creates the user in auth.users with a temporary password
-- The user will need to reset their password on first login
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'leonardopanhan@outlook.com',
  crypt('TempPassword123!', gen_salt('bf')), -- Temporary password, should be changed
  now(),
  now(),
  now(),
  '{"username": "leonardopanhan", "full_name": "Leonardo Panhan"}',
  'authenticated',
  'authenticated'
);

-- Create profile for the admin user
INSERT INTO public.profiles (user_id, username, full_name)
SELECT 
  id,
  'leonardopanhan',
  'Leonardo Panhan'
FROM auth.users 
WHERE email = 'leonardopanhan@outlook.com';

-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'admin'::app_role
FROM auth.users 
WHERE email = 'leonardopanhan@outlook.com';

-- Add unique constraint to usernames to prevent duplicates
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);