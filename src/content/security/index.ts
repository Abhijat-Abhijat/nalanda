import type { World } from '../../schema';
import { secFoundations } from './foundations';
import { secCrypto } from './crypto';
import { secAuth } from './auth';
import { secWeb } from './web';
import { secNetwork } from './network';
import { secSdlc } from './sdlc';
import { secCloud } from './cloud';
import { secDetection } from './detection';
import { secIncident } from './incident';
import { secThreats } from './threats';
import { secPrivacy } from './privacy';
import { secLabs } from './labs';
import { secReverse } from './reverse-engineering';
import { secBoss } from './boss';

export const secWorld: World = {
  id: 'security',
  title: 'Cybersecurity',
  hue: '#B23A48',
  tagline: 'Defend systems and data: threats, cryptography, secure code, detection, and incident response',
  intro: [
    { t: 'text', md: "This world teaches security from the defender's side. It covers the foundations (the CIA triad, threat modelling, risk, least privilege), cryptography and authentication, how common web vulnerabilities work and how to prevent them, network and cloud defences, secure development practices, detection and monitoring, incident response, the threats organisations face, and privacy and compliance.\n\n**Everything here is for defending systems you own or are authorised to test.** Testing anyone else's systems without written permission is illegal in most countries. Where lessons explain how an attack works, it is so you can recognise and stop it; the exercises implement protective checks, validators, and detectors, and the final chapter shows how to practise safely in your own lab and on platforms built for learning." },
  ],
  chapters: [secFoundations, secCrypto, secAuth, secWeb, secNetwork, secSdlc, secCloud, secDetection, secIncident, secThreats, secPrivacy, secLabs, secReverse],
  boss: secBoss,
};
