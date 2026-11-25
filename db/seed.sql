-- Realistic, repeatable development data for all application tables.
-- Run through db/setup-sql-test.js; the seed transaction rolls back on failure.

BEGIN;

-- Categories: 8 parent categories and 32 child categories.
WITH root_categories(i, name) AS (
  VALUES
    (1, 'Electronics'),
    (2, 'Home and Kitchen'),
    (3, 'Clothing'),
    (4, 'Sports and Outdoors'),
    (5, 'Beauty and Personal Care'),
    (6, 'Books and Stationery'),
    (7, 'Toys and Games'),
    (8, 'Grocery')
)
INSERT INTO categories (id, parent_id, name, path)
SELECT md5('sql-test-category-' || i)::uuid,
       NULL,
       name,
       format('catalog.root_%s', lpad(i::text, 2, '0'))::ltree
FROM root_categories
ON CONFLICT DO NOTHING;

WITH child_categories(i, name) AS (
  VALUES
    (9, 'Headphones'), (10, 'Laptops'), (11, 'Smartphones'), (12, 'Cameras'),
    (13, 'Cookware'), (14, 'Coffee Makers'), (15, 'Storage'), (16, 'Lighting'),
    (17, 'T Shirts'), (18, 'Jeans'), (19, 'Jackets'), (20, 'Footwear'),
    (21, 'Camping'), (22, 'Fitness Equipment'), (23, 'Cycling'), (24, 'Team Sports'),
    (25, 'Skincare'), (26, 'Hair Care'), (27, 'Makeup'), (28, 'Fragrance'),
    (29, 'Fiction'), (30, 'Technology Books'), (31, 'Notebooks'), (32, 'Pens'),
    (33, 'Building Sets'), (34, 'Board Games'), (35, 'Puzzles'), (36, 'Outdoor Toys'),
    (37, 'Coffee and Tea'), (38, 'Snacks'), (39, 'Pantry Staples'), (40, 'Breakfast')
)
INSERT INTO categories (id, parent_id, name, path)
SELECT md5('sql-test-category-' || c.i)::uuid,
       md5('sql-test-category-' || (((c.i - 9) / 4) + 1))::uuid,
       c.name,
       format(
         'catalog.root_%s.category_%s',
         lpad((((c.i - 9) / 4) + 1)::text, 2, '0'),
         lpad(c.i::text, 2, '0')
       )::ltree
FROM child_categories c
ON CONFLICT DO NOTHING;

-- Product attributes and representative values.
WITH attribute_seed(name, value) AS (
  VALUES
    ('Color', 'Midnight Black'),
    ('Size', 'Medium'),
    ('Material', 'Stainless Steel'),
    ('Weight', '1.2 kg'),
    ('Dimensions', '30 x 20 x 10 cm'),
    ('Brand', 'Northstar'),
    ('Model', 'Series 4'),
    ('Storage Capacity', '256 GB'),
    ('Memory', '16 GB'),
    ('Screen Size', '15.6 inch'),
    ('Resolution', '1920 x 1080'),
    ('Connectivity', 'Bluetooth 5.3'),
    ('Battery Life', '12 hours'),
    ('Power', '1200 W'),
    ('Voltage', '220 V'),
    ('Fabric', '100% cotton'),
    ('Fit', 'Regular'),
    ('Pattern', 'Solid'),
    ('Care Instructions', 'Machine washable'),
    ('Shoe Size', 'EU 42'),
    ('Volume', '500 ml'),
    ('Fragrance', 'Citrus and cedar'),
    ('Ingredients', 'Plant based'),
    ('Author', 'A. Rahman'),
    ('Language', 'English'),
    ('Page Count', '320'),
    ('Age Range', '8 years and up'),
    ('Game Type', 'Family strategy'),
    ('Piece Count', '500 pieces'),
    ('Flavor', 'Sea salt'),
    ('Pack Size', 'Pack of 3'),
    ('Country of Origin', 'Pakistan'),
    ('Warranty', '1 year'),
    ('Compatibility', 'Universal'),
    ('Capacity', '2 litres'),
    ('Finish', 'Matte'),
    ('Release Year', '2026'),
    ('Sport', 'Cycling'),
    ('Skill Level', 'Beginner'),
    ('Scent', 'Unscented')
)
INSERT INTO attributes (name)
SELECT name
FROM attribute_seed
ON CONFLICT DO NOTHING;

