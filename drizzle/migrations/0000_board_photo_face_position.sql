ALTER TABLE public.board_members ADD COLUMN IF NOT EXISTS photo_position text NOT NULL DEFAULT '50% 25%';

UPDATE public.board_members SET photo_position = '45% 50%' WHERE name = 'Melanie Bainbridge';
UPDATE public.board_members SET photo_position = '50% 55%' WHERE name = 'Harry Deluxe';
UPDATE public.board_members SET photo_position = '50% 14%' WHERE name = 'Mike Fuller';
UPDATE public.board_members SET photo_position = '50% 0%' WHERE name = 'Robert Weymouth';
UPDATE public.board_members SET photo_position = '50% 50%' WHERE name = 'Pippa Bainbridge';
UPDATE public.board_members SET photo_position = '50% 50%' WHERE name = 'Justin Sideris';
UPDATE public.board_members SET photo_position = '50% 50%' WHERE name = 'Giles Thomson';
UPDATE public.board_members SET photo_position = '50% 0%' WHERE name = 'Kieran Murphy';
UPDATE public.board_members SET photo_position = '45% 50%' WHERE name = 'Ngaire Greenwood';
UPDATE public.board_members SET photo_position = '72% 50%' WHERE name = 'Mel Anastas';
UPDATE public.board_members SET photo_position = '96% 50%' WHERE name = 'Hank Gidney';

GRANT SELECT ON public.board_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_members TO authenticated;
GRANT ALL ON public.board_members TO service_role;