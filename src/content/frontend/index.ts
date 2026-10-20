import type { World } from '../../schema';
import { feHtmlCss } from './html-css';
import { feCssLayout } from './css-layout';
import { feCssScale } from './css-scale';
import { feReactBasics } from './react-basics';
import { feReactHooks } from './react-hooks';
import { feReactPatterns } from './react-patterns';
import { feStateData } from './state-data';
import { feNextjs } from './nextjs';
import { feVueNuxt } from './vue-nuxt';
import { feReactNative } from './react-native';
import { feA11y } from './a11y';
import { fePerf } from './perf';
import { feSecurity } from './security';
import { feArchitecture } from './architecture';
import { feInterview } from './interview';
import { feTailwind } from './tailwind';
import { feElectron } from './electron';
import { feReactNativeProd } from './react-native-prod';
import { feBoss } from './boss';

export const feWorld: World = {
  id: 'frontend',
  title: 'Frontend',
  hue: '#D9534F',
  tagline: 'From HTML and CSS to React, Next.js, Vue, and mobile apps',
  intro: [
    { t: 'text', md: "The first web page in 1991 was plain text with links. Today the front end is where users meet every product: shops, banks, maps, and AI assistants all live in a browser tab or a phone app.\n\nThis world is a complete frontend course: semantic HTML and modern CSS, layout and design systems, React from components to hooks and patterns, state and data fetching, Next.js and server components, Vue and Nuxt, React Native for mobile, accessibility, performance, security, architecture at scale, and the machine-coding and design rounds of frontend interviews." },
  ],
  chapters: [feHtmlCss, feCssLayout, feCssScale, feReactBasics, feReactHooks, feReactPatterns, feStateData, feNextjs, feVueNuxt, feReactNative, feA11y, fePerf, feSecurity, feArchitecture, feInterview, feTailwind, feElectron, feReactNativeProd],
  boss: feBoss,
};