WITH attribute_seed(name, value) AS (
  VALUES
    ('Color', 'Midnight Black'), ('Size', 'Medium'),
    ('Material', 'Stainless Steel'), ('Weight', '1.2 kg'),
    ('Dimensions', '30 x 20 x 10 cm'), ('Brand', 'Northstar'),
    ('Model', 'Series 4'), ('Storage Capacity', '256 GB'),
    ('Memory', '16 GB'), ('Screen Size', '15.6 inch'),
    ('Resolution', '1920 x 1080'), ('Connectivity', 'Bluetooth 5.3'),
    ('Battery Life', '12 hours'), ('Power', '1200 W'),
    ('Voltage', '220 V'), ('Fabric', '100% cotton'),
    ('Fit', 'Regular'), ('Pattern', 'Solid'),
    ('Care Instructions', 'Machine washable'), ('Shoe Size', 'EU 42'),
    ('Volume', '500 ml'), ('Fragrance', 'Citrus and cedar'),
    ('Ingredients', 'Plant based'), ('Author', 'A. Rahman'),
    ('Language', 'English'), ('Page Count', '320'),
    ('Age Range', '8 years and up'), ('Game Type', 'Family strategy'),
    ('Piece Count', '500 pieces'), ('Flavor', 'Sea salt'),
    ('Pack Size', 'Pack of 3'), ('Country of Origin', 'Pakistan'),
    ('Warranty', '1 year'), ('Compatibility', 'Universal'),
    ('Capacity', '2 litres'), ('Finish', 'Matte'),
    ('Release Year', '2026'), ('Sport', 'Cycling'),
    ('Skill Level', 'Beginner'), ('Scent', 'Unscented')
)
INSERT INTO attribute_values (attribute_id, value)
SELECT a.id, s.value
FROM attribute_seed s
JOIN attributes a ON lower(a.name) = lower(s.name)
ON CONFLICT DO NOTHING;

INSERT INTO category_attributes (category_id, attribute_id, required)
SELECT md5('sql-test-category-' || i)::uuid,
       a.id,
       i % 3 = 0
FROM generate_series(1, 40) AS g(i)
JOIN attributes a
  ON a.name = CASE i
    WHEN 1 THEN 'Color' WHEN 2 THEN 'Size' WHEN 3 THEN 'Material'
    WHEN 4 THEN 'Weight' WHEN 5 THEN 'Dimensions' WHEN 6 THEN 'Brand'
    WHEN 7 THEN 'Model' WHEN 8 THEN 'Storage Capacity' WHEN 9 THEN 'Memory'
    WHEN 10 THEN 'Screen Size' WHEN 11 THEN 'Resolution' WHEN 12 THEN 'Connectivity'
    WHEN 13 THEN 'Battery Life' WHEN 14 THEN 'Power' WHEN 15 THEN 'Voltage'
    WHEN 16 THEN 'Fabric' WHEN 17 THEN 'Fit' WHEN 18 THEN 'Pattern'
    WHEN 19 THEN 'Care Instructions' WHEN 20 THEN 'Shoe Size' WHEN 21 THEN 'Volume'
    WHEN 22 THEN 'Fragrance' WHEN 23 THEN 'Ingredients' WHEN 24 THEN 'Author'
    WHEN 25 THEN 'Language' WHEN 26 THEN 'Page Count' WHEN 27 THEN 'Age Range'
    WHEN 28 THEN 'Game Type' WHEN 29 THEN 'Piece Count' WHEN 30 THEN 'Flavor'
    WHEN 31 THEN 'Pack Size' WHEN 32 THEN 'Country of Origin' WHEN 33 THEN 'Warranty'
    WHEN 34 THEN 'Compatibility' WHEN 35 THEN 'Capacity' WHEN 36 THEN 'Finish'
    WHEN 37 THEN 'Release Year' WHEN 38 THEN 'Sport' WHEN 39 THEN 'Skill Level'
    ELSE 'Scent' END
ON CONFLICT DO NOTHING;

