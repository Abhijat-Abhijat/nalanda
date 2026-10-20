import type { Boss } from '../../schema';

export const sqlBoss: Boss = {
  id: 'sql-boss',
  title: 'The report that lies',
  steps: [
    {
      kind: 'sql-query', id: 'sql-boss-1', conceptId: 'group-by', dbId: 'shop', starter: '', ordered: false,
      prompt: 'Revenue per category (quantity times price), one row per category.',
      solution: 'SELECT p.category, SUM(o.qty * p.price) FROM orders o JOIN products p ON p.id = o.product_id GROUP BY p.category',
      hint: 'Join orders to products, multiply qty by price, and GROUP BY category.',
    },
    {
      kind: 'sql-query', id: 'sql-boss-2', conceptId: 'inner-join', dbId: 'shop', starter: '', ordered: false,
      prompt: 'Which customers never placed an order? (names only)',
      solution: 'SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL',
      hint: 'A LEFT JOIN keeps every customer. Customers with no orders have NULL in the orders columns.',
    },
    {
      kind: 'sql-query', id: 'sql-boss-3', conceptId: 'null-semantics', dbId: 'shop', starter: '', ordered: false,
      prompt: 'How many products have a listed price?',
      solution: 'SELECT COUNT(price) FROM products',
      hint: 'COUNT(*) counts rows, COUNT(column) skips NULL.',
    },
    {
      kind: 'sql-query', id: 'sql-boss-4', conceptId: 'cte', dbId: 'shop', starter: '', ordered: true,
      prompt: 'Rank customers by total spent (qty times price), highest first: name and total. Customers with no orders are left out.',
      solution: 'WITH spend AS (SELECT o.customer_id, SUM(o.qty * p.price) AS total FROM orders o JOIN products p ON p.id = o.product_id GROUP BY o.customer_id) SELECT c.name, s.total FROM spend s JOIN customers c ON c.id = s.customer_id ORDER BY s.total DESC',
      hint: 'Total per customer in a CTE, join to customers for the name, ORDER BY total DESC.',
    },
    {
      kind: 'sql-query', id: 'sql-boss-5', conceptId: 'partition-by', dbId: 'shop', starter: '', ordered: false,
      prompt: "Each customer's most recent order: customer name and the date.",
      solution: 'SELECT c.name, t.ordered_on FROM (SELECT customer_id, ordered_on, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_on DESC) AS rn FROM orders) t JOIN customers c ON c.id = t.customer_id WHERE t.rn = 1',
      hint: 'ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_on DESC), keep rn = 1. MAX(ordered_on) with GROUP BY also works.',
    },
  ],
};
