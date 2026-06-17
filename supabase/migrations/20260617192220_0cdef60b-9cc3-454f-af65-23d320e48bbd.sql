UPDATE public.bundles
SET name = UPPER(LEFT(regexp_replace(trim(name), '\s+', ' ', 'g'), 1))
        || LOWER(SUBSTRING(regexp_replace(trim(name), '\s+', ' ', 'g') FROM 2))
WHERE name IS NOT NULL;

UPDATE public.bogo_offers
SET name = UPPER(LEFT(regexp_replace(trim(name), '\s+', ' ', 'g'), 1))
        || LOWER(SUBSTRING(regexp_replace(trim(name), '\s+', ' ', 'g') FROM 2))
WHERE name IS NOT NULL;

UPDATE public.course_bundles
SET name = UPPER(LEFT(regexp_replace(trim(name), '\s+', ' ', 'g'), 1))
        || LOWER(SUBSTRING(regexp_replace(trim(name), '\s+', ' ', 'g') FROM 2))
WHERE name IS NOT NULL;

UPDATE public.customer_testimonials
SET product_name = UPPER(LEFT(regexp_replace(trim(product_name), '\s+', ' ', 'g'), 1))
                || LOWER(SUBSTRING(regexp_replace(trim(product_name), '\s+', ' ', 'g') FROM 2))
WHERE product_name IS NOT NULL;