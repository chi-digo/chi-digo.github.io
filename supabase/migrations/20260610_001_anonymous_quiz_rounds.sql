-- Allow anonymous quiz rounds so they can be claimed on sign-in

-- 1. Make user_id nullable on quiz_rounds and quiz_answers
ALTER TABLE public.quiz_rounds ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.quiz_answers ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add anonymous_id to quiz_rounds
ALTER TABLE public.quiz_rounds ADD COLUMN anonymous_id uuid;
CREATE INDEX idx_quiz_rounds_anonymous ON public.quiz_rounds(anonymous_id) WHERE anonymous_id IS NOT NULL;

-- 3. Ensure at least one identifier is present
ALTER TABLE public.quiz_rounds ADD CONSTRAINT quiz_rounds_has_identity
  CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL);
