import type { World } from '../../schema';
import { pyBasics } from './basics';
import { pyControlFlow } from './control-flow';
import { pyCollections } from './collections';
import { pyFunctions } from './functions';
import { pyOop } from './oop';
import { pyErrorsFiles } from './errors-files';
import { pyModulesEnv } from './modules-env';
import { pyConcurrency } from './concurrency';
import { pyWeb } from './web';
import { pyPro } from './pro';
import { pyBoss } from './boss';

export const pyWorld: World = {
  id: 'python',
  title: 'Python',
  hue: '#2F6F9F',
  tagline: 'Readable code for scripts, servers, data, and AI',
  intro: [
    { t: 'text', md: "In 1989 a Dutch programmer spent his Christmas break writing a language he hoped would be fun and easy to read. Python is now one of the most used languages in the world, from school classrooms to the systems that train AI models.\n\nThis world is a complete Python course: the language from variables to classes, collections and functions, errors and files, modules and environments, concurrency with threads and asyncio, web APIs with FastAPI, and the professional toolkit of testing, typing, and profiling. Code runs in Python, so exercises here ask you to predict output, order steps, and fill in the key piece, the same skills interviewers test." },
  ],
  chapters: [pyBasics, pyControlFlow, pyCollections, pyFunctions, pyOop, pyErrorsFiles, pyModulesEnv, pyConcurrency, pyWeb, pyPro],
  boss: pyBoss,
};
