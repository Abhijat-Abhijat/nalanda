export type OpenPrompt = { id: string; prompt: string; rubric: string[] };

const DESIGN_RUBRIC = [
  'Clarified requirements, scale, and constraints before designing',
  'Proposed a coherent high-level architecture with clear data flow',
  'Went deep on one or two hard parts (storage, consistency, scaling)',
  'Discussed trade-offs, failure modes, and how to monitor it',
];
const BEHAVIOURAL_RUBRIC = [
  'Used a clear structure (situation, task, action, result)',
  "Showed your own actions and decisions, not only the team's",
  'Quantified the result or impact',
  'Reflected on what you learned or would do differently',
];
const design = (id: string, prompt: string): OpenPrompt => ({ id, prompt, rubric: DESIGN_RUBRIC });
const beh = (id: string, prompt: string): OpenPrompt => ({ id, prompt, rubric: BEHAVIOURAL_RUBRIC });

export const PROMPTS = {
  design: [
    design('d-url', 'Design a URL shortener handling 100 million new links per month and 10 billion redirects.'),
    design('d-feed', 'Design the home news feed for a social network with 300 million daily users.'),
    design('d-ratelimit', 'Design a distributed rate limiter for a public API used by 50,000 customers.'),
    design('d-chat', 'Design a one-to-one and group chat service with delivery receipts and offline sync.'),
    design('d-rides', 'Design the matching service for a ride-hailing app in 300 cities.'),
    design('d-files', 'Design a file storage and sync service for 50 million users.'),
    design('d-autocomplete', 'Design search autocomplete that returns suggestions within 50 ms.'),
    design('d-payments', 'Design a payment system that charges cards and never double-charges.'),
    design('d-notify', 'Design a notification system that sends email, SMS, and push to 100 million users.'),
    design('d-docs', 'Design a real-time collaborative document editor.'),
  ],
  behavioural: [
    beh('b-conflict', 'Tell me about a conflict with a colleague and how you resolved it.'),
    beh('b-failure', 'Tell me about a project that failed. What happened and what did you do?'),
    beh('b-influence', 'Describe a time you influenced a decision without formal authority.'),
    beh('b-decision', 'Describe a hard technical decision you made and its trade-offs.'),
    beh('b-mentor', 'Tell me about someone you mentored and how they grew.'),
    beh('b-incident', 'Describe a production incident you led. How did you handle it?'),
    beh('b-disagree', 'Tell me about a time you disagreed with your manager.'),
    beh('b-deadline', 'Describe delivering something important under a tight deadline.'),
    beh('b-feedback', 'Tell me about a time feedback changed your mind.'),
    beh('b-crossteam', 'Describe a cross-team initiative you drove.'),
    beh('b-process', 'Tell me how you improved a team process.'),
    beh('b-mistake', 'Tell me about a mistake you made and what you changed afterwards.'),
  ],
};
