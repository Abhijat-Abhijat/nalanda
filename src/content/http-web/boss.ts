import type { Boss } from '../../schema';

export const httpWebBoss: Boss = {
  id: 'http-boss',
  title: 'Repair the request flow',
  steps: [
    {
      kind: 'http-builder', id: 'http-boss-1', conceptId: 'methods',
      prompt: 'This request tries to save a note, but it is wrong. Make it a POST and tell the server the body is JSON.',
      starter: { method: 'GET', url: 'https://api.example.com/notes', headers: {}, body: '{"title":"hi"}' },
      rules: [{ type: 'method', equals: 'POST' }, { type: 'header', name: 'Content-Type', equals: 'application/json' }],
      solution: { method: 'POST', url: 'https://api.example.com/notes', headers: { 'Content-Type': 'application/json' }, body: '{"title":"hi"}' },
      hint: 'Change the method to POST and add the header Content-Type: application/json.',
    },
    {
      kind: 'http-builder', id: 'http-boss-2', conceptId: 'headers',
      prompt: 'The server answers 401 because you did not say who you are. Send the header Authorization with the value Bearer token123.',
      starter: { method: 'GET', url: 'https://api.example.com/me', headers: {}, body: '' },
      rules: [{ type: 'header', name: 'Authorization', equals: 'Bearer token123' }],
      solution: { method: 'GET', url: 'https://api.example.com/me', headers: { Authorization: 'Bearer token123' }, body: '' },
      hint: 'Add the line Authorization: Bearer token123 to the headers.',
    },
    {
      kind: 'http-builder', id: 'http-boss-3', conceptId: 'caching',
      prompt: 'Ask for data.json only if it changed since version "v7", and say you want JSON back.',
      starter: { method: 'GET', url: 'https://example.com/data.json', headers: {}, body: '' },
      rules: [{ type: 'header', name: 'If-None-Match', equals: '"v7"' }, { type: 'header', name: 'Accept', equals: 'application/json' }],
      solution: { method: 'GET', url: 'https://example.com/data.json', headers: { 'If-None-Match': '"v7"', Accept: 'application/json' }, body: '' },
      hint: 'You need two headers: If-None-Match: "v7" and Accept: application/json.',
    },
  ],
};
