import type { Boss } from '../../schema';

export const pyBoss: Boss = {
  id: 'py-boss',
  title: 'Ship a tiny order-report script',
  steps: [
    {
      kind: 'choice', id: 'py-boss-1', conceptId: 'py-fstrings',
      prompt: "The report must print totals like 1,398.00. Which line formats paise = 139800 correctly?",
      options: ["print(f'{paise / 100:,.2f}')", "print(paise / 100)", "print(f'{paise:,}')", "print(round(paise, 2))"],
      answer: 0,
      explain: 'Divide by 100, then :,.2f adds separators and two decimals.',
    },
    {
      kind: 'order', id: 'py-boss-2', conceptId: 'py-running',
      prompt: 'Order the steps to run the script safely in a fresh project.',
      items: ['python -m venv .venv', 'Activate the virtual environment', 'pip install -r requirements.txt', 'python report.py orders.csv'],
      explain: 'Isolate, activate, install, run.',
    },
    {
      kind: 'fill', id: 'py-boss-3', conceptId: 'py-none',
      prompt: 'A lookup returns None when an order is missing. Complete the check: if order ___ None: print("not found")',
      answers: ['is'],
      explain: 'Compare with None using is.',
    },
  ],
};
