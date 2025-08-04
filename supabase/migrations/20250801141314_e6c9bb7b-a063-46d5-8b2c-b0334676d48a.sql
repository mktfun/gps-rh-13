
-- Drop the mensagens table
DROP TABLE IF EXISTS public.mensagens CASCADE;

-- Drop the conversas table
DROP TABLE IF EXISTS public.conversas CASCADE;

-- Drop the find_or_create_conversation function
DROP FUNCTION IF EXISTS public.find_or_create_conversation() CASCADE;
