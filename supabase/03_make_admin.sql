-- =====================================================================
-- Alpa Zone BD — make an account admin
-- 1) First sign up on the website (/signup) with this email.
-- 2) Then run this file in the Supabase SQL Editor.
-- The last query must show one row with role = admin.
-- =====================================================================

update public.profiles
set role = 'admin'
where lower(email) = lower('boktiyerhossen43085@gmail.com');

select id, email, role, created_at
from public.profiles
where lower(email) = lower('boktiyerhossen43085@gmail.com');
