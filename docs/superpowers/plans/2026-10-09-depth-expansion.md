# Depth Expansion Plan: senior-level coverage, extreme depth for AI

**Goal:** Close the gaps found in the skills audit (Java, Spring Boot, C++, payments, named AI tools, and several thin topics). Raise the content to the depth an engineer with 11 years of experience needs. Take the AI material to extreme depth.

**Scope:**
- 4 new worlds.
- 11 new chapters in existing worlds.
- About 340 new lessons.

**Executor:** inline, chapter by chapter. Use the existing `ship.sh` gate. Merge each world or phase to `master` locally once the full suite is green.

---

## 1. Depth tiers

Every chapter in this plan is tagged with one of three tiers.

| Tier | Used for | Lesson builder | Lessons per chapter | What each lesson contains |
|---|---|---|---|---|
| **Standard** | Thin-topic patches | `topic()` (existing) | 6 | Story, core idea with 2–3 examples, reference table, tip, warning, FAQ, one exercise, 3 quiz questions |
| **Deep** | Java, Spring Boot, C++, payments, backend and devops deepening | `topic()`, with three worked examples and a longer explanation | 6–8 | Standard, plus a production-grade example, an internals explanation, and a "common senior-interview probes" FAQ |
| **Extreme** | All AI chapters | **new `deepTopic()` builder** (Task 0) | 8 | See section 1.1 |

### 1.1 What "extreme" means for one lesson

The schema allows exactly three layers, one exercise, and 3–5 quiz questions per lesson. Extreme depth therefore comes from richer layers and more lessons per chapter. The schema does not change.

- **Story:**
  - A real incident, paper, or launch, with its year.
  - An analogy.
  - A timeline of how the idea evolved, with 3–5 dated entries.
- **Layer 1, "Mental model":**
  - How it works mechanically, with an ASCII diagram.
  - The minimal correct example.
  - The vocabulary a practitioner must use precisely.
- **Layer 2, "Deep dive":**
  - Internals and the exact algorithm or protocol.
  - A production-grade example, 30–60 lines, with error handling.
  - Two variants compared in a trade-off table.
  - Known failure modes, each with a symptom, a root cause, and a fix.
- **Layer 3, "In production":**
  - Cost and latency numbers with units.
  - Observability: what to log and trace.
  - A security note.
  - A checklist of 6–10 items.
  - Primary sources: papers and official docs, with year.
  - An FAQ of 4–6 senior-interview questions with model answers.
- **Exercise:**
  - Implements the core mechanism itself, not a toy wrapper: a judge-agreement metric, a router, an MCP message validator, a retry budget.
  - 4–6 cases, including edge cases.
- **Quiz:** 4–5 questions, at least one scenario-based.
- **Chapter exam:** 12 questions, at least 3 of them order or fill questions.

### 1.2 Fact policy (non-negotiable)

- **Recent tools:** any claim about a framework, API, model, or product released or changed after 2023 is checked with a web search at writing time. This includes LangGraph, Agents SDKs, MCP spec revisions, RAGAS metrics, Azure API names, PhonePe and Cashfree APIs, and RevenueCat.
  - State versions and dates ("as of October 2026", "MCP spec 2025-06-18").
  - If a fact cannot be verified, it is left out.
- **Code:** examples use real, current API shapes. Code that calls external services is marked illustrative.
- **Exercises:** every expected value is computed with `node -e` before it is written. The `content.test.ts` gate then runs each reference solution against its cases.
- **Security:** content stays defensive and authorised-only. Reverse engineering and LLM red-teaming lessons are lab-only, on your own systems or on targets built for practice.

---

## 2. Phase order

| Phase | Content | Tier | Lessons |
|---|---|---|---|
| 0 | `deepTopic()` builder plus a helper test | n/a | 0 |
| 1 | **New world: Applied AI and Agents** | Extreme | 102 |
| 2 | **New world: Java and Spring Boot** | Deep | 84 |
| 3 | **New world: Payments and Messaging** | Deep | 40 |
| 4 | **New world: C++** | Deep | 48 |
| 5 | Deepening chapters in existing worlds | Standard/Deep | 66 |
| **Total** | | | **≈340** |

