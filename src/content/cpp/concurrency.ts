import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const cxConcurrency: Chapter = {
  id: 'cx-concurrency',
  title: 'Concurrency: threads, locks, atomics, and the memory model',
  summary: 'Writing correct concurrent C++: std::thread and std::jthread with data races explained, mutexes and deadlock avoidance, condition variables and producer-consumer queues, atomics and compare-and-swap, the C++ memory model with acquire and release, and tasks with std::async, futures, and thread pools. Library status checked as of October 2026: C++20 added jthread, latches, barriers, and semaphores; C++26 adds std::execution (senders and receivers), hazard pointers, and RCU. The in-browser runner has no threads, so exercises model interleavings deterministically.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'cx-cc-1', title: 'Threads and data races', concept: 'cpp-threads-races',
      story: "Until C++11, the C++ standard did not mention threads at all: programs used POSIX threads or Windows APIs, and compilers were free to apply optimisations that broke threaded code. Hans Boehm's 2005 paper \"Threads Cannot Be Implemented as a Library\" showed why that was untenable, and C++11 adopted a memory model and `std::thread`. The central rule it introduced is short and unforgiving: a **data race**, two threads accessing the same memory location without synchronisation where at least one writes, is undefined behaviour.",
      analogy: "Two cashiers updating the same paper ledger: each reads the total, adds their sale in their head, and writes the new total. If they both read before either writes, one sale disappears.",
      timeline: [['1995', 'POSIX threads', 'pthreads standardised (IEEE 1003.1c).'], ['2005', 'Boehm\'s paper', '"Threads Cannot Be Implemented as a Library".'], ['2011', 'C++11', 'std::thread, memory model, atomics, mutexes.'], ['2020', 'C++20', 'std::jthread with automatic join and stop tokens.']],
      explain: "`std::thread t(f, args...)` starts a thread running `f`. Before a `std::thread` object is destroyed you must call **`join()`** (wait for it) or **`detach()`** (let it run independently); destroying a joinable thread calls `std::terminate`. C++20 **`std::jthread`** joins automatically in its destructor and supports cooperative cancellation through `std::stop_token`. Arguments are **copied** into the thread; pass references explicitly with `std::ref`, and make sure referenced objects outlive the thread. A **data race** occurs when two threads access the same memory location concurrently, at least one access is a write, and nothing orders them (no mutex, no atomic, no join). Data races are **undefined behaviour**, not merely wrong answers: the compiler may keep values in registers, merge or reorder accesses, and produce torn reads. The classic symptom is the **lost update**: `counter++` is a read, an add, and a write; if two threads both read 0 before either writes, both write 1 and one increment is lost. Fix by making the shared state atomic, protecting it with a mutex, or not sharing it (each thread accumulates locally, then combine after join). `std::thread::hardware_concurrency()` reports the number of hardware threads as a hint.",
      diagram: "counter = 0; two threads run counter++ once each\nschedule A-read A-write B-read B-write → 2   (correct)\nschedule A-read B-read A-write B-write → 1   (lost update)\n          A: read 0 ─────────── write 1\n          B:        read 0 ─────────── write 1\nrule: concurrent access + at least one write + no synchronisation = data race = UB",
      ex1: ['cpp', 'starting and joining threads (C++20 jthread)', "#include <thread>\nstd::vector<long long> partial(4);\n{\n  std::vector<std::jthread> workers;\n  for (int t = 0; t < 4; ++t)\n    workers.emplace_back([t, &partial] {\n      for (int i = t; i < 1'000'000; i += 4) partial[t] += i;   // no sharing between threads\n    });\n}   // jthreads join here\nlong long total = std::accumulate(partial.begin(), partial.end(), 0LL);"],
      ex2: ['cpp', 'a data race and two fixes', "int counter = 0;                     // racy: UB\nstd::atomic<int> safeCounter{0};     // fix 1: atomic\nstd::mutex m; int guarded = 0;       // fix 2: mutex\nauto work = [&] {\n  for (int i = 0; i < 100'000; ++i) {\n    ++counter;                        // lost updates (and UB)\n    ++safeCounter;                    // always 200000 in total\n    std::lock_guard lk(m); ++guarded; // always 200000 in total\n  }\n};"],
      deepDive: {
        explain: "The C++ memory model defines **happens-before**: within one thread, statements are sequenced; across threads, synchronisation (mutex unlock then lock, atomic release then acquire, thread start and join) creates edges. If two conflicting accesses are not ordered by happens-before, there is a data race. Because data-race-free programs behave as if sequentially consistent (the \"SC for DRF\" guarantee), you only need to reason about interleavings, not hardware reordering, as long as you avoid races. **False sharing** is a performance cousin of races: independent variables on the same 64-byte cache line (like `partial[t]` above) bounce between cores; padding to `std::hardware_destructive_interference_size` (C++17, typically 64) or `alignas(64)` fixes it. `detach()` is rarely right: a detached thread that touches objects destroyed at exit causes crashes during shutdown. Exceptions escaping a thread function call `std::terminate`; capture results or errors through futures. ThreadSanitizer detects data races dynamically with 5–15× overhead.",
        example: ['cpp', 'avoiding false sharing', "struct alignas(64) PaddedCounter { long long value = 0; };   // one per cache line\nstd::vector<PaddedCounter> perThread(8);\n// each thread increments perThread[id].value without contending for a line"],
        tradeoffs: [['Approach', 'Correctness', 'Cost'], ['No sharing (thread-local, combine at end)', 'Simple', 'Memory per thread'], ['std::atomic', 'Correct for single variables', 'Contention on hot counters'], ['Mutex', 'Correct for invariants across variables', 'Blocking; contention'], ['Racy code', 'Undefined behaviour', 'None until it fails']],
        failures: [['Counter total lower than expected', 'Lost updates from a data race', 'Atomic, mutex, or per-thread counters'], ['std::terminate at scope exit', 'Joinable std::thread destroyed', 'join, or use std::jthread'], ['Crash during shutdown', 'Detached thread uses destroyed globals', 'Join threads before exit'], ['Parallel code slower than serial', 'False sharing on adjacent counters', 'Pad to 64 bytes']],
      },
      warn: "A data race is undefined behaviour, not just a wrong number. If two threads touch the same variable and one writes, you need a mutex, an atomic, or a join between them.",
      production: {
        numbers: "Cache lines are 64 bytes on x86-64 and most ARM server cores (128 bytes on Apple M-series for some purposes); ThreadSanitizer costs about 5–15× run time and 5–10× memory.",
        observe: "Run concurrency tests under -fsanitize=thread in CI; measure scalability by thread count; perf c2c finds false sharing on Linux.",
        security: "Races on security state (reference counts, permission flags, buffer lengths) produce time-of-check to time-of-use bugs and use-after-free; they are exploitable, not just flaky.",
        checklist: ['std::jthread or guaranteed join', 'Shared mutable state identified and protected', 'Per-thread accumulation where possible', 'No detached threads touching shared objects', 'False sharing avoided with padding', 'TSan job in CI', 'Thread function exceptions captured'],
        sources: ['Boehm, "Threads Cannot Be Implemented as a Library" (PLDI 2005)', 'Boehm and Adve, "Foundations of the C++ Concurrency Memory Model" (PLDI 2008)', 'cppreference.com: std::thread; std::jthread; Memory model (data races)', 'Williams, "C++ Concurrency in Action" (2nd ed., 2019)'],
      },
      tip: "Before sharing anything between threads, ask whether you can avoid sharing: give each thread its own data and combine results after join.",
      faq: [['What is a data race in C++?', 'Concurrent unsynchronised accesses to the same location where at least one is a write; it is undefined behaviour.'], ['What happens if a joinable std::thread is destroyed?', 'std::terminate is called.'], ['What does std::jthread add?', 'Automatic join in the destructor and stop-token cancellation (C++20).'], ['Why is counter++ not thread-safe?', 'It is a separate read, modify, and write that can interleave.'], ['What is false sharing?', 'Independent variables on one cache line causing cores to contend.']],
      ex: {
        prompt: 'Two threads, A and B, each run counter++ as two steps: first read the shared counter into a register, then write register + 1. schedule is a string of "A" and "B" characters; each character runs the next step of that thread (read, then write, then read again, and so on). The counter starts at 0. Write racyCounter(schedule) returning the final counter value.',
        fn: 'racyCounter', params: 'schedule', sig: '(string schedule) -> int',
        cpp: `class Solution {
public:
    int racyCounter(string schedule) {
        int counter = 0;
        int phase[2] = {0, 0}, reg[2] = {0, 0};
        for (char t : schedule) {
            int i = t == 'A' ? 0 : 1;
            if (phase[i] == 0) { reg[i] = counter; phase[i] = 1; }   // read
            else { counter = reg[i] + 1; phase[i] = 0; }             // write
        }
        return counter;
    }
};
`,
        cases: [{ args: ['AABB'], expect: 2 }, { args: ['ABAB'], expect: 1 }, { args: ['ABBA'], expect: 1 }, { args: ['AABBAABB'], expect: 4 }, { args: ['ABABABAB'], expect: 2 }, { args: [''], expect: 0 }],
        solution: 'function racyCounter(sch){let c=0;const st={A:{p:0,r:0},B:{p:0,r:0}};for(const t of sch){const s=st[t];if(s.p===0){s.r=c;s.p=1}else{c=s.r+1;s.p=0}}return c}',
        hint: 'Track, per thread, whether the next step is a read or a write, and the value it read.',
      },
      quiz: [
        choice('cx-cc-1-q1', 'cpp-threads-races', 'Two threads each do counter++ 1,000 times on a plain int. The result is...', ['undefined behaviour; often less than 2,000', 'always 2,000', 'always 1,000', 'a compile error'], 0, 'Data race.'),
        choice('cx-cc-1-q2', 'cpp-threads-races', 'Destroying a std::thread that was neither joined nor detached...', ['calls std::terminate', 'joins automatically', 'detaches automatically', 'is fine'], 0, 'Use jthread.'),
        choice('cx-cc-1-q3', 'cpp-threads-races', 'Which tool detects data races at run time?', ['ThreadSanitizer', 'AddressSanitizer', 'gprof', 'clang-format'], 0, 'TSan.'),
        fill('cx-cc-1-q4', 'cpp-threads-races', 'The C++20 thread type that joins in its destructor is std::___', ['jthread'], 'Joining thread.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'cx-cc-2', title: 'Mutexes, lock guards, and deadlock', concept: 'cpp-mutexes-deadlock',
      story: "In 1997 the Mars Pathfinder lander kept resetting itself on the Martian surface. Engineers at JPL traced it to priority inversion around a mutex shared by a high-priority bus task and a low-priority meteorological task, and fixed it by uploading a patch that enabled priority inheritance. The episode became the standard story of how locking bugs survive testing and appear only under real timing. Deadlock, two threads each holding one lock and waiting for the other's, is the more common and equally timing-dependent cousin.",
      analogy: "Two people in a narrow corridor each holding a door the other needs, both politely waiting forever. A rule that everyone opens doors in alphabetical order makes the standoff impossible.",
      timeline: [['1965', 'Dijkstra', 'Semaphores and the dining philosophers problem.'], ['1997', 'Mars Pathfinder', 'Priority inversion causes resets; fixed by priority inheritance.'], ['2011', 'C++11', 'std::mutex, lock_guard, unique_lock, std::lock.'], ['2017', 'C++17', 'std::scoped_lock (multiple mutexes, deadlock-free) and shared_mutex.']],
      explain: "A **mutex** provides mutual exclusion: only one thread holds it at a time, and unlocking a mutex **synchronises-with** the next lock of it, so writes made under the lock are visible to the next holder. Always lock through RAII: **`std::lock_guard`** (simple scope lock), **`std::unique_lock`** (movable, can unlock early, needed with condition variables), and **`std::scoped_lock`** (C++17, locks several mutexes at once using a deadlock-avoidance algorithm). **`std::shared_mutex`** allows many readers or one writer. A **deadlock** needs four conditions (Coffman, 1971): mutual exclusion, hold and wait, no preemption, and **circular wait**. The practical fix is to break circular wait: impose a **global lock order** (always lock A before B), lock multiple mutexes together with `std::scoped_lock(a, b)`, or never hold one lock while acquiring another. Model it as a graph: draw an edge from each lock to every lock acquired while holding it; a **cycle** in that graph means a possible deadlock, even if tests have never hit it. Keep critical sections short, never call unknown code (callbacks, virtual functions of other modules) while holding a lock, and do not lock the same `std::mutex` twice in one thread (undefined behaviour; `std::recursive_mutex` exists but usually hides design problems).",
      diagram: "thread 1: lock(A) … lock(B)        lock-order graph\nthread 2: lock(B) … lock(A)         A ──► B\n                                    ▲     │\n                                    └─────┘  cycle → deadlock possible\nfix: global order (A before B) or std::scoped_lock lk(a, b);",
      ex1: ['cpp', 'locking two accounts without deadlock', "struct Account { std::mutex m; long long balance; };\nvoid transfer(Account& from, Account& to, long long amt) {\n  std::scoped_lock lk(from.m, to.m);   // locks both, deadlock-free, in any argument order\n  from.balance -= amt;\n  to.balance += amt;\n}"],
      ex2: ['cpp', 'a reader-writer lock', "class Config {\n  mutable std::shared_mutex m_;\n  std::map<std::string, std::string> values_;\npublic:\n  std::string get(const std::string& k) const {\n    std::shared_lock lk(m_);           // many readers at once\n    auto it = values_.find(k); return it == values_.end() ? \"\" : it->second;\n  }\n  void set(std::string k, std::string v) {\n    std::unique_lock lk(m_);           // one writer\n    values_[std::move(k)] = std::move(v);\n  }\n};"],
      deepDive: {
        explain: "`std::mutex` on Linux is built on futexes: an uncontended lock and unlock are a couple of atomic instructions in user space (tens of nanoseconds), while contention makes threads sleep in the kernel (microseconds). That is why lock **contention**, not locking itself, is what hurts; sharding (one mutex per bucket) or reducing critical-section length scales better than removing locks. `std::scoped_lock` with several mutexes uses `std::lock`, which tries and backs off to avoid deadlock. Lock hierarchies can be enforced at run time in debug builds (assign each mutex a level and assert that levels only increase), and Clang's **Thread Safety Analysis** (`-Wthread-safety` with `GUARDED_BY` and `REQUIRES` annotations, used heavily in Abseil and Chromium) checks lock discipline at compile time. Priority inversion matters on real-time systems; general-purpose OS schedulers mitigate it, and POSIX offers priority-inheritance mutexes. `shared_mutex` helps only for read-mostly data with long reads; for short reads its overhead can exceed a plain mutex.",
        example: ['cpp', 'Clang thread safety annotations', "class Cache {\n  absl::Mutex mu_;\n  std::map<int, std::string> items_ ABSL_GUARDED_BY(mu_);\npublic:\n  void put(int k, std::string v) ABSL_LOCKS_EXCLUDED(mu_) {\n    absl::MutexLock lock(&mu_);\n    items_[k] = std::move(v);   // compiler checks mu_ is held\n  }\n};"],
        tradeoffs: [['Tool', 'Use', 'Note'], ['lock_guard', 'Simple scoped lock', 'Cannot unlock early'], ['unique_lock', 'Condition variables, deferred or early unlock', 'Slightly heavier'], ['scoped_lock', 'Several mutexes at once', 'Deadlock avoidance built in'], ['shared_mutex', 'Read-mostly data with long reads', 'Overhead can exceed mutex for short reads']],
        failures: [['Service hangs under load', 'Deadlock from inconsistent lock order', 'Global order or scoped_lock'], ['Throughput flat as threads increase', 'One hot mutex', 'Shard the data; shorten critical sections'], ['Deadlock from a callback', 'Calling user code while holding a lock', 'Copy data, unlock, then call'], ['Undefined behaviour on relock', 'Same thread locks a std::mutex twice', 'Restructure; avoid recursive locking']],
      },
      warn: "Never acquire locks in different orders in different threads, and never call callbacks or other modules' code while holding a lock.",
      production: {
        numbers: "An uncontended std::mutex lock/unlock pair costs on the order of 20–50 ns on modern x86; a contended one that sleeps costs microseconds plus context switches.",
        observe: "Lock contention profiling (perf lock, mutrace, or Abseil's mutex profiling), thread dumps on hangs (gdb thread apply all bt), and latency histograms around critical sections.",
        security: "Deadlocks are denial-of-service bugs; attackers who can trigger a rare lock order (for example via specific request sequences) can hang a server.",
        checklist: ['RAII locks only', 'Documented global lock order', 'scoped_lock for multiple mutexes', 'No user code under locks', 'Short critical sections', '-Wthread-safety annotations where possible', 'Hang diagnostics (thread dumps) in runbooks'],
        sources: ['Coffman, Elphick, Shoshani, "System Deadlocks" (Computing Surveys, 1971)', 'Jones, "What really happened on Mars?" (1997) and Reeves\' account of Pathfinder', 'cppreference.com: std::mutex; std::scoped_lock; std::shared_mutex', 'Clang documentation: Thread Safety Analysis'],
      },
      tip: "Write the lock order down next to the mutex declarations. If you cannot state it in one sentence, the design is likely to deadlock eventually.",
      faq: [['What are the Coffman conditions?', 'Mutual exclusion, hold and wait, no preemption, and circular wait.'], ['How does std::scoped_lock avoid deadlock?', 'It locks all given mutexes with a deadlock-avoidance algorithm (std::lock).'], ['When use unique_lock instead of lock_guard?', 'With condition variables, or when you need to unlock early or move the lock.'], ['What does a cycle in the lock-order graph mean?', 'A possible deadlock.'], ['Is locking a std::mutex twice in one thread allowed?', 'No; it is undefined behaviour.']],
      ex: {
        prompt: 'Each string describes the order in which one thread acquires nested locks, such as "A>B>C" (lock A, then B while holding A, then C while holding both). Add a directed edge from every lock to every lock acquired later in the same string. Write deadlockRisk(threads) returning true if the resulting lock-order graph has a cycle.',
        fn: 'deadlockRisk', params: 'threads', sig: '(string[] threads) -> bool',
        cpp: `class Solution {
    map<string, set<string>> g;
    map<string, int> color;   // 0 unvisited, 1 on stack, 2 done
    bool dfs(const string& u) {
        color[u] = 1;
        for (const string& v : g[u]) {
            if (color[v] == 1) return true;
            if (color[v] == 0 && dfs(v)) return true;
        }
        color[u] = 2;
        return false;
    }
public:
    bool deadlockRisk(vector<string>& threads) {
        g.clear(); color.clear();
        for (const string& t : threads) {
            vector<string> locks;
            stringstream ss(t);
            string part;
            while (getline(ss, part, '>')) locks.push_back(part);
            for (size_t i = 0; i < locks.size(); i++)
                for (size_t j = i + 1; j < locks.size(); j++) g[locks[i]].insert(locks[j]);
        }
        vector<string> nodes;
        for (auto& kv : g) nodes.push_back(kv.first);
        for (const string& u : nodes) if (color[u] == 0 && dfs(u)) return true;
        return false;
    }
};
`,
        cases: [{ args: [['A>B', 'B>A']], expect: true }, { args: [['A>B', 'A>B']], expect: false }, { args: [['A>B', 'B>C', 'C>A']], expect: true }, { args: [['A', 'B']], expect: false }, { args: [['A>B>C', 'A>C']], expect: false }],
        solution: "function deadlockRisk(th){const g={};for(const t of th){const ls=t.split('>');for(let i=0;i<ls.length;i++)for(let j=i+1;j<ls.length;j++){(g[ls[i]]=g[ls[i]]||new Set()).add(ls[j])}}const color={};const dfs=u=>{color[u]=1;for(const v of (g[u]||[])){if(color[v]===1)return true;if(!color[v]&&dfs(v))return true}color[u]=2;return false};for(const u of Object.keys(g))if(!color[u]&&dfs(u))return true;return false}",
        hint: 'Build the graph, then detect a cycle with depth-first search and three colours.',
      },
      quiz: [
        choice('cx-cc-2-q1', 'cpp-mutexes-deadlock', 'Thread 1 locks A then B; thread 2 locks B then A. This can...', ['deadlock', 'never deadlock', 'only race', 'crash at compile time'], 0, 'Circular wait.'),
        choice('cx-cc-2-q2', 'cpp-mutexes-deadlock', 'Which locks several mutexes without deadlock?', ['std::scoped_lock', 'two lock_guards in any order', 'std::recursive_mutex', 'volatile'], 0, 'std::lock inside.'),
        choice('cx-cc-2-q3', 'cpp-mutexes-deadlock', 'Why avoid calling callbacks while holding a lock?', ['the callback may take other locks and deadlock', 'callbacks are slow', 'it is a compile error', 'mutexes forbid function calls'], 0, 'Unknown lock order.'),
        fill('cx-cc-2-q4', 'cpp-mutexes-deadlock', 'std::___ allows many concurrent readers or one writer.', ['shared_mutex'], 'Reader-writer lock.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'cx-cc-3', title: 'Condition variables and producer-consumer queues', concept: 'cpp-condition-variables',
      story: "C. A. R. Hoare's 1974 paper on monitors introduced condition variables as the way for a thread to wait inside a protected region until some condition becomes true. Real systems later adopted \"Mesa semantics\" (from Xerox PARC's Mesa language, 1980), where a woken thread must re-check its condition because something else may have run first. That single difference explains the most important rule for C++ condition variables: always wait in a loop or with a predicate, because wake-ups can be spurious or stale.",
      analogy: "A condition variable is a restaurant pager. The kitchen buzzes it when food might be ready, but when you reach the counter you still check that it is actually your order; sometimes the pager goes off for nothing.",
      timeline: [['1974', 'Hoare monitors', 'Condition variables inside monitors.'], ['1980', 'Mesa semantics', 'Signalled threads re-check conditions.'], ['2011', 'C++11', 'std::condition_variable and condition_variable_any.'], ['2020', 'C++20', 'std::counting_semaphore, latch, barrier, and atomic wait/notify.']],
      explain: "A **`std::condition_variable`** lets threads sleep until notified. The protocol: lock a `std::unique_lock` on the mutex protecting the shared state, then call **`cv.wait(lock, predicate)`**, which atomically releases the lock while sleeping and re-acquires it before checking the predicate again. The predicate form handles **spurious wake-ups** (allowed by the standard) and **lost wake-ups**: if the condition is already true, it does not wait at all. The notifier changes the shared state **while holding the mutex** (or at least before notifying, under the mutex), then calls `notify_one()` (wake one waiter) or `notify_all()`. A **bounded producer-consumer queue** uses two conditions: producers wait for \"not full\", consumers wait for \"not empty\". Non-blocking variants (`try_push`, `try_pop`) return immediately with a failure instead of waiting, which is useful for back-pressure and shedding load. C++20 adds simpler primitives for common cases: **`std::counting_semaphore`** (permits), **`std::latch`** (one-shot countdown, such as \"wait until N workers are ready\"), **`std::barrier`** (reusable phase synchronisation), and `std::atomic<T>::wait`/`notify_one` for waiting on a value without a mutex.",
      diagram: "consumer                               producer\nunique_lock lk(m);                      { lock_guard lk(m); q.push(x); }\ncv.wait(lk, [&]{ return !q.empty(); });  cv.notify_one();\n  ├─ predicate false → unlock m, sleep\n  ├─ woken (or spuriously) → relock m, re-check predicate\n  └─ predicate true → continue holding m\nx = q.front(); q.pop();",
      ex1: ['cpp', 'a bounded blocking queue', "template <class T> class BoundedQueue {\n  std::mutex m_; std::condition_variable notFull_, notEmpty_;\n  std::deque<T> q_; size_t cap_;\npublic:\n  explicit BoundedQueue(size_t cap) : cap_(cap) {}\n  void push(T x) {\n    std::unique_lock lk(m_);\n    notFull_.wait(lk, [&] { return q_.size() < cap_; });\n    q_.push_back(std::move(x));\n    lk.unlock(); notEmpty_.notify_one();\n  }\n  T pop() {\n    std::unique_lock lk(m_);\n    notEmpty_.wait(lk, [&] { return !q_.empty(); });\n    T x = std::move(q_.front()); q_.pop_front();\n    lk.unlock(); notFull_.notify_one();\n    return x;\n  }\n};"],
      ex2: ['cpp', 'C++20 latch for start-up coordination', "std::latch ready(4);\nstd::vector<std::jthread> ws;\nfor (int i = 0; i < 4; ++i)\n  ws.emplace_back([&] { init(); ready.count_down(); work(); });\nready.wait();   // main continues once all 4 initialised"],
      deepDive: {
        explain: "Without a predicate, `cv.wait(lk)` can return spuriously, and a notification sent before the waiter started waiting is simply lost, which is how programs hang forever in rare timings. The predicate overload is equivalent to `while (!pred()) cv.wait(lk);`. Modifying the shared state without holding the mutex and then notifying is a bug even if the state is atomic: the waiter may check the predicate, the producer may change state and notify, and then the waiter goes to sleep and misses the notification. Notifying after unlocking avoids waking a thread that immediately blocks on the still-held mutex (a \"hurry up and wait\"), and is safe as long as the state change happened under the lock. Bounded queues provide **back-pressure**: when consumers fall behind, producers block or get a failure, instead of memory growing without limit. `std::condition_variable_any` works with any lockable type, including `std::shared_mutex`, and C++20 adds overloads taking a `std::stop_token` so waits can be cancelled by `std::jthread::request_stop()`.",
        example: ['cpp', 'cancellable wait with jthread (C++20)', "std::condition_variable_any cv;\nstd::mutex m; std::deque<Job> jobs;\nstd::jthread worker([&](std::stop_token st) {\n  std::unique_lock lk(m);\n  while (cv.wait(lk, st, [&] { return !jobs.empty(); })) {   // false when stop requested\n    auto j = std::move(jobs.front()); jobs.pop_front();\n    lk.unlock(); run(j); lk.lock();\n  }\n});"],
        tradeoffs: [['Primitive', 'Use for', 'Note'], ['condition_variable', 'Waiting for arbitrary conditions', 'Needs mutex and predicate'], ['counting_semaphore', 'Limiting concurrency (N permits)', 'C++20; no ownership'], ['latch / barrier', 'One-shot or repeated phase sync', 'C++20'], ['atomic wait/notify', 'Waiting on a single value change', 'C++20; no mutex needed']],
        failures: [['Consumer hangs forever occasionally', 'Lost wake-up: wait without predicate', 'Always wait with a predicate'], ['Wakes up with an empty queue', 'Spurious wake-up handled with if instead of while', 'Predicate form'], ['Memory grows until OOM', 'Unbounded queue with slow consumers', 'Bounded queue with back-pressure'], ['Shutdown hangs', 'Waiting threads never told to stop', 'Stop flag in the predicate or stop_token']],
      },
      warn: "Always wait with a predicate (or in a while loop) and change the shared state under the mutex before notifying. Otherwise spurious and lost wake-ups will eventually hang or corrupt your program.",
      production: {
        numbers: "A bounded queue of 10,000 jobs averaging 1 KB caps memory at about 10 MB; an unbounded queue under a 10× traffic spike grows until the process is killed.",
        observe: "Export queue depth, enqueue and dequeue rates, wait times, and rejected try_push counts; alert when depth stays near capacity.",
        security: "Unbounded queues fed by external input are a denial-of-service vector; bound them and reject or shed load when full.",
        checklist: ['wait with predicate', 'State changed under the mutex', 'Bounded queues with back-pressure', 'try_push/try_pop where blocking is wrong', 'Shutdown flag or stop_token in predicates', 'C++20 latch/barrier/semaphore where they fit', 'Queue depth metrics'],
        sources: ['Hoare, "Monitors: An Operating System Structuring Concept" (CACM, 1974)', 'Lampson and Redell, "Experience with Processes and Monitors in Mesa" (CACM, 1980)', 'cppreference.com: std::condition_variable; std::latch; std::counting_semaphore', 'Williams, "C++ Concurrency in Action" (2nd ed.), chapter 4'],
      },
      tip: "Name the condition in words (\"queue not empty\") and put exactly that expression in the wait predicate; most condition-variable bugs come from waiting on something other than the real condition.",
      faq: [['What is a spurious wake-up?', 'A return from wait without a notification; the standard allows it.'], ['Why pass a predicate to wait?', 'To re-check the condition, handling spurious and lost wake-ups.'], ['Why must wait use unique_lock?', 'wait needs to unlock and relock the mutex.'], ['What is back-pressure?', 'Slowing or rejecting producers when consumers fall behind, as a bounded queue does.'], ['What is std::latch for?', 'Waiting until a counter reaches zero once, such as N threads finishing initialisation.']],
      ex: {
        prompt: 'Model a bounded queue with non-blocking operations. ops are "put:<x>" (try_push: if the queue holds capacity items, log "full:<x>" and drop it; otherwise enqueue) and "take" (try_pop: log the front item and remove it, or log "empty"). Write boundedQueue(ops, capacity) returning the log.',
        fn: 'boundedQueue', params: 'ops, capacity', sig: '(string[] ops, int capacity) -> string[]',
        cpp: `class Solution {
public:
    vector<string> boundedQueue(vector<string>& ops, int capacity) {
        deque<string> q;
        vector<string> out;
        for (const string& op : ops) {
            if (op == "take") {
                if (q.empty()) out.push_back("empty");
                else { out.push_back(q.front()); q.pop_front(); }
            } else {
                string v = op.substr(4);
                if ((int)q.size() >= capacity) out.push_back("full:" + v);
                else q.push_back(v);
            }
        }
        return out;
    }
};
`,
        cases: [{ args: [['put:a', 'put:b', 'put:c', 'take', 'take', 'take', 'take'], 2], expect: ['full:c', 'a', 'b', 'empty', 'empty'] }, { args: [['take'], 1], expect: ['empty'] }, { args: [[], 3], expect: [] }],
        solution: "function boundedQueue(ops,cap){const q=[],out=[];for(const op of ops){if(op==='take'){if(!q.length)out.push('empty');else out.push(q.shift())}else{const v=op.split(':')[1];if(q.length>=cap)out.push('full:'+v);else q.push(v)}}return out}",
        hint: 'Use a FIFO; check capacity on put and emptiness on take.',
      },
      quiz: [
        choice('cx-cc-3-q1', 'cpp-condition-variables', 'Why must cv.wait be given a predicate (or used in a loop)?', ['spurious and lost wake-ups', 'it is faster', 'to avoid needing a mutex', 'notify requires it'], 0, 'Mesa semantics.'),
        choice('cx-cc-3-q2', 'cpp-condition-variables', 'Which lock type does condition_variable::wait require?', ['std::unique_lock<std::mutex>', 'std::lock_guard', 'std::scoped_lock', 'no lock'], 0, 'Must unlock and relock.'),
        choice('cx-cc-3-q3', 'cpp-condition-variables', 'What does a bounded queue provide that an unbounded one does not?', ['back-pressure', 'lower latency always', 'lock freedom', 'ordering'], 0, 'Caps memory.'),
        fill('cx-cc-3-q4', 'cpp-condition-variables', 'The C++20 one-shot countdown synchroniser is std::___', ['latch'], 'Latch.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'cx-cc-4', title: 'Atomics and compare-and-swap', concept: 'cpp-atomics',
      story: "Maurice Herlihy's 1991 paper \"Wait-free synchronization\" proved that compare-and-swap is universal: any concurrent data structure can be built from it without locks. CPUs had offered CAS-like instructions since IBM System/370 (1970), and x86 added `CMPXCHG` with the 486. C++11's `std::atomic` made these instructions portable. The lesson every engineer learns afterwards is that lock-free code is far harder to get right than locked code, and not always faster, so atomics are best used for counters, flags, and well-tested library structures.",
      analogy: "Compare-and-swap is updating a shared whiteboard with the rule \"only write the new number if the board still shows the number I last saw\". If someone changed it meanwhile, you read the new number and try again.",
      timeline: [['1970', 'System/370 CS', 'Compare-and-swap instruction in hardware.'], ['1991', 'Herlihy', 'Wait-free synchronisation; CAS is universal.'], ['2011', 'C++11 atomics', 'std::atomic, memory orders, compare_exchange.'], ['2020–2026', 'Extensions', 'C++20 atomic_ref, atomic wait/notify, atomic<shared_ptr>; C++26 hazard pointers and RCU.']],
      explain: "`std::atomic<T>` makes individual operations on a variable indivisible and race-free: `load`, `store`, `exchange`, `fetch_add`, `fetch_sub`, `fetch_or`, and **`compare_exchange_weak/strong(expected, desired)`**. CAS semantics: if the current value equals `expected`, store `desired` and return true; otherwise **write the current value into `expected`** and return false, so a retry loop has the fresh value without another load. The **weak** version may fail spuriously (cheaper on LL/SC architectures such as ARM) and belongs in loops; **strong** fails only when values differ. `++counter` on an atomic is a single `fetch_add` and cannot lose updates. Atomics are **lock-free** for sizes the hardware supports (`is_always_lock_free`); larger types fall back to internal locks. Operations default to `memory_order_seq_cst`, the safest ordering (next lesson). Typical uses: counters and statistics, flags (`std::atomic<bool>` stop requests), reference counts, sequence numbers, and pointers in lock-free structures. Pitfalls: a sequence of atomic operations is not atomic as a whole (check-then-act races); **ABA** (a value changes from A to B and back to A, so CAS succeeds incorrectly) in lock-free stacks; and heavy contention on one atomic counter, which bounces a cache line between cores.",
      diagram: "atomic<int> v = 5;\nexpected = 5; v.compare_exchange_strong(expected, 6)  → true,  v = 6\nexpected = 5; v.compare_exchange_strong(expected, 7)  → false, expected ← 6\nexpected = 6; v.compare_exchange_strong(expected, 8)  → true,  v = 8\nCAS loop:  T old = v.load();\n           while (!v.compare_exchange_weak(old, f(old))) {}   // old refreshed on failure",
      ex1: ['cpp', 'an atomic maximum with a CAS loop', "std::atomic<int> best{0};\nvoid record(int x) {\n  int cur = best.load();\n  while (x > cur && !best.compare_exchange_weak(cur, x)) {\n    // cur now holds the latest value; loop re-checks x > cur\n  }\n}"],
      ex2: ['cpp', 'check-then-act is still a race', "std::atomic<int> stock{1};\n// racy: two threads can both see 1 and both decrement\nif (stock.load() > 0) stock.fetch_sub(1);\n// correct: decide and act in one atomic step\nint s = stock.load();\nwhile (s > 0 && !stock.compare_exchange_weak(s, s - 1)) {}"],
      deepDive: {
        explain: "On x86-64, an atomic load or store with seq_cst ordering compiles to an ordinary `mov` for loads and an `xchg` (or `mov` plus `mfence`) for stores, and read-modify-writes use `lock`-prefixed instructions (`lock xadd`, `lock cmpxchg`) costing roughly 10–20 cycles uncontended. On ARMv8.1+ there are single-instruction atomics (LSE), while older ARM uses load-linked/store-conditional loops, which is where `compare_exchange_weak` spurious failure comes from. **Contention** is the real cost: when many cores hammer one atomic, its cache line migrates constantly and throughput can drop below a single core's; sharded counters (per-thread or per-core slots summed on read) fix it. `std::atomic_ref` (C++20) applies atomic operations to an existing non-atomic object. Lock-free structures must solve **memory reclamation** (when is it safe to free a node another thread might be reading?); C++26 standardises **hazard pointers** and **RCU** for this. Use `std::atomic<std::shared_ptr<T>>` (C++20) to publish immutable snapshots safely.",
        example: ['cpp', 'a sharded counter that scales', "struct alignas(64) Slot { std::atomic<long long> n{0}; };\nstd::array<Slot, 64> slots;\nvoid inc(size_t threadId) { slots[threadId % 64].n.fetch_add(1, std::memory_order_relaxed); }\nlong long total() { long long t = 0; for (auto& s : slots) t += s.n.load(std::memory_order_relaxed); return t; }"],
        tradeoffs: [['Tool', 'Good for', 'Watch out for'], ['std::atomic counter', 'Statistics, ids, flags', 'Contention on hot lines'], ['CAS loop', 'Lock-free updates of one value', 'Starvation, ABA, complexity'], ['Mutex', 'Invariants spanning several variables', 'Blocking'], ['Sharded atomics', 'High-rate counters', 'Reads sum many slots']],
        failures: [['Two threads both claim the last item', 'Check-then-act across separate atomic operations', 'Single CAS or a mutex'], ['Lock-free stack corrupts nodes', 'ABA problem or premature free', 'Tagged pointers, hazard pointers, or a mutex'], ['Atomic counter is a bottleneck', 'Cache-line contention', 'Shard per thread'], ['Large atomic<T> is slow', 'Not lock-free; uses a hidden lock', 'Check is_always_lock_free']],
      },
      warn: "A sequence of atomic operations is not atomic as a whole. Checking a value and then acting on it with separate atomic calls is still a race; combine them in one compare-and-swap or use a mutex.",
      production: {
        numbers: "An uncontended lock-prefixed atomic increment costs roughly 10–20 CPU cycles on x86-64; under heavy contention from many cores it can cost hundreds of cycles per operation as the cache line migrates.",
        observe: "Profile with perf c2c or hardware counters for cache-line contention; static_assert(std::atomic<T>::is_always_lock_free) for types assumed lock-free.",
        security: "Reference counts must be atomic; non-atomic or racy counts lead to double frees and use-after-free, which are exploitable.",
        checklist: ['Atomics for single variables only', 'Invariants across variables under a mutex', 'compare_exchange_weak in loops', 'No check-then-act races', 'Sharded counters for hot paths', 'is_always_lock_free checked', 'Lock-free structures from tested libraries'],
        sources: ['Herlihy, "Wait-Free Synchronization" (TOPLAS, 1991)', 'cppreference.com: std::atomic; compare_exchange; std::atomic_ref', 'Williams, "C++ Concurrency in Action" (2nd ed.), chapters 5 and 7', 'P2530 "Hazard Pointers" and P2545 "Read-Copy Update" (C++26)'],
      },
      tip: "Use atomics for counters and flags; reach for a mutex as soon as two variables must change together.",
      faq: [['What does compare_exchange do on failure?', 'Returns false and writes the current value into expected.'], ['Difference between weak and strong CAS?', 'Weak may fail spuriously and belongs in loops; strong fails only on a real mismatch.'], ['Is ++ on std::atomic<int> safe?', 'Yes; it is an atomic fetch_add.'], ['What is the ABA problem?', 'A value changes A to B to A, so a CAS succeeds although the state changed.'], ['When is std::atomic<T> not lock-free?', 'When T is too large or unaligned for hardware atomics; check is_always_lock_free.']],
      ex: {
        prompt: 'Simulate compare_exchange_strong on an atomic int starting at initial. Each op is "cas:<expected>:<desired>": if the current value equals expected, set it to desired and log "true"; otherwise log "false:<current>" (the value written back into expected). Finally append "final:<value>". Write casOps(initial, ops).',
        fn: 'casOps', params: 'initial, ops', sig: '(int initial, string[] ops) -> string[]',
        cpp: `class Solution {
public:
    vector<string> casOps(int initial, vector<string>& ops) {
        int v = initial;
        vector<string> out;
        for (const string& op : ops) {
            size_t a = op.find(':'), b = op.find(':', a + 1);
            int expected = stoi(op.substr(a + 1, b - a - 1)), desired = stoi(op.substr(b + 1));
            if (v == expected) { v = desired; out.push_back("true"); }
            else out.push_back("false:" + to_string(v));
        }
        out.push_back("final:" + to_string(v));
        return out;
    }
};
`,
        cases: [{ args: [5, ['cas:5:6', 'cas:5:7', 'cas:6:8']], expect: ['true', 'false:6', 'true', 'final:8'] }, { args: [0, []], expect: ['final:0'] }, { args: [1, ['cas:2:3']], expect: ['false:1', 'final:1'] }],
        solution: "function casOps(init,ops){let v=init;const out=[];for(const op of ops){const[,e,d]=op.split(':').map(Number);if(v===e){v=d;out.push('true')}else out.push('false:'+v)}out.push('final:'+v);return out}",
        hint: 'Compare, then either swap or report the current value.',
      },
      quiz: [
        choice('cx-cc-4-q1', 'cpp-atomics', 'v is 6. expected = 5; v.compare_exchange_strong(expected, 7) leaves...', ['v = 6, expected = 6, returns false', 'v = 7', 'v = 5', 'expected = 7'], 0, 'Failure refreshes expected.'),
        choice('cx-cc-4-q2', 'cpp-atomics', 'Where should compare_exchange_weak be used?', ['inside a retry loop', 'for one-shot checks', 'never', 'only on x86'], 0, 'Spurious failures.'),
        choice('cx-cc-4-q3', 'cpp-atomics', 'Two variables must change together consistently. Use...', ['a mutex', 'two atomics', 'volatile', 'relaxed atomics'], 0, 'Invariant.'),
        fill('cx-cc-4-q4', 'cpp-atomics', 'A CAS succeeding after a value changed from A to B and back to A is the ___ problem.', ['ABA'], 'ABA.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'cx-cc-5', title: 'The memory model: ordering, acquire, and release', concept: 'cpp-memory-model',
      story: "Modern CPUs and compilers reorder memory operations aggressively: store buffers delay writes, out-of-order cores execute loads early, and optimisers move code. On a single thread none of this is visible, but across threads it is. Leslie Lamport defined **sequential consistency** in 1979 as the intuitive model; real hardware such as ARM and POWER is much weaker. The C++11 memory model, built by Hans Boehm, Sarita Adve, and others, gave programmers a portable contract: memory orders on atomic operations say exactly which reorderings are forbidden.",
      analogy: "Release and acquire are a relay baton. The runner finishing a leg (release) hands over the baton only after everything in their leg is done; the next runner (acquire) who takes the baton is guaranteed to see all of it. A relaxed handover is tossing the baton without checking: it arrives, but there is no promise about what else has happened.",
      timeline: [['1979', 'Lamport', 'Sequential consistency defined.'], ['2008', 'Boehm and Adve', 'Foundations of the C++ concurrency memory model.'], ['2011', 'C++11', 'memory_order: relaxed, consume, acquire, release, acq_rel, seq_cst.'], ['2020s', 'consume', 'Compilers treat consume as acquire; the committee has moved to deprecate it.']],
      explain: "Each atomic operation takes a **memory order**. **`memory_order_relaxed`**: atomicity only, no ordering with other memory; fine for counters and statistics. **`release`** (on stores): all memory writes before it in this thread become visible to a thread that **acquires** the same atomic and reads the stored value. **`acquire`** (on loads): reads and writes after it cannot move before it. Together they create a **synchronises-with** edge and thus **happens-before**, which is how you publish data: write the payload with plain stores, then `ready.store(true, release)`; the reader does `while (!ready.load(acquire)) {}` and then safely reads the payload. **`acq_rel`** combines both for read-modify-writes. **`seq_cst`** (the default) adds a single global order of all seq_cst operations, which is easiest to reason about and costs a full fence on stores on x86 and barriers on ARM. If either side of the publication is relaxed, the reader may see `ready == true` and still read **stale payload** data. Mutexes give you acquire on lock and release on unlock automatically. **`volatile` is not a synchronisation tool** in C++: it prevents some compiler optimisations for memory-mapped I/O but provides neither atomicity nor ordering between threads.",
      diagram: "writer thread                        reader thread\ndata = 42;              (plain)      while (!ready.load(acquire)) {}\nready.store(true, release); ───────► sees true  ── synchronises-with ──►\n                                     assert(data == 42);   // guaranteed\nrelaxed on either side → no synchronises-with → data may read stale\nx86: acquire/release are free (ordinary mov); ARM: ldar/stlr instructions",
      ex1: ['cpp', 'publishing data with release and acquire', "std::string payload;\nstd::atomic<bool> ready{false};\nvoid producer() {\n  payload = \"hello\";                                // plain write\n  ready.store(true, std::memory_order_release);     // publish\n}\nvoid consumer() {\n  while (!ready.load(std::memory_order_acquire)) {} // wait for publication\n  assert(payload == \"hello\");                       // guaranteed visible\n}"],
      ex2: ['cpp', 'relaxed is fine for independent counters', "std::atomic<long long> requests{0};\nvoid onRequest() { requests.fetch_add(1, std::memory_order_relaxed); }   // only the count matters\n// reading requests later gives an exact total once all threads have joined"],
      deepDive: {
        explain: "x86-64 is a relatively strong model (TSO): loads are not reordered with loads, stores not with stores, and the only visible hardware reordering is a store followed by a load to a different location. So acquire loads and release stores compile to plain `mov`s, while seq_cst stores need `xchg` or `mfence`. ARMv8 and POWER are weaker; ARMv8 has dedicated `ldar`/`stlr` instructions that make acquire/release cheap. Code with relaxed orderings that \"works on x86\" often breaks on ARM servers and Apple Silicon, which is a common porting bug. Litmus tests (message passing, store buffering, IRIW) define what each order allows; tools such as CppMem and herd7 explore them. **Fences** (`std::atomic_thread_fence`) can establish ordering for several relaxed operations at once. The double-checked locking pattern for lazy initialisation is broken without proper ordering; in C++11 and later, **function-local statics are initialised thread-safely** (\"magic statics\"), and `std::call_once` exists for other cases, so you rarely need to hand-roll it. Rule of thumb: use seq_cst until profiling proves the cost matters, and then only with expert review and tests on weak hardware.",
        example: ['cpp', 'thread-safe lazy initialisation without hand-written atomics', "Config& config() {\n  static Config instance = loadConfig();   // initialised once, thread-safe since C++11\n  return instance;\n}"],
        tradeoffs: [['Order', 'Guarantees', 'Use for'], ['relaxed', 'Atomicity only', 'Counters, statistics'], ['release / acquire', 'Publication: writes before release visible after acquire', 'Flags, queues, handoffs'], ['acq_rel', 'Both, for read-modify-write', 'Lock-free structures'], ['seq_cst (default)', 'Single global order', 'Default; simplest reasoning']],
        failures: [['Reader sees the flag but stale data', 'Relaxed store or load on the publication flag', 'release store and acquire load'], ['Works on x86, fails on ARM', 'Relied on x86\'s strong ordering', 'Correct memory orders; test on ARM'], ['Busy loop never exits', 'Plain bool flag optimised into a register', 'std::atomic<bool>'], ['volatile used for thread signalling', 'Misunderstanding volatile', 'std::atomic']],
      },
      warn: "volatile does not make code thread-safe. Use std::atomic (or a mutex) for any variable shared between threads.",
      production: {
        numbers: "On x86-64, acquire loads and release stores cost the same as ordinary loads and stores; a seq_cst store adds a full fence (xchg or mfence), typically tens of cycles.",
        observe: "Run concurrency tests on ARM hardware (Graviton, Ampere, Apple Silicon) as well as x86; ThreadSanitizer understands the C++ memory model and reports races on non-atomic data.",
        security: "Publication bugs can expose partially initialised objects to other threads, for example a request handler reading a half-written configuration or credentials.",
        checklist: ['seq_cst by default', 'release/acquire pairs for publication', 'relaxed only for independent counters', 'No volatile for synchronisation', 'Function-local statics or call_once for lazy init', 'Tests on weakly ordered hardware', 'Expert review for any relaxed or lock-free code'],
        sources: ['Lamport, "How to Make a Multiprocessor Computer That Correctly Executes Multiprocess Programs" (1979)', 'Boehm and Adve, "Foundations of the C++ Concurrency Memory Model" (PLDI 2008)', 'cppreference.com: std::memory_order', 'Preshing, "Acquire and Release Semantics" (2012)'],
      },
      tip: "When you see a relaxed atomic used as a ready flag, assume a bug until someone explains which acquire pairs with which release.",
      faq: [['What does release on a store guarantee?', 'Writes before it become visible to a thread that acquires the same atomic and reads that value.'], ['When is relaxed ordering enough?', 'When only the atomic value itself matters, such as counters.'], ['What is the default memory order?', 'memory_order_seq_cst.'], ['Is volatile enough for thread communication?', 'No; it provides neither atomicity nor inter-thread ordering.'], ['Are function-local statics initialised thread-safely?', 'Yes, since C++11.']],
      ex: {
        prompt: 'A writer stores data, then sets an atomic flag with storeOrder; a reader loads the flag with loadOrder, sees true, then reads data. Write canSeeStale(storeOrder, loadOrder) returning true if the reader may still see stale data. Orders are "relaxed", "release", "acquire", or "seq_cst". Publication is guaranteed only when the store is release or seq_cst and the load is acquire or seq_cst.',
        fn: 'canSeeStale', params: 'storeOrder, loadOrder', sig: '(string storeOrder, string loadOrder) -> bool',
        cpp: `class Solution {
public:
    bool canSeeStale(string storeOrder, string loadOrder) {
        bool releases = storeOrder == "release" || storeOrder == "seq_cst";
        bool acquires = loadOrder == "acquire" || loadOrder == "seq_cst";
        return !(releases && acquires);
    }
};
`,
        cases: [{ args: ['relaxed', 'relaxed'], expect: true }, { args: ['release', 'acquire'], expect: false }, { args: ['release', 'relaxed'], expect: true }, { args: ['seq_cst', 'seq_cst'], expect: false }, { args: ['relaxed', 'acquire'], expect: true }, { args: ['seq_cst', 'acquire'], expect: false }],
        solution: "function canSeeStale(s,l){const rel=s==='release'||s==='seq_cst';const acq=l==='acquire'||l==='seq_cst';return !(rel&&acq)}",
        hint: 'Both sides must participate: a releasing store and an acquiring load.',
      },
      quiz: [
        choice('cx-cc-5-q1', 'cpp-memory-model', 'Writer: data = 1; flag.store(true, relaxed). Reader: if (flag.load(acquire)) read data. Is data == 1 guaranteed?', ['no', 'yes', 'only on ARM', 'only with -O0'], 0, 'Store must be release.'),
        choice('cx-cc-5-q2', 'cpp-memory-model', 'Which order is fine for a statistics counter?', ['relaxed', 'consume', 'acquire only', 'volatile'], 0, 'Independent value.'),
        choice('cx-cc-5-q3', 'cpp-memory-model', 'Relaxed-ordering bugs most often surface when code moves from x86 to...', ['ARM', 'a faster x86', 'a debug build', 'Windows'], 0, 'Weaker hardware model.'),
        fill('cx-cc-5-q4', 'cpp-memory-model', 'A release store paired with an acquire load that reads its value creates a synchronises-___ edge.', ['with'], 'Happens-before.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'cx-cc-6', title: 'Tasks: std::async, futures, and thread pools', concept: 'cpp-async-tasks',
      story: "Creating a thread per task is simple and scales badly: each thread costs a stack (megabytes reserved) and a kernel object, and oversubscribing cores makes everything slower. Thread pools, popularised by Java's `ExecutorService` (2004) and Intel TBB (2006), keep a fixed set of workers pulling tasks from queues. C++11 added `std::async` and futures as a minimal task API; C++26 standardises `std::execution` (senders and receivers, P2300), a framework for composing asynchronous work on schedulers, adopted in June 2024.",
      analogy: "A thread pool is a taxi rank: a fixed number of cars take passengers in turn. Hiring a new car for every passenger (a thread per task) clogs the roads.",
      timeline: [['2004', 'Java executors', 'java.util.concurrent thread pools.'], ['2006', 'Intel TBB', 'Work-stealing task scheduler for C++.'], ['2011', 'C++11', 'std::async, std::future, std::promise, std::packaged_task.'], ['2024–2026', 'std::execution', 'P2300 senders/receivers adopted for C++26.']],
      explain: "**`std::async(std::launch::async, f, args...)`** runs `f` on a new thread and returns a **`std::future<R>`**; `future.get()` waits and returns the result or rethrows the exception. Without an explicit policy, the implementation may run it **deferred** (lazily on `get()` in the calling thread). The future returned by `std::async` **blocks in its destructor** until the task finishes, so `std::async(f);` without keeping the future runs synchronously. **`std::promise<T>`** lets you set a future's value from any thread; **`std::packaged_task`** wraps a callable whose result goes into a future. For many short tasks, use a **thread pool**: N workers (usually `hardware_concurrency()` for CPU-bound work, more for I/O-bound) take tasks from a shared queue or per-worker deques with **work stealing**. Scheduling matters: a greedy pool assigns each task to the next free worker, and the total time (**makespan**) depends on task order and size; one long task at the end leaves other workers idle. In production C++ the common choices are Intel oneTBB, Folly executors, Boost.Asio for I/O, Taskflow, or the coming `std::execution`. C++20 **coroutines** add language support for asynchronous code (`co_await`), used with libraries such as Asio or cppcoro.",
      diagram: "tasks 4 2 3 1 on 2 workers (each task to the earliest-free worker)\nworker 0: [4---]      [1]   → finishes at 5\nworker 1: [2-][3--]         → finishes at 5\nmakespan = 5\ntasks 1 1 1 1 10 on 2 workers → [1][1][10………] and [1][1] → makespan 12 (put long tasks first: 10 vs 4 → 10)",
      ex1: ['cpp', 'async and futures', "auto f1 = std::async(std::launch::async, [] { return countWords(\"a.txt\"); });\nauto f2 = std::async(std::launch::async, [] { return countWords(\"b.txt\"); });\nint total = f1.get() + f2.get();   // waits; rethrows exceptions from the tasks"],
      ex2: ['cpp', 'a minimal thread pool', "class Pool {\n  std::mutex m_; std::condition_variable cv_;\n  std::deque<std::function<void()>> q_; bool stop_ = false;\n  std::vector<std::jthread> ws_;\npublic:\n  explicit Pool(unsigned n) {\n    for (unsigned i = 0; i < n; ++i) ws_.emplace_back([this] {\n      for (;;) {\n        std::function<void()> job;\n        { std::unique_lock lk(m_); cv_.wait(lk, [&] { return stop_ || !q_.empty(); });\n          if (stop_ && q_.empty()) return; job = std::move(q_.front()); q_.pop_front(); }\n        job();\n      }\n    });\n  }\n  void submit(std::function<void()> f) { { std::lock_guard lk(m_); q_.push_back(std::move(f)); } cv_.notify_one(); }\n  ~Pool() { { std::lock_guard lk(m_); stop_ = true; } cv_.notify_all(); }   // jthreads join\n};"],
      deepDive: {
        explain: "Greedy list scheduling (assign each task to the least-loaded worker) is within a factor of 2 − 1/m of optimal (Graham, 1966), and sorting tasks longest-first (LPT) improves the bound to 4/3 − 1/(3m). Real pools add **work stealing**: each worker has its own deque, pushes and pops at one end, and idle workers steal from the other end of busy workers' deques, which balances load with little contention (Cilk, TBB, Java ForkJoinPool). Pool sizing: CPU-bound work wants about one worker per core; I/O-bound work wants more workers or, better, asynchronous I/O (Asio, io_uring) so threads do not block. **Never block inside a pool task waiting for another task in the same pool**: if all workers wait, nothing runs (pool-induced deadlock). Futures from `std::async` lack continuations (`then`), which is why libraries and `std::execution` exist; senders describe work as composable values (`schedule(sched) | then(f) | let_value(g)`) that a scheduler runs. Exceptions crossing threads travel through futures (`std::exception_ptr`), and cancellation uses stop tokens.",
        example: ['cpp', 'std::execution style (C++26, simplified)', "namespace ex = std::execution;\nauto work = ex::schedule(pool.get_scheduler())\n          | ex::then([] { return loadImage(\"a.png\"); })\n          | ex::then([](Image img) { return resize(img, 256); });\nauto [thumb] = std::this_thread::sync_wait(std::move(work)).value();"],
        tradeoffs: [['Approach', 'Strength', 'Weakness'], ['Thread per task', 'Simple', 'Expensive threads; oversubscription'], ['std::async', 'One line; exception propagation', 'No pool guarantees; blocking future destructor'], ['Thread pool / work stealing', 'Reuses threads; balances load', 'Must avoid blocking inside tasks'], ['Async I/O + coroutines', 'Scales to many connections', 'Library choice; complexity']],
        failures: [['std::async call runs synchronously', 'Discarded future blocks in its destructor', 'Keep the future and call get later'], ['Pool stops making progress', 'Tasks block waiting for other tasks in the same pool', 'Do not block; use continuations'], ['CPU at 100% but throughput low', 'Too many threads, context switching', 'Size the pool to cores'], ['One slow task dominates latency', 'Long task scheduled last', 'Longest first, split big tasks']],
      },
      warn: "Never block a pool worker waiting for another task submitted to the same pool. When every worker waits, the pool deadlocks.",
      production: {
        numbers: "Each Linux thread reserves an 8 MB stack by default (virtual memory) plus kernel structures; 10,000 threads reserve about 80 GB of address space, which is why pools with tens of workers serve thousands of tasks.",
        observe: "Pool queue depth, task wait time versus run time, worker utilisation, and rejected submissions; trace long tasks.",
        security: "Unbounded task queues fed by requests are a denial-of-service vector; bound the queue, set per-task timeouts, and shed load.",
        checklist: ['Pool sized to cores for CPU work', 'Async I/O instead of blocking threads', 'Futures kept and awaited', 'No blocking waits inside pool tasks', 'Bounded task queues', 'Long tasks split or scheduled first', 'Exceptions captured through futures'],
        sources: ['cppreference.com: std::async; std::future; std::promise', 'P2300R10 "std::execution" (adopted for C++26, June 2024)', 'Graham, "Bounds for Certain Multiprocessing Anomalies" (1966)', 'Blumofe and Leiserson, "Scheduling Multithreaded Computations by Work Stealing" (1999)'],
      },
      tip: "Measure task sizes. A pool with a few huge tasks behaves like a single thread at the end of a batch; split work into many similar-sized pieces.",
      faq: [['What does future.get() do?', 'Waits for the result and returns it, or rethrows the task\'s exception.'], ['Why can std::async(f); be synchronous?', 'The discarded future\'s destructor blocks until the task finishes.'], ['How many workers for CPU-bound work?', 'About one per hardware thread.'], ['What is work stealing?', 'Idle workers take tasks from other workers\' queues.'], ['What does C++26 std::execution provide?', 'Senders and receivers: a model for composing asynchronous work on schedulers.']],
      ex: {
        prompt: 'Simulate a pool of k workers that takes tasks in order and gives each to the worker that becomes free earliest (lowest index on ties). tasks are durations. Write makespan(tasks, k) returning the time when all tasks are done (0 if there are none).',
        fn: 'makespan', params: 'tasks, k', sig: '(int[] tasks, int k) -> int',
        cpp: `class Solution {
public:
    int makespan(vector<int>& tasks, int k) {
        vector<int> busyUntil(k, 0);
        for (int t : tasks) {
            int i = (int)(min_element(busyUntil.begin(), busyUntil.end()) - busyUntil.begin());
            busyUntil[i] += t;
        }
        return *max_element(busyUntil.begin(), busyUntil.end());
    }
};
`,
        cases: [{ args: [[4, 2, 3, 1], 2], expect: 5 }, { args: [[5, 5, 5], 3], expect: 5 }, { args: [[], 4], expect: 0 }, { args: [[1, 1, 1, 1, 10], 2], expect: 12 }],
        solution: 'function makespan(tasks,k){const w=new Array(k).fill(0);for(const t of tasks){let i=0;for(let j=1;j<k;j++)if(w[j]<w[i])i=j;w[i]+=t}return Math.max(0,...w)}',
        hint: 'Track when each worker becomes free; always give the next task to the minimum.',
      },
      quiz: [
        choice('cx-cc-6-q1', 'cpp-async-tasks', 'What does future.get() do if the task threw?', ['rethrows the exception', 'returns a default value', 'terminates', 'returns null'], 0, 'Exception propagation.'),
        choice('cx-cc-6-q2', 'cpp-async-tasks', 'Main reason to use a thread pool instead of a thread per task:', ['reuse a bounded set of threads', 'threads are not allowed', 'pools avoid all locks', 'futures require pools'], 0, 'Cost and oversubscription.'),
        choice('cx-cc-6-q3', 'cpp-async-tasks', 'All pool workers wait on futures of tasks queued in the same pool. Result:', ['deadlock', 'faster completion', 'automatic new threads', 'a compile error'], 0, 'Pool-induced deadlock.'),
        fill('cx-cc-6-q4', 'cpp-async-tasks', 'Idle workers taking tasks from busy workers\' queues is called work ___', ['stealing'], 'Load balancing.'),
      ],
    }),
  ],
  exam: [
    choice('cx-cc-e1', 'cpp-threads-races', 'A data race in C++ is...', ['undefined behaviour', 'a guaranteed lost update only', 'a compile error', 'harmless on x86'], 0, 'UB.'),
    choice('cx-cc-e2', 'cpp-threads-races', 'Best way to sum a big array in parallel:', ['each thread sums its own part, combine after join', 'all threads add to one int', 'all threads add to one atomic in a tight loop', 'use volatile'], 0, 'No sharing.'),
    choice('cx-cc-e3', 'cpp-mutexes-deadlock', 'Which breaks the circular-wait condition?', ['a global lock order', 'more threads', 'recursive mutexes', 'longer critical sections'], 0, 'Ordering.'),
    choice('cx-cc-e4', 'cpp-condition-variables', 'Correct way to wait for a non-empty queue:', ['cv.wait(lk, [&]{ return !q.empty(); })', 'if (q.empty()) cv.wait(lk);', 'while (q.empty()) {} (spin)', 'sleep(1)'], 0, 'Predicate.'),
    choice('cx-cc-e5', 'cpp-atomics', 'compare_exchange fails. The expected argument now holds...', ['the current value', 'the desired value', 'zero', 'its old value unchanged'], 0, 'Refreshed.'),
    choice('cx-cc-e6', 'cpp-atomics', 'if (stock.load() > 0) stock.fetch_sub(1); with two threads is...', ['a check-then-act race', 'correct', 'deadlock-prone', 'a compile error'], 0, 'Use CAS.'),
    choice('cx-cc-e7', 'cpp-memory-model', 'Publishing data safely needs...', ['a release store and an acquire load on the flag', 'two relaxed operations', 'volatile', 'a sleep'], 0, 'Synchronises-with.'),
    choice('cx-cc-e8', 'cpp-memory-model', 'Default memory order of std::atomic operations:', ['seq_cst', 'relaxed', 'acquire', 'consume'], 0, 'Safest.'),
    choice('cx-cc-e9', 'cpp-async-tasks', 'std::async(f); with the future discarded...', ['blocks until f finishes', 'runs f later', 'never runs f', 'detaches f'], 0, 'Blocking destructor.'),
    choice('cx-cc-e10', 'cpp-async-tasks', 'C++26 standardises asynchronous composition with...', ['std::execution (senders and receivers)', 'std::thread_pool', 'std::coroutine_pool', 'std::future::then'], 0, 'P2300.'),
    order('cx-cc-e11', 'cpp-condition-variables', 'Order a correct producer step for a condition-variable queue.', ['Lock the mutex', 'Push the item into the queue', 'Unlock the mutex', 'Call notify_one()'], 'Change state under the lock, then notify.'),
    fill('cx-cc-e12', 'cpp-mutexes-deadlock', 'The C++17 RAII lock that locks several mutexes without deadlock is std::___', ['scoped_lock'], 'scoped_lock.'),
  ],
};
