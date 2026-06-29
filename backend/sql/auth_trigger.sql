-- Auth Trigger: sincroniza auth.users → public.users
-- Ejecutar en Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, password, role, phone, "businessId", "createdAt")
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    '',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'businessId',
    NOW()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();