Phase 1 is first because AI is the area to push hardest. Within Phase 1, chapters are ordered so that each one builds on the last.

---

## 3. Task 0: the `deepTopic()` builder

- **File:** `src/content/cs/h.ts`. Add `deepTopic()` next to `topic()`.
- **Inputs:** everything `topic()` takes, plus:
  - `timeline` (required)
  - `diagram` (an ASCII code block)
  - `deepDive: { explain, example, tradeoffs, failures: [symptom, cause, fix][] }`
  - `production: { numbers, observe, security, checklist[], sources[] }`
  - `faq` with at least 4 entries
  - `quiz` with 4–5 questions
- **Output:**
  - Story: story text, analogy, timeline.
  - Layer 1 "Mental model": explanation, diagram, ex1, ex2.
  - Layer 2 "Deep dive": explanation, production example, trade-off table, failure-mode table.
  - Layer 3 "In production": numbers, observability, security callout, checklist, sources, FAQ.
- **Test:** a unit test that builds one sample lesson and asserts it passes `LessonSchema`, has 3 layers, and contains a failure-mode table and a sources list.
- **Gate:** `npx tsc -b` and `npx vitest run src/content` pass.

---

## 4. Phase 1: Applied AI and Agents (new world, Extreme)

- **Id:** `ai-advanced`
- **Folder:** `src/content/ai-advanced/`
- **Hue:** a new colour distinct from `ai-engineer`.
- **Prerequisite:** the intro points to the AI Engineer world as the foundation.
- **Boss "The support agent that went rogue":**
  1. Choice: triage of a prompt injection hidden in a retrieved document.
  2. Code: implement a tool-call allow-list plus a per-run budget.
  3. Order: the incident steps.

Each chapter below lists its lessons with the exercise function in brackets.

### A1. Prompting in depth (8)
1. Anatomy of a production system prompt: role, rules, format, examples, and why order matters `[lintSystemPrompt]`
2. Few-shot design: example selection, ordering, and label bias; dynamic example retrieval `[pickFewShot]`
3. Prompting reasoning models versus standard models: when "think step by step" helps or hurts, and thinking budgets `[chooseReasoningMode]`
4. Long-context prompting: where documents go, XML tags, and quote-then-answer `[layoutLongPrompt]`
5. Output control: prefill, stop sequences, length control, refusals `[truncateAtStop]`
6. Prompt templates, variables, and versioning as code; prompt regression tests `[renderTemplate]`
7. Automatic prompt optimisation: DSPy signatures and optimisers, meta-prompting `[bestPromptBySuite]`
8. Multimodal prompting: images, documents, and audio as inputs; grounding on regions `[scaleBBox]`

### A2. Context engineering (8)
1. The context window as working memory: budgets, attention, and the "lost in the middle" finding `[fitContextBudget]`
2. Writing context: tool results shaped for models (truncation, summaries, pagination) `[shapeToolResult]`
3. Selecting context: retrieval into context, relevance thresholds, deduplication `[dedupeChunks]`
4. Compressing context: rolling summaries, compaction, and what to keep verbatim `[compactHistory]`
5. Isolating context: subagents, scratchpads, and separate threads `[splitForSubagents]`
6. Persistent memory: memory files, episodic and semantic stores, and when memory poisons results `[mergeMemories]`
7. Prompt caching in depth: cache breakpoints, prefix stability, and hit-rate economics `[cacheSavings]`
8. Context failure modes: poisoning, distraction, confusion, and clash, with diagnoses `[detectContextClash]`

### A3. Structured output and tool calling in depth (8)
1. JSON Schema for LLMs: supported subsets, strict modes, constrained decoding `[validateAgainstSchema]`
2. Schema-first apps with zod and Pydantic; parsing, repair, and retry `[repairJson]`
3. Tool definitions that models use correctly: names, descriptions, parameter design `[scoreToolDef]`
4. Parallel and sequential tool calls; dependency graphs between calls `[scheduleToolCalls]`
5. Tool errors as model input: error messages that lead to recovery `[formatToolError]`
6. Forcing, restricting, and routing tools (`tool_choice`, allow-lists) `[allowedTools]`
7. Large tool catalogues: tool search, lazy loading, and namespacing `[searchTools]`
8. Testing tool-calling behaviour: golden traces and mocked tools `[diffToolTrace]`

