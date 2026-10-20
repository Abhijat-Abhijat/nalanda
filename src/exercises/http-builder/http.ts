import type { HttpEx, HttpRequest, HttpRule } from '../../schema';

export function parseUrl(u: string): URL | null { try { return new URL(u); } catch { return null; } }

export function formatRequest(r: HttpRequest): string {
  const url = parseUrl(r.url);
  if (!url) return `Invalid URL: ${r.url}`;
  const lines = [`${r.method.toUpperCase()} ${url.pathname}${url.search} HTTP/1.1`, `Host: ${url.host}`];
  for (const [k, v] of Object.entries(r.headers)) lines.push(`${k}: ${v}`);
  return `${lines.join('\n')}\n\n${r.body}`;
}

function holds(rule: HttpRule, r: HttpRequest): boolean {
  const url = parseUrl(r.url);
  switch (rule.type) {
    case 'method': return r.method.toLowerCase() === rule.equals.toLowerCase();
    case 'host': return !!url && url.host === rule.equals;
    case 'path': return !!url && url.pathname === rule.equals;
    case 'query': return !!url && url.searchParams.get(rule.key) === rule.equals;
    case 'header': {
      const found = Object.entries(r.headers).find(([k]) => k.toLowerCase() === rule.name.toLowerCase());
      return !!found && (rule.equals === undefined || found[1] === rule.equals);
    }
    case 'json': {
      try {
        const data = JSON.parse(r.body) as Record<string, unknown>;
        return JSON.stringify(data[rule.key]) === JSON.stringify(rule.equals);
      } catch { return false; }
    }
  }
}

export function evaluateRules(rules: HttpRule[], r: HttpRequest) {
  const failed = rules.filter((x) => !holds(x, r));
  return { passed: failed.length === 0, failed };
}

export const checkHttp = (ex: HttpEx, r: HttpRequest) => evaluateRules(ex.rules, r);

export function describeRule(rule: HttpRule): string {
  switch (rule.type) {
    case 'method': return `Use the ${rule.equals.toUpperCase()} method.`;
    case 'host': return `Send the request to the host ${rule.equals}.`;
    case 'path': return `Use the path ${rule.equals}.`;
    case 'query': return `Set the query parameter ${rule.key} to ${rule.equals}.`;
    case 'header': return rule.equals === undefined ? `Send the header ${rule.name}.` : `Send the header ${rule.name} with the value ${rule.equals}.`;
    case 'json': return `Send a JSON body where ${rule.key} is ${JSON.stringify(rule.equals)}.`;
  }
}
