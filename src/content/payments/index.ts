import type { World } from '../../schema';
import { pmFundamentals } from './fundamentals';
import { pmStripe } from './stripe';
import { pmIndia } from './india';
import { pmIap } from './iap';
import { pmMessaging } from './messaging';
import { pmOperations } from './operations';
import { pmBoss } from './boss';

export const pmWorld: World = {
  id: 'payments',
  title: 'Payments and Messaging',
  hue: '#2F7D5B',
  tagline: 'Card payments, Stripe, UPI, in-app purchases, WhatsApp, and operating money flows safely',
  intro: [
    { t: 'text', md: "This world covers the systems that move money and messages in real products: payment fundamentals (authorisation, capture, refunds, disputes, idempotency, PCI scope), Stripe in depth, Indian payments (UPI, payment gateways, mandates, card tokenisation), in-app purchases on the App Store and Google Play with RevenueCat, the WhatsApp Business Platform and other messaging channels, and the operations behind them: ledgers, reconciliation, fraud, dunning, and observability.\n\nPayment and messaging rules change often and differ by country. Every lesson dates its facts and cites official documentation from the provider or regulator; always confirm current values in those sources before building. Exercises model the underlying mechanics (state machines, idempotency, signatures, reconciliation) rather than any one vendor's SDK.\n\nNothing here is financial, legal, or compliance advice. Use it to ask better questions of your payment provider, your compliance team, and the official documentation." },
  ],
  chapters: [pmFundamentals, pmStripe, pmIndia, pmIap, pmMessaging, pmOperations],
  boss: pmBoss,
};