-- Forty products across the child categories.
WITH product_seed(i, name, description) AS (
  VALUES
    (1, 'Northstar Studio Wireless Headphones', 'Over ear headphones with active noise cancellation and a 30 hour battery.'),
    (2, 'Aster 14 Inch Business Laptop', 'Lightweight laptop with a full HD display and all day battery.'),
    (3, 'Harbor 5G Smartphone 256 GB', 'Unlocked smartphone with a bright OLED display and dual camera.'),
    (4, 'Lumen Mirrorless Camera Kit', 'Compact mirrorless camera supplied with a versatile zoom lens.'),
    (5, 'Cedar Nonstick Cookware Set', 'Six piece cookware set with induction compatible bases.'),
    (6, 'Brewwell Programmable Coffee Maker', 'Programmable drip coffee maker with a reusable filter.'),
    (7, 'StackRight Modular Storage Bins', 'Set of three stackable containers for home organization.'),
    (8, 'Solstice Adjustable Desk Lamp', 'Dimmable LED desk lamp with adjustable arm and warm light.'),
    (9, 'Everyday Cotton Crew T Shirt', 'Soft cotton crew neck shirt for everyday wear.'),
    (10, 'Ridge Straight Fit Denim Jeans', 'Mid rise denim jeans with a classic straight fit.'),
    (11, 'Summit Waterproof Trail Jacket', 'Packable shell jacket with sealed seams for wet weather.'),
    (12, 'Wayfarer Leather Walking Shoes', 'Comfortable walking shoes with cushioned insoles.'),
    (13, 'Trailmark Two Person Camping Tent', 'Weather resistant two person tent with quick setup poles.'),
    (14, 'Pulse Adjustable Dumbbell Set', 'Space saving adjustable dumbbells for home workouts.'),
    (15, 'Metro Aluminum Commuter Bicycle', 'Lightweight commuter bicycle with seven speed gearing.'),
    (16, 'FieldPro Training Football', 'Durable match size football for training and recreation.'),
    (17, 'Clearwater Daily Moisturizer', 'Lightweight facial moisturizer for daily use.'),
    (18, 'Root and Bloom Repair Shampoo', 'Gentle shampoo formulated for dry and damaged hair.'),
    (19, 'ColorTheory Neutral Makeup Palette', 'Twelve shade palette with blendable matte and shimmer finishes.'),
    (20, 'Saffron Woods Eau de Parfum', 'Warm woody fragrance in a 50 ml glass bottle.'),
    (21, 'The Mapmakers of Lahore', 'A contemporary literary novel set across two generations.'),
    (22, 'Practical PostgreSQL for Teams', 'Hands on guide to relational database design and SQL.'),
    (23, 'Gridline Hardcover Notebook', 'Lay flat notebook with 200 ruled pages.'),
    (24, 'FinePoint Gel Pen Set', 'Set of five smooth writing pens with archival ink.'),
    (25, 'BuildWorks Creative Brick Set', 'Open ended construction set with 420 colorful pieces.'),
    (26, 'Crossroads Family Board Game', 'Strategy board game for two to five players.'),
    (27, 'World Atlas 500 Piece Puzzle', 'Illustrated jigsaw puzzle made from recycled board.'),
    (28, 'Skybound Foam Glider Pack', 'Two lightweight foam gliders for outdoor play.'),
    (29, 'Karakoram Breakfast Tea', 'Loose leaf black tea sourced from northern Pakistan.'),
    (30, 'Sea Salt Lentil Crisps', 'Oven baked lentil snacks with a light sea salt seasoning.'),
    (31, 'Stoneground Whole Wheat Flour', 'Whole wheat flour milled in small batches.'),
    (32, 'Morning Oat and Honey Granola', 'Toasted oats with honey, seeds, and dried fruit.'),
    (33, 'Studio USB C Docking Station', 'Multiport dock with HDMI, USB, and power delivery.'),
    (34, 'Terra Ceramic Serving Bowl', 'Hand finished ceramic bowl for everyday serving.'),
    (35, 'Willow Relaxed Fit Cardigan', 'Soft knit cardigan with front pockets.'),
    (36, 'Meridian Insulated Water Bottle', 'Double wall bottle that keeps drinks cold for 24 hours.'),
    (37, 'PureKind Mineral Sunscreen SPF 50', 'Broad spectrum mineral sunscreen for daily wear.'),
    (38, 'Canvas Weekender Travel Bag', 'Durable carry on bag with a padded shoulder strap.'),
    (39, 'Junior Explorer Science Kit', 'Beginner friendly experiments with illustrated instructions.'),
    (40, 'Pantry Select Extra Virgin Olive Oil', 'Cold extracted olive oil in a dark glass bottle.')
)
INSERT INTO products (id, category_id, name, description)
SELECT md5('sql-test-product-' || i)::uuid,
       md5('sql-test-category-' || (9 + ((i - 1) % 32)))::uuid,
       name,
       description
