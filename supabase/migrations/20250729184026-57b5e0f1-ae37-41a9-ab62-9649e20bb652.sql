-- Just add the unique constraint for usernames
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);