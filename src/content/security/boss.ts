import type { Boss } from '../../schema';

export const secBoss: Boss = {
  id: 'sec-boss',
  title: 'The phished finance team',
  steps: [
    {
      kind: 'choice', id: 'sec-boss-1', conceptId: 'sec-cia',
      prompt: 'Monday 08:40: three people in finance report an email asking them to "re-verify" their accounts on a look-alike login page. One person entered their password. What do you do first?',
      options: ['Reset that user\'s password, revoke their sessions, and check their sign-ins', 'Wait to see if anything bad happens', 'Email the whole company the phishing link so they can look', 'Turn off email for everyone for a week'],
      answer: 0,
      explain: 'Contain the known compromise immediately: reset credentials, revoke sessions and tokens, and review recent sign-ins and mailbox rules.',
    },
    {
      kind: 'js-code', id: 'sec-boss-2', conceptId: 'sec-risk', fnName: 'impossibleTravel',
      prompt: 'Check sign-in logs for "impossible travel". Write impossibleTravel(logins, windowMin) where logins are { user, country, t } (t in minutes, any order). Flag a user who signed in from two different countries less than windowMin minutes apart. Return the flagged users sorted alphabetically.',
      starter: 'function impossibleTravel(logins, windowMin) {\n  // your code\n}',
      cases: [
        { args: [[{ user: 'asha', country: 'GB', t: 0 }, { user: 'asha', country: 'NG', t: 30 }, { user: 'ben', country: 'GB', t: 0 }, { user: 'ben', country: 'FR', t: 600 }, { user: 'chen', country: 'GB', t: 10 }, { user: 'chen', country: 'GB', t: 20 }], 120], expect: ['asha'] },
        { args: [[], 60], expect: [] },
      ],
      solution: 'function impossibleTravel(l,w){const by={},out=new Set();for(const x of [...l].sort((a,b)=>a.t-b.t)){for(const p of by[x.user]??[])if(p.country!==x.country&&x.t-p.t<w)out.add(x.user);(by[x.user]??=[]).push(x)}return[...out].sort()}',
      hint: 'Sort by time and compare each sign-in with the user\'s earlier ones.',
    },
    {
      kind: 'order', id: 'sec-boss-3', conceptId: 'sec-defence-depth',
      prompt: 'Order the response and the follow-up improvements.',
      items: ['Contain: reset credentials and revoke sessions for affected users', 'Investigate: review sign-ins, mailbox rules, and data accessed', 'Eradicate and recover: remove attacker access and restore anything changed', 'Improve: enforce phishing-resistant MFA and report what was learned'],
      explain: 'Contain, investigate, eradicate and recover, then add layers so the next phish fails.',
    },
  ],
};
