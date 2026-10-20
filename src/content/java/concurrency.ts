import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const jvConcurrency: Chapter = {
  id: 'jv-concurrency',
  title: 'Concurrency and the Java memory model',
  summary: 'Writing correct concurrent Java: the Java memory model and happens-before, visibility and atomicity, locks and deadlock, executors and pool sizing, CompletableFuture composition, coordination utilities, atomics and compare-and-set, and scalability limits. Based on JSR 133, JSR 166, and Java Concurrency in Practice; checked as of October 2026.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'jv-cc-1', title: 'The Java memory model and happens-before', concept: 'jv-jmm',
      story: "Java was the first mainstream language to specify a memory model, but the original 1996 model was broken: researchers including Bill Pugh showed it forbade common compiler optimisations while still permitting surprising behaviours, and that the popular double-checked locking idiom did not work. JSR 133, led by Pugh with Jeremy Manson and Sarita Adve's research as foundation, rewrote the model for Java 5 (2004). Its central idea, **happens-before**, is what every correct concurrent Java program ultimately relies on.",
      analogy: "Sending sealed letters: a recipient is only guaranteed to see what you wrote before you posted the letter if there is a postal route from you to them; without a route, they may see an old version of your notes or nothing at all.",
      timeline: [['1996', 'Original JMM', 'Specified, but flawed and widely misunderstood.'], ['2000', 'Double-checked locking declared broken', 'Pugh and others publish the analysis.'], ['2004', 'JSR 133', 'New memory model with happens-before (Java 5).'], ['2017', 'VarHandles', 'Fine-grained memory ordering modes (Java 9).']],
      explain: "Without synchronisation, the compiler, JIT, and CPU may **reorder** instructions and keep values in registers or caches, so one thread can see another's writes late, out of order, or never. The JMM defines when a write is guaranteed to be **visible**: if write W **happens-before** read R. Happens-before edges come from: **program order** within a thread; **unlocking** a monitor before a later **lock** of the same monitor; a **volatile write** before a later **volatile read** of the same field; `Thread.start()` before the started thread's actions; a thread's actions before another thread's successful `join()`; and the end of a constructor before the finaliser, plus final-field publication rules. Happens-before is **transitive**: if A hb B and B hb C, then A hb C. Concurrency utilities document their own edges (for example, actions before `queue.put` happen-before actions after the corresponding `take`). A **data race** is two accesses to the same variable from different threads, at least one a write, not ordered by happens-before; racy programs can observe surprising values.",
      diagram: "Thread 1                         Thread 2\nx = 42          (program order)\nsynchronized(m) { … } unlock ──▶ lock m (later)\n                                  read x  → guaranteed 42\nchain: write x → unlock → lock → read x   (transitive)\nno edge → read x may see 0",
      ex1: ['java', 'a visibility bug', "class Worker implements Runnable {\n    boolean stop = false;                // not volatile: no happens-before edge\n    public void run() { while (!stop) { doWork(); } }   // may loop forever after stop = true\n}"],
      ex2: ['java', 'safe publication through a happens-before edge', "private volatile Config config;           // volatile write → volatile read\nvoid reload() { config = loadConfig(); }  // all writes inside loadConfig happen-before readers\nConfig current() { return config; }"],
      deepDive: {
        explain: "The JMM is defined in terms of allowed executions, not hardware: it is the contract that lets the JIT reorder aggressively while keeping correctly synchronised programs **sequentially consistent** (\"data-race-free implies SC\"). In practice: protect every shared mutable variable with one consistent mechanism (a lock, volatile, an atomic, or a thread-safe collection), or make it immutable and publish it safely. **Safe publication** idioms: static initialisers, volatile fields, final fields of a properly constructed object, `AtomicReference`, or putting the object in a concurrent collection. Final fields are special: once the constructor finishes (without `this` escaping), other threads see the correctly initialised final fields even without synchronisation, which is why immutable objects are thread-safe. Double-checked locking works since Java 5 only if the field is `volatile`; the holder-class idiom (`private static class Holder { static final X INSTANCE = new X(); }`) is simpler.",
        example: ['js', 'is there a happens-before path from a to b?', "function happensBefore(edges, a, b) {           // edges like 'w1>unlock'\n  const g = {};\n  for (const e of edges) { const [x, y] = e.split('>'); (g[x] = g[x] || []).push(y); }\n  const seen = new Set(), stack = [a];\n  while (stack.length) {\n    for (const m of g[stack.pop()] || []) {\n      if (m === b) return true;                      // transitive chain found\n      if (!seen.has(m)) { seen.add(m); stack.push(m); }\n    }\n  }\n  return false;\n}"],
        tradeoffs: [['Mechanism', 'Guarantees', 'Cost'], ['synchronized / locks', 'Visibility and mutual exclusion', 'Contention; blocking'], ['volatile', 'Visibility and ordering of one variable', 'No compound atomicity'], ['final fields + safe construction', 'Visibility of immutable state', 'Must avoid this-escape'], ['Concurrent collections', 'Documented happens-before edges', 'Choose the right one']],
        failures: [['Background loop never stops', 'Non-volatile flag', 'volatile or AtomicBoolean'], ['Half-constructed object seen by another thread', 'Unsafe publication', 'volatile, final fields, or safe publication idioms'], ['Double-checked singleton returns broken object', 'Non-volatile DCL field', 'volatile or holder-class idiom'], ['Bug disappears when adding logging', 'Logging adds synchronisation', 'Fix the missing happens-before edge']],
      },
      warn: "If a bug vanishes when you add a print statement or run in a debugger, suspect a data race: logging adds synchronisation that hides the missing happens-before edge.",
      production: {
        numbers: "A volatile read on x86 costs about the same as a normal read; a volatile write adds a memory barrier costing tens of cycles, cheap compared with lock contention.",
        observe: "Race detectors and stress tests (for example jcstress from OpenJDK) explore interleavings and reorderings that normal tests rarely trigger.",
        security: "Races on security state (authentication flags, permission caches) can let one request observe another's partially updated state; guard such state with clear synchronisation or immutability.",
        checklist: ['Every shared mutable variable has one guard', 'Immutable objects for shared data', 'Safe publication idioms', 'volatile flags for stop signals', 'No double-checked locking without volatile', 'jcstress or stress tests for tricky code', 'Document thread-safety of classes'],
        sources: ['JSR 133: Java Memory Model and Thread Specification Revision (Java 5)', 'Manson, Pugh, Adve, "The Java Memory Model" (POPL 2005)', 'Goetz et al., "Java Concurrency in Practice" (2006), chapter 16'],
      },
      tip: "For every field touched by more than one thread, write down which lock, volatile, or atomic guards it. Any field with no answer is a bug waiting for a busy day.",
      faq: [['What does happens-before guarantee?', 'Visibility and ordering of the earlier action to the later one.'], ['Name three happens-before sources.', 'Unlock before lock, volatile write before read, Thread.start and join.'], ['What is a data race?', 'Conflicting accesses not ordered by happens-before.'], ['Why are immutable objects thread-safe?', 'Final-field semantics plus no mutation after construction.'], ['When does double-checked locking work?', 'Since Java 5, with a volatile field.']],
      ex: { prompt: 'Write happensBefore(edges, a, b) where edges are strings "x>y" meaning x happens-before y. Return true if a happens-before b through one or more edges (transitively).', fn: 'happensBefore', params: 'edges, a, b', sig: '(string[] edges, string a, string b) -> bool', java: `class Solution {
    public boolean happensBefore(String[] edges, String a, String b) {
        Map<String, List<String>> g = new HashMap<>();
        for (String e : edges) {
            String[] p = e.split(">");
            if (!g.containsKey(p[0])) g.put(p[0], new ArrayList<String>());
            g.get(p[0]).add(p[1]);
        }
        Set<String> seen = new HashSet<>();
        Deque<String> stack = new ArrayDeque<>();
        stack.push(a);
        while (!stack.isEmpty()) {
            List<String> next = g.get(stack.pop());
            if (next == null) continue;
            for (String m : next) {
                if (m.equals(b)) return true;
                if (seen.add(m)) stack.push(m);
            }
        }
        return false;
    }
}
`, cases: [{ args: [['w1>unlock', 'unlock>lock', 'lock>r1'], 'w1', 'r1'], expect: true }, { args: [['w1>unlock', 'lock>r1'], 'w1', 'r1'], expect: false }, { args: [[], 'a', 'a'], expect: false }], solution: `function happensBefore(edges,a,b){const g={};for(const e of edges){const[x,y]=e.split('>');(g[x]=g[x]||[]).push(y)}const seen=new Set();const st=[a];while(st.length){for(const m of g[st.pop()]||[]){if(m===b)return true;if(!seen.has(m)){seen.add(m);st.push(m)}}}return false}`, hint: 'Graph reachability with a stack.' },
      quiz: [
        choice('jv-cc-1-q1', 'jv-jmm', 'Thread A sets a plain boolean stop = true; thread B loops while(!stop). Risk?', ['B may never see the change', 'none', 'deadlock', 'exception'], 0, 'Visibility.'),
        choice('jv-cc-1-q2', 'jv-jmm', 'Which creates a happens-before edge?', ['unlocking a monitor then locking the same monitor', 'two plain writes', 'Thread.sleep', 'System.out.println by contract'], 0, 'Monitor rule.'),
        choice('jv-cc-1-q3', 'jv-jmm', 'Simplest correct lazy singleton?', ['holder-class idiom', 'non-volatile double-checked locking', 'static mutable field set lazily', 'finalizer'], 0, 'Class init.'),
        fill('jv-cc-1-q4', 'jv-jmm', 'The 2004 revision of the Java memory model was JSR ___', ['133'], 'Java 5.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'jv-cc-2', title: 'Visibility versus atomicity: volatile and count++', concept: 'jv-volatile-atomicity',
      story: "A classic interview question: two threads each increment a shared `volatile int counter` 1,000 times. What is the final value? Not 2,000, and not reliably anything. `volatile` guarantees that every read sees the latest write, but `counter++` is three steps (read, add, write), and two threads can read the same value before either writes. This **lost update** is the most common concurrency bug in Java code, and understanding why `volatile` does not fix it separates visibility from atomicity.",
      analogy: "Two cashiers updating the same paper tally: both read 41, both write 42, and one sale disappears, even though both always read the latest number on the sheet.",
      timeline: [['1996', 'volatile keyword', 'Present from Java 1.0, weakly specified.'], ['2004', 'Strong volatile semantics', 'JSR 133 gives volatile happens-before meaning.'], ['2004', 'java.util.concurrent.atomic', 'AtomicInteger and friends (Java 5).'], ['2014', 'LongAdder', 'Striped counters for high contention (Java 8).']],
      explain: "**Visibility** asks whether a thread sees another thread's write. **Atomicity** asks whether a compound action happens as one indivisible step. `volatile` provides visibility and ordering for reads and writes of that one field, so it is right for **flags** and **published references** written by one thread and read by others. It does **not** make read-modify-write sequences atomic: `count++`, `if (x == null) x = create()`, and `balance -= amount` all race. Fixes: `synchronized` blocks around the compound action, `AtomicInteger.incrementAndGet()` (lock-free compare-and-set), `LongAdder` for heavily contended counters, or confining the variable to one thread. Note that `long` and `double` writes are not guaranteed atomic on 32-bit JVMs unless declared `volatile` (JLS 17.7), though they are atomic on all modern 64-bit JVMs in practice.",
      diagram: "counter = 0\nA: read 0          B: read 0\nA: write 0+1 = 1   B: write 0+1 = 1   → final 1, one update lost\nvolatile does not help: both reads were \"latest\" when they happened\nAtomicInteger.incrementAndGet(): CAS loop → final 2",
      ex1: ['java', 'the lost update and two fixes', "volatile int count;                       // visible, but count++ is not atomic\nvoid hit() { count++; }                   // read, add, write: races\n\nAtomicInteger safe = new AtomicInteger();\nvoid hit2() { safe.incrementAndGet(); }   // atomic\n\nLongAdder hot = new LongAdder();\nvoid hit3() { hot.increment(); }          // best under heavy contention"],
      ex2: ['java', 'check-then-act race', "if (cache.get(key) == null) {             // two threads both see null\n    cache.put(key, compute(key));          // both compute; one overwrites the other\n}"],
      deepDive: {
        explain: "Lost updates often go unnoticed in tests because contention is rare at low load, then appear in production as counts slightly lower than expected, duplicate ids, or oversold inventory. The same race exists across processes: two service instances reading a database row, incrementing in Java, and writing back lose updates exactly like two threads; solve it with database atomic updates (`UPDATE ... SET qty = qty - 1 WHERE qty > 0`), optimistic locking with versions, or row locks. Within a JVM, prefer higher-level atomic operations (`ConcurrentHashMap.merge`, `AtomicInteger.updateAndGet`) to hand-rolled synchronisation. `volatile` is still the right tool for single-writer flags, configuration references swapped atomically, and the state field of lock-free algorithms.",
        example: ['js', 'replaying an interleaving of read and write steps', "function interleave(ops) {                  // ops like 'A:read', 'A:write' for counter++\n  let counter = 0; const reg = {};\n  for (const op of ops) {\n    const [t, k] = op.split(':');\n    if (k === 'read') reg[t] = counter;      // thread copies the current value\n    else counter = reg[t] + 1;               // and writes its stale copy + 1\n  }\n  return counter;\n}"],
        tradeoffs: [['Tool', 'Visibility', 'Atomic compound ops'], ['volatile', 'Yes', 'No'], ['synchronized / Lock', 'Yes', 'Yes (inside the block)'], ['AtomicInteger / AtomicReference', 'Yes', 'Single-variable CAS operations'], ['LongAdder', 'Yes (on sum)', 'Increments only; sum is approximate under updates']],
        failures: [['Counters lower than expected', 'count++ on shared field', 'AtomicInteger or LongAdder'], ['Inventory oversold', 'Read-modify-write across instances', 'Atomic SQL update or optimistic locking'], ['Duplicate initialisation', 'Check-then-act', 'computeIfAbsent or a lock'], ['volatile added and bug remains', 'Confusing visibility with atomicity', 'Make the compound action atomic']],
      },
      warn: "volatile never makes count++, check-then-act, or any read-modify-write sequence atomic. It only guarantees that reads see the latest writes.",
      production: {
        numbers: "In the interleaving A:read, B:read, A:write, B:write, two increments produce a final value of 1: half the updates are lost.",
        observe: "Compare business counters against authoritative sources (database counts, payment provider totals); small, load-dependent discrepancies are a signature of lost updates.",
        security: "Race conditions in balance or quota checks (time-of-check to time-of-use) can let users spend money twice or exceed limits; enforce such invariants atomically, ideally in the database.",
        checklist: ['volatile only for flags and published references', 'Atomics for counters', 'LongAdder under heavy contention', 'Compound actions in one atomic step', 'Atomic SQL updates across instances', 'Optimistic locking with versions', 'Load tests that create contention'],
        sources: ['The Java Language Specification, sections 8.3.1.4 (volatile) and 17.7 (non-atomic long and double)', 'Java SE API: java.util.concurrent.atomic', 'Goetz et al., "Java Concurrency in Practice" (2006), chapters 2–3'],
      },
      tip: "Whenever you see `x = f(x)` on shared state, ask \"what if another thread runs this line between my read and my write?\" If the answer matters, make the step atomic.",
      faq: [['Does volatile make count++ atomic?', 'No.'], ['What does volatile guarantee?', 'Visibility and ordering of reads and writes to that field.'], ['How do you increment a shared counter safely?', 'AtomicInteger.incrementAndGet or LongAdder.'], ['What is a check-then-act race?', 'Deciding based on a value that another thread changes before you act.'], ['How do you prevent lost updates across service instances?', 'Atomic database updates or optimistic locking.']],
      ex: { prompt: 'Write interleave(ops) simulating counter++ split into steps. counter starts at 0. "T:read" copies counter into thread T\'s register; "T:write" sets counter to T\'s register + 1. Return the final counter.', fn: 'interleave', params: 'ops', sig: '(string[] ops) -> int', java: `class Solution {
    public int interleave(String[] ops) {
        int counter = 0;
        Map<String, Integer> reg = new HashMap<>();
        for (String op : ops) {
            String[] p = op.split(":");
            if (p[1].equals("read")) reg.put(p[0], counter);
            else counter = reg.get(p[0]) + 1;
        }
        return counter;
    }
}
`, cases: [{ args: [['A:read', 'A:write', 'B:read', 'B:write']], expect: 2 }, { args: [['A:read', 'B:read', 'A:write', 'B:write']], expect: 1 }, { args: [['A:read', 'B:read', 'B:write', 'C:read', 'A:write', 'C:write']], expect: 2 }], solution: `function interleave(ops){let c=0;const reg={};for(const op of ops){const[t,k]=op.split(':');if(k==='read')reg[t]=c;else c=reg[t]+1}return c}`, hint: 'Each thread writes its own stale copy plus one.' },
      quiz: [
        choice('jv-cc-2-q1', 'jv-volatile-atomicity', 'Two threads run volatileCount++ 1,000 times each. Final value?', ['anything up to 2,000', 'exactly 2,000', 'exactly 1,000', '0'], 0, 'Lost updates.'),
        choice('jv-cc-2-q2', 'jv-volatile-atomicity', 'Right use of volatile?', ['a stop flag written by one thread', 'a shared counter incremented by many', 'a map', 'a balance updated by many'], 0, 'Visibility.'),
        choice('jv-cc-2-q3', 'jv-volatile-atomicity', 'Two app instances decrement stock read from the DB, then save. Fix?', ['UPDATE ... SET qty = qty - 1 WHERE qty > 0', 'volatile', 'synchronized in Java', 'bigger pool'], 0, 'Atomic in DB.'),
        fill('jv-cc-2-q4', 'jv-volatile-atomicity', 'A striped counter for high contention is Long___', ['Adder'], 'Java 8.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'jv-cc-3', title: 'Locks and deadlock', concept: 'jv-locks-deadlock',
      story: "Edsger Dijkstra illustrated deadlock in 1965 with the dining philosophers: five philosophers, five forks, and everyone holding one fork while waiting for the next. In Java services the pattern appears as two threads transferring money in opposite directions, each holding one account's lock and waiting for the other's. `jstack` and thread dumps report \"Found one Java-level deadlock\" when it happens; preventing it is a matter of design, not luck.",
      analogy: "Two cars meeting on a single-lane bridge from opposite ends: each waits for the other to reverse, and neither ever moves.",
      timeline: [['1965', 'Dining philosophers', 'Dijkstra\'s deadlock illustration.'], ['1971', 'Coffman conditions', 'Four necessary conditions for deadlock.'], ['1996', 'synchronized', 'Intrinsic monitor locks in Java 1.0.'], ['2004', 'ReentrantLock', 'Explicit locks with tryLock, timeouts, fairness (Java 5).']],
      explain: "`synchronized` acquires an object's intrinsic monitor; it is **reentrant** (the same thread can re-acquire it), releases automatically on exit or exception, and gives happens-before edges. `ReentrantLock` adds **tryLock** (with optional timeout), interruptible acquisition, fairness, and multiple **Condition** objects; always release it in `finally`. `ReadWriteLock` and `StampedLock` allow concurrent readers. **Deadlock** requires all four **Coffman conditions**: mutual exclusion, hold and wait, no preemption, and circular wait. Prevent it by breaking circular wait with a **global lock order** (always lock the account with the smaller id first), by using `tryLock` with timeouts and backing off, by holding at most one lock at a time, or by never calling unknown code (callbacks, listeners) while holding a lock. **Detection**: thread dumps show blocked threads, the locks they hold, and those they wait for; a cycle in that wait-for graph is a deadlock.",
      diagram: "T1 holds A, waits for B\nT2 holds B, waits for A\nwait-for graph: T1 → T2 → T1   (cycle = deadlock)\nfix: lock order by id → both lock A first → no cycle",
      ex1: ['java', 'deadlock-free transfers by lock ordering', "void transfer(Account from, Account to, BigDecimal amount) {\n    Account first = from.id() < to.id() ? from : to;\n    Account second = first == from ? to : from;\n    synchronized (first) {\n        synchronized (second) {\n            from.withdraw(amount);\n            to.deposit(amount);\n        }\n    }\n}"],
      ex2: ['java', 'tryLock with timeout', "if (lock.tryLock(200, TimeUnit.MILLISECONDS)) {\n    try { update(); } finally { lock.unlock(); }\n} else {\n    throw new BusyException(\"resource busy, retry\");\n}"],
      deepDive: {
        explain: "Lock **contention** is as harmful to throughput as deadlock is to liveness: threads queue for a hot lock and CPU sits idle. Reduce it by shrinking critical sections (no I/O while holding locks), splitting locks (per-key or striped locks), using concurrent collections, or making state immutable. **Livelock** is the cousin of deadlock: threads keep retrying and backing off in lockstep without progress; randomised backoff breaks the symmetry. **Starvation** occurs when unfair locks repeatedly favour some threads; fair locks fix it at a throughput cost. Since Java 21, virtual threads pinned by `synchronized` blocks during blocking I/O were a known issue; JDK 24 (JEP 491) removed most pinning for `synchronized`, so the choice between `synchronized` and `ReentrantLock` is now mostly about features (tryLock, conditions), not virtual-thread compatibility. Database deadlocks follow the same rules: access rows in a consistent order and keep transactions short.",
        example: ['js', 'detecting a cycle in the wait-for graph', "function hasDeadlock(holds, waits) {          // 'T1:A' = T1 holds A; waits 'T1:B' = T1 waits for B\n  const owner = {};\n  for (const h of holds) { const [t, l] = h.split(':'); owner[l] = t; }\n  const g = {};\n  for (const w of waits) { const [t, l] = w.split(':'); if (owner[l] && owner[l] !== t) (g[t] = g[t] || []).push(owner[l]); }\n  const state = {};                              // 1 = on stack, 2 = done\n  const dfs = (n) => {\n    state[n] = 1;\n    for (const m of g[n] || []) { if (state[m] === 1 || (!state[m] && dfs(m))) return true; }\n    state[n] = 2; return false;\n  };\n  return Object.keys(g).some((n) => !state[n] && dfs(n));\n}"],
        tradeoffs: [['Lock', 'Strength', 'Weakness'], ['synchronized', 'Simple, automatic release', 'No timeout or tryLock'], ['ReentrantLock', 'tryLock, timeouts, conditions, fairness', 'Must unlock in finally'], ['ReadWriteLock / StampedLock', 'Concurrent readers', 'Complexity; StampedLock not reentrant'], ['Lock-free (atomics, concurrent maps)', 'No deadlock, high throughput', 'Harder to design for compound state']],
        failures: [['Service freezes; thread dump shows a deadlock', 'Inconsistent lock order', 'Global lock ordering'], ['Throughput collapses under load', 'I/O inside a lock', 'Move I/O outside critical sections'], ['Lock never released after exception', 'unlock not in finally', 'try/finally or synchronized'], ['Deadlock via callbacks', 'Calling alien methods while holding a lock', 'Copy state, release, then call out']],
      },
      warn: "Never perform I/O, remote calls, or callbacks into unknown code while holding a lock. It turns slow dependencies into blocked threads and is a common route to deadlock.",
      production: {
        numbers: "One hot lock held for 10 ms per request caps that code path at about 100 requests per second, no matter how many threads or cores you add.",
        observe: "Take several thread dumps a few seconds apart (jstack, jcmd Thread.print); look for BLOCKED threads, the same lock across dumps, and the JVM's automatic deadlock report. JFR records lock contention events.",
        security: "Lock-based denial of service is possible when untrusted requests can make the server hold contended locks for long; bound time inside critical sections.",
        checklist: ['Consistent global lock ordering', 'Short critical sections, no I/O inside', 'unlock in finally', 'tryLock with timeouts where waiting is risky', 'No callbacks under locks', 'Contention monitored with JFR', 'Thread dumps in incident runbooks'],
        sources: ['Coffman, Elphick, Shoshani, "System Deadlocks" (Computing Surveys, 1971)', 'Java SE API: ReentrantLock, StampedLock', 'OpenJDK JEP 491: Synchronize Virtual Threads without Pinning (JDK 24)'],
      },
      tip: "Keep a runbook step: on a hang, take three thread dumps ten seconds apart. Deadlocks, hot locks, and stuck I/O all become visible in minutes.",
      faq: [['What are the four Coffman conditions?', 'Mutual exclusion, hold and wait, no preemption, circular wait.'], ['Simplest deadlock prevention for transfers?', 'Lock accounts in a consistent order.'], ['What does tryLock add?', 'Non-blocking or timed acquisition.'], ['How do you find deadlocks in production?', 'Thread dumps, which report Java-level deadlocks.'], ['What is livelock?', 'Threads keep reacting to each other without progress.']],
      ex: { prompt: 'Write hasDeadlock(holds, waits) where holds are "T:L" (thread T holds lock L) and waits are "T:L" (thread T waits for lock L). Build a wait-for graph (T → owner of L, ignoring locks with no owner or owned by T itself) and return true if it contains a cycle.', fn: 'hasDeadlock', params: 'holds, waits', sig: '(string[] holds, string[] waits) -> bool', java: `class Solution {
    Map<String, List<String>> g = new HashMap<>();
    Map<String, Integer> state = new HashMap<>();
    boolean dfs(String n) {
        state.put(n, 1);
        List<String> next = g.get(n);
        if (next != null) for (String m : next) {
            Integer s = state.get(m);
            if (s != null && s == 1) return true;
            if (s == null && dfs(m)) return true;
        }
        state.put(n, 2);
        return false;
    }
    public boolean hasDeadlock(String[] holds, String[] waits) {
        Map<String, String> owner = new HashMap<>();
        for (String h : holds) { String[] p = h.split(":"); owner.put(p[1], p[0]); }
        for (String w : waits) {
            String[] p = w.split(":");
            String o = owner.get(p[1]);
            if (o != null && !o.equals(p[0])) {
                if (!g.containsKey(p[0])) g.put(p[0], new ArrayList<String>());
                g.get(p[0]).add(o);
            }
        }
        for (String n : g.keySet()) if (!state.containsKey(n) && dfs(n)) return true;
        return false;
    }
}
`, cases: [{ args: [['T1:A', 'T2:B'], ['T1:B', 'T2:A']], expect: true }, { args: [['T1:A', 'T2:B'], ['T1:B']], expect: false }, { args: [['T1:A', 'T2:B', 'T3:C'], ['T1:B', 'T2:C', 'T3:A']], expect: true }, { args: [[], []], expect: false }], solution: `function hasDeadlock(holds,waits){const owner={};for(const h of holds){const[t,l]=h.split(':');owner[l]=t}const g={};for(const w of waits){const[t,l]=w.split(':');if(owner[l]&&owner[l]!==t)(g[t]=g[t]||[]).push(owner[l])}const st={};const dfs=n=>{st[n]=1;for(const m of g[n]||[]){if(st[m]===1)return true;if(!st[m]&&dfs(m))return true}st[n]=2;return false};for(const n of Object.keys(g))if(!st[n]&&dfs(n))return true;return false}`, hint: 'Map locks to owners, build thread-to-thread edges, then look for a cycle.' },
      quiz: [
        choice('jv-cc-3-q1', 'jv-locks-deadlock', 'transfer(a, b) and transfer(b, a) run concurrently and hang. Fix?', ['lock accounts in a consistent order', 'add volatile', 'use a bigger thread pool', 'retry immediately'], 0, 'Circular wait.'),
        choice('jv-cc-3-q2', 'jv-locks-deadlock', 'Which Lock feature lets you give up after 200 ms?', ['tryLock(timeout)', 'lock()', 'synchronized', 'notify()'], 0, 'Timed.'),
        choice('jv-cc-3-q3', 'jv-locks-deadlock', 'Where must ReentrantLock.unlock() go?', ['in a finally block', 'at the end of the try', 'in a catch', 'anywhere'], 0, 'Always release.'),
        fill('jv-cc-3-q4', 'jv-locks-deadlock', 'Deadlock needs mutual exclusion, hold and wait, no preemption, and circular ___', ['wait'], 'Coffman.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'jv-cc-4', title: 'Executors and thread pool sizing', concept: 'jv-executors',
      story: "Creating a thread per task worked for applets and failed for servers: threads cost memory (around a megabyte of stack each by default) and scheduling time, and an unbounded number of them crashes the JVM under load. Doug Lea's executor framework (JSR 166, Java 5) separated **task submission** from **execution policy**. *Java Concurrency in Practice* (2006) then gave the sizing rule still quoted in reviews: threads ≈ cores × target utilisation × (1 + wait time ÷ compute time).",
      analogy: "A restaurant kitchen with a fixed number of cooks and an order rail: customers submit orders, the rail holds the queue, and the head chef decides how many cooks to hire based on how much of each order is waiting for the oven.",
      timeline: [['1996', 'new Thread(...)', 'Manual thread management.'], ['2004', 'ExecutorService', 'Thread pools, futures, and queues (Java 5).'], ['2011', 'ForkJoinPool', 'Work-stealing pool for divide and conquer (Java 7).'], ['2023', 'Virtual threads', 'Thread-per-task becomes cheap again for I/O (Java 21).']],
      explain: "An `ExecutorService` accepts `Runnable` and `Callable` tasks and returns `Future`s. `ThreadPoolExecutor` is configured by **core and maximum pool size**, a **work queue**, a **keep-alive** time, a **thread factory** (name your threads), and a **rejection policy** (`AbortPolicy` throws, `CallerRunsPolicy` slows the submitter for backpressure). Beware the convenience factories: `newFixedThreadPool` uses an **unbounded queue** (memory grows without limit under overload), and `newCachedThreadPool` creates **unbounded threads**. Prefer explicit `ThreadPoolExecutor` construction with bounded queues for production. **Sizing**: for CPU-bound work, about one thread per core; for tasks that wait (I/O), Goetz's formula `N = cores × U × (1 + W/C)` estimates threads needed to keep CPUs busy. Separate pools per workload (bulkheads) so slow dependencies cannot exhaust threads for everything else. Always **shut down** executors (`shutdown`, then `awaitTermination`).",
      diagram: "N_threads = N_cores × U_target × (1 + W / C)\n8 cores, U = 1, W = 90 ms, C = 10 ms → 8 × 1 × 10 = 80 threads\nCPU-bound (W = 0)                   → 8 threads\nsubmit → queue (bounded!) → workers → rejection policy when full",
      ex1: ['java', 'an explicit, bounded pool', "ThreadPoolExecutor pool = new ThreadPoolExecutor(\n    16, 16, 0L, TimeUnit.MILLISECONDS,\n    new ArrayBlockingQueue<>(500),                          // bounded queue\n    r -> new Thread(r, \"pricing-worker\"),                  // named threads\n    new ThreadPoolExecutor.CallerRunsPolicy());             // backpressure"],
      ex2: ['java', 'orderly shutdown', "pool.shutdown();\nif (!pool.awaitTermination(30, TimeUnit.SECONDS)) {\n    pool.shutdownNow();          // interrupt remaining tasks\n}"],
      deepDive: {
        explain: "The sizing formula gives a starting point; confirm with load tests, because real systems have other limits: database connection pools (more threads than connections just queue on the pool), downstream rate limits, and memory per thread. **Little's law** (L = λ × W) relates concurrency, throughput, and latency: to sustain 200 requests per second with 100 ms latency, you need about 20 in flight. Queues hide overload until memory runs out or latency becomes unacceptable; bounded queues with rejection make overload visible and let callers back off. Thread-local state leaks across tasks in pooled threads unless cleared, which matters for MDC logging context and security contexts. With virtual threads (next chapter), the pool-sizing question for I/O-bound work largely disappears, but limits on downstream resources (connections, rate limits) remain and should be enforced with semaphores or connection pools.",
        example: ['js', 'Goetz\'s thread pool sizing formula', "function poolSize(cores, util, waitMs, computeMs) {\n  return Math.round(cores * util * (1 + waitMs / computeMs));   // N = cores × U × (1 + W/C)\n}"],
        tradeoffs: [['Configuration', 'Strength', 'Risk'], ['newFixedThreadPool', 'Simple', 'Unbounded queue: memory blow-up'], ['newCachedThreadPool', 'Absorbs bursts', 'Unbounded threads'], ['Explicit bounded ThreadPoolExecutor', 'Predictable under overload', 'Needs tuning'], ['Separate pools per dependency', 'Isolation (bulkheads)', 'More pools to size']],
        failures: [['OutOfMemoryError under load', 'Unbounded executor queue', 'Bounded queue with rejection policy'], ['Thousands of threads, then crash', 'Cached pool under bursts', 'Bounded pool'], ['All requests slow when one dependency is slow', 'Shared pool for everything', 'Bulkhead pools per dependency'], ['Logs show the wrong user id', 'ThreadLocal context leaking between tasks', 'Clear context in finally or use task decorators']],
      },
      warn: "Executors.newFixedThreadPool uses an unbounded queue. Under sustained overload, it accepts tasks until the heap is exhausted; use a bounded queue in production.",
      production: {
        numbers: "With 8 cores, tasks waiting 90 ms per 10 ms of CPU need about 80 threads to keep CPUs busy; purely CPU-bound tasks need about 8.",
        observe: "Export pool metrics: active threads, queue size, completed tasks, and rejections (Micrometer has executor binders). A growing queue predicts latency problems before users see them.",
        security: "Unbounded queues and pools let request floods exhaust memory or threads; bounded pools with rejection give predictable failure modes under attack.",
        checklist: ['Explicit ThreadPoolExecutor with bounded queue', 'Named threads', 'Rejection policy chosen deliberately', 'Pool size from formula, confirmed by load test', 'Bulkheads per dependency', 'Thread-local context cleared', 'Graceful shutdown'],
        sources: ['Goetz et al., "Java Concurrency in Practice" (2006), chapter 8: applying thread pools', 'Java SE API: ThreadPoolExecutor, Executors', 'Little, "A Proof for the Queuing Formula: L = λW" (Operations Research, 1961)'],
      },
      tip: "Name every thread pool's threads after its job. Thread dumps and profilers then tell you at a glance which workload is stuck.",
      faq: [['Thread pool sizing formula?', 'cores × utilisation × (1 + wait/compute).'], ['Risk of newFixedThreadPool?', 'Unbounded queue.'], ['What does CallerRunsPolicy do?', 'Runs rejected tasks in the submitting thread, applying backpressure.'], ['Why separate pools per dependency?', 'So one slow dependency cannot exhaust all threads.'], ['How do you stop an executor?', 'shutdown, awaitTermination, then shutdownNow if needed.']],
      ex: { prompt: 'Write poolSize(cores, util, waitMs, computeMs) returning cores × util × (1 + waitMs / computeMs), rounded to the nearest integer.', fn: 'poolSize', params: 'cores, util, waitMs, computeMs', sig: '(int cores, double util, double waitMs, double computeMs) -> int', java: `class Solution {
    public int poolSize(int cores, double util, double waitMs, double computeMs) {
        return (int) Math.round(cores * util * (1 + waitMs / computeMs));
    }
}
`, cases: [{ args: [8, 1, 0, 10], expect: 8 }, { args: [8, 1, 90, 10], expect: 80 }, { args: [4, 0.5, 50, 50], expect: 4 }], solution: `function poolSize(cores,util,waitMs,computeMs){return Math.round(cores*util*(1+waitMs/computeMs))}`, hint: 'Apply the formula and round.' },
      quiz: [
        choice('jv-cc-4-q1', 'jv-executors', 'Heap fills under overload with a newFixedThreadPool. Why?', ['its queue is unbounded', 'too many threads', 'GC bug', 'JIT'], 0, 'Bounded queue.'),
        choice('jv-cc-4-q2', 'jv-executors', 'CPU-bound image resizing on 16 cores: pool size?', ['about 16', 'about 160', '1', 'unbounded'], 0, 'W = 0.'),
        choice('jv-cc-4-q3', 'jv-executors', 'A slow payment provider stalls all endpoints sharing one pool. Pattern?', ['bulkhead: separate pools', 'bigger shared pool', 'cached pool', 'parallel streams'], 0, 'Isolation.'),
        fill('jv-cc-4-q4', 'jv-executors', 'L = λW is ___\'s law', ['Little'], 'Queueing.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'jv-cc-5', title: 'CompletableFuture composition', concept: 'jv-completablefuture',
      story: "Java 5's `Future` could only be polled or blocked on with `get()`, so combining asynchronous results meant tying up threads. Java 8 introduced `CompletableFuture`, a promise-like type with more than fifty methods for chaining (`thenApply`, `thenCompose`), combining (`thenCombine`, `allOf`, `anyOf`), and handling errors (`exceptionally`, `handle`). It made fan-out patterns, such as calling three services in parallel and merging results, expressible without blocking in between.",
      analogy: "Ordering a meal from three restaurant stalls at once and setting the table when the last dish arrives, instead of standing at each stall in turn.",
      timeline: [['2004', 'Future', 'Blocking get() only (Java 5).'], ['2014', 'CompletableFuture', 'Composable async pipelines (Java 8).'], ['2017', 'Timeouts', 'orTimeout and completeOnTimeout (Java 9).'], ['2023', 'Virtual threads', 'Blocking style becomes viable again for I/O (Java 21).']],
      explain: "`supplyAsync(supplier, executor)` starts work and returns a `CompletableFuture<T>`. **Transform** with `thenApply(fn)` (sync function on the result); **chain** dependent async calls with `thenCompose(fn)` (flat-map, avoiding `CompletableFuture<CompletableFuture<T>>`); **combine** two independent futures with `thenCombine`; wait for many with `allOf(...)` (then `join` each) or the first with `anyOf`. **Errors**: an exception completes the future exceptionally and skips later `thenApply` stages until `exceptionally`, `handle`, or `whenComplete` deals with it; `join()` throws `CompletionException` wrapping the cause. **Timeouts**: `orTimeout(2, SECONDS)` or `completeOnTimeout(fallback, …)` (Java 9). **Latency arithmetic**: sequential stages add up; parallel branches cost the slowest branch. Always pass an **executor** for blocking work; the default async pool is the common ForkJoinPool, which should not run blocking I/O.",
      diagram: "seq 100 ms ─▶ parallel {50, 80, 30} ms ─▶ seq 20 ms\nlatency = 100 + max(50, 80, 30) + 20 = 200 ms\nthenApply:   T → U          (sync transform)\nthenCompose: T → CF<U>      (dependent async call)\nallOf:       wait for all   anyOf: first to finish",
      ex1: ['java', 'fan-out and combine with an explicit executor', "CompletableFuture<Profile> profile = CompletableFuture.supplyAsync(() -> profiles.get(id), ioPool);\nCompletableFuture<List<Order>> orders = CompletableFuture.supplyAsync(() -> orderClient.recent(id), ioPool);\nCompletableFuture<Dashboard> dash = profile.thenCombine(orders, Dashboard::new)\n    .orTimeout(2, TimeUnit.SECONDS)\n    .exceptionally(e -> Dashboard.degraded(id));"],
      ex2: ['java', 'thenCompose for dependent calls', "CompletableFuture<Receipt> r = findCart(userId)            // CF<Cart>\n    .thenCompose(cart -> pricing.quote(cart))             // CF<Quote>\n    .thenCompose(quote -> payments.charge(quote));        // CF<Receipt>"],
      deepDive: {
        explain: "Common mistakes: calling `get()` or `join()` inside a stage (blocking a pool thread), forgetting to handle exceptions (they disappear silently if nobody joins the future), and using the common pool for blocking calls. Methods without `Async` run the next stage on whichever thread completed the previous one, which may be a caller thread or a pool thread; `thenApplyAsync(fn, executor)` makes the thread explicit. Cancellation is weak: `cancel(true)` completes the future with `CancellationException` but does not interrupt the running supplier. Context such as MDC, tracing spans, and security contexts does not propagate automatically across async stages; instrumented executors or framework support (Micrometer context propagation) are needed. With Java 21 virtual threads and structured concurrency (next chapter), many fan-out cases can be written as straightforward blocking code with the same latency, which is often easier to read and debug; `CompletableFuture` remains valuable for event-driven APIs and libraries.",
        example: ['js', 'latency of sequential and parallel stages', "function pipelineLatency(stages) {         // 'seq:a,b' adds all; 'par:a,b,c' takes the max\n  let t = 0;\n  for (const s of stages) {\n    const [k, v] = s.split(':');\n    const xs = v.split(',').map(Number);\n    t += k === 'seq' ? xs.reduce((a, b) => a + b, 0) : Math.max(...xs);\n  }\n  return t;\n}"],
        tradeoffs: [['Style', 'Strength', 'Weakness'], ['CompletableFuture chains', 'Non-blocking composition', 'Harder stack traces and debugging'], ['Blocking calls on virtual threads', 'Simple code, cheap threads', 'Java 21+'], ['Reactive streams (Reactor)', 'Backpressure, streaming', 'Steep learning curve'], ['Sequential blocking calls', 'Simplest', 'Latency adds up']],
        failures: [['Errors silently lost', 'No exceptionally/handle and nobody joins', 'Handle errors at the end of each chain'], ['Common pool starved', 'Blocking I/O in supplyAsync without executor', 'Pass a dedicated executor'], ['Requests hang forever', 'No timeout on remote calls', 'orTimeout / completeOnTimeout'], ['Traces broken across async stages', 'Context not propagated', 'Context-propagating executors']],
      },
      warn: "supplyAsync without an executor runs on the common ForkJoinPool. Never put blocking I/O there; pass a dedicated executor.",
      production: {
        numbers: "Calling three services of 50, 80, and 30 ms sequentially costs 160 ms; in parallel with allOf it costs about 80 ms, the slowest call.",
        observe: "Track per-stage latency and timeouts in traces; ensure async stages carry trace context so fan-out calls appear under the parent span.",
        security: "Security context does not propagate automatically to async threads; use framework-supported propagation (for example DelegatingSecurityContextExecutor in Spring Security) so authorisation checks see the right user.",
        checklist: ['Explicit executor for blocking work', 'thenCompose for dependent async calls', 'allOf for independent fan-out', 'Timeouts on remote stages', 'Errors handled at chain ends', 'Context propagation configured', 'No join() inside stages'],
        sources: ['Java SE API: CompletableFuture (Java 8, timeouts in Java 9)', 'Goetz et al., "Java Concurrency in Practice" (2006)', 'Micrometer documentation: context propagation (accessed October 2026)'],
      },
      tip: "Draw the dependency graph of your remote calls before coding. Independent calls go in parallel with allOf or thenCombine; dependent ones chain with thenCompose.",
      faq: [['thenApply versus thenCompose?', 'thenApply maps a value; thenCompose chains a call that returns another future.'], ['How do you wait for several futures?', 'allOf, then join each.'], ['What does join throw on failure?', 'CompletionException wrapping the cause.'], ['Default executor for supplyAsync?', 'The common ForkJoinPool.'], ['How do you add a timeout?', 'orTimeout or completeOnTimeout (Java 9).']],
      ex: { prompt: 'Write pipelineLatency(stages) where each stage is "seq:a,b,…" (calls run one after another: add them) or "par:a,b,…" (calls run in parallel: take the maximum). Return the total latency.', fn: 'pipelineLatency', params: 'stages', sig: '(string[] stages) -> int', java: `class Solution {
    public int pipelineLatency(String[] stages) {
        int t = 0;
        for (String s : stages) {
            String[] kv = s.split(":");
            int sum = 0, max = 0;
            for (String x : kv[1].split(",")) { int v = Integer.parseInt(x); sum += v; max = Math.max(max, v); }
            t += kv[0].equals("seq") ? sum : max;
        }
        return t;
    }
}
`, cases: [{ args: [['seq:100', 'par:50,80,30', 'seq:20']], expect: 200 }, { args: [[]], expect: 0 }, { args: [['seq:10,20']], expect: 30 }], solution: `function pipelineLatency(stages){let t=0;for(const s of stages){const[k,v]=s.split(':');const xs=v.split(',').map(Number);t+=k==='seq'?xs.reduce((a,b)=>a+b,0):Math.max(...xs)}return t}`, hint: 'Sum for sequential, max for parallel.' },
      quiz: [
        choice('jv-cc-5-q1', 'jv-completablefuture', 'Call B needs A\'s result, both async. Use...', ['thenCompose', 'thenApply', 'allOf', 'anyOf'], 0, 'Flat-map.'),
        choice('jv-cc-5-q2', 'jv-completablefuture', 'Three independent calls of 40, 90, 60 ms in parallel take about...', ['90 ms', '190 ms', '40 ms', '60 ms'], 0, 'Slowest.'),
        choice('jv-cc-5-q3', 'jv-completablefuture', 'supplyAsync(() -> httpCall()) with no executor risks...', ['starving the common ForkJoinPool', 'nothing', 'deadlock always', 'memory leak only'], 0, 'Blocking I/O.'),
        fill('jv-cc-5-q4', 'jv-completablefuture', 'Wait for all futures with CompletableFuture.___Of', ['all'], 'Fan-in.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'jv-cc-6', title: 'Coordination: latches, semaphores, and queues', concept: 'jv-sync-utilities',
      story: "Before Java 5, coordinating threads meant `wait()` and `notify()` on monitors, a mechanism so error-prone that Effective Java advises never to use it in new code. JSR 166 delivered ready-made **synchronisers**: `CountDownLatch`, `CyclicBarrier`, `Semaphore`, `Exchanger`, and later `Phaser` (Java 7), plus **blocking queues** that make the producer-consumer pattern almost trivial. They remain the building blocks for rate limiting, bulk-loading coordination, and backpressure inside a JVM.",
      analogy: "A car park with a fixed number of spaces and a barrier: cars enter while spaces remain, queue at the barrier when it is full, and the barrier lifts again whenever someone leaves.",
      timeline: [['1996', 'wait/notify', 'Low-level monitor coordination.'], ['2004', 'Synchronisers and blocking queues', 'CountDownLatch, Semaphore, ArrayBlockingQueue (Java 5).'], ['2011', 'Phaser and TransferQueue', 'Flexible barriers and handoff queues (Java 7).'], ['2023', 'Semaphores with virtual threads', 'Limiting concurrency replaces sizing pools (Java 21).']],
      explain: "**`CountDownLatch(n)`**: threads `await()` until `countDown()` has been called n times; one-shot (for example, wait for services to start, or start all workers at once in a test). **`CyclicBarrier(n)`**: n threads wait for each other repeatedly at a barrier point. **`Semaphore(permits)`**: `acquire()` takes a permit or blocks; `release()` returns it; use it to **limit concurrency** to a resource (at most 10 concurrent calls to a partner API), always releasing in `finally`. **Blocking queues**: `ArrayBlockingQueue` (bounded, array), `LinkedBlockingQueue` (optionally bounded), `SynchronousQueue` (direct handoff), `PriorityBlockingQueue`, `DelayQueue`. `put` blocks when full and `take` when empty, giving natural **backpressure**; `offer` and `poll` with timeouts avoid blocking forever. Each documents happens-before edges, so objects passed through a queue are safely published.",
      diagram: "Semaphore(2), tasks in order [5, 3, 2, 4] time units\nslot 1: 5 ……… → 4 …… (ends 9)\nslot 2: 3 … → 2 .. (ends 5)\nall done at t = 9\nBlockingQueue: producer.put() blocks when full · consumer.take() blocks when empty",
      ex1: ['java', 'limiting concurrent calls with a semaphore', "private final Semaphore partnerSlots = new Semaphore(10);\nQuote quote(Order o) throws InterruptedException {\n    partnerSlots.acquire();\n    try { return partner.quote(o); }\n    finally { partnerSlots.release(); }\n}"],
      ex2: ['java', 'producer-consumer with backpressure', "BlockingQueue<Event> queue = new ArrayBlockingQueue<>(1_000);\n// producer\nif (!queue.offer(event, 50, TimeUnit.MILLISECONDS)) metrics.dropped();\n// consumer\nwhile (running) { Event e = queue.poll(1, TimeUnit.SECONDS); if (e != null) handle(e); }"],
      deepDive: {
        explain: "Choose the simplest tool: a `CountDownLatch` for one-time events, a `Semaphore` to cap concurrency, a bounded `BlockingQueue` between producer and consumer stages, and `CompletableFuture` or structured concurrency for result fan-in. Pitfalls: a `Semaphore` acquire without a matching release (for example on an exception path) slowly leaks permits until the system stops; a latch whose count never reaches zero hangs forever unless you use `await(timeout)`. Unbounded `LinkedBlockingQueue` defeats backpressure, just like unbounded executor queues. For distributed coordination across instances, these JVM-local tools do not help; use database locks, a distributed rate limiter, or a message broker. In tests, latches make concurrency deterministic: start all threads, release them together with a latch, and wait for completion with another.",
        example: ['js', 'completion time with a semaphore of n permits (tasks start in order)', "function semaphoreMakespan(permits, durations) {\n  const freeAt = new Array(permits).fill(0);\n  let end = 0;\n  for (const d of durations) {\n    let i = 0;\n    for (let j = 1; j < permits; j++) if (freeAt[j] < freeAt[i]) i = j;   // earliest free permit\n    freeAt[i] += d;\n    end = Math.max(end, freeAt[i]);\n  }\n  return end;\n}"],
        tradeoffs: [['Tool', 'Use', 'Pitfall'], ['CountDownLatch', 'One-time event or start gate', 'Cannot reset; can hang'], ['CyclicBarrier / Phaser', 'Repeated rendezvous', 'Broken barrier on failure'], ['Semaphore', 'Concurrency limits', 'Leaked permits without finally'], ['Bounded BlockingQueue', 'Backpressure between stages', 'Producers block; choose offer with timeout']],
        failures: [['System gradually stops processing', 'Semaphore permits leaked on exceptions', 'release in finally'], ['Test hangs forever', 'Latch never counted down', 'await with timeout; count down in finally'], ['Memory grows between stages', 'Unbounded queue', 'Bounded queue with offer timeout'], ['Partner API rate-limits you', 'No concurrency cap', 'Semaphore or rate limiter']],
      },
      warn: "Every Semaphore.acquire needs a release in a finally block. A leaked permit is invisible until the last one is gone and every caller blocks.",
      production: {
        numbers: "Two permits running tasks of 5, 3, 2, and 4 units in order finish at 9 units; one permit would take 14, four permits 5.",
        observe: "Export available permits, queue depth, and wait times; a semaphore stuck at zero permits for long periods signals leaks or an overloaded dependency.",
        security: "Concurrency caps on expensive operations (report generation, exports) protect services from resource exhaustion by heavy or malicious users; apply them per tenant where possible.",
        checklist: ['Synchronisers instead of wait/notify', 'Semaphore release in finally', 'Timeouts on await and offer', 'Bounded queues between stages', 'Latches for deterministic tests', 'Metrics on permits and queue depth', 'Distributed tools for cross-instance limits'],
        sources: ['Java SE API: java.util.concurrent package (synchronisers and blocking queues)', 'Bloch, "Effective Java" (3rd ed.), item 81: prefer concurrency utilities to wait and notify', 'Lea, "Concurrent Programming in Java" (2nd ed., 1999)'],
      },
      tip: "Use a Semaphore to protect any external dependency with a concurrency limit in its contract. It is two lines of code and prevents a whole class of rate-limit incidents.",
      faq: [['What does a CountDownLatch do?', 'Blocks waiting threads until a count reaches zero.'], ['Semaphore use case?', 'Limiting concurrent access to a resource.'], ['How do blocking queues provide backpressure?', 'put blocks when full.'], ['Can a CountDownLatch be reused?', 'No; it is one-shot.'], ['Why avoid wait/notify?', 'Error-prone; utilities are safer and clearer.']],
      ex: { prompt: 'Write semaphoreMakespan(permits, durations) for tasks that start in order whenever a permit is free (each takes the permit that becomes free earliest; ties go to the lowest-numbered permit). Return the time when all tasks have finished (0 for no tasks).', fn: 'semaphoreMakespan', params: 'permits, durations', sig: '(int permits, int[] durations) -> int', java: `class Solution {
    public int semaphoreMakespan(int permits, int[] durations) {
        int[] freeAt = new int[permits];
        int end = 0;
        for (int d : durations) {
            int i = 0;
            for (int j = 1; j < permits; j++) if (freeAt[j] < freeAt[i]) i = j;
            freeAt[i] += d;
            end = Math.max(end, freeAt[i]);
        }
        return end;
    }
}
`, cases: [{ args: [2, [5, 3, 2, 4]], expect: 9 }, { args: [1, [1, 2, 3]], expect: 6 }, { args: [3, []], expect: 0 }, { args: [4, [7, 1]], expect: 7 }], solution: `function semaphoreMakespan(permits,durations){const free=new Array(permits).fill(0);let end=0;for(const d of durations){let i=0;for(let j=1;j<permits;j++)if(free[j]<free[i])i=j;free[i]+=d;end=Math.max(end,free[i])}return end}`, hint: 'Track when each permit becomes free.' },
      quiz: [
        choice('jv-cc-6-q1', 'jv-sync-utilities', 'A partner allows 10 concurrent calls. Tool?', ['Semaphore(10)', 'CountDownLatch(10)', 'volatile int', 'CyclicBarrier'], 0, 'Concurrency cap.'),
        choice('jv-cc-6-q2', 'jv-sync-utilities', 'Start 20 test threads at exactly the same moment:', ['a CountDownLatch(1) start gate', 'Thread.sleep', 'a Semaphore(0) without release', 'nothing'], 0, 'Start gate.'),
        choice('jv-cc-6-q3', 'jv-sync-utilities', 'Which queue gives backpressure?', ['ArrayBlockingQueue (bounded)', 'unbounded LinkedBlockingQueue', 'ConcurrentLinkedQueue', 'ArrayList'], 0, 'Bounded.'),
        fill('jv-cc-6-q4', 'jv-sync-utilities', 'acquire() must always be paired with ___() in finally', ['release'], 'No leaks.'),
      ],
    }),
    deepTopic({
      id: 'l7', key: 'jv-cc-7', title: 'Atomics and compare-and-set', concept: 'jv-atomics-cas',
      story: "Modern CPUs provide an instruction that compares a memory location with an expected value and, only if they match, writes a new value, all atomically: compare-and-swap (`CMPXCHG` on x86) or load-linked/store-conditional on ARM. Java exposed it safely in 2004 through `java.util.concurrent.atomic`, and almost every lock-free structure in the JDK, from `ConcurrentHashMap` to `LongAdder`, is built on it. Maurice Herlihy's 1991 work showed that compare-and-swap is **universal**: it can implement any wait-free concurrent object.",
      analogy: "Editing a shared document with a version number: you submit your change saying \"this is based on version 7\"; if someone saved version 8 first, your save is refused and you merge and try again.",
      timeline: [['1991', 'Herlihy\'s universality', 'Compare-and-swap can build any wait-free object.'], ['2004', 'Atomic classes', 'AtomicInteger, AtomicReference, field updaters (Java 5).'], ['2014', 'LongAdder and accumulators', 'Striped counters (Java 8).'], ['2017', 'VarHandle', 'Standard API for atomic and ordered access (Java 9).']],
      explain: "`compareAndSet(expected, newValue)` succeeds and returns `true` only if the current value equals `expected`; otherwise it changes nothing and returns `false`. Lock-free updates use a **CAS loop**: read the current value, compute the new one, attempt CAS, and retry on failure. `AtomicInteger` wraps this in `incrementAndGet`, `updateAndGet(fn)`, and `accumulateAndGet`. `AtomicReference` does the same for objects, ideal for swapping immutable snapshots (configuration, routing tables). Under heavy contention, CAS loops spin and retry; **`LongAdder`** spreads updates across cells and sums them on read, scaling far better for counters. The **ABA problem**: a value changes from A to B and back to A, and a CAS that expected A succeeds although the state changed; `AtomicStampedReference` adds a version stamp to detect it, and garbage collection removes the classic memory-reuse variant in Java.",
      diagram: "value = 0\ncas(expected 0 → 1)  ✓ value 1\ncas(expected 0 → 2)  ✗ (value is 1) → caller retries with fresh value\ncas(expected 1 → 5)  ✓ value 5\nresult: value 5, successes 2\nCAS loop: do { cur = get(); next = f(cur); } while (!compareAndSet(cur, next));",
      ex1: ['java', 'swapping an immutable snapshot', "private final AtomicReference<Routes> routes = new AtomicReference<>(Routes.empty());\nvoid addRoute(Route r) {\n    routes.updateAndGet(current -> current.with(r));   // CAS loop inside; fn must be side-effect free\n}\nRoute lookup(String path) { return routes.get().find(path); }"],
      ex2: ['java', 'a hand-written CAS loop', "int addCapped(AtomicInteger counter, int delta, int cap) {\n    while (true) {\n        int cur = counter.get();\n        int next = Math.min(cap, cur + delta);\n        if (counter.compareAndSet(cur, next)) return next;   // retry if another thread won\n    }\n}"],
      deepDive: {
        explain: "Functions passed to `updateAndGet` or `accumulateAndGet` may run **more than once** under contention, so they must be pure (no I/O, no counters, no logging side effects). CAS is optimistic: under low contention it beats locks; under extreme contention on a single variable, retries waste CPU, and a lock or a striped structure (`LongAdder`, `ConcurrentHashMap`) scales better. Atomics cover single variables; invariants across several variables need a lock or an immutable object swapped through one `AtomicReference`. **VarHandles** (Java 9) offer CAS and memory-ordering modes (plain, opaque, acquire/release, volatile) on fields and array elements without the overhead of separate atomic objects; they are mostly for library authors. The same optimistic pattern appears in databases as optimistic locking with version columns: `UPDATE … SET …, version = version + 1 WHERE id = ? AND version = ?`, retrying when zero rows change.",
        example: ['js', 'simulating a sequence of compare-and-set calls', "function casSequence(initial, ops) {          // ops like 'cas:expected:new'\n  let value = initial, successes = 0;\n  for (const op of ops) {\n    const [, e, n] = op.split(':');\n    if (value === +e) { value = +n; successes++; }   // only if current equals expected\n  }\n  return [value, successes];\n}"],
        tradeoffs: [['Tool', 'Strength', 'Weakness'], ['AtomicInteger / CAS loop', 'Lock-free, fast at low contention', 'Retries under heavy contention'], ['LongAdder', 'Scales for hot counters', 'Sum is not a snapshot; more memory'], ['AtomicReference + immutable state', 'Consistent multi-field snapshots', 'Allocation per update'], ['Lock', 'Any invariant, simple reasoning', 'Blocking and contention']],
        failures: [['Side effect runs twice', 'Impure function in updateAndGet', 'Pure update functions only'], ['High CPU with little progress', 'Hot CAS loop under contention', 'LongAdder or striping'], ['Invariant broken across two atomics', 'Separate atomics for related fields', 'One AtomicReference to an immutable object'], ['Stale-state bug with recycled values', 'ABA', 'AtomicStampedReference or versioned state']],
      },
      warn: "The function given to updateAndGet or accumulateAndGet can be called several times when threads compete. Never perform I/O or other side effects inside it.",
      production: {
        numbers: "In the sequence cas(0→1), cas(0→2), cas(1→5) starting from 0, two of three CAS calls succeed and the final value is 5.",
        observe: "Profilers showing time in compareAndSet retry loops on one field indicate contention; switch to LongAdder or partition the state.",
        security: "Optimistic concurrency (CAS in memory, version columns in databases) prevents lost updates in security-relevant state such as balances, quotas, and permissions.",
        checklist: ['Atomics for single-variable state', 'LongAdder for hot counters', 'AtomicReference for immutable snapshots', 'Pure functions in updateAndGet', 'Locks for multi-variable invariants', 'ABA considered for recycled values', 'Version columns for database optimistic locking'],
        sources: ['Herlihy, "Wait-Free Synchronization" (ACM TOPLAS, 1991)', 'Java SE API: java.util.concurrent.atomic, LongAdder, VarHandle', 'Goetz et al., "Java Concurrency in Practice" (2006), chapter 15'],
      },
      tip: "When several fields must change together, put them in one immutable object and swap it with a single AtomicReference. Readers then always see a consistent snapshot.",
      faq: [['What does compareAndSet do?', 'Sets a new value only if the current value equals the expected value.'], ['What is a CAS loop?', 'Read, compute, attempt CAS, retry on failure.'], ['When is LongAdder better than AtomicLong?', 'Under heavy contention on counters.'], ['What is the ABA problem?', 'A value changes and returns to its old value, fooling a CAS.'], ['Why must updateAndGet functions be pure?', 'They may run more than once.']],
      ex: { prompt: 'Write casSequence(initial, ops) where ops are "cas:expected:new". Starting from initial, each op sets the value to new only if the current value equals expected. Return [finalValue, numberOfSuccessfulCas].', fn: 'casSequence', params: 'initial, ops', sig: '(int initial, string[] ops) -> int[]', java: `class Solution {
    public int[] casSequence(int initial, String[] ops) {
        java.util.concurrent.atomic.AtomicInteger v = new java.util.concurrent.atomic.AtomicInteger(initial);
        int ok = 0;
        for (String op : ops) {
            String[] p = op.split(":");
            if (v.compareAndSet(Integer.parseInt(p[1]), Integer.parseInt(p[2]))) ok++;
        }
        return new int[] { v.get(), ok };
    }
}
`, cases: [{ args: [0, ['cas:0:1', 'cas:0:2', 'cas:1:5']], expect: [5, 2] }, { args: [10, []], expect: [10, 0] }], solution: `function casSequence(initial,ops){let v=initial,ok=0;for(const op of ops){const[,e,n]=op.split(':');if(v===+e){v=+n;ok++}}return[v,ok]}`, hint: 'Only matching expectations succeed.' },
      quiz: [
        choice('jv-cc-7-q1', 'jv-atomics-cas', 'A request counter hit by thousands of threads per second. Best type?', ['LongAdder', 'AtomicLong in a CAS loop', 'synchronized long', 'volatile long'], 0, 'Striping.'),
        choice('jv-cc-7-q2', 'jv-atomics-cas', 'Config holds host and port that must change together. Approach?', ['immutable Config in one AtomicReference', 'two AtomicReferences', 'two volatile fields', 'no synchronisation'], 0, 'Snapshot.'),
        choice('jv-cc-7-q3', 'jv-atomics-cas', 'The function in updateAndGet logs each call. Problem?', ['it may run several times under contention', 'none', 'deadlock', 'compile error'], 0, 'Purity.'),
        fill('jv-cc-7-q4', 'jv-atomics-cas', 'CAS stands for compare-and-___', ['swap', 'set'], 'Atomic instruction.'),
      ],
    }),
    deepTopic({
      id: 'l8', key: 'jv-cc-8', title: 'Scalability limits: Amdahl and contention', concept: 'jv-scalability',
      story: "In 1967 Gene Amdahl argued that the serial fraction of any workload caps the speed-up from adding processors: if 5% of the work must run serially, no number of cores will make it more than 20 times faster. Neil Gunther's Universal Scalability Law (1993) added a second penalty, **coherency**: coordinating cores (locks, cache-line transfers) can make throughput fall as you add capacity. Every Java service with a shared lock, a single database row everyone updates, or a synchronised logger runs into these laws eventually.",
      analogy: "A kitchen where any number of cooks can chop vegetables, but there is only one oven: past a point, extra cooks just stand around the oven, and if they argue about it, dinner gets slower.",
      timeline: [['1967', 'Amdahl\'s law', 'Serial fraction limits parallel speed-up.'], ['1988', 'Gustafson\'s law', 'Larger problems scale better with more processors.'], ['1993', 'Universal Scalability Law', 'Gunther adds contention and coherency costs.'], ['2010s', 'False sharing awareness', '@Contended (Java 8 internal) pads hot fields.']],
      explain: "**Amdahl's law**: speed-up with n workers is `1 / ((1 − p) + p / n)`, where p is the parallelisable fraction. With p = 0.95 and 8 cores, the best possible speed-up is about 5.9; with infinite cores, 20. With p = 0.5, even 1,000 cores give less than 2×. Sources of serial fraction in Java services: global locks, synchronised singletons, a single-threaded executor, a database row or sequence everyone updates, logging with a shared lock, and garbage collection pauses. **Contention** makes it worse than Amdahl predicts: threads waste time acquiring locks, and **false sharing** (independent variables on the same 64-byte cache line updated by different cores) forces cache-line ping-pong. To scale: remove shared mutable state (immutability, thread confinement), partition state (per-key locks, `ConcurrentHashMap`, `LongAdder`), batch updates, move coordination into well-scaling infrastructure, and **measure** with load tests that increase concurrency step by step.",
      diagram: "speed-up = 1 / ((1 − p) + p / n)\np = 0.95, n = 8     → 5.93×\np = 0.95, n = ∞     → 20×\np = 0.50, n = 1000  → ≈ 2×\nthroughput vs threads: rises, flattens (Amdahl), may fall (contention, USL)",
      ex1: ['java', 'removing a serial bottleneck', "// before: one lock for all customers\nsynchronized void record(String customerId, Event e) { log.computeIfAbsent(customerId, k -> new ArrayList<>()).add(e); }\n// after: per-key structure, no global lock\nConcurrentHashMap<String, Queue<Event>> log = new ConcurrentHashMap<>();\nvoid record(String customerId, Event e) { log.computeIfAbsent(customerId, k -> new ConcurrentLinkedQueue<>()).add(e); }"],
      ex2: ['text', 'a load-test ladder', "threads:      1     2     4     8     16    32\nreq/s:        210   400   760   1300  1500  1350\ninterpretation: near-linear to 8, flattening at 16 (serial fraction), falling at 32 (contention)"],
      deepDive: {
        explain: "Measure the curve, not a point: run load tests at increasing concurrency and plot throughput and latency. A curve that flattens indicates a serial bottleneck; one that bends down indicates contention or coherency costs. JFR (Java Flight Recorder) lock contention events, `jcmd Thread.print`, and async-profiler's lock mode show where threads wait. False sharing is subtle: two `AtomicLong` counters in adjacent fields updated by different threads can be several times slower than padded ones; `LongAdder` pads its cells internally for this reason. Database contention follows the same laws: a single \"last order number\" row updated in every transaction serialises all orders; sequences, UUIDs, or batched allocation remove it. Gustafson's law is the optimistic counterpart: if bigger problems arrive as you add hardware, the parallel portion grows, and scaling looks better than Amdahl's fixed-size analysis.",
        example: ['js', 'Amdahl\'s law speed-up', "function amdahl(p, n) {                      // p: parallel fraction, n: workers\n  return Math.round(1 / ((1 - p) + p / n) * 100) / 100;\n}"],
        tradeoffs: [['Technique', 'Removes', 'Cost'], ['Immutability / confinement', 'Shared mutable state', 'Design effort, allocation'], ['Partitioning (per-key locks, sharding)', 'Global serialisation', 'Complexity; cross-partition operations'], ['Batching', 'Per-item coordination', 'Latency for individual items'], ['Padding / LongAdder', 'False sharing', 'Memory']],
        failures: [['Throughput flat beyond 8 threads', 'Global lock or single-threaded stage', 'Partition or remove the shared state'], ['Throughput drops as threads increase', 'Lock contention, cache-line ping-pong', 'Reduce contention; fewer threads'], ['Order creation serialised', 'Single counter row in the database', 'Sequences or UUIDs'], ['Adding pods does not help', 'Shared downstream bottleneck', 'Find and scale the serial component']],
      },
      warn: "Adding threads or instances cannot fix a serial bottleneck. Find the shared lock, row, or single-threaded stage first, or extra capacity is wasted.",
      production: {
        numbers: "With 95% parallel work, 8 cores give at most 5.93× speed-up and infinite cores 20×; with 50% parallel work, 1,000 cores give about 2×.",
        observe: "Run stepped load tests and plot throughput against concurrency; use JFR lock events and async-profiler to find where threads queue.",
        security: "Serial bottlenecks are denial-of-service amplifiers: an attacker only needs to saturate the narrowest shared resource; rate-limit operations that hit it.",
        checklist: ['Stepped load tests with throughput curves', 'Global locks and singletons reviewed', 'State partitioned or immutable', 'Hot counters use LongAdder', 'Database hot rows eliminated', 'Lock contention profiled with JFR', 'Capacity plans based on measured curves'],
        sources: ['Amdahl, "Validity of the single processor approach to achieving large scale computing capabilities" (AFIPS, 1967)', 'Gunther, "Guerrilla Capacity Planning" (2007): Universal Scalability Law', 'Gustafson, "Reevaluating Amdahl\'s Law" (CACM, 1988)'],
      },
      tip: "Before buying more instances, run a load test at 1, 2, 4, 8, and 16 times concurrency. The shape of the curve tells you whether capacity or a bottleneck is the real problem.",
      faq: [['What does Amdahl\'s law say?', 'The serial fraction limits maximum speed-up.'], ['Speed-up limit with 5% serial work?', '20×.'], ['What is false sharing?', 'Independent variables on one cache line causing contention.'], ['What does the Universal Scalability Law add?', 'Coherency costs that can reduce throughput.'], ['How do you find serial bottlenecks?', 'Stepped load tests plus lock profiling.']],
      ex: { prompt: 'Write amdahl(p, n) returning the speed-up 1 / ((1 − p) + p / n) for parallel fraction p and n workers, rounded to 2 decimals.', fn: 'amdahl', params: 'p, n', sig: '(double p, int n) -> double', java: `class Solution {
    public double amdahl(double p, int n) {
        return Math.round(1 / ((1 - p) + p / n) * 100) / 100.0;
    }
}
`, cases: [{ args: [0.95, 8], expect: 5.93 }, { args: [0.5, 1000], expect: 2 }, { args: [1, 4], expect: 4 }, { args: [0, 16], expect: 1 }], solution: `function amdahl(p,n){return Math.round(1/((1-p)+p/n)*100)/100}`, hint: 'Serial part plus parallel part divided by n.' },
      quiz: [
        choice('jv-cc-8-q1', 'jv-scalability', '50% of request time is under a global lock. Max speed-up with many cores?', ['about 2×', 'unlimited', 'about 10×', 'none at all'], 0, 'Amdahl.'),
        choice('jv-cc-8-q2', 'jv-scalability', 'Throughput falls when going from 16 to 32 threads. Likely cause?', ['contention and coherency costs', 'Amdahl alone', 'too little memory always', 'JIT warm-up'], 0, 'USL.'),
        choice('jv-cc-8-q3', 'jv-scalability', 'Every order updates one "next number" row. Fix?', ['database sequences or UUIDs', 'more app instances', 'bigger thread pool', 'volatile'], 0, 'Hot row.'),
        fill('jv-cc-8-q4', 'jv-scalability', 'Independent hot variables on one cache line suffer false ___', ['sharing'], 'Padding.'),
      ],
    }),
  ],
  exam: [
    choice('jv-cc-e1', 'jv-jmm', 'Which guarantees visibility of a write to a later read in another thread?', ['a happens-before edge such as unlock then lock', 'running on the same CPU', 'Thread.yield', 'a long sleep'], 0, 'JMM.'),
    choice('jv-cc-e2', 'jv-volatile-atomicity', 'volatile int x; x++ from two threads is...', ['not atomic', 'atomic', 'a compile error', 'synchronised'], 0, 'Read-modify-write.'),
    choice('jv-cc-e3', 'jv-locks-deadlock', 'Most reliable deadlock prevention for multiple locks?', ['a global lock order', 'more threads', 'volatile', 'larger heap'], 0, 'No cycles.'),
    choice('jv-cc-e4', 'jv-executors', 'Production thread pool should have...', ['a bounded queue and explicit rejection policy', 'an unbounded queue', 'unbounded threads', 'no names'], 0, 'Predictable.'),
    choice('jv-cc-e5', 'jv-completablefuture', 'Dependent async call after another:', ['thenCompose', 'thenApply', 'anyOf', 'runAsync'], 0, 'Flat-map.'),
    choice('jv-cc-e6', 'jv-sync-utilities', 'Cap concurrent calls to a partner at 10:', ['Semaphore(10)', 'CountDownLatch(10)', 'CyclicBarrier(10)', 'volatile'], 0, 'Permits.'),
    choice('jv-cc-e7', 'jv-atomics-cas', 'compareAndSet succeeds when...', ['the current value equals the expected value', 'always', 'the lock is free', 'the value is null'], 0, 'CAS.'),
    choice('jv-cc-e8', 'jv-scalability', 'Max speed-up when 10% of work is serial?', ['10×', '100×', 'unlimited', '1×'], 0, 'Amdahl.'),
    choice('jv-cc-e9', 'jv-executors', 'Thread pool size for tasks waiting 90 ms per 10 ms CPU on 8 cores?', ['about 80', 'about 8', 'about 800', '1'], 0, 'Goetz formula.'),
    order('jv-cc-e10', 'jv-atomics-cas', 'Order a CAS update loop.', ['Read the current value', 'Compute the new value', 'Attempt compareAndSet', 'Retry from the start if it failed'], 'Optimistic.'),
    order('jv-cc-e11', 'jv-locks-deadlock', 'Order deadlock diagnosis in production.', ['Notice hung requests', 'Take several thread dumps', 'Find BLOCKED threads and the locks they wait for', 'Fix the lock ordering in code'], 'Runbook.'),
    fill('jv-cc-e12', 'jv-jmm', 'The relation guaranteeing visibility in the JMM is happens-___', ['before'], 'Edges.'),
  ],
};
