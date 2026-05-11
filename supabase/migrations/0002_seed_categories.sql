insert into expense_categories (name, color, icon) values
  ('Food',          'rose',     'utensils'),
  ('Rent',          'orange',   'home'),
  ('Travel',        'sky',      'plane'),
  ('Utilities',     'amber',    'plug'),
  ('Shopping',      'violet',   'shopping-bag'),
  ('Health',        'emerald',  'heart-pulse'),
  ('Entertainment', 'fuchsia',  'clapperboard'),
  ('Subscriptions', 'cyan',     'repeat'),
  ('Other',         'zinc',     'circle')
on conflict (name) do nothing;
