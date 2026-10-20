import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const cxMemory: Chapter = {
  id: 'cx-memory',
  title: 'Memory and ownership',
  summary: 'How C++ programs manage memory without a garbage collector: the stack and the heap, RAII and deterministic destruction, unique ownership with std::unique_ptr, shared ownership and cycles with std::shared_ptr and std::weak_ptr, the rule of zero, three, and five, and the classic memory bugs with the tools that find them. Library behaviour checked against cppreference and the C++ Core Guidelines as of October 2026.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'cx-me-1', title: 'The stack, the heap, and object lifetime', concept: 'cpp-stack-heap',
      story: "Early C programmers learned about the stack the hard way: in 1988 the Morris worm spread partly by overflowing a 512-byte stack buffer in the `fingerd` daemon, overwriting the return address. The stack is fast because it is simple: a function call moves one pointer down, a return moves it back. The heap is flexible because it is not: `malloc` and `new` search free lists, take locks or per-thread caches, and leave you responsible for giving the memory back. C++ code is fast when most objects live on the stack or inside other objects, and the heap is used deliberately.",
      analogy: "The stack is a pile of cafeteria trays: you always take and return the top one, instantly. The heap is a self-storage facility: you can rent any size for any duration, but someone has to find a unit, keep records, and you must remember to hand back the key.",
      timeline: [['1960s', 'Call stacks', 'Hardware-supported stacks for subroutine calls and locals.'], ['1972', 'C malloc/free', 'Manual heap management.'], ['1988', 'Morris worm', 'Stack buffer overflow exploited at scale.'], ['2000s–2020s', 'Modern allocators', 'tcmalloc, jemalloc, mimalloc: per-thread caches and size classes.']],
      explain: "C++ has four **storage durations**. **Automatic** objects (locals) live on the stack and are destroyed at the end of their scope, in reverse order of construction. **Static** objects (globals, `static` locals) live for the whole program. **Thread** storage (`thread_local`) lives per thread. **Dynamic** objects are created with `new` (or by containers and smart pointers internally) and live until explicitly destroyed. Stack allocation costs essentially nothing, has excellent cache locality, and frees itself, but the stack is small: commonly **8 MB** for the main thread on Linux, **1 MB** on Windows, and often 512 KB to 8 MB for other threads, so deep recursion or large local arrays cause stack overflow. Heap allocation costs tens to hundreds of nanoseconds, can fragment memory, and must be released exactly once. Modern C++ almost never writes `new` and `delete` directly: `std::vector`, `std::string`, and `std::make_unique` allocate on the heap but tie release to an owning object that lives on the stack. An object's **lifetime** begins when its constructor finishes and ends when its destructor starts; touching it outside that window is undefined behaviour.",
      diagram: "stack (grows down, ~8 MB main thread on Linux)\n  main()      [ locals ]\n  handle()    [ std::vector<int> v : ptr,size,cap ] ──► heap [ 1, 2, 3, ... ]\n  parse()     [ char buf[256] ]\n  ▲ call = move stack pointer · return = move it back (free)\nheap: new/malloc → allocator finds a block · delete/free → returns it",
      ex1: ['cpp', 'automatic versus dynamic objects', "void f() {\n  int a = 1;                       // stack, freed at }\n  std::vector<int> v(1'000'000);   // object on stack, 4 MB buffer on heap\n  auto p = std::make_unique<int>(5);   // heap int, freed by p's destructor\n}                                  // v and p destroyed here, in reverse order"],
      ex2: ['cpp', 'stack overflow from a large local or deep recursion', "void bad() {\n  char big[16 * 1024 * 1024];      // 16 MB on an 8 MB stack: crash\n}\nint depth(int n) { return n == 0 ? 0 : 1 + depth(n - 1); }\n// depth(10'000'000) overflows the stack; use a loop or an explicit std::vector stack"],
      deepDive: {
        explain: "A function's **stack frame** holds its locals, saved registers, and the return address; the compiler knows its size at compile time, which is why variable-length arrays are not standard C++. Allocators such as glibc's ptmalloc, jemalloc, tcmalloc, and mimalloc keep per-thread caches of size classes so small allocations avoid locks; large allocations (above about 128 KB by default in glibc) go straight to `mmap`. Every heap block has bookkeeping overhead (8 to 16 bytes is typical), so a million tiny allocations waste memory and scatter data across the cache. Techniques for heavy allocation: reserve container capacity, store objects by value in contiguous containers, use small-buffer optimisations, and use **arena or monotonic allocators** (`std::pmr::monotonic_buffer_resource`, C++17) that free everything at once. `new` throws `std::bad_alloc` on failure by default; on Linux with overcommit, allocation often succeeds and the out-of-memory killer acts later. Placement new constructs an object in memory you already have, which is how containers build elements in their buffers.",
        example: ['cpp', 'an arena with std::pmr (C++17)', "#include <memory_resource>\nchar buffer[64 * 1024];\nstd::pmr::monotonic_buffer_resource arena(buffer, sizeof buffer);\nstd::pmr::vector<int> v(&arena);    // allocations come from buffer\nfor (int i = 0; i < 1000; ++i) v.push_back(i);\n// everything is released when arena is destroyed"],
        tradeoffs: [['Storage', 'Speed', 'Limits'], ['Stack (automatic)', 'Fastest; free on scope exit', 'Small (MBs); size fixed at compile time'], ['Heap (dynamic)', 'Tens to hundreds of ns per allocation', 'Must be freed once; fragmentation'], ['Static', 'No allocation at run time', 'Lives forever; init-order issues'], ['Arena / pmr', 'Bump-pointer fast; bulk free', 'Cannot free individual objects early']],
        failures: [['Segfault in deep recursion', 'Stack overflow', 'Iterate, or use an explicit heap-backed stack'], ['Crash with a large local array', 'Array bigger than the thread stack', 'Use std::vector'], ['Memory grows but nothing leaks', 'Fragmentation or allocator caching', 'Arenas, pooling, or a different allocator'], ['Slow hot loop', 'Allocation per iteration', 'Hoist and reuse buffers; reserve']],
      },
      warn: "Never return a pointer or reference to a local variable, and never put large arrays on the stack. Locals die at the end of their scope; the stack is only a few megabytes.",
      production: {
        numbers: "Default main-thread stack: 8 MB on most Linux distributions (ulimit -s 8192), 1 MB on Windows. A small malloc with a warm per-thread cache takes roughly 20–100 ns; a contended or mmap-backed one can take microseconds.",
        observe: "Heap profilers (heaptrack, jemalloc and tcmalloc profiling, Valgrind massif) show allocation counts and peak heap; perf shows time spent in malloc and free.",
        security: "Stack buffer overflows can overwrite return addresses; compile with -fstack-protector-strong, -D_FORTIFY_SOURCE=3, and control-flow protections, and never use unbounded copies into stack buffers.",
        checklist: ['Values and containers instead of raw new', 'No large local arrays', 'Recursion depth bounded or converted to iteration', 'reserve() for containers of known size', 'Arenas for many short-lived objects', 'Heap profiled under realistic load', 'Stack protector and FORTIFY in release builds'],
        sources: ['cppreference.com: Storage duration; Lifetime; std::pmr::monotonic_buffer_resource', 'C++ Core Guidelines R.1–R.5 (resource management)', 'Drepper, "What Every Programmer Should Know About Memory" (2007)', 'Spafford, "The Internet Worm Program: An Analysis" (1988)'],
      },
      tip: "Look for the word new in a code review. In modern C++ almost every one should be std::make_unique, std::make_shared, or a container.",
      faq: [['What are the four storage durations?', 'Automatic, static, thread, and dynamic.'], ['How large is the default stack?', 'Typically 8 MB for the main thread on Linux and 1 MB on Windows.'], ['Why is stack allocation fast?', 'It only moves the stack pointer, and release happens automatically on return.'], ['Where does a std::vector store its elements?', 'On the heap; the vector object itself (pointer, size, capacity) can be on the stack.'], ['What is an arena allocator?', 'An allocator that bumps a pointer through a buffer and frees everything at once.']],
      ex: {
        prompt: 'Write peakStack(events) where each event is "call:<bytes>" (push a stack frame of that size) or "ret" (pop the most recent frame). Return the peak total stack usage in bytes.',
        fn: 'peakStack', params: 'events', sig: '(string[] events) -> int',
        cpp: `class Solution {
public:
    int peakStack(vector<string>& events) {
        vector<int> frames;
        int cur = 0, peak = 0;
        for (const string& e : events) {
            if (e == "ret") { cur -= frames.back(); frames.pop_back(); continue; }
            int n = stoi(e.substr(5));
            frames.push_back(n);
            cur += n;
            peak = max(peak, cur);
        }
        return peak;
    }
};
`,
        cases: [{ args: [['call:64', 'call:128', 'ret', 'call:32', 'call:256', 'ret', 'ret', 'ret']], expect: 352 }, { args: [[]], expect: 0 }, { args: [['call:100', 'ret', 'call:50']], expect: 100 }],
        solution: "function peakStack(ev){let cur=0,peak=0;const st=[];for(const e of ev){if(e==='ret'){cur-=st.pop()}else{const n=Number(e.split(':')[1]);st.push(n);cur+=n;if(cur>peak)peak=cur}}return peak}",
        hint: 'Keep a stack of frame sizes and a running total; track the maximum.',
      },
      quiz: [
        choice('cx-me-1-q1', 'cpp-stack-heap', 'When is a local std::vector\'s heap buffer released?', ['when the vector is destroyed at the end of its scope', 'when the program exits', 'by a garbage collector', 'never'], 0, 'RAII.'),
        choice('cx-me-1-q2', 'cpp-stack-heap', 'char buf[16 * 1024 * 1024]; as a local on Linux most likely...', ['overflows the 8 MB stack', 'goes on the heap automatically', 'is fine', 'is a compile error'], 0, 'Stack is small.'),
        choice('cx-me-1-q3', 'cpp-stack-heap', 'Which storage duration does a local variable have?', ['automatic', 'static', 'dynamic', 'thread'], 0, 'Scope-bound.'),
        fill('cx-me-1-q4', 'cpp-stack-heap', 'Memory from new lives until it is released with ___', ['delete'], 'Dynamic storage.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'cx-me-2', title: 'RAII and deterministic destruction', concept: 'cpp-raii',
      story: "Stroustrup coined \"Resource Acquisition Is Initialization\" while designing exception handling for C++ in the late 1980s. The problem was simple: if a function can exit early by throwing, every `fclose`, `unlock`, or `delete` written at the bottom of the function is skipped. The answer was to make the destructor do the release, because C++ guarantees destructors of fully constructed local objects run whenever their scope exits, by return, by break, or by exception. The awkward name stuck; many people now say \"scope-bound resource management\".",
      analogy: "A hotel key card that deactivates itself at checkout time: you cannot forget to return access, because leaving is what returns it.",
      timeline: [['1984–1989', 'Destructors and exceptions', 'RAII emerges as the way to make exception-safe code.'], ['1998', 'C++98', 'std::auto_ptr, fstream, and containers use RAII.'], ['2011', 'C++11', 'std::unique_ptr, std::lock_guard, std::thread with RAII-style ownership.'], ['2017', 'C++17', 'std::scoped_lock for multiple mutexes; CTAD makes guards shorter.']],
      explain: "**RAII** binds a resource's lifetime to an object's lifetime: the constructor acquires (opens a file, locks a mutex, allocates memory, starts a transaction), and the destructor releases. Because destructors of automatic objects run on **every** exit path, the resource cannot leak, and release order is the **reverse of construction**, which naturally respects dependencies (a statement is closed before its connection). Standard RAII types: `std::vector` and `std::string` (memory), `std::unique_ptr` and `std::shared_ptr` (heap objects), `std::fstream` (files), `std::lock_guard`, `std::unique_lock`, and `std::scoped_lock` (mutexes), and `std::jthread` (joins on destruction). For C APIs, wrap the handle: `std::unique_ptr<FILE, decltype(&fclose)>` or a small class. **Destructors must not throw**: they are `noexcept` by default, and throwing during stack unwinding calls `std::terminate`. A **scope guard** runs arbitrary cleanup at scope exit and is useful for one-off actions (`absl::Cleanup`, `gsl::finally`, or `std::experimental::scope_exit`).",
      diagram: "{\n  Connection c(url);        // 1 acquire\n  Statement s(c, sql);      // 2 acquire\n  Lock l(mutex);            // 3 acquire\n  if (bad) return;          // early exit\n}                           // destructors run: ~Lock (3) · ~Statement (2) · ~Connection (1)\nreverse order, on every exit path: return, break, exception",
      ex1: ['cpp', 'wrapping a C handle', "struct FileCloser { void operator()(FILE* f) const { if (f) std::fclose(f); } };\nusing File = std::unique_ptr<FILE, FileCloser>;\nFile open(const char* path) { return File(std::fopen(path, \"r\")); }\nvoid read() {\n  File f = open(\"data.txt\");\n  if (!f) return;\n  // ... early returns are safe: fclose runs automatically\n}"],
      ex2: ['cpp', 'locks released on every path', "std::mutex m;\nint counter = 0;\nvoid add(int x) {\n  std::lock_guard<std::mutex> guard(m);   // locked here\n  if (x < 0) return;                       // unlocked here\n  counter += x;\n}                                          // and here"],
      deepDive: {
        explain: "Objects are destroyed in reverse order of construction at every level: locals in a scope, members of a class (reverse declaration order, after the destructor body runs), base classes after members, and elements of an array from last to first. Temporaries die at the end of the full expression unless bound to a reference that extends their life. If a constructor throws, the destructors of already-constructed members and bases run, but the object's own destructor does not, which is why each resource should be owned by its own member rather than acquired raw in a constructor body. Static objects are destroyed after `main` returns in reverse order of their construction. RAII is also the backbone of the exception-safety guarantees: the **basic guarantee** (no leaks, invariants intact), the **strong guarantee** (commit or roll back, often via copy-and-swap), and the **no-throw guarantee** (destructors, swap, moves). Even with exceptions disabled, as in this course's runner and much of game and embedded code, RAII still fixes early returns and `goto cleanup` chains.",
        example: ['cpp', 'a minimal scope guard', "template <class F> struct ScopeExit {\n  F f;\n  ~ScopeExit() { f(); }\n};\ntemplate <class F> ScopeExit(F) -> ScopeExit<F>;   // C++17 deduction guide\nvoid work() {\n  begin_transaction();\n  ScopeExit rollback{[] { rollback_if_open(); }};\n  // ... any return path rolls back unless committed\n}"],
        tradeoffs: [['Approach', 'Safety', 'Cost'], ['Manual release at end of function', 'Leaks on every forgotten path', 'None until it breaks'], ['goto cleanup (C style)', 'Better, but easy to get wrong', 'Verbose; fragile edits'], ['RAII wrapper type', 'Release on every path, in order', 'A small class or unique_ptr deleter'], ['Garbage collection (other languages)', 'Memory only; files and locks still manual', 'Pauses; non-deterministic release']],
        failures: [['Mutex never unlocked after an error', 'Manual unlock skipped by early return', 'std::lock_guard or std::scoped_lock'], ['File descriptors exhausted', 'fopen without fclose on error paths', 'unique_ptr with a deleter'], ['std::terminate during unwinding', 'Destructor threw an exception', 'Destructors noexcept; report errors differently'], ['Leak when a constructor fails half-way', 'Raw resources acquired in a constructor body', 'One RAII member per resource']],
      },
      warn: "Never let an exception escape a destructor. Destructors are noexcept by default, so throwing from one calls std::terminate.",
      production: {
        numbers: "Linux limits open file descriptors per process with ulimit -n, often 1,024 soft by default; a leak of one descriptor per failed request exhausts that in about a thousand failures.",
        observe: "Count open descriptors (ls /proc/<pid>/fd | wc -l), lock hold times, and live object counts in metrics; LeakSanitizer reports unreleased heap memory at exit.",
        security: "Leaked locks and descriptors are denial-of-service vectors: an attacker who can trigger error paths can exhaust resources. RAII on every path removes the class of bug.",
        checklist: ['Every resource owned by an RAII object', 'C handles wrapped (unique_ptr deleter or class)', 'Locks via lock_guard, scoped_lock, unique_lock', 'Destructors noexcept', 'One resource per owning member', 'Scope guards for one-off cleanups', 'Descriptor and lock metrics in production'],
        sources: ['Stroustrup, "The Design and Evolution of C++" (1994), section 16.5', 'C++ Core Guidelines R.1 ("Manage resources automatically using resource handles and RAII")', 'cppreference.com: RAII; Destructors; std::lock_guard', 'Sutter, "Exceptional C++" (1999), exception-safety guarantees'],
      },
      tip: "If you write the word close, unlock, release, or delete at the end of a function, ask which type's destructor should be doing it instead.",
      faq: [['What does RAII stand for?', 'Resource Acquisition Is Initialization: acquire in the constructor, release in the destructor.'], ['In what order are local objects destroyed?', 'Reverse order of construction.'], ['Does RAII work without exceptions?', 'Yes; it releases resources on every exit path, including early returns.'], ['Why must destructors not throw?', 'They are noexcept by default; throwing calls std::terminate, especially during unwinding.'], ['How do you RAII-wrap a FILE*?', 'std::unique_ptr<FILE, Deleter> where the deleter calls fclose.']],
      ex: {
        prompt: 'Write destroyOrder(events) simulating scopes. Events: "enter" opens a nested scope, "exit" closes the innermost scope, and "make:<name>" constructs an object in the current scope. When a scope closes, its objects are destroyed in reverse order of construction. After the events, all remaining scopes close from innermost to outermost. Return the names in destruction order.',
        fn: 'destroyOrder', params: 'events', sig: '(string[] events) -> string[]',
        cpp: `class Solution {
public:
    vector<string> destroyOrder(vector<string>& events) {
        vector<vector<string>> scopes(1);
        vector<string> out;
        auto close = [&]() {
            vector<string>& s = scopes.back();
            for (auto it = s.rbegin(); it != s.rend(); ++it) out.push_back(*it);
            scopes.pop_back();
        };
        for (const string& e : events) {
            if (e == "enter") scopes.emplace_back();
            else if (e == "exit") close();
            else scopes.back().push_back(e.substr(5));
        }
        while (!scopes.empty()) close();
        return out;
    }
};
`,
        cases: [{ args: [['make:a', 'enter', 'make:b', 'make:c', 'exit', 'make:d']], expect: ['c', 'b', 'd', 'a'] }, { args: [['enter', 'make:x', 'enter', 'make:y']], expect: ['y', 'x'] }, { args: [[]], expect: [] }],
        solution: "function destroyOrder(ev){const sc=[[]];const out=[];for(const e of ev){if(e==='enter')sc.push([]);else if(e==='exit'){const s=sc.pop();while(s.length)out.push(s.pop())}else sc[sc.length-1].push(e.split(':')[1])}while(sc.length){const s=sc.pop();while(s.length)out.push(s.pop())}return out}",
        hint: 'Keep a stack of scopes, each a list of names; closing a scope pops names from the back.',
      },
      quiz: [
        choice('cx-me-2-q1', 'cpp-raii', 'A function locks a mutex with std::lock_guard and returns early. The mutex is...', ['unlocked by the guard\'s destructor', 'left locked', 'unlocked only on exceptions', 'unlocked at program exit'], 0, 'Every exit path.'),
        choice('cx-me-2-q2', 'cpp-raii', 'Objects a, b, c constructed in that order in one scope are destroyed...', ['c, b, a', 'a, b, c', 'in an unspecified order', 'only if exceptions are on'], 0, 'Reverse order.'),
        choice('cx-me-2-q3', 'cpp-raii', 'What happens if a destructor throws during stack unwinding?', ['std::terminate is called', 'the exception is ignored', 'the caller catches both', 'nothing'], 0, 'Destructors must not throw.'),
        fill('cx-me-2-q4', 'cpp-raii', 'In RAII the resource is released in the ___', ['destructor'], 'Scope exit.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'cx-me-3', title: 'std::unique_ptr and exclusive ownership', concept: 'cpp-unique-ptr',
      story: "C++98's `std::auto_ptr` tried to be a smart pointer before the language had move semantics. Its \"copy\" silently transferred ownership and left the source null, so putting `auto_ptr`s in containers or passing them by value caused surprising crashes. C++11 replaced it with `std::unique_ptr`, which uses move semantics to make transfer explicit (`std::move`) and makes copying a compile error. `auto_ptr` was deprecated in C++11 and removed in C++17. `std::make_unique` arrived in C++14.",
      analogy: "unique_ptr is a car title with exactly one name on it. You can sign it over to someone else (move), but you cannot photocopy it, and when the owner is gone the car goes to the scrapyard.",
      timeline: [['1998', 'std::auto_ptr', 'Ownership transfer disguised as copying.'], ['2011', 'std::unique_ptr', 'Move-only exclusive ownership; auto_ptr deprecated.'], ['2014', 'std::make_unique', 'Allocation without a naked new.'], ['2017', 'auto_ptr removed', 'C++17 deletes it from the standard.']],
      explain: "`std::unique_ptr<T>` owns one heap object and deletes it in its destructor. It is **move-only**: `auto b = std::move(a);` transfers ownership and leaves `a` null; `auto b = a;` does not compile. With the default deleter it is the **same size as a raw pointer** and adds no run-time overhead in optimised builds. Create with `std::make_unique<T>(args...)`; `std::make_unique<T[]>(n)` handles arrays (though `std::vector` is usually better). Useful members: `get()` (borrow a raw pointer without giving up ownership), `release()` (give up ownership and return the raw pointer: you must now delete it), `reset(p)` (delete the current object and take `p`), and `operator bool`. **Assigning** a new object to a `unique_ptr` destroys the old one first. Function signatures express ownership: take `std::unique_ptr<T>` **by value** to take ownership (caller writes `std::move`), return `std::unique_ptr<T>` from factories, and pass `T&` or `T*` to functions that only use the object. **Custom deleters** let it manage any resource (`FILE*`, sockets, OpenSSL objects). It is the right default for polymorphic objects (`std::unique_ptr<Shape>` to a `Circle`), provided the base class has a **virtual destructor**.",
      diagram: "auto a = std::make_unique<Img>();   a ──► [Img #1]\nauto b = std::move(a);              a = null   b ──► [Img #1]\nb = std::make_unique<Img>();        [Img #1] deleted · b ──► [Img #2]\nb.reset();                          [Img #2] deleted · b = null\nauto c = b;                         ✗ compile error: copy is deleted",
      ex1: ['cpp', 'factories and ownership transfer', "std::unique_ptr<Shape> makeShape(std::string_view kind) {\n  if (kind == \"circle\") return std::make_unique<Circle>(1.0);\n  return std::make_unique<Square>(2.0);\n}\nvoid adopt(std::unique_ptr<Shape> s);       // takes ownership\nauto s = makeShape(\"circle\");\ndraw(*s);                                   // borrow: void draw(const Shape&)\nadopt(std::move(s));                        // s is null afterwards"],
      ex2: ['cpp', 'a container of polymorphic objects', "struct Shape { virtual ~Shape() = default; virtual double area() const = 0; };\nstd::vector<std::unique_ptr<Shape>> shapes;\nshapes.push_back(std::make_unique<Circle>(1.0));\nshapes.push_back(std::make_unique<Square>(2.0));\ndouble total = 0;\nfor (const auto& s : shapes) total += s->area();\n// all shapes deleted when the vector is destroyed"],
      deepDive: {
        explain: "`unique_ptr<T, D>` stores the deleter as part of its type. A stateless deleter (an empty struct or a captureless lambda type) takes no space thanks to the empty base optimisation, so the pointer stays 8 bytes; a function-pointer deleter (`decltype(&fclose)`) adds 8 bytes. Deleting a derived object through a base pointer without a **virtual destructor** is undefined behaviour, the classic polymorphic-ownership bug. `unique_ptr` to an incomplete type (the **pimpl** idiom) works if the destructor of the owning class is defined where the type is complete, usually by declaring `~Widget();` in the header and `Widget::~Widget() = default;` in the .cpp file. Prefer `make_unique` over `std::unique_ptr<T>(new T)`: it avoids writing `new`, names the type once, and (before C++17's evaluation-order rules) avoided leaks in `f(unique_ptr<T>(new T), g())`. `release()` is for handing ownership to legacy APIs and is a frequent source of leaks when the result is ignored; compilers warn because it is marked `[[nodiscard]]` in C++20 library implementations.",
        example: ['cpp', 'pimpl with unique_ptr', "// widget.h\nclass Widget {\npublic:\n  Widget();\n  ~Widget();                   // declared here, defined where Impl is complete\nprivate:\n  struct Impl;\n  std::unique_ptr<Impl> impl_;\n};\n// widget.cpp\nstruct Widget::Impl { std::vector<int> data; };\nWidget::Widget() : impl_(std::make_unique<Impl>()) {}\nWidget::~Widget() = default;"],
        tradeoffs: [['Option', 'Ownership', 'Overhead'], ['Value member or local', 'Exclusive, inline', 'None; size known at compile time'], ['std::unique_ptr', 'Exclusive, on the heap', 'Allocation; pointer-sized handle'], ['std::shared_ptr', 'Shared', 'Control block; atomic reference counts'], ['Raw T*', 'None (observer)', 'None, but no ownership safety']],
        failures: [['Leak after calling release()', 'Returned raw pointer never deleted', 'Use std::move to transfer instead'], ['Derived destructor never runs', 'Base class lacks a virtual destructor', 'virtual ~Base() = default;'], ['Null dereference after a call', 'Function took the unique_ptr by value and moved it', 'Check ownership in the signature; do not use after move'], ['Compile error on copy', 'Copying a move-only type', 'std::move or share via references']],
      },
      warn: "Do not use a unique_ptr after moving from it: it is null. And never delete a derived object through a base pointer unless the base destructor is virtual.",
      production: {
        numbers: "sizeof(std::unique_ptr<T>) with the default deleter is 8 bytes on 64-bit platforms, the same as T*; with a function-pointer deleter it is 16 bytes.",
        observe: "clang-tidy modernize-make-unique and cppcoreguidelines-owning-memory flag naked new and raw owning pointers; LeakSanitizer catches leaked release() results.",
        security: "Exclusive ownership removes double-free bugs by construction: only one owner can delete. Keep raw pointers from get() short-lived so they cannot outlive the owner.",
        checklist: ['make_unique instead of new', 'Factories return unique_ptr', 'Sinks take unique_ptr by value', 'Users take T& or T*', 'Virtual destructors on polymorphic bases', 'Custom deleters for C handles', 'No use after move'],
        sources: ['cppreference.com: std::unique_ptr; std::make_unique', 'C++ Core Guidelines R.20–R.23, R.32–R.33', 'Meyers, "Effective Modern C++", items 18 and 21', 'N4190, "Removing auto_ptr, random_shuffle(), And Old <functional> Stuff" (C++17)'],
      },
      tip: "Make unique_ptr your default heap owner. Switch to shared_ptr only when you can name two owners whose lifetimes are genuinely independent.",
      faq: [['Can you copy a unique_ptr?', 'No. It is move-only; use std::move to transfer ownership.'], ['What does release() do?', 'Gives up ownership and returns the raw pointer without deleting it.'], ['What is the size overhead?', 'None with the default deleter: the same size as a raw pointer.'], ['How should a function that only uses an object take it?', 'By T& or T*, not by smart pointer.'], ['Why did auto_ptr fail?', 'Its copy operations silently transferred ownership; it was removed in C++17.']],
      ex: {
        prompt: 'Simulate unique_ptr variables. Write uniqueLog(ops) where ops are "make:<v>" (assign a newly created object to variable v; objects are numbered #1, #2, ... in creation order), "move:<a>:<b>" (b = std::move(a)), and "reset:<v>". Whenever an owned object is destroyed (a variable that already owns one is overwritten, or reset), log its id. At the end, the variables go out of scope in reverse order of their first appearance and destroy what they still own. Return the destruction log.',
        fn: 'uniqueLog', params: 'ops', sig: '(string[] ops) -> string[]',
        cpp: `class Solution {
public:
    vector<string> uniqueLog(vector<string>& ops) {
        vector<string> order;
        map<string, string> owns;              // variable -> object id ("" = null)
        auto touch = [&](const string& v) { if (!owns.count(v)) { owns[v] = ""; order.push_back(v); } };
        vector<string> out;
        int next = 0;
        for (const string& op : ops) {
            vector<string> p;
            stringstream ss(op);
            string part;
            while (getline(ss, part, ':')) p.push_back(part);
            if (p[0] == "make") {
                touch(p[1]);
                if (!owns[p[1]].empty()) out.push_back(owns[p[1]]);
                owns[p[1]] = "#" + to_string(++next);
            } else if (p[0] == "move") {
                touch(p[1]);
                touch(p[2]);
                if (!owns[p[2]].empty()) out.push_back(owns[p[2]]);
                owns[p[2]] = owns[p[1]];
                owns[p[1]] = "";
            } else {
                touch(p[1]);
                if (!owns[p[1]].empty()) out.push_back(owns[p[1]]);
                owns[p[1]] = "";
            }
        }
        for (auto it = order.rbegin(); it != order.rend(); ++it)
            if (!owns[*it].empty()) out.push_back(owns[*it]);
        return out;
    }
};
`,
        cases: [{ args: [['make:a', 'make:b', 'move:a:b', 'reset:b']], expect: ['#2', '#1'] }, { args: [['make:a', 'move:a:b', 'make:a']], expect: ['#1', '#2'] }, { args: [['make:p', 'make:p']], expect: ['#1', '#2'] }, { args: [[]], expect: [] }],
        solution: "function uniqueLog(ops){const v=new Map();let k=0;const out=[];for(const op of ops){const p=op.split(':');if(p[0]==='make'){if(v.get(p[1]))out.push(v.get(p[1]));v.set(p[1],'#'+(++k))}else if(p[0]==='move'){const a=p[1],b=p[2];if(!v.has(a))v.set(a,null);if(v.get(b))out.push(v.get(b));v.set(b,v.get(a)||null);v.set(a,null)}else if(p[0]==='reset'){if(v.get(p[1]))out.push(v.get(p[1]));v.set(p[1],null)}}const names=[...v.keys()].reverse();for(const n of names)if(v.get(n))out.push(v.get(n));return out}",
        hint: 'Track which object each variable owns; overwriting or resetting destroys the old one, and moving nulls the source.',
      },
      quiz: [
        choice('cx-me-3-q1', 'cpp-unique-ptr', 'After auto b = std::move(a); with unique_ptrs, a is...', ['null', 'a copy of b', 'dangling', 'deleted'], 0, 'Ownership moved.'),
        choice('cx-me-3-q2', 'cpp-unique-ptr', 'A function that only reads a Widget should take...', ['const Widget&', 'std::unique_ptr<Widget>', 'std::shared_ptr<Widget>', 'std::unique_ptr<Widget>&&'], 0, 'Do not involve ownership.'),
        choice('cx-me-3-q3', 'cpp-unique-ptr', 'Deleting a Circle through unique_ptr<Shape> requires...', ['a virtual destructor in Shape', 'a custom deleter', 'shared_ptr instead', 'nothing'], 0, 'Otherwise UB.'),
        fill('cx-me-3-q4', 'cpp-unique-ptr', 'The C++14 factory that creates a unique_ptr without writing new is std::___', ['make_unique'], 'make_unique.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'cx-me-4', title: 'std::shared_ptr, std::weak_ptr, and cycles', concept: 'cpp-shared-weak',
      story: "Boost introduced `shared_ptr` in 1999, and it entered the standard via TR1 and then C++11. It made shared ownership easy: copy the pointer, and the object lives until the last copy is destroyed. It also made a familiar garbage-collection problem easy to recreate: two objects that hold `shared_ptr`s to each other keep each other alive forever, because reference counting cannot see that nobody else can reach them. `weak_ptr` exists to break those cycles.",
      analogy: "shared_ptr is a meeting room booking shared by a team: the room stays reserved while anyone still holds the booking. weak_ptr is someone who knows the room number but holds no booking: before going in, they must check whether the meeting still exists.",
      timeline: [['1999', 'boost::shared_ptr', 'Reference-counted shared ownership.'], ['2005', 'TR1', 'std::tr1::shared_ptr and weak_ptr.'], ['2011', 'C++11', 'shared_ptr, weak_ptr, make_shared standardised.'], ['2020', 'C++20', 'std::atomic<std::shared_ptr<T>>; make_shared for arrays.']],
      explain: "`std::shared_ptr<T>` points to the object and to a **control block** holding a **strong count** (number of `shared_ptr`s), a **weak count**, and the deleter. Copying increments the strong count **atomically** (thread-safe, but not free); destroying decrements it; when it reaches zero the object is destroyed, and when the weak count also reaches zero the control block is freed. `std::make_shared` allocates the object and control block **in one allocation** (faster, better locality), at the cost that the memory is not returned until weak pointers are gone too. `std::weak_ptr<T>` observes without owning: call `lock()` to get a `shared_ptr` (empty if the object has died), or `expired()`. **Cycles leak**: if A holds `shared_ptr<B>` and B holds `shared_ptr<A>`, neither count reaches zero. Fix by making back-references (child to parent, observer to subject, cache entries) `weak_ptr`. Pass `shared_ptr` **by value only when the callee keeps a copy**; otherwise pass `T&`. Never create two `shared_ptr`s from the same raw pointer (two control blocks, double delete); use `enable_shared_from_this` when an object needs a `shared_ptr` to itself.",
      diagram: "auto a = std::make_shared<Node>();   [ctrl strong=1 weak=0 | Node]\nauto b = a;                           strong=2\nstd::weak_ptr<Node> w = a;            weak=1\na.reset(); b.reset();                 strong=0 → Node destroyed; ctrl stays (weak=1)\nw.lock()                              → empty shared_ptr\ncycle: A ──shared──► B ──shared──► A   counts never reach 0 → leak\nfix:   A ──shared──► B ──weak────► A",
      ex1: ['cpp', 'breaking a parent/child cycle with weak_ptr', "struct Node {\n  std::vector<std::shared_ptr<Node>> children;   // owns children\n  std::weak_ptr<Node> parent;                    // observes parent\n};\nauto root = std::make_shared<Node>();\nauto kid = std::make_shared<Node>();\nkid->parent = root;\nroot->children.push_back(kid);\n// dropping root frees the whole tree"],
      ex2: ['cpp', 'using a weak_ptr safely', "std::weak_ptr<Session> watcher = session;\nif (auto s = watcher.lock()) {   // shared_ptr, keeps it alive in this block\n  s->ping();\n} else {\n  // the session has already been destroyed\n}"],
      deepDive: {
        explain: "The atomic increments and decrements in the control block cost a locked instruction each, which shows up when `shared_ptr`s are copied in hot loops or across cores (cache-line contention on the count). That is why passing `const std::shared_ptr<T>&` or plain `T&` matters in hot paths, and why `std::move` of a `shared_ptr` is cheaper than a copy. The reference counts are thread-safe, but **the pointed-to object is not**, and neither is a single `shared_ptr` variable written by one thread while another reads it; C++20 `std::atomic<std::shared_ptr<T>>` handles the latter. The **aliasing constructor** lets a `shared_ptr` to a member share the owner's control block. `enable_shared_from_this` stores a weak pointer inside the object so `shared_from_this()` returns a pointer sharing the existing control block; calling it on an object not owned by a `shared_ptr` throws `std::bad_weak_ptr` (C++17). Destruction cascades recursively: dropping the head of a long `shared_ptr` linked list can overflow the stack, so long chains need iterative teardown.",
        example: ['cpp', 'callbacks that do not extend lifetime', "class Downloader : public std::enable_shared_from_this<Downloader> {\npublic:\n  void start() {\n    std::weak_ptr<Downloader> self = shared_from_this();\n    http.get(url, [self](Response r) {\n      if (auto d = self.lock()) d->onDone(r);   // skip if destroyed meanwhile\n    });\n  }\n};"],
        tradeoffs: [['Pointer', 'Owns', 'Cost'], ['unique_ptr', 'Exclusively', 'Free (pointer-sized)'], ['shared_ptr', 'Shared, last owner frees', '16 bytes plus control block; atomic counting'], ['weak_ptr', 'No; can be promoted with lock()', 'Keeps the control block alive'], ['T& / T*', 'No', 'Free; caller guarantees lifetime']],
        failures: [['Memory grows with every session', 'shared_ptr cycle between objects', 'Make back-references weak_ptr'], ['Double delete crash', 'Two shared_ptrs created from one raw pointer', 'make_shared once; copy the shared_ptr'], ['Slow hot path', 'shared_ptr copied by value in a loop', 'Pass by reference or T&'], ['Callback runs on a destroyed object', 'Captured raw this', 'Capture weak_ptr and lock()']],
      },
      warn: "Never construct two shared_ptrs from the same raw pointer, and never let objects own each other through shared_ptr. Both lead to double deletes or permanent leaks.",
      production: {
        numbers: "sizeof(std::shared_ptr<T>) is 16 bytes on 64-bit platforms (object pointer plus control block pointer); each copy or destruction performs an atomic increment or decrement on the control block.",
        observe: "LeakSanitizer reports objects kept alive by cycles at exit; heap profilers show growth in objects that should be short-lived. use_count() is for debugging only.",
        security: "Use-after-free in asynchronous callbacks is a common exploitable bug; capturing weak_ptr and checking lock() before use closes it.",
        checklist: ['unique_ptr first; shared_ptr only for real shared ownership', 'make_shared for creation', 'Back-references and observers as weak_ptr', 'shared_from_this for self-references', 'No shared_ptr copies in hot loops', 'Async callbacks capture weak_ptr', 'Long chains torn down iteratively'],
        sources: ['cppreference.com: std::shared_ptr; std::weak_ptr; std::enable_shared_from_this', 'C++ Core Guidelines R.20–R.24, R.30–R.37', 'Meyers, "Effective Modern C++", items 19–21', 'Boost.SmartPtr documentation (history of shared_ptr)'],
      },
      tip: "Draw the ownership graph. Every arrow should point from owner to owned; any cycle of shared_ptr arrows is a leak waiting to happen.",
      faq: [['What does a control block hold?', 'The strong count, the weak count, and the deleter (and the object itself with make_shared).'], ['Are shared_ptr counts thread-safe?', 'Yes, they are atomic; the pointed-to object is not automatically thread-safe.'], ['How does weak_ptr access the object?', 'lock() returns a shared_ptr that is empty if the object has been destroyed.'], ['Why do cycles leak?', 'Each object keeps the other\'s strong count above zero.'], ['Why prefer make_shared?', 'One allocation for object and control block, and no naked new.']],
      ex: {
        prompt: 'Objects are released by reference counting after every external owner is gone. Write leakedNodes(nodes, edges) where edges are "a>b" (a holds a shared_ptr to b) or "a~b" (a holds a weak_ptr to b, which does not count). Repeatedly destroy any node with zero incoming strong references, releasing its outgoing strong references. Return the nodes that are never destroyed, sorted.',
        fn: 'leakedNodes', params: 'nodes, edges', sig: '(string[] nodes, string[] edges) -> string[]',
        cpp: `class Solution {
public:
    vector<string> leakedNodes(vector<string>& nodes, vector<string>& edges) {
        map<string, int> strong;
        map<string, vector<string>> owns;
        for (const string& n : nodes) strong[n] = 0;
        for (const string& e : edges) {
            size_t i = e.find('>');
            if (i == string::npos) continue;          // weak edge: no count
            string a = e.substr(0, i), b = e.substr(i + 1);
            strong[b]++;
            owns[a].push_back(b);
        }
        deque<string> q;
        for (const string& n : nodes) if (strong[n] == 0) q.push_back(n);
        set<string> freed;
        while (!q.empty()) {
            string n = q.front(); q.pop_front();
            freed.insert(n);
            for (const string& m : owns[n]) if (--strong[m] == 0) q.push_back(m);
        }
        vector<string> out;
        for (const string& n : nodes) if (!freed.count(n)) out.push_back(n);
        sort(out.begin(), out.end());
        return out;
    }
};
`,
        cases: [{ args: [['a', 'b'], ['a>b', 'b>a']], expect: ['a', 'b'] }, { args: [['a', 'b'], ['a>b', 'b~a']], expect: [] }, { args: [['p', 'c1', 'c2'], ['p>c1', 'p>c2', 'c1>p']], expect: ['c1', 'c2', 'p'] }, { args: [['x', 'y', 'z'], ['x>y', 'y>z']], expect: [] }],
        solution: "function leakedNodes(nodes,edges){const inc={},out={};for(const n of nodes){inc[n]=0;out[n]=[]}for(const e of edges){if(e.includes('>')){const[a,b]=e.split('>');inc[b]++;out[a].push(b)}}const q=nodes.filter(n=>inc[n]===0);const freed=new Set();while(q.length){const n=q.shift();freed.add(n);for(const m of out[n]){if(--inc[m]===0)q.push(m)}}return nodes.filter(n=>!freed.has(n)).sort()}",
        hint: 'Count incoming strong edges, then free nodes with a zero count in a queue, decrementing what they own.',
      },
      quiz: [
        choice('cx-me-4-q1', 'cpp-shared-weak', 'A holds shared_ptr<B> and B holds shared_ptr<A>. After all external pointers are gone...', ['both leak', 'both are freed', 'A is freed, B leaks', 'the program crashes'], 0, 'Cycle.'),
        choice('cx-me-4-q2', 'cpp-shared-weak', 'What does weak_ptr::lock() return if the object is gone?', ['an empty shared_ptr', 'a dangling pointer', 'it throws', 'the last value'], 0, 'Check before use.'),
        choice('cx-me-4-q3', 'cpp-shared-weak', 'Why is make_shared usually faster?', ['one allocation for object and control block', 'no reference counting', 'it uses the stack', 'it skips constructors'], 0, 'Single allocation.'),
        fill('cx-me-4-q4', 'cpp-shared-weak', 'A child should refer to its parent through a std::___ to avoid a cycle.', ['weak_ptr'], 'Non-owning.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'cx-me-5', title: 'The rule of zero, three, and five', concept: 'cpp-rule-of-five',
      story: "In 1991 Marshall Cline described the \"Law of the Big Three\": if a class needs a user-defined destructor, copy constructor, or copy assignment operator, it probably needs all three, because it is managing a resource by hand. C++11 added move constructors and move assignment, turning three into five. In 2012 R. Martinho Fernandes named the better goal, the **rule of zero**: design classes so they need none of them, by letting members such as `std::vector`, `std::string`, and `std::unique_ptr` manage resources.",
      analogy: "The rule of zero is renting a furnished flat: the landlord's staff handle the boiler, the locks, and the cleaning. The rule of five is owning the building: you must personally handle moving in, moving out, copying keys, and demolition, and forgetting one of them hurts.",
      timeline: [['1991', 'Law of the Big Three', 'Marshall Cline, C++ FAQ.'], ['2011', 'C++11', 'Move operations: three becomes five; = default and = delete.'], ['2012', 'Rule of zero', 'R. Martinho Fernandes\' blog post names the idea.'], ['2011 onwards', 'Deprecation', 'Implicit copy when a destructor is user-declared is deprecated.']],
      explain: "The **special member functions** are the default constructor, destructor, copy constructor, copy assignment, move constructor, and move assignment. The compiler generates them when needed, memberwise. **Rule of zero**: if every member manages itself, declare none of them; the generated ones are correct and efficient. **Rule of three/five**: if you must write a destructor (because the class owns a raw resource), you almost certainly need custom copy operations (deep copy or `= delete`) and should write the moves too. The generation rules matter: declaring **any** of the destructor, copy constructor, copy assignment, or move assignment **suppresses the implicit move constructor** (copies are used instead, silently slower). Declaring a move constructor or move assignment makes the implicit **copy operations deleted**. Declaring a destructor still generates copies, but that is deprecated. When you need to mention one, say what you mean for all: `= default` (generate it) or `= delete` (forbid it). Move operations should be `noexcept`, or `std::vector` will copy rather than move elements when it grows.",
      diagram: "user declares…            copy ctor           move ctor\nnothing                    implicit            implicit       ← rule of zero\ndestructor                 implicit (deprec.)  not declared → copies used\ncopy ctor / copy assign    user / implicit     not declared\nmove ctor or move assign   deleted             user / not declared\nall five                   user                user           ← rule of five",
      ex1: ['cpp', 'rule of zero: let members do the work', "class Document {\n  std::string title_;\n  std::vector<std::string> lines_;\n  std::unique_ptr<Renderer> renderer_;   // move-only member: Document is move-only too\npublic:\n  explicit Document(std::string t) : title_(std::move(t)) {}\n  // no destructor, copy, or move declared: all correct automatically\n};"],
      ex2: ['cpp', 'rule of five for a raw buffer', "class Buffer {\n  size_t n_ = 0; char* p_ = nullptr;\npublic:\n  explicit Buffer(size_t n) : n_(n), p_(new char[n]) {}\n  ~Buffer() { delete[] p_; }\n  Buffer(const Buffer& o) : n_(o.n_), p_(new char[o.n_]) { std::memcpy(p_, o.p_, n_); }\n  Buffer& operator=(Buffer o) noexcept { swap(o); return *this; }   // copy-and-swap\n  Buffer(Buffer&& o) noexcept : n_(std::exchange(o.n_, 0)), p_(std::exchange(o.p_, nullptr)) {}\n  void swap(Buffer& o) noexcept { std::swap(n_, o.n_); std::swap(p_, o.p_); }\n};"],
      deepDive: {
        explain: "The **copy-and-swap idiom** implements assignment by taking the parameter by value (which copies or moves into it) and swapping, giving the strong exception guarantee and handling self-assignment for free; it unifies copy and move assignment in one function. `std::exchange` (C++14) makes move constructors short and leaves the source in a valid empty state. A moved-from object must remain **valid but unspecified**: destructible and assignable. Polymorphic base classes have a tension: they need a virtual destructor, which suppresses implicit moves, and copying through a base reference slices. The common answer is to declare the destructor virtual and `= default`, and either delete copy and move (`Base(const Base&) = delete;`) to prevent slicing, or default all five protected. Declaring a special member `= default` in the class keeps it **trivial** when possible, which matters for `memcpy`-able types and `std::is_trivially_copyable`. Aggregates and types with only self-managing members get `noexcept` moves automatically.",
        example: ['cpp', 'a polymorphic base that forbids slicing', "class Shape {\npublic:\n  virtual ~Shape() = default;\n  Shape(const Shape&) = delete;              // no slicing copies\n  Shape& operator=(const Shape&) = delete;\n  virtual std::unique_ptr<Shape> clone() const = 0;   // explicit deep copy\nprotected:\n  Shape() = default;\n};"],
        tradeoffs: [['Approach', 'When', 'Risk'], ['Rule of zero', 'Members manage resources (default choice)', 'None; least code'], ['Rule of five', 'Class wraps a raw resource directly', 'Many functions to get right'], ['= delete copies', 'Unique resources (sockets, mutexes)', 'Type becomes move-only or immovable'], ['Copy-and-swap', 'Strong guarantee for assignment', 'Extra move or copy in some cases']],
        failures: [['Double free after copying an object', 'Destructor written, copy left implicit (shallow copy)', 'Rule of five or rule of zero'], ['vector growth is slow', 'Move constructor not noexcept, so elements are copied', 'Mark moves noexcept'], ['Moves silently became copies', 'A user-declared destructor suppressed implicit moves', 'Default the moves explicitly or remove the destructor'], ['Derived data lost on copy', 'Slicing through a base class copy', 'Delete base copies; use clone()']],
      },
      warn: "If you write a destructor that frees something, the implicit copy is a shallow copy and will cause a double free. Either write or delete the copy operations, or better, let a member own the resource.",
      production: {
        numbers: "std::vector growth reallocates about log₂(n) times with geometric growth (factor 1.5 or 2 depending on the library); with non-noexcept moves, every reallocation copies every element instead of moving it.",
        observe: "clang-tidy cppcoreguidelines-special-member-functions and performance-noexcept-move-constructor; static_assert(std::is_nothrow_move_constructible_v<T>) in tests.",
        security: "Shallow copies of resource-owning classes cause double frees, which are exploitable heap corruption. Rule-of-zero designs eliminate the class of bug.",
        checklist: ['Rule of zero by default', 'Raw resources wrapped in small dedicated classes', 'All five declared (default or delete) when any is', 'Moves noexcept', 'Polymorphic bases: virtual destructor, no slicing copies', 'static_asserts for noexcept moves', 'clang-tidy special-member checks'],
        sources: ['Cline, C++ FAQ ("Law of the Big Three")', 'Fernandes, "Rule of Zero" (2012)', 'C++ Core Guidelines C.20–C.22, C.66, C.67', 'cppreference.com: The rule of three/five/zero; Move constructors'],
      },
      tip: "Aim for zero. If a class needs a destructor, extract the resource into its own tiny RAII class with all five members, and let everything else follow the rule of zero.",
      faq: [['What is the rule of zero?', 'Classes whose members manage their own resources should declare no special members.'], ['What suppresses the implicit move constructor?', 'A user-declared destructor, copy constructor, copy assignment, or move assignment.'], ['What happens to copies when you declare a move constructor?', 'The implicit copy operations are deleted.'], ['Why should moves be noexcept?', 'Containers like vector move elements during growth only if the move cannot throw.'], ['What is copy-and-swap?', 'Assignment that takes its argument by value and swaps, for exception safety and self-assignment handling.']],
      ex: {
        prompt: 'Write specialMembers(declared) where declared lists the user-declared special members among "dtor", "copyCtor", "copyAssign", "moveCtor", "moveAssign". Return [copy, move] describing the copy constructor and the move constructor. copy: "copy:deleted" if moveCtor or moveAssign is declared, else "copy:user" if copyCtor is declared, else "copy:implicit". move: "move:user" if moveCtor is declared, else "move:none" if any of copyCtor, copyAssign, moveAssign, dtor is declared, else "move:implicit".',
        fn: 'specialMembers', params: 'declared', sig: '(string[] declared) -> string[]',
        cpp: `class Solution {
public:
    vector<string> specialMembers(vector<string>& declared) {
        set<string> d(declared.begin(), declared.end());
        string copy = (d.count("moveCtor") || d.count("moveAssign")) ? "copy:deleted"
                    : d.count("copyCtor") ? "copy:user" : "copy:implicit";
        string move;
        if (d.count("moveCtor")) move = "move:user";
        else if (d.count("copyCtor") || d.count("copyAssign") || d.count("moveAssign") || d.count("dtor")) move = "move:none";
        else move = "move:implicit";
        return {copy, move};
    }
};
`,
        cases: [{ args: [[]], expect: ['copy:implicit', 'move:implicit'] }, { args: [['dtor']], expect: ['copy:implicit', 'move:none'] }, { args: [['moveCtor']], expect: ['copy:deleted', 'move:user'] }, { args: [['copyCtor', 'copyAssign', 'dtor']], expect: ['copy:user', 'move:none'] }, { args: [['copyCtor', 'copyAssign', 'moveCtor', 'moveAssign', 'dtor']], expect: ['copy:deleted', 'move:user'] }, { args: [['moveAssign']], expect: ['copy:deleted', 'move:none'] }],
        solution: "function specialMembers(declared){const d=new Set(declared);const copy=(d.has('moveCtor')||d.has('moveAssign'))?'copy:deleted':(d.has('copyCtor')?'copy:user':'copy:implicit');const move=d.has('moveCtor')?'move:user':(['copyCtor','copyAssign','moveAssign','dtor'].some(x=>d.has(x))?'move:none':'move:implicit');return[copy,move]}",
        hint: 'Declaring a move operation deletes the implicit copies; declaring any of the other four suppresses the implicit move constructor.',
      },
      quiz: [
        choice('cx-me-5-q1', 'cpp-rule-of-five', 'A class has members std::string and std::vector only. Which special members should it declare?', ['none (rule of zero)', 'all five', 'only a destructor', 'only copies'], 0, 'Members manage themselves.'),
        choice('cx-me-5-q2', 'cpp-rule-of-five', 'Declaring only a destructor causes the move constructor to be...', ['not declared, so copies are used', 'generated', 'deleted', 'noexcept'], 0, 'Silent pessimisation.'),
        choice('cx-me-5-q3', 'cpp-rule-of-five', 'Why must a move constructor be noexcept?', ['so std::vector moves elements when it grows', 'the language requires it', 'to allow copying', 'for thread safety'], 0, 'move_if_noexcept.'),
        fill('cx-me-5-q4', 'cpp-rule-of-five', 'Implementing assignment by taking a by-value parameter and swapping is the copy-and-___ idiom.', ['swap'], 'Strong guarantee.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'cx-me-6', title: 'Memory bugs and the tools that find them', concept: 'cpp-memory-errors',
      story: "In 2019 Microsoft engineer Matt Miller reported that about 70% of the vulnerabilities Microsoft assigned CVEs each year were memory-safety issues; Google's Chromium team published the same figure in 2020. Those numbers pushed governments (the US CISA and NSA in 2022–2024) to urge memory-safe languages, and pushed the C++ community toward safety profiles, hardened standard libraries, and better tooling. Most C++ memory bugs fall into a handful of classes, and modern sanitizers find them quickly when tests exercise the code.",
      analogy: "Memory bugs are like a library with no checkout desk: people read books that were already shredded (use after free), shred the same book twice (double free), take books home and never return them (leaks), or write past the last page into the next book (buffer overflow). Sanitizers install the checkout desk during testing.",
      timeline: [['1996', 'Smashing the stack', 'Aleph One\'s Phrack article popularises stack overflows.'], ['2002', 'Valgrind', 'Memcheck finds invalid reads and leaks by dynamic binary instrumentation.'], ['2012', 'AddressSanitizer', 'Google\'s compiler-based ASan in Clang 3.1 and GCC 4.8.'], ['2025–2026', 'Hardening', 'C++26 adopts a hardened standard library mode and erroneous behaviour for uninitialised reads.']],
      explain: "The main classes: **buffer overflow** (reading or writing outside an array, on the stack or heap), **use after free** (dereferencing memory already released, including dangling references and iterators), **double free** (releasing the same block twice), **invalid free** (freeing memory that was never allocated by that allocator, or a stack address), **memory leak** (allocated memory never released), **uninitialised reads**, and **data races** (unsynchronised concurrent access). Tools: **AddressSanitizer** (`-fsanitize=address`) catches overflows, use after free, double free, and (with LeakSanitizer) leaks, at roughly 2× slowdown; **UndefinedBehaviorSanitizer** (`-fsanitize=undefined`) catches signed overflow, invalid shifts, misaligned access, and more; **MemorySanitizer** (Clang) finds uninitialised reads; **ThreadSanitizer** (`-fsanitize=thread`) finds data races at 5–15× slowdown; **Valgrind** works on unmodified binaries but runs 20–50× slower. Prevention beats detection: RAII and smart pointers for ownership, containers instead of raw arrays, `at()` or hardened library modes for checked access, and `std::span` for pointer-plus-length.",
      diagram: "bug class             typical cause                       tool\nheap overflow         index past end, wrong size          ASan\nuse after free        dangling pointer, iterator, view    ASan\ndouble / invalid free two owners, freeing a stack address ASan\nleak                  owner forgot to release             LSan (with ASan)\nuninitialised read    T x; then read                      MSan\nUB (overflow, shift)  arithmetic rules                    UBSan\ndata race             shared write without sync           TSan",
      ex1: ['cpp', 'a use after free that ASan reports', "int* p = new int[4];\ndelete[] p;\nreturn p[1];   // ASan: heap-use-after-free READ of size 4\n// compile: clang++ -g -fsanitize=address -fno-omit-frame-pointer main.cpp"],
      ex2: ['cpp', 'replacing raw memory with safe types', "void process(std::span<const int> data) {   // C++20: pointer + length\n  for (int x : data) { /* bounds known */ }\n}\nstd::vector<int> v(100);\nprocess(v);\nauto owner = std::make_unique<Packet>();   // no manual delete\n// libstdc++: -D_GLIBCXX_ASSERTIONS · libc++: hardening modes check operator[]"],
      deepDive: {
        explain: "ASan works by **shadow memory**: every 8 bytes of application memory map to 1 shadow byte saying how many are addressable, and the compiler inserts a check before each load and store. Freed memory goes into a **quarantine** so reuse is delayed and use-after-free hits poisoned memory; **redzones** around allocations catch overflows. Sanitizers only find bugs on paths that run, so pair them with good tests and **fuzzing** (libFuzzer, AFL++), which generates inputs to reach new code; OSS-Fuzz has found tens of thousands of bugs in open-source projects this way. ASan and TSan cannot be combined in one build; teams usually run separate CI jobs. For production, cheaper defences exist: hardened standard library modes (libc++ hardening, `_GLIBCXX_ASSERTIONS`) add bounds checks at low cost, and sampling detectors (GWP-ASan in Chrome and Android) catch use-after-free in the field with negligible overhead. Static analysers (Clang Static Analyzer, clang-tidy, Coverity, PVS-Studio) and lifetime warnings catch some bugs before any run.",
        example: ['text', 'a typical CI sanitizer matrix', "job asan:  -O1 -g -fsanitize=address,undefined -fno-omit-frame-pointer   → unit + integration tests\njob tsan:  -O1 -g -fsanitize=thread                                      → concurrency tests\njob msan:  -O1 -g -fsanitize=memory (Clang, instrumented libc++)          → unit tests\njob fuzz:  -fsanitize=fuzzer,address                                      → parsers, 10 min per target"],
        tradeoffs: [['Tool', 'Finds', 'Cost'], ['AddressSanitizer', 'Overflows, UAF, double free, leaks', '~2× time, ~3× memory'], ['ThreadSanitizer', 'Data races', '5–15× time, 5–10× memory'], ['Valgrind memcheck', 'Similar to ASan, no rebuild', '20–50× time'], ['Hardened library mode', 'Out-of-bounds container access', 'Low; usable in production']],
        failures: [['Crash far away from the bug', 'Heap corruption detected later', 'Run under ASan to find the first bad write'], ['Sanitizer finds nothing', 'Buggy path not exercised', 'Add tests and fuzzing'], ['Leak reports at every exit', 'Global caches never freed', 'Free at shutdown or suppress deliberately'], ['Race appears only in production', 'TSan never run on concurrency tests', 'Separate TSan CI job']],
      },
      warn: "A program that \"works\" does not prove it is free of memory bugs. Undefined behaviour can stay silent for years and then corrupt data or become an exploit; run sanitizers in CI.",
      production: {
        numbers: "Microsoft (2019) and Chromium (2020) each reported that about 70% of their serious security bugs were memory-safety issues. ASan typically costs about 2× run time and 3× memory.",
        observe: "Sanitizer CI jobs on every merge, fuzzing for parsers and decoders, crash reporting with symbolised stacks in production, and GWP-ASan-style sampling where available.",
        security: "Memory-safety bugs are the dominant exploit class for C and C++. Combine prevention (ownership types, containers, span) with detection (sanitizers, fuzzing) and mitigation (hardening flags).",
        checklist: ['No owning raw pointers', 'Containers and std::span instead of raw arrays', 'ASan + UBSan CI job', 'TSan CI job for concurrent code', 'Fuzzing for untrusted input parsers', 'Hardened library mode in release builds', 'Symbolised crash reports'],
        sources: ['Miller, "Trends, challenges, and strategic shifts in the software vulnerability mitigation landscape" (Microsoft, BlueHat IL 2019)', 'Chromium Project, "Memory safety" (2020)', 'Clang documentation: AddressSanitizer, ThreadSanitizer, MemorySanitizer, UBSan', 'Serebryany et al., "AddressSanitizer: A Fast Address Sanity Checker" (USENIX ATC 2012)'],
      },
      tip: "When ASan reports an error, read the first report fully: it shows where the bad access happened, where the memory was allocated, and where it was freed. Later reports are often consequences.",
      faq: [['What does ASan detect?', 'Buffer overflows, use after free, double free, and, with LeakSanitizer, leaks.'], ['How much does ASan slow a program?', 'About 2× in time and about 3× in memory.'], ['Which sanitizer finds data races?', 'ThreadSanitizer.'], ['Which sanitizer finds uninitialised reads?', 'MemorySanitizer (Clang).'], ['Why fuzz as well as test?', 'Sanitizers only catch bugs on executed paths; fuzzers generate inputs that reach new paths.']],
      ex: {
        prompt: 'Write memCheck(events) acting like a tiny AddressSanitizer. Events are "alloc:<p>", "free:<p>", and "use:<p>". Report in order: "use-after-free:<p>" for a use of freed memory, "double-free:<p>" for freeing already freed memory, and "invalid-free:<p>" for freeing a name never allocated. After all events, append "leak:<p>" for every block still allocated, sorted by name.',
        fn: 'memCheck', params: 'events', sig: '(string[] events) -> string[]',
        cpp: `class Solution {
public:
    vector<string> memCheck(vector<string>& events) {
        map<string, int> state;                 // 1 = live, 2 = freed
        vector<string> out;
        for (const string& e : events) {
            size_t c = e.find(':');
            string kind = e.substr(0, c), p = e.substr(c + 1);
            auto it = state.find(p);
            int s = it == state.end() ? 0 : it->second;
            if (kind == "alloc") state[p] = 1;
            else if (kind == "free") {
                if (s == 1) state[p] = 2;
                else if (s == 2) out.push_back("double-free:" + p);
                else out.push_back("invalid-free:" + p);
            } else if (s == 2) out.push_back("use-after-free:" + p);
        }
        for (const auto& kv : state) if (kv.second == 1) out.push_back("leak:" + kv.first);
        return out;
    }
};
`,
        cases: [{ args: [['alloc:a', 'use:a', 'free:a']], expect: [] }, { args: [['alloc:a', 'free:a', 'use:a', 'free:a']], expect: ['use-after-free:a', 'double-free:a'] }, { args: [['alloc:b', 'alloc:a', 'free:x']], expect: ['invalid-free:x', 'leak:a', 'leak:b'] }, { args: [[]], expect: [] }],
        solution: "function memCheck(ev){const st={};const out=[];for(const e of ev){const[k,p]=e.split(':');if(k==='alloc')st[p]='live';else if(k==='free'){if(st[p]==='live')st[p]='freed';else if(st[p]==='freed')out.push('double-free:'+p);else out.push('invalid-free:'+p)}else{if(st[p]==='freed')out.push('use-after-free:'+p)}}const leaks=Object.keys(st).filter(p=>st[p]==='live').sort().map(p=>'leak:'+p);return out.concat(leaks)}",
        hint: 'Track each block as live or freed; a std::map keeps leak names sorted for free.',
      },
      quiz: [
        choice('cx-me-6-q1', 'cpp-memory-errors', 'Which flag enables AddressSanitizer in GCC and Clang?', ['-fsanitize=address', '-fsanitize=thread', '-Wall', '-O3'], 0, 'ASan.'),
        choice('cx-me-6-q2', 'cpp-memory-errors', 'Reading through a pointer after delete is...', ['use after free (undefined behaviour)', 'a leak', 'a double free', 'safe if the value is unchanged'], 0, 'UAF.'),
        choice('cx-me-6-q3', 'cpp-memory-errors', 'About what share of Microsoft\'s and Chromium\'s serious security bugs were memory-safety issues?', ['about 70%', 'about 10%', 'about 30%', 'almost none'], 0, '2019 and 2020 reports.'),
        fill('cx-me-6-q4', 'cpp-memory-errors', 'Data races are found by ___Sanitizer', ['Thread', 'thread'], 'TSan.'),
      ],
    }),
  ],
  exam: [
    choice('cx-me-e1', 'cpp-stack-heap', 'Why is stack allocation cheaper than heap allocation?', ['it only moves the stack pointer and frees automatically', 'it uses faster RAM', 'it is garbage collected', 'it avoids the CPU cache'], 0, 'Pointer bump.'),
    choice('cx-me-e2', 'cpp-raii', 'What guarantees a mutex is unlocked on every exit path?', ['an RAII guard such as std::lock_guard', 'calling unlock at the end', 'a try/finally block', 'a global flag'], 0, 'Destructor runs.'),
    choice('cx-me-e3', 'cpp-raii', 'Members of a class are destroyed in...', ['reverse declaration order', 'declaration order', 'alphabetical order', 'random order'], 0, 'Reverse.'),
    choice('cx-me-e4', 'cpp-unique-ptr', 'Which is true of std::unique_ptr?', ['it is move-only', 'it is reference counted', 'it can be copied', 'it is always 16 bytes'], 0, 'Exclusive.'),
    choice('cx-me-e5', 'cpp-unique-ptr', 'A sink function that takes ownership should take...', ['std::unique_ptr<T> by value', 'const T&', 'T*', 'std::weak_ptr<T>'], 0, 'Caller writes std::move.'),
    choice('cx-me-e6', 'cpp-shared-weak', 'What breaks a shared_ptr reference cycle?', ['making one direction a weak_ptr', 'calling use_count()', 'make_shared', 'a virtual destructor'], 0, 'Non-owning back edge.'),
    choice('cx-me-e7', 'cpp-shared-weak', 'Copying a shared_ptr costs...', ['an atomic increment of the strong count', 'nothing', 'a heap allocation', 'a deep copy of the object'], 0, 'Atomic counting.'),
    choice('cx-me-e8', 'cpp-rule-of-five', 'Class with a raw owning pointer and only a destructor written. Copying it causes...', ['a double free', 'a deep copy', 'a compile error', 'nothing harmful'], 0, 'Shallow copy.'),
    choice('cx-me-e9', 'cpp-memory-errors', 'Which tool finds reads of uninitialised memory?', ['MemorySanitizer', 'ThreadSanitizer', 'gprof', 'clang-format'], 0, 'MSan.'),
    choice('cx-me-e10', 'cpp-stack-heap', 'Typical default main-thread stack size on Linux:', ['8 MB', '64 KB', '1 GB', 'unlimited'], 0, 'ulimit -s.'),
    order('cx-me-e11', 'cpp-memory-errors', 'Order the response to a heap corruption crash.', ['Reproduce it with a fixed input', 'Rebuild with -fsanitize=address -g', 'Read the first ASan report: access, allocation, and free stacks', 'Fix ownership and add a regression test under ASan in CI'], 'First report first.'),
    fill('cx-me-e12', 'cpp-rule-of-five', 'Designing classes so they need no user-declared special members is the rule of ___', ['zero', '0'], 'Let members manage resources.'),
  ],
};
