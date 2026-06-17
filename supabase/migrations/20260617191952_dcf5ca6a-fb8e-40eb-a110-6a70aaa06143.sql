UPDATE public.products
SET name = (
  UPPER(LEFT(regexp_replace(trim(name), '\s+', ' ', 'g'), 1))
  || LOWER(SUBSTRING(regexp_replace(trim(name), '\s+', ' ', 'g') FROM 2))
)
WHERE name IS NOT NULL
  AND name <> (
    UPPER(LEFT(regexp_replace(trim(name), '\s+', ' ', 'g'), 1))
    || LOWER(SUBSTRING(regexp_replace(trim(name), '\s+', ' ', 'g') FROM 2))
  );