### A4. Agent workflow patterns (8)
Follows Anthropic, *Building effective agents*, December 2024, plus later practice.
1. Workflows versus agents: deciding how much autonomy to give `[autonomyLevel]`
2. Prompt chaining with gates `[runChain]`
3. Routing: classifier routes and model routing by cost `[routeRequest]`
4. Parallelisation: sectioning and voting `[majorityVote]`
5. Orchestrator–workers `[planToTasks]`
6. Evaluator–optimizer loops and stopping criteria `[refineUntil]`
7. Planning agents: ReAct, plan-and-execute, re-planning on failure `[replanOnError]`
8. Deep-research agents: search, read, synthesise, cite `[citationCoverage]`

### A5. Agent frameworks (8)
Every API detail here is verified at writing time; the chapter is date-stamped.
1. The loop without a framework: about 60 lines that every framework hides `[agentStep]`
2. LangGraph: state graphs, nodes and edges, checkpoints, interrupts `[nextNode]`
3. OpenAI Agents SDK: agents, handoffs, guardrails, tracing `[resolveHandoff]`
4. Claude Agent SDK: tools, permissions, subagents, hooks `[permissionFor]`
5. CrewAI and AutoGen/AG2: role-based crews and conversational multi-agent `[turnOrder]`
6. Pydantic AI and typed agents; dependency injection for tools `[typedResult]`
7. Choosing a framework: a criteria matrix and lock-in risks `[scoreFramework]`
8. Migrating between frameworks and keeping a thin core `[mapConcepts]`

### A6. Model Context Protocol in depth (8)
1. Architecture: hosts, clients, servers; JSON-RPC 2.0 messages `[validateJsonRpc]`
2. Capabilities: tools, resources, prompts, sampling, roots, elicitation `[negotiateCapabilities]`
3. Transports: stdio and Streamable HTTP; sessions and resumability `[parseSseEvents]`
4. Building a server in TypeScript and Python (official SDKs) `[dispatchMethod]`
5. Authorisation: OAuth 2.1 for remote servers, scopes, token audience `[checkTokenAudience]`
6. Security: tool poisoning, rug pulls, confused deputy, cross-server shadowing `[detectToolDrift]`
7. Registries, discovery, versioning, and testing servers (inspector, contract tests) `[semverCompatible]`
8. MCP versus A2A versus plain function calling; when to use which `[chooseProtocol]`

### A7. Computer use, browser, and voice agents (8)
1. Computer-use agents: the screenshot → action loop, coordinate grounding `[scaleClick]`
2. Browser agents: DOM or accessibility tree versus pixels; Playwright-driven agents `[pickSelector]`
3. Reliability for UI agents: waits, verification steps, recovery `[retryWithVerify]`
4. Sandboxing UI agents: isolated browsers, credential handling, domain allow-lists `[domainAllowed]`
5. Voice agents: STT → LLM → TTS pipelines versus speech-to-speech realtime models `[latencyBudget]`
6. Turn-taking: voice activity detection, barge-in, endpointing `[detectEndOfTurn]`
7. Telephony and WebRTC integration; streaming audio formats `[chunkPcm]`
8. Evaluating UI and voice agents: task success, latency percentiles `[p95]`

### A8. Production agents (8)
1. Durable execution: checkpoints, idempotent steps, resume after crash (Temporal-style) `[resumeFrom]`
2. Budgets and limits: step caps, token and cost caps, wall-clock timeouts `[enforceBudget]`
3. Human-in-the-loop at scale: approval queues, risk scoring, timeouts `[needsApproval]`
4. Observability: traces, spans for tool calls, OpenTelemetry GenAI conventions `[buildSpanTree]`
5. Cost engineering: model cascades, caching, batch APIs `[cascadeCost]`
6. Reliability: retries with backoff, fallbacks across providers, circuit breakers `[backoffSchedule]`
7. Multi-tenant agents: isolation, per-tenant quotas, data boundaries `[tenantQuota]`
8. Agent incident response: kill switches, replaying traces, postmortems `[replayDiff]`

