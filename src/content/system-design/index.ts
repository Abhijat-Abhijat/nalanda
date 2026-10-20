import type { World } from '../../schema';
import { sdApproach } from './approach';
import { sdBlocks } from './blocks';
import { sdStorage } from './storage';
import { sdDistributed } from './distributed';
import { sdAsync } from './async';
import { sdCaseStorage } from './case-storage';
import { sdCaseSocial } from './case-social';
import { sdCaseGeo } from './case-geo';
import { sdCaseSearch } from './case-search';
import { sdCasePayments } from './case-payments';
import { sdBoss } from './boss';

export const sdWorld: World = {
  id: 'system-design',
  title: 'System Design',
  hue: '#5B6CC2',
  tagline: 'Design systems that serve millions: the building blocks, the trade-offs, and the classic case studies',
  intro: [
    { t: 'text', md: "System design is the skill of turning a vague goal (\"let people share photos\") into an architecture that meets real numbers for users, latency, availability, and cost. It is also the most common senior-level interview.\n\nThis world starts with the method: requirements, estimates, APIs, data models, and trade-offs. It then covers the building blocks (DNS, load balancers, gateways, queues, object storage, search), data storage choices and consistency, distributed-systems fundamentals such as consensus, quorums, and unique ids, and asynchronous patterns such as outboxes and sagas. The second half works through classic designs: URL shorteners and file sync, news feeds and chat, location-based services, search and autocomplete, and payments. The exercises implement the core algorithm of each one." },
  ],
  chapters: [sdApproach, sdBlocks, sdStorage, sdDistributed, sdAsync, sdCaseStorage, sdCaseSocial, sdCaseGeo, sdCaseSearch, sdCasePayments],
  boss: sdBoss,
};