FROM product_seed
ON CONFLICT (id) DO NOTHING;

-- One purchasable variant for each sample product.
INSERT INTO variants (id, product_id, sku, price, stock)
SELECT md5('sql-test-variant-' || i)::uuid,
       md5('sql-test-product-' || i)::uuid,
       format('SHOP-%s', lpad((10000 + i)::text, 5, '0')),
       (12.50 + i * 3.75)::numeric(10,2),
       8 + ((i * 7) % 75)
FROM generate_series(1, 40) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO variant_attribute_values (variant_id, attribute_id, attribute_value_id)
SELECT md5('sql-test-variant-' || i)::uuid,
       a.id,
       av.id
FROM generate_series(1, 40) AS g(i)
JOIN attributes a
  ON a.name = CASE i
    WHEN 1 THEN 'Color' WHEN 2 THEN 'Size' WHEN 3 THEN 'Material'
    WHEN 4 THEN 'Weight' WHEN 5 THEN 'Dimensions' WHEN 6 THEN 'Brand'
    WHEN 7 THEN 'Model' WHEN 8 THEN 'Storage Capacity' WHEN 9 THEN 'Memory'
    WHEN 10 THEN 'Screen Size' WHEN 11 THEN 'Resolution' WHEN 12 THEN 'Connectivity'
    WHEN 13 THEN 'Battery Life' WHEN 14 THEN 'Power' WHEN 15 THEN 'Voltage'
    WHEN 16 THEN 'Fabric' WHEN 17 THEN 'Fit' WHEN 18 THEN 'Pattern'
    WHEN 19 THEN 'Care Instructions' WHEN 20 THEN 'Shoe Size' WHEN 21 THEN 'Volume'
    WHEN 22 THEN 'Fragrance' WHEN 23 THEN 'Ingredients' WHEN 24 THEN 'Author'
    WHEN 25 THEN 'Language' WHEN 26 THEN 'Page Count' WHEN 27 THEN 'Age Range'
    WHEN 28 THEN 'Game Type' WHEN 29 THEN 'Piece Count' WHEN 30 THEN 'Flavor'
    WHEN 31 THEN 'Pack Size' WHEN 32 THEN 'Country of Origin' WHEN 33 THEN 'Warranty'
    WHEN 34 THEN 'Compatibility' WHEN 35 THEN 'Capacity' WHEN 36 THEN 'Finish'
    WHEN 37 THEN 'Release Year' WHEN 38 THEN 'Sport' WHEN 39 THEN 'Skill Level'
    ELSE 'Scent' END
JOIN attribute_values av
  ON av.attribute_id = a.id
 AND av.value = CASE a.name
    WHEN 'Color' THEN 'Midnight Black' WHEN 'Size' THEN 'Medium'
    WHEN 'Material' THEN 'Stainless Steel' WHEN 'Weight' THEN '1.2 kg'
    WHEN 'Dimensions' THEN '30 x 20 x 10 cm' WHEN 'Brand' THEN 'Northstar'
    WHEN 'Model' THEN 'Series 4' WHEN 'Storage Capacity' THEN '256 GB'
    WHEN 'Memory' THEN '16 GB' WHEN 'Screen Size' THEN '15.6 inch'
    WHEN 'Resolution' THEN '1920 x 1080' WHEN 'Connectivity' THEN 'Bluetooth 5.3'
    WHEN 'Battery Life' THEN '12 hours' WHEN 'Power' THEN '1200 W'
    WHEN 'Voltage' THEN '220 V' WHEN 'Fabric' THEN '100% cotton'
    WHEN 'Fit' THEN 'Regular' WHEN 'Pattern' THEN 'Solid'
    WHEN 'Care Instructions' THEN 'Machine washable' WHEN 'Shoe Size' THEN 'EU 42'
    WHEN 'Volume' THEN '500 ml' WHEN 'Fragrance' THEN 'Citrus and cedar'
    WHEN 'Ingredients' THEN 'Plant based' WHEN 'Author' THEN 'A. Rahman'
    WHEN 'Language' THEN 'English' WHEN 'Page Count' THEN '320'
    WHEN 'Age Range' THEN '8 years and up' WHEN 'Game Type' THEN 'Family strategy'
    WHEN 'Piece Count' THEN '500 pieces' WHEN 'Flavor' THEN 'Sea salt'
    WHEN 'Pack Size' THEN 'Pack of 3' WHEN 'Country of Origin' THEN 'Pakistan'
    WHEN 'Warranty' THEN '1 year' WHEN 'Compatibility' THEN 'Universal'
    WHEN 'Capacity' THEN '2 litres' WHEN 'Finish' THEN 'Matte'
    WHEN 'Release Year' THEN '2026' WHEN 'Sport' THEN 'Cycling'
    WHEN 'Skill Level' THEN 'Beginner' ELSE 'Unscented' END