### A9. Evaluating LLM systems (8)
1. Eval-driven development: what to measure, offline versus online, eval sets as code `[splitEvalSet]`
2. Building eval datasets: sampling production traffic, synthetic data, labelling guides `[stratifiedSample]`
3. LLM-as-judge: rubric design, pairwise versus pointwise, known biases (position, verbosity, self-preference) `[positionSwapAgreement]`
4. Calibrating judges against humans: Cohen's kappa, confusion matrices `[cohensKappa]`
5. RAG evaluation with RAGAS: faithfulness, answer relevancy, context precision and recall (definitions verified against the current RAGAS docs) `[contextPrecision]`
6. OpenAI Evals and promptfoo/DeepEval: registries, graders, CI integration `[gradeMatch]`
7. Agent evaluation: trajectory scoring, tool-call accuracy, SWE-bench and τ-bench style tasks `[trajectoryScore]`
8. Online evaluation: A/B tests, guardrail metrics, regression alerts, significance `[twoProportionZ]`

### A10. LLM security (8)
Defensive, authorised testing only.
1. The OWASP Top 10 for LLM applications (2025 edition) as a threat model `[mapToOwaspLlm]`
2. Direct and indirect prompt injection; why there is no complete fix `[flagInjectionMarkers]`
3. Excessive agency: least-privilege tools, confirmation steps `[riskOfAction]`
4. Data leakage and system-prompt exposure; output filtering `[redactSecrets]`
5. Insecure output handling: model output into SQL, HTML, or shell `[escapeForHtml]`
6. Supply chain: model files, pickles, poisoned datasets, MCP servers `[isSafeModelFormat]`
7. Guardrail systems: input and output classifiers, policy engines, layered defence `[combineGuardrails]`
8. Red-teaming your own LLM app: test plans, attack libraries, regression suites `[attackSuccessRate]`

### A11. LLMOps and gateways (8)
1. Model gateways (for example LiteLLM, Portkey): one API, many providers `[normaliseResponse]`
2. Routing and fallbacks across models and regions `[pickProvider]`
3. Rate limits, quotas, token buckets per key and tenant `[tokenBucket]`
4. Semantic caching: similarity thresholds and staleness `[semanticCacheHit]`
5. Prompt and model versioning, rollouts, and shadow traffic `[canarySplit]`
6. Tracing platforms (Langfuse, LangSmith, Arize Phoenix): what each records `[aggregateTraceCost]`
7. Self-hosting models: vLLM, batching, KV cache, throughput versus latency `[tokensPerSecond]`
8. Capacity and cost planning for LLM features `[monthlyCost]`

### A12. Azure OpenAI and Document Intelligence pipelines (8)
All service names and API versions verified against Microsoft docs at writing time.
1. Azure OpenAI: resources, deployments, model versions, regions `[deploymentFor]`
2. Quotas (tokens per minute, requests per minute), provisioned throughput, 429 handling `[tpmFits]`
3. Content filtering, abuse monitoring, and data handling `[filterDecision]`
4. Private networking and identity: private endpoints, managed identity, keyless auth `[authMode]`
5. Azure AI Document Intelligence: read, layout, prebuilt and custom models `[pickDocModel]`
6. Building an OCR pipeline: ingest → classify → extract → validate → human review `[routeByConfidence]`
7. Post-processing extracted fields: normalisation, cross-field checks, LLM-assisted cleanup `[validateInvoice]`
8. Cost, throughput, and monitoring for document pipelines `[pagesPerHour]`

### A13. Prototyping AI apps with Streamlit (6)
1. The Streamlit execution model: reruns, widgets, state `[rerunCount]`
2. Session state, caching (`st.cache_data`, `st.cache_resource`) `[cacheKey]`
3. Chat UIs and streaming in Streamlit `[appendMessage]`
4. Dashboards for eval results and monitoring `[summariseRuns]`
5. Auth, secrets, and deployment options `[secretFor]`
6. From prototype to production: when to leave Streamlit `[readinessScore]`

**Phase 1 totals:**
- 13 chapters, 102 lessons.
- Merge to `master` after A1–A13, or in two halves: A1–A6, then A7–A13.

