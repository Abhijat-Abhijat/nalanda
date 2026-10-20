import type { World } from '../../schema';
import { carCommunication } from './communication';
import { carTeamwork } from './teamwork';
import { carCoding } from './coding';
import { carBeyond } from './beyond';
import { carBoss } from './boss';

export const careerWorld: World = {
  id: 'career',
  title: 'Soft Skills and Interviews',
  hue: '#A0527A',
  tagline: 'Communicate clearly, work well with people, and get through technical interviews with confidence',
  intro: [
    { t: 'text', md: "Technical skill gets you in the room; communication and collaboration decide how far your work goes. The first half of this world covers the people side of engineering: writing clearly, design documents, status updates, presenting, giving and receiving feedback, managing expectations, and working in teams through conflict, mentoring, stakeholders, and remote collaboration.\n\nThe second half prepares you for interviews: how hiring processes work, a framework for coding problems, talking about complexity, the patterns that come up again and again, system design interviews with back-of-the-envelope estimates, behavioural questions answered with STAR, résumés, offers, and planning your growth. The exercises implement the small tools and classic interview problems along the way." },
  ],
  chapters: [carCommunication, carTeamwork, carCoding, carBeyond],
  boss: carBoss,
};
