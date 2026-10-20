import type { World } from '../../schema';
import { engCode } from './code';
import { engReview } from './review';
import { engDebug } from './debugging';
import { engDesign } from './design';
import { engAgents } from './agents';
import { engCodebases } from './codebases';
import { engAgile } from './agile';
import { engBoss } from './boss';

export const engWorld: World = {
  id: 'engineering',
  title: 'Engineering Practice',
  hue: '#8A5A44',
  tagline: 'The habits of engineers whose code others trust: readable code, reviews, debugging, design, and working well with coding agents',
  intro: [
    { t: 'text', md: "Knowing a language is the start; working on a real codebase with other people is the job. This world covers the everyday practice of software engineering: writing code others can read and change, refactoring safely, reviewing and being reviewed, writing useful commits, debugging methodically, making design decisions and recording them, and working on large and legacy codebases.\n\nIt also goes deeper on working with AI coding agents than the AI Engineer world does: giving agents the right context, breaking work into agent-sized tasks, building verification loops so agents check their own work, running agents in parallel, and automating the workflow around them. The exercises implement small tools behind these practices, from naming converters to bisection and review checklists." },
  ],
  chapters: [engCode, engReview, engDebug, engDesign, engAgents, engCodebases, engAgile],
  boss: engBoss,
};