---

## 5. Phase 2: Java and Spring Boot (new world, Deep)

- **Id:** `java`
- **Exercises:** Java-first. `langs: ['java', 'js']`, with a `sig` on every exercise. Reference solutions are verified by the existing Java solution suite.
- **Boss "The slow order service":**
  1. Choice: find the N+1 query.
  2. Code: fix the cache key.
  3. Order: the GC-tuning steps.

| # | Chapter | Lessons |
|---|---|---|
| J1 | Java for experienced developers: types, records, sealed classes, switch patterns, text blocks | 6 |
| J2 | Object-oriented design in Java: interfaces, default methods, immutability, `equals`/`hashCode` contracts | 6 |
| J3 | Generics: bounded types, wildcards, erasure, PECS | 6 |
| J4 | Collections internals: `HashMap` resizing and treeification, `ArrayList` versus `LinkedList`, `ConcurrentHashMap` | 6 |
| J5 | Streams and functional Java: collectors, laziness, parallel-stream pitfalls | 6 |
| J6 | Exceptions, I/O, and NIO: checked versus unchecked, try-with-resources, `Files`/`Path` | 6 |
| J7 | Concurrency: Java memory model, `volatile`, locks, executors, `CompletableFuture` | 8 |
| J8 | Virtual threads and structured concurrency (Java 21+) | 6 |
| J9 | The JVM: class loading, JIT, heap layout, garbage collectors (G1, ZGC), tuning and profiling | 8 |
| J10 | Build and test: Maven, Gradle, JUnit 5, Mockito, Testcontainers | 6 |
| S1 | Spring Boot core: DI container, auto-configuration, profiles, configuration properties | 6 |
| S2 | Spring Web and Data: REST controllers, validation, Spring Data JPA, transactions, N+1, Flyway | 8 |
| S3 | Spring Security, testing, and operations: OAuth2 resource server, `@SpringBootTest` slices, Actuator, Micrometer, native images | 6 |

**Phase 2 total:** 13 chapters, 84 lessons.

---

## 6. Phase 3: Payments and Messaging (new world, Deep)

- **Id:** `payments`
- **Fact policy:** strict. Every API field, status, and regulation is verified against current official docs: Stripe, NPCI, RBI, PhonePe, Cashfree, Razorpay, RevenueCat, Apple, Google, and Meta.
- **Boss "The double-charged customer":**
  1. Choice: idempotency.
  2. Code: webhook deduplication plus state machine.
  3. Order: the refund and reconciliation steps.

| # | Chapter | Lessons |
|---|---|---|
| P1 | Payment fundamentals: authorise, capture, settle, refund, chargeback; idempotency; money as integers; PCI scope | 6 |
| P2 | Stripe in depth: PaymentIntents, SCA/3DS, webhooks and signature verification, Billing subscriptions, Connect, disputes, test clocks | 8 |
| P3 | Indian payments: UPI architecture (NPCI, PSPs, VPAs), collect versus intent flows, PhonePe PG, Cashfree, Razorpay, UPI AutoPay mandates, RBI card-tokenisation rules, settlement cycles | 8 |
| P4 | In-app purchases: App Store and Play Billing, receipts and server notifications, RevenueCat entitlements, offerings, webhooks | 6 |
| P5 | Messaging APIs: WhatsApp Business Platform (Cloud API), template approval, 24-hour customer-service window, opt-in, webhooks; SMS and email deliverability basics | 6 |
| P6 | Operating payments: reconciliation, ledgers and double-entry, fraud signals, retries and dunning, observability | 6 |

**Phase 3 total:** 6 chapters, 40 lessons.

---

## 7. Phase 4: C++ (new world, Deep)

- **Id:** `cpp`
- **Exercises:** C++-first (`langs: ['cpp', 'js']`).
- **Boss "The leaking image server":**
  1. Choice: ownership.
  2. Code: an RAII buffer pool.
  3. Order: the debugging steps with sanitizers.