ON CONFLICT DO NOTHING;

-- Customers, carts, and cart lines.
WITH first_names AS (
  SELECT ARRAY['Ayesha','Hamza','Fatima','Ali','Sara','Usman','Zara','Omar',
               'Mariam','Bilal','Noor','Ahmed','Hira','Daniyal','Sana','Rayan'] AS items
),
last_names AS (
  SELECT ARRAY['Khan','Malik','Ahmed','Hussain','Sheikh','Raza','Iqbal','Qureshi'] AS items
), cities AS (
  SELECT ARRAY['Lahore','Karachi','Islamabad','Rawalpindi','Peshawar','Faisalabad','Multan','Quetta'] AS items
)
INSERT INTO customers (id, name, email, delivery_address)
SELECT md5('sql-test-customer-' || i)::uuid,
       format('%s %s', first_names.items[((i - 1) % 16) + 1], last_names.items[((i - 1) % 8) + 1]),
       format('shopper%s@sqltest.example', lpad(i::text, 3, '0')),
       format('%s, Street %s, %s, Pakistan', first_names.items[((i - 1) % 16) + 1], i, cities.items[((i - 1) % 8) + 1])
FROM generate_series(1, 40) AS g(i)
CROSS JOIN first_names
CROSS JOIN last_names
CROSS JOIN cities
ON CONFLICT DO NOTHING;

INSERT INTO carts (id, customer_id, status)
SELECT md5('sql-test-cart-' || i)::uuid,
       md5('sql-test-customer-' || i)::uuid,
       'converted'
FROM generate_series(1, 40) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO cart_products (cart_id, variant_id, quantity)
SELECT md5('sql-test-cart-' || i)::uuid,
       md5('sql-test-variant-' || i)::uuid,
       1 + ((i - 1) % 5)
FROM generate_series(1, 40) AS g(i)
ON CONFLICT DO NOTHING;

-- Completed orders and their immutable price snapshots (stored in minor units).
INSERT INTO orders (id, customer_id, cart_id, status, total_amount)
SELECT md5('sql-test-order-' || i)::uuid,
       md5('sql-test-customer-' || i)::uuid,
       md5('sql-test-cart-' || i)::uuid,
       CASE WHEN i % 10 = 0 THEN 'completed'::order_status ELSE 'pending'::order_status END,
       round((12.50 + i * 3.75) * 100)::bigint * (1 + ((i - 1) % 5))
FROM generate_series(1, 40) AS g(i)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, variant_id, quantity, unit_price, discount_amount)
SELECT md5('sql-test-order-item-' || i)::uuid,
       md5('sql-test-order-' || i)::uuid,
       md5('sql-test-variant-' || i)::uuid,
       1 + ((i - 1) % 5),
       round((12.50 + i * 3.75) * 100)::bigint,
       CASE WHEN i % 4 = 0 THEN 100 ELSE 0 END
FROM generate_series(1, 40) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO payments (id, order_id, payment_method, payment_status, amount, currency, paid_at)
SELECT md5('sql-test-payment-' || i)::uuid,
       md5('sql-test-order-' || i)::uuid,
       CASE WHEN i % 3 = 0 THEN 'card'::payment_method ELSE 'cod'::payment_method END,
       'paid'::payment_status,
       round((12.50 + i * 3.75) * 100)::bigint * (1 + ((i - 1) % 5)),
       'PKR',
       CURRENT_TIMESTAMP - (i || ' days')::interval
FROM generate_series(1, 40) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO stripe_events (id, type, processed_at)
SELECT format('evt_sql_test_%s', lpad(i::text, 3, '0')),
       CASE WHEN i % 2 = 0 THEN 'checkout.session.completed' ELSE 'payment_intent.succeeded' END,
       CURRENT_TIMESTAMP - (i || ' hours')::interval
FROM generate_series(1, 40) AS g(i)
ON CONFLICT (id) DO NOTHING;

