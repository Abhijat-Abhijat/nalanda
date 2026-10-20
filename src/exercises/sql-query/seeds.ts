export const SHOP_SEED = `
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT, email TEXT);
INSERT INTO customers VALUES
 (1,'Asha','Pune','asha@example.com'),
 (2,'Bilal','Mumbai',NULL),
 (3,'Chitra','Pune','chitra@example.com'),
 (4,'Dev','Delhi','dev@example.com'),
 (5,'Esha','Pune',NULL),
 (6,'Farid','Mumbai','farid@example.com'),
 (7,'Gita','Chennai','gita@example.com'),
 (8,'Hari','Delhi','hari@example.com');

CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL, category TEXT);
INSERT INTO products VALUES
 (1,'Notebook',120,'Stationery'),
 (2,'Pen',20,'Stationery'),
 (3,'Backpack',1500,'Bags'),
 (4,'Lunchbox',450,'Kitchen'),
 (5,'Bottle',350,'Kitchen'),
 (6,'Headphones',2200,'Electronics'),
 (7,'Cable',199,'Electronics'),
 (8,'Gift card',NULL,'Misc');

CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, product_id INTEGER, qty INTEGER, ordered_on TEXT);
INSERT INTO orders VALUES
 (1,1,1,2,'2026-09-01'),(2,1,3,1,'2026-09-03'),(3,2,2,5,'2026-09-04'),(4,3,4,1,'2026-09-06'),
 (5,3,6,1,'2026-09-08'),(6,4,5,2,'2026-09-10'),(7,5,7,3,'2026-09-12'),(8,6,1,1,'2026-09-15'),
 (9,6,2,4,'2026-09-16'),(10,7,3,1,'2026-09-20'),(11,1,7,2,'2026-09-22'),(12,3,2,2,'2026-09-25'),
 (13,6,5,1,'2026-09-27'),(14,2,6,1,'2026-09-28');
`;
