-- Fix RLS policies for profiles table
-- This fixes the "infinite recursion detected in policy" error (42P17)

-- First, create helper functions that bypass RLS using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public, pg_temp;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow audit log user lookups" ON public.profiles;
DROP POLICY IF EXISTS "Allow public profile creation during invitation" ON public.profiles;
DROP POLICY IF EXISTS "Owners can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Recreate policies with proper syntax

-- SELECT policies
-- Note: Using SECURITY DEFINER function to avoid infinite recursion
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins and owners can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR 
  get_my_role() IN ('owner', 'admin')
);

-- INSERT policies
CREATE POLICY "Allow public profile creation during invitation"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invitations
    WHERE invitations.email = profiles.email
    AND invitations.accepted_at IS NULL
    AND invitations.expires_at > now()
  )
);

CREATE POLICY "Owners can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  get_my_role() = 'owner'
);

-- UPDATE policies
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = get_my_role()  -- Prevent users from changing their own role
);

CREATE POLICY "Owners can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (get_my_role() = 'owner')
WITH CHECK (get_my_role() = 'owner');

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
