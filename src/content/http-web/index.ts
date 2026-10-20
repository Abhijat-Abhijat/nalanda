import type { World } from '../../schema';
import { httpWebCh1 } from './ch1';
import { httpWebCh2 } from './ch2';
import { httpWebCh3 } from './ch3';
import { httpWebCh4 } from './ch4';
import { httpWebCh5 } from './ch5';
import { httpWebCh6 } from './ch6';
import { httpWebCh7 } from './ch7';
import { httpWebCh8 } from './ch8';
import { httpWebBoss } from './boss';

export const httpWebWorld: World = {
  id: 'http-web',
  title: 'HTTP and Web',
  hue: '#F0554D',
  tagline: 'How computers on the other side of the planet talk to you',
  intro: [
    { t: 'text', md: 'Every time you open a page, two computers have a short, polite conversation. One asks, the other answers. That conversation has a name, **HTTP**, and a history that begins at a physics lab in 1989.\n\nThis world is a complete course on how the web works: URLs, DNS, and TCP; HTTP messages, methods, and status codes; cookies, tokens, OAuth, TLS, and CORS; API design; caching and performance; the browser platform; and web security. You practise by building real requests and writing small functions.' },
  ],
  chapters: [httpWebCh1, httpWebCh2, httpWebCh3, httpWebCh4, httpWebCh5, httpWebCh6, httpWebCh7, httpWebCh8],
  boss: httpWebBoss,
};