-- Storefront regions.
WITH region_seed(i, name) AS (
  VALUES
    (1,'Lahore'),(2,'Karachi'),(3,'Islamabad'),(4,'Rawalpindi'),(5,'Peshawar'),
    (6,'Faisalabad'),(7,'Multan'),(8,'Quetta'),(9,'Sialkot'),(10,'Gujranwala'),
    (11,'Hyderabad'),(12,'Sukkur'),(13,'Bahawalpur'),(14,'Sargodha'),(15,'Abbottabad'),
    (16,'Mardan'),(17,'Gujrat'),(18,'Sheikhupura'),(19,'Sahiwal'),(20,'Jhelum'),
    (21,'Kasur'),(22,'Okara'),(23,'Rahim Yar Khan'),(24,'Dera Ghazi Khan'),(25,'Nawabshah'),
    (26,'Larkana'),(27,'Mirpur Khas'),(28,'Charsadda'),(29,'Swat'),(30,'Mansehra'),
    (31,'Attock'),(32,'Chiniot'),(33,'Kohat'),(34,'Bannu'),(35,'Gwadar'),
    (36,'Turbat'),(37,'Muzaffarabad'),(38,'Gilgit'),(39,'Skardu'),(40,'Hafizabad')
)
INSERT INTO regions (id, name, code)
SELECT md5('sql-test-region-' || i)::uuid,
       name,
       format('PK-%s', lpad(i::text, 3, '0'))
FROM region_seed
ON CONFLICT DO NOTHING;

-- Promotions and time-bounded campaigns.
INSERT INTO promotions (name, description, promotion_type, status, discount_type, discount_value)
SELECT format('Store Promotion %s', lpad(i::text, 3, '0')),
       CASE WHEN i % 2 = 0 THEN 'Percentage discount for eligible products.' ELSE 'Fixed amount discount for eligible products.' END,
       'price_discount',
       'active',
       CASE WHEN i % 2 = 0 THEN 'percentage' ELSE 'fixed' END,
       CASE WHEN i % 2 = 0 THEN 10 + (i % 26) ELSE 250 + (i * 25) END
FROM generate_series(1, 40) AS g(i)
WHERE NOT EXISTS (
  SELECT 1 FROM promotions p
  WHERE p.name = format('Store Promotion %s', lpad(i::text, 3, '0'))
);

INSERT INTO campaigns (name, description, start_date, end_date, status)
SELECT format('Seasonal Sale %s', lpad(i::text, 3, '0')),
       'Regional seasonal offer for the selected catalog scope.',
       CURRENT_TIMESTAMP - interval '7 days',
       CURRENT_TIMESTAMP + interval '30 days',
       'active'
FROM generate_series(1, 40) AS g(i)
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.name = format('Seasonal Sale %s', lpad(i::text, 3, '0'))
);

-- Forty applications at each scope: global, category, product, and variant.
INSERT INTO campaign_applications (
  campaign_id, promotion_id, region_id, scope,
  category_id, product_id, variant_id
)
SELECT c.id,
       p.id,
       md5('sql-test-region-' || i)::uuid,
       s.scope,
       CASE WHEN s.scope = 'category' THEN md5('sql-test-category-' || (9 + ((i - 1) % 32)))::uuid END,
       CASE WHEN s.scope = 'product' THEN md5('sql-test-product-' || i)::uuid END,
       CASE WHEN s.scope = 'variant' THEN md5('sql-test-variant-' || i)::uuid END
FROM generate_series(1, 40) AS g(i)
CROSS JOIN (VALUES
  ('global'::campaign_scope),
  ('category'::campaign_scope),
  ('product'::campaign_scope),
  ('variant'::campaign_scope)
) AS s(scope)
JOIN campaigns c ON c.name = format('Seasonal Sale %s', lpad(i::text, 3, '0'))
JOIN promotions p ON p.name = format('Store Promotion %s', lpad(i::text, 3, '0'))
ON CONFLICT DO NOTHING;

-- One currently selected variant promotion per sample variant and region.
INSERT INTO variant_current_promotions (variant_id, region_id, campaign_application_id)
SELECT ca.variant_id,
       ca.region_id,
       ca.id
FROM campaign_applications ca
WHERE ca.scope = 'variant'
  AND ca.variant_id IN (
    SELECT md5('sql-test-variant-' || i)::uuid
    FROM generate_series(1, 40) AS g(i)
  )
ON CONFLICT DO NOTHING;

COMMIT;
