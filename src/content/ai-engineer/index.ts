import type { World } from '../../schema';
import { aiCh1 } from './ch1';
import { aiCh2 } from './ch2';
import { aiCh3 } from './ch3';
import { aiCh4 } from './ch4';
import { aiCh5 } from './ch5';
import { aiCh6 } from './ch6';
import { aiCh7 } from './ch7';
import { aiPythonData } from './python-data';
import { aiClassicMl } from './classic-ml';
import { aiDeepLearning } from './deep-learning';
import { aiMultimodal } from './multimodal';
import { aiAdvancedRag } from './advanced-rag';
import { aiAgenticCoding } from './agentic-coding';
import { aiFineTuning } from './fine-tuning';
import { aiSystemDesign } from './ai-system-design';
import { aiBoss } from './boss';

export const aiWorld: World = {
  id: 'ai-engineer',
  title: 'AI Engineer',
  hue: '#6F4CFF',
  tagline: 'How machines learned to read, remember, and answer',
  intro: [
    { t: 'text', md: "People have dreamed of thinking machines for a very long time. In 1958 a simple machine learned to tell two kinds of pictures apart, and the world got excited. Then it got disappointed. Then, slowly, the idea grew up.\n\nThis world is a complete course for AI engineers: machine learning foundations, Python for data, classical ML, deep learning with PyTorch, how LLMs work inside, prompt engineering and tool calling, multimodal models, retrieval-augmented generation from basics to GraphRAG and text-to-SQL, agents with MCP and A2A, agentic coding, building and evaluating LLM applications, fine-tuning with LoRA and DPO, MLOps with responsible AI, and AI system design for interviews. Every lesson has worked examples, reference tables, and interview questions, and you practise with small JavaScript functions and hands-on labs." },
  ],
  chapters: [aiCh1, aiPythonData, aiClassicMl, aiDeepLearning, aiCh2, aiCh3, aiMultimodal, aiCh4, aiAdvancedRag, aiCh5, aiAgenticCoding, aiCh6, aiFineTuning, aiCh7, aiSystemDesign],
  boss: aiBoss,
};
