import type { World } from '../../schema';
import { beFundamentals } from './fundamentals';
import { beApiDesign } from './api-design';
import { beBeyondRest } from './beyond-rest';
import { beDataAccess } from './data-access';
import { beAuth } from './auth';
import { beCaching } from './caching';
import { beMessaging } from './messaging';
import { beReliability } from './reliability';
import { beArchitecture } from './architecture';
import { beTesting } from './testing';
import { beSecurity } from './security';
import { beProduction } from './production';
import { beNode } from './node';
import { beDjango } from './django';
import { beBoss } from './boss';

export const beWorld: World = {
  id: 'backend',
  title: 'Backend',
  hue: '#3C8D5A',
  tagline: 'The servers, APIs, and data behind every app',
  intro: [
    { t: 'text', md: "Every tap in an app ends up at a backend: a program that checks who you are, reads and writes data, talks to other services, and answers in milliseconds, for one user or for millions at once on a sale day.\n\nThis world is a complete backend course: how servers handle requests, designing REST, GraphQL, and gRPC APIs, data access and transactions, authentication and authorisation, caching, queues and events, reliability patterns, architecture from monoliths to microservices, testing, security, and running services in production. Examples use Node.js, Python, Go, and SQL, and you practise by writing the core algorithms yourself." },
  ],
  chapters: [beFundamentals, beApiDesign, beBeyondRest, beDataAccess, beAuth, beCaching, beMessaging, beReliability, beArchitecture, beTesting, beSecurity, beProduction, beNode, beDjango],
  boss: beBoss,
};
