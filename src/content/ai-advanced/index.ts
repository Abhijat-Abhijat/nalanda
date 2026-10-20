import type { World } from '../../schema';
import { aaPrompting } from './prompting';
import { aaContext } from './context';
import { aaTools } from './tools';
import { aaPatterns } from './patterns';
import { aaFrameworks } from './frameworks';
import { aaMcp } from './mcp';
import { aaUiAgents } from './ui-agents';
import { aaProduction } from './production';
import { aaEvals } from './evals';
import { aaSecurity } from './security';
import { aaLlmops } from './llmops';
import { aaAzure } from './azure';
import { aaStreamlit } from './streamlit';
import { aaBoss } from './boss';

export const aaWorld: World = {
  id: 'ai-advanced',
  title: 'Applied AI and Agents',
  hue: '#3F6E8C',
  tagline: 'Senior-level depth on prompting, context, tools, agents, MCP, evaluation, security, and LLMOps',
  intro: [
    { t: 'text', md: "This world assumes the foundations from the AI Engineer world (how LLMs work, basic prompting, RAG, and agents) and goes to the depth a senior engineer needs to build, run, and defend AI systems in production. Every lesson has three layers: a mental model of how the mechanism works, a deep dive into its internals, trade-offs, and failure modes, and a production layer with numbers, what to observe, security notes, a checklist, interview questions, and primary sources.\n\nTopics: prompting in depth, context engineering, structured output and tool calling, agent workflow patterns, agent frameworks, the Model Context Protocol, computer-use and voice agents, production agents, evaluating LLM systems, LLM security, LLMOps and gateways, Azure OpenAI and document pipelines, and prototyping with Streamlit.\n\nAI tools change quickly. Product and API details are checked against official documentation and dated in each chapter's summary; the exercises focus on the underlying mechanisms, which change far more slowly than vendor syntax." },
  ],
  chapters: [aaPrompting, aaContext, aaTools, aaPatterns, aaFrameworks, aaMcp, aaUiAgents, aaProduction, aaEvals, aaSecurity, aaLlmops, aaAzure, aaStreamlit],
  boss: aaBoss,
};
