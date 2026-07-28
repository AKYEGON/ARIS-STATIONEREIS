DELETE FROM public.order_items
WHERE order_id IN (SELECT id FROM public.orders WHERE customer_name IN ('Test Buyer','Casio'));

DELETE FROM public.orders WHERE customer_name IN ('Test Buyer','Casio');

DELETE FROM public.stock_movements WHERE notes LIKE 'Walk-in Sale #5046076b%';

UPDATE public.products SET stock = stock + 1 WHERE id = '34f368f8-6aa7-46d6-b1b8-e133dd966b04';