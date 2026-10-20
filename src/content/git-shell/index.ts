import type { World } from '../../schema';
import { gitShellCh1 } from './ch1';
import { gitShellCh2 } from './ch2';
import { gitShellCh3 } from './ch3';
import { gitShellCh4 } from './ch4';
import { gitShellCh5 } from './ch5';
import { gitShellCh6 } from './ch6';
import { gitShellCh7 } from './ch7';
import { gitShellCh8 } from './ch8';
import { gitShellCh9 } from './ch9';
import { gitShellBoss } from './boss';

export const gitShellWorld: World = {
  id: 'git-shell',
  title: 'Git and Shell',
  hue: '#1FA463',
  tagline: 'Talk to your computer and keep every version',
  intro: [
    { t: 'text', md: 'Before screens had pictures, people talked to computers by typing. That way of talking, the **shell**, is still the fastest way to do many things, and the only way on most servers.\n\nOnce you can type commands, you can also keep a perfect history of your work with **Git**. This world covers both in depth: files and pipes, permissions, processes and scripts, SSH, then Git from your first commit to branching, collaboration, and how Git works inside.' },
  ],
  chapters: [gitShellCh1, gitShellCh2, gitShellCh3, gitShellCh4, gitShellCh5, gitShellCh6, gitShellCh7, gitShellCh8, gitShellCh9],
  boss: gitShellBoss,
};
