import type { World } from '../../schema';
import { sqlCh1 } from './ch1';
import { sqlCh2 } from './ch2';
import { sqlCh3 } from './ch3';
import { sqlCh4 } from './ch4';
import { sqlCh5 } from './ch5';
import { sqlCh6 } from './ch6';
import { sqlCh7 } from './ch7';
import { sqlBoss } from './boss';

export const sqlWorld: World = {
  id: 'sql',
  title: 'SQL',
  hue: '#1F78D1',
  tagline: 'Ask a database anything, in plain words',
  intro: [
    { t: 'text', md: 'In 1970 a researcher at IBM, Edgar Codd, asked a simple question: why should you need to know **where** your data is stored just to read it? His answer, tables and a way to ask for what you want, became the idea behind almost every database you will meet.\n\nThis world is a complete SQL course, from your first `SELECT` to window functions, transactions, indexes, and SQL injection. Every lesson has the syntax, runnable examples on a small shop database, reference tables, common mistakes, and interview questions.' },
    { t: 'table', head: ['Table', 'Columns'], rows: [
      ['`customers`', 'id, name, city, email'],
      ['`products`', 'id, name, price, category'],
      ['`orders`', 'id, customer_id, product_id, qty, ordered_on'],
    ] },
  ],
  chapters: [sqlCh1, sqlCh2, sqlCh3, sqlCh4, sqlCh5, sqlCh6, sqlCh7],
  boss: sqlBoss,
};
