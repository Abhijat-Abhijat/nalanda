import type { World } from '../../schema';
import { jsBasics } from './basics';
import { jsControlFlow } from './control-flow';
import { jsFunctions } from './functions';
import { jsArrays } from './arrays';
import { jsObjects } from './objects';
import { jsStringsNumbers } from './strings-numbers';
import { jsOop } from './oop';
import { jsAsync } from './async';
import { jsDom } from './dom';
import { jsBrowserApis } from './browser-apis';
import { jsModulesTooling } from './modules-tooling';
import { jsNode } from './node';
import { tsBasics } from './ts-basics';
import { tsAdvanced } from './ts-advanced';
import { jsTesting } from './testing';
import { jsPatterns } from './patterns';
import { jsInterview } from './interview';
import { jsBoss } from './boss';

export const jsWorld: World = {
  id: 'javascript',
  title: 'JavaScript & TypeScript',
  hue: '#C98A00',
  tagline: 'The language every browser speaks, and its typed big sibling',
  intro: [
    { t: 'text', md: "In 1995 a programmer at Netscape had about ten days to give web pages a scripting language. Thirty years later that rushed little language runs in every browser, on servers, in phones, and in the tools that build the rest of the web.\n\nThis world is a complete JavaScript and TypeScript course: the language from variables to closures, arrays, objects, classes, and async code; the browser's DOM and APIs; modules, tooling, and Node.js; TypeScript from basic types to generics; testing; patterns for clean, fast, and secure code; and the problems interviewers love. Every lesson has runnable examples, reference tables, and interview questions, and you practise by writing real functions." },
  ],
  chapters: [jsBasics, jsControlFlow, jsFunctions, jsArrays, jsObjects, jsStringsNumbers, jsOop, jsAsync, jsDom, jsBrowserApis, jsModulesTooling, jsNode, tsBasics, tsAdvanced, jsTesting, jsPatterns, jsInterview],
  boss: jsBoss,
};