| # | Chapter | Lessons |
|---|---|---|
| C1 | Modern C++ essentials: types, references, `auto`, `const`, initialisation | 6 |
| C2 | Memory and ownership: stack versus heap, RAII, `unique_ptr`/`shared_ptr`, rule of 0/3/5 | 6 |
| C3 | Move semantics and value categories | 6 |
| C4 | The STL: containers, iterators, algorithms, ranges (C++20) | 8 |
| C5 | Templates and generic programming: concepts (C++20), SFINAE basics, `constexpr` | 6 |
| C6 | Concurrency: `std::thread`, atomics, the memory model, mutexes, `std::async` | 6 |
| C7 | Build and tooling: CMake, compilers and flags, sanitizers, debugging, profiling | 4 |
| C8 | Performance: cache-friendly data, undefined behaviour, benchmarking | 6 |

**Phase 4 total:** 8 chapters, 48 lessons.

---

## 8. Phase 5: deepening chapters in existing worlds

| World | New chapter | Tier | Lessons |
|---|---|---|---|
| backend | Node.js and Express in depth: event loop, streams, middleware, error handling, clustering, production hardening | Deep | 6 |
| backend | Django in depth: ORM and query optimisation, migrations, DRF, auth, Celery, deployment | Deep | 6 |
| frontend | Tailwind CSS in depth: config, design tokens, variants, component patterns, v4 changes | Standard | 6 |
| frontend | Electron.js: main and renderer processes, IPC, preload and context isolation, security, packaging, auto-update | Deep | 6 |
| frontend | React Native in production: navigation, native modules, performance, OTA updates, store releases | Deep | 6 |
| databases | MySQL in depth: InnoDB, indexes, isolation levels, replication, query tuning, operations | Deep | 6 |
| devops | GitLab CI/CD and GitHub Actions in depth: runners, caching, matrices, environments, OIDC to cloud, reusable workflows, security | Deep | 6 |
| devops | Cloudflare and web hosting: DNS, CDN, WAF, Workers, Pages, Tunnels; shared hosting and cPanel basics | Standard | 6 |
| monitoring | Splunk in depth: indexing, SPL searches, stats/timechart, alerts, dashboards | Deep | 6 |
| engineering | Agile in practice: Scrum, Kanban, estimation, ceremonies that work, metrics | Standard | 6 |
| security | Defensive reverse engineering (lab-only): binaries, disassembly with Ghidra, APK analysis, malware triage in sandboxes, protecting your own apps | Deep | 6 |

**Phase 5 total:** 11 chapters, 66 lessons. Merge after each world's chapters are done.

---

## 9. Per-chapter workflow (unchanged, proven)

1. **Research:** for Extreme and Deep chapters, run web searches for post-2023 facts. Record the source URLs in the lesson's sources list.
2. **Values:** compute exercise expected values with `node -e`.
3. **Write:** write the chapter to the scratchpad staging file.
4. **Ship:** `bash .superpowers/ship.sh <world> <export> <file> "<subject>"`. This runs catalog, tsc, and content tests, and commits only when all pass.
5. **Before each merge:**
   - `npx tsc -b`
   - `npx vitest run`
   - `npm run build`
   - `npx playwright test`
   - Then run `git merge --no-ff` into `master`, delete the branch, and append to `.superpowers/progress.md`.
6. **New world:** create `index.ts` and `boss.ts`, register the world in `load.ts` and `content/index.ts`, and add a `Sketch.tsx` case.

## 10. Quality bar checks (per chapter, before shipping)

- [ ] Every post-2023 product or API claim has been verified, and the chapter carries an "as of" date.
- [ ] Every exercise implements a real mechanism and has edge-case tests.
- [ ] Every Extreme lesson has a failure-mode table, numbers with units, a production checklist, and sources.
- [ ] There are no invented statistics, no AI copywriting clichés, and no unverifiable claims.
- [ ] Security content is defensive and authorised-only.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Fast-moving AI and payment APIs make content stale | Date-stamp chapters; keep exercises on mechanisms, not vendor syntax |
| Wrong facts at senior depth damage trust | Web verification for recent claims; omit anything unverifiable |
| Bundle size grows with about 340 lessons | Worlds are already code-split per world in `load.ts`; check the build output size each phase |
| Java- and C++-first exercises need `sig` for every exercise | Reuse the Phase B `sig` and solution-suite tooling; the suites already require all languages |
