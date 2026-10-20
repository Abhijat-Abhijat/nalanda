import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const cxStl: Chapter = {
  id: 'cx-stl',
  title: 'The standard library: containers, iterators, algorithms, and ranges',
  summary: 'The parts of the C++ standard library a senior engineer uses every day: sequence containers and their growth, ordered and unordered associative containers, iterators and invalidation rules, the algorithms library, lambdas and function objects, C++20 ranges and views, vocabulary types (optional, variant, any, span), and hashing with custom keys. Library behaviour checked against cppreference and the libstdc++, libc++, and MSVC STL implementations as of October 2026.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'cx-st-1', title: 'Sequence containers: vector, array, deque, and list', concept: 'cpp-sequence-containers',
      story: "Alexander Stepanov spent years at GE, Bell Labs, and HP developing the idea that algorithms could be written once and work on any data structure that offered the right iterators. In 1994 he and Meng Lee presented the Standard Template Library to the C++ committee, which accepted it into the draft standard within months. The STL's sequence containers made a promise C programmers had never had: precise complexity guarantees. Decades later, the most important practical lesson is that `std::vector`, the simplest of them, is the right choice far more often than the theory of linked lists suggests, because modern CPUs reward contiguous memory.",
      analogy: "A vector is a row of numbered lockers in one corridor: walking along it is fast, but adding lockers may mean moving to a longer corridor. A list is a treasure hunt where each clue points to the next: inserting a clue is cheap, but finding the twentieth one means following nineteen others.",
      timeline: [['1994', 'STL proposal', 'Stepanov and Lee present the STL; accepted into the C++ draft.'], ['1998', 'C++98', 'vector, deque, list in the standard.'], ['2011', 'C++11', 'std::array, std::forward_list, emplace operations, shrink_to_fit.'], ['2023', 'C++23', 'std::flat_map and flat_set (sorted vectors); C++26 adds std::inplace_vector.']],
      explain: "**`std::vector<T>`**: contiguous dynamic array. Random access O(1), `push_back` amortised O(1), insertion or erase in the middle O(n). When full it allocates a bigger buffer and relocates elements: **libstdc++ and libc++ double** the capacity, **MSVC grows by 1.5×**. `size()` is the number of elements, `capacity()` the allocated slots; `reserve(n)` preallocates, `shrink_to_fit()` requests release. **`std::array<T, N>`**: fixed-size contiguous array with no heap allocation, the safer replacement for C arrays. **`std::deque<T>`**: a sequence of fixed-size blocks; O(1) push and pop at both ends, random access O(1) with an extra indirection, and no relocation of existing elements when growing (references stay valid on push at the ends). **`std::list<T>`** (doubly linked) and **`std::forward_list<T>`**: O(1) insert and erase anywhere given an iterator, stable addresses, `splice` without copying, but one heap allocation per node and poor cache behaviour. Default to **vector**; use **array** for fixed sizes, **deque** for queues needing both ends, and **list** only when you need stable references with frequent middle insertions and have measured.",
      diagram: "vector  [a|b|c|d|_|_|_|_]  contiguous; size 4, capacity 8\narray   [a|b|c|d]          fixed size N, no heap\ndeque   map ──► [a b c d] [e f g h] [i j _ _]   blocks; fast at both ends\nlist    ⇄[a]⇄[b]⇄[c]⇄       one node per element; pointers each way\ngrowth: libstdc++/libc++ ×2  ·  MSVC ×1.5",
      ex1: ['cpp', 'size, capacity, and reserve', "std::vector<int> v;\nv.reserve(1000);                // one allocation up front\nfor (int i = 0; i < 1000; ++i) v.push_back(i);   // no reallocations\nstd::printf(\"%zu %zu\\n\", v.size(), v.capacity());   // 1000 1000\nstd::array<int, 4> a{1, 2, 3, 4};   // stack, no allocation\nstd::deque<int> q; q.push_front(0); q.push_back(1);"],
      ex2: ['cpp', 'why vector usually beats list', "// Insert 100,000 random values in sorted position, then sum.\n// vector: binary search + memmove shifts, contiguous — typically faster\n// list:   linear search through scattered nodes — cache misses dominate\n// Stroustrup's and others' benchmarks show vector winning even for\n// middle insertion until elements get large or very numerous."],
      deepDive: {
        explain: "Growth by a constant factor makes `push_back` amortised O(1): with factor 2, n pushes cause about log₂ n reallocations and fewer than 2n element relocations in total. A factor of 1.5 wastes less memory and lets freed blocks be reused by later allocations (the sum of previous blocks can exceed the next request), at the cost of more reallocations. Relocation uses the element's move constructor only if it is `noexcept` (otherwise copies). `std::vector<bool>` is a special bit-packed specialisation that does not hold real `bool`s; use `std::vector<char>` or `std::bitset` when you need addressable elements. Cache effects dominate: a cache line is 64 bytes, and sequential access lets the hardware prefetcher stream data, whereas each list node is a separate allocation that may miss the cache. C++23 `std::flat_map` stores keys and values in sorted vectors, trading O(n) insertion for faster lookup and iteration than node-based maps. C++26 `std::inplace_vector<T, N>` gives vector semantics with fixed capacity and no heap allocation.",
        example: ['cpp', 'erase-remove (and C++20 std::erase_if)', "std::vector<int> v{1, 2, 3, 4, 5, 6};\nv.erase(std::remove_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; }), v.end());\n// C++20: std::erase_if(v, [](int x) { return x % 2 == 0; });\n// v == {1, 3, 5}"],
        tradeoffs: [['Container', 'Strength', 'Weakness'], ['vector', 'Contiguous, cache-friendly, cheap random access', 'Middle insertion O(n); relocation invalidates'], ['array', 'No allocation; fixed size known at compile time', 'Cannot grow'], ['deque', 'Fast at both ends; no relocation of elements', 'Extra indirection; not contiguous'], ['list', 'Stable references; O(1) splice and insert', 'Allocation per node; cache misses']],
        failures: [['Many reallocations in a loop', 'push_back without reserve for a known size', 'reserve(n)'], ['Pointers invalid after push_back', 'Vector reallocated', 'Indices, reserve, or deque'], ['vector<bool> element address fails to compile', 'Proxy specialisation', 'vector<char> or bitset'], ['List-based code is slow', 'Cache misses on node traversal', 'Measure; prefer vector or flat_map']],
      },
      warn: "Do not pick std::list for performance from textbook complexity alone. On modern CPUs vector usually wins, even for many middle insertions; measure before choosing.",
      production: {
        numbers: "Pushing 1,000 elements reallocates 11 times with doubling (1, 2, 4, … 1,024) and 18 times with MSVC's 1.5× growth; reserve(1000) makes it once.",
        observe: "Allocation profiles (heaptrack) and cache-miss counters (perf stat -e cache-misses) reveal container choices that hurt; benchmark with realistic sizes and element types.",
        security: "operator[] does not check bounds; use at() where indices come from input, or enable hardened library modes (_GLIBCXX_ASSERTIONS, libc++ hardening) to trap out-of-range access.",
        checklist: ['vector by default', 'reserve when the size is known', 'array for fixed sizes', 'deque for double-ended queues', 'list only with measurements', 'No vector<bool> where real bools are needed', 'Bounds-checked access for untrusted indices'],
        sources: ['Stepanov and Lee, "The Standard Template Library" (HP Labs, 1994/1995)', 'cppreference.com: std::vector, std::deque, std::list, std::array', 'Stroustrup, "Software Development for Infrastructure" (IEEE Computer, 2012), vector versus list', 'P0429 (std::flat_map, C++23) and P0843 (std::inplace_vector, C++26)'],
      },
      tip: "Start with vector and reserve. Switch containers only when a profiler shows the container is the bottleneck.",
      faq: [['How does vector grow?', 'Geometrically: ×2 in libstdc++ and libc++, ×1.5 in MSVC, giving amortised O(1) push_back.'], ['When is deque better than vector?', 'When you push and pop at both ends, or need element addresses to stay valid while growing at the ends.'], ['Why is list often slower than its complexity suggests?', 'One allocation per node and poor cache locality.'], ['What is special about vector<bool>?', 'It packs bits and returns proxy objects, not bool references.'], ['What is std::array for?', 'Fixed-size arrays with value semantics and no heap allocation.']],
      ex: {
        prompt: 'Write reallocations(n, factor) returning how many times a vector reallocates while n elements are pushed one by one, starting from capacity 0. When size equals capacity, the new capacity is max(1, 2 × capacity) for factor 2, or max(capacity + 1, capacity + floor(capacity / 2)) for factor 1.5 (MSVC style).',
        fn: 'reallocations', params: 'n, factor', sig: '(int n, double factor) -> int',
        cpp: `class Solution {
public:
    int reallocations(int n, double factor) {
        long long cap = 0;
        int count = 0;
        for (long long size = 0; size < n; size++) {
            if (size == cap) {
                cap = factor == 2 ? max(1LL, cap * 2) : max(cap + 1, cap + cap / 2);
                count++;
            }
        }
        return count;
    }
};
`,
        cases: [{ args: [1000, 2], expect: 11 }, { args: [1000, 1.5], expect: 18 }, { args: [0, 2], expect: 0 }, { args: [1, 1.5], expect: 1 }, { args: [10, 1.5], expect: 7 }],
        solution: 'function reallocations(n,f){let cap=0,r=0;for(let s=0;s<n;s++){if(s===cap){cap=f===2?Math.max(1,cap*2):Math.max(cap+1,cap+Math.floor(cap/2));r++}}return r}',
        hint: 'Simulate: before each push, grow if the vector is full and count it.',
      },
      quiz: [
        choice('cx-st-1-q1', 'cpp-sequence-containers', 'Default container choice for a sequence in C++:', ['std::vector', 'std::list', 'std::deque', 'std::forward_list'], 0, 'Contiguous.'),
        choice('cx-st-1-q2', 'cpp-sequence-containers', 'MSVC\'s std::vector grows capacity by a factor of about...', ['1.5', '2', '4', '1.1'], 0, 'libstdc++/libc++ use 2.'),
        choice('cx-st-1-q3', 'cpp-sequence-containers', 'Which container offers O(1) push at both ends without relocating elements?', ['std::deque', 'std::vector', 'std::array', 'std::string'], 0, 'Blocks.'),
        fill('cx-st-1-q4', 'cpp-sequence-containers', 'To allocate space for n elements up front, call v.___(n)', ['reserve'], 'Avoids reallocations.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'cx-st-2', title: 'Associative containers: map, set, and their unordered cousins', concept: 'cpp-associative',
      story: "The original STL had only ordered associative containers, `std::map` and `std::set`, implemented as red-black trees with O(log n) operations and sorted iteration. Hash tables were proposed too late for C++98, so every vendor shipped its own `hash_map` with different interfaces. C++11 finally standardised `std::unordered_map` and `std::unordered_set`, with a design (separate chaining with buckets and stable node addresses) that later proved slower than the open-addressing tables Google and others built, such as Abseil's Swiss tables (2017) and Boost's `unordered_flat_map` (2022).",
      analogy: "std::map is a dictionary in alphabetical order: finding a word takes a few page flips, and reading it front to back gives sorted words. unordered_map is a coat check: you get your item almost instantly from its ticket number, but the racks are in no meaningful order.",
      timeline: [['1998', 'map and set', 'Ordered containers, usually red-black trees.'], ['2011', 'unordered_map/set', 'Hash containers standardised with bucket interfaces.'], ['2017', 'C++17', 'try_emplace, insert_or_assign, node extract and merge; Abseil Swiss tables open-sourced.'], ['2023', 'C++23', 'flat_map and flat_set; C++20 added contains().']],
      explain: "**Ordered**: `std::map<K, V>`, `std::set<K>`, and the `multi` versions keep keys sorted by `operator<` (or a comparator); lookup, insert, and erase are O(log n), and iteration is in key order. They also support range queries: `lower_bound`, `upper_bound`, `equal_range`. **Unordered**: `std::unordered_map` and `std::unordered_set` use a hash function and buckets; average O(1), worst case O(n) with many collisions, iteration order unspecified. Watch the API traps: **`map[key]` inserts a default-constructed value** when the key is missing (and cannot be used on a const map); use `find`, `contains` (C++20), or `at` (throws if missing) for lookups. `insert` does not overwrite an existing key; `insert_or_assign` does; `try_emplace` constructs only if the key is absent. Structured bindings make iteration readable: `for (const auto& [k, v] : m)`. Choose **ordered** when you need sorted output, range queries, or deterministic order; **unordered** for pure lookup speed with a good hash; and consider **flat** or third-party open-addressing maps for the hottest paths.",
      diagram: "std::map (red-black tree)              std::unordered_map (buckets)\n          [m]                          bucket 0 → (k3,v3)\n        /     \\                        bucket 1 → (k1,v1) → (k7,v7)\n     [c]       [t]                     bucket 2 → ∅\n    /   \\        \\                     bucket 3 → (k2,v2)\n  [a]   [f]      [z]                   load factor = size / bucket_count (max 1.0 by default)\nO(log n), sorted                        O(1) average, unordered",
      ex1: ['cpp', 'counting words in sorted order', "std::map<std::string, int> counts;\nfor (const std::string& w : words) ++counts[w];   // operator[] inserts 0 first\nfor (const auto& [word, n] : counts)\n  std::cout << word << '=' << n << '\\n';          // alphabetical"],
      ex2: ['cpp', 'lookups that do not insert', "std::unordered_map<std::string, int> ages{{\"ada\", 36}};\nif (auto it = ages.find(\"bo\"); it != ages.end()) use(it->second);   // C++17 if-init\nif (ages.contains(\"ada\")) { }        // C++20\nages.try_emplace(\"cy\", 41);          // inserts only if absent\nages.insert_or_assign(\"ada\", 37);    // overwrites"],
      deepDive: {
        explain: "`std::unordered_map`'s standard requirements (stable references to elements across rehashing, the bucket interface, `max_load_factor`) effectively force **separate chaining with one heap node per element**, which costs an allocation per insert and a pointer chase per lookup. Open-addressing tables (Abseil `flat_hash_map`, Boost `unordered_flat_map`, Facebook F14) store elements inline in arrays and use SIMD-friendly metadata, and are often 2–3× faster, at the cost of not keeping references stable on rehash. **Rehashing** happens when size exceeds `bucket_count × max_load_factor` (1.0 by default) and invalidates iterators but not references in the standard containers. Heterogeneous lookup (C++14 for ordered with `std::less<>`, C++20 for unordered with transparent hash and equal) lets you look up with a `string_view` without constructing a `std::string`. Ordered maps with a `std::less<>` comparator find by `const char*` or `string_view` directly. Node handles (C++17 `extract`, `merge`) move elements between maps without reallocation.",
        example: ['cpp', 'heterogeneous lookup without allocating', "std::map<std::string, int, std::less<>> m{{\"alpha\", 1}};\nstd::string_view key = \"alpha\";\nauto it = m.find(key);   // no temporary std::string thanks to std::less<>"],
        tradeoffs: [['Container', 'Lookup', 'Notes'], ['std::map / set', 'O(log n)', 'Sorted; range queries; node per element'], ['std::unordered_map / set', 'O(1) average', 'Node per element; unspecified order'], ['std::flat_map (C++23)', 'O(log n), cache-friendly', 'O(n) insertion; best for read-mostly'], ['Open addressing (Abseil, Boost)', 'O(1) average, fastest in practice', 'Third-party; references unstable on rehash']],
        failures: [['Map grows with empty entries', 'operator[] used for lookups', 'find or contains'], ['Lookups slow down over time', 'Poor hash causing collisions', 'Better hash; check bucket sizes'], ['Output order differs between runs or platforms', 'Iterating an unordered container', 'Sort or use std::map'], ['Allocation in every lookup', 'Constructing std::string keys from literals', 'Heterogeneous lookup']],
      },
      warn: "m[key] inserts a default value when the key is missing. Use find, contains, or at for lookups, especially in code that should not modify the map.",
      production: {
        numbers: "std::unordered_map rehashes when size exceeds bucket_count × max_load_factor (1.0 by default); a red-black tree with 1,000,000 keys has a height of at most about 40 (2 log₂ n), so lookups touch about 20–40 nodes.",
        observe: "Profile lookups in hot paths; record bucket_count, load_factor, and the largest bucket_size for suspicious maps; compare with open-addressing alternatives in benchmarks.",
        security: "Hash flooding: attackers who can choose keys can force collisions and O(n) lookups (denial of service). std::hash is not randomised; for untrusted keys use a seeded hash (for example SipHash) or ordered maps.",
        checklist: ['find/contains for lookups', 'try_emplace and insert_or_assign for clear intent', 'Ordered containers when order matters', 'reserve() for unordered containers of known size', 'Heterogeneous lookup for string keys', 'Seeded hashes for untrusted keys', 'Benchmark flat or open-addressing maps for hot paths'],
        sources: ['cppreference.com: std::map; std::unordered_map; std::flat_map', 'Abseil, "Swiss Tables Design Notes" (2017)', 'Boost.Unordered documentation: unordered_flat_map (2022)', 'Crosby and Wallach, "Denial of Service via Algorithmic Complexity Attacks" (USENIX Security 2003)'],
      },
      tip: "If you only need lookups, start with unordered_map and reserve; if you ever print, diff, or range-query the keys, use map.",
      faq: [['What does m[key] do if key is missing?', 'Inserts a value-initialised element and returns a reference to it.'], ['Complexity of std::map lookup?', 'O(log n).'], ['Is unordered_map iteration order stable?', 'No; it is unspecified and can change after rehashing.'], ['What is try_emplace for?', 'Constructing the value only if the key is absent, without moving arguments otherwise.'], ['What is hash flooding?', 'Choosing keys that collide to make hash lookups O(n), as a denial-of-service attack.']],
      ex: {
        prompt: 'Write wordCounts(words) returning "word=count" strings in sorted key order (byte order, so uppercase letters sort before lowercase), as iterating a std::map<std::string, int> would.',
        fn: 'wordCounts', params: 'words', sig: '(string[] words) -> string[]',
        cpp: `class Solution {
public:
    vector<string> wordCounts(vector<string>& words) {
        map<string, int> counts;
        for (const string& w : words) ++counts[w];
        vector<string> out;
        for (const auto& kv : counts) out.push_back(kv.first + "=" + to_string(kv.second));
        return out;
    }
};
`,
        cases: [{ args: [['to', 'be', 'or', 'not', 'to', 'be']], expect: ['be=2', 'not=1', 'or=1', 'to=2'] }, { args: [[]], expect: [] }, { args: [['B', 'a', 'B']], expect: ['B=2', 'a=1'] }],
        solution: "function wordCounts(w){const m={};for(const x of w)m[x]=(m[x]||0)+1;return Object.keys(m).sort().map(k=>k+'='+m[k])}",
        hint: 'An ordered map gives sorted iteration for free.',
      },
      quiz: [
        choice('cx-st-2-q1', 'cpp-associative', 'Which container gives keys in sorted order when iterated?', ['std::map', 'std::unordered_map', 'std::unordered_set', 'none'], 0, 'Tree.'),
        choice('cx-st-2-q2', 'cpp-associative', 'Average lookup cost of std::unordered_map:', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 0, 'Hashing.'),
        choice('cx-st-2-q3', 'cpp-associative', 'Which call inserts only when the key is absent?', ['try_emplace', 'insert_or_assign', 'operator[] with assignment', 'at'], 0, 'try_emplace.'),
        fill('cx-st-2-q4', 'cpp-associative', 'The C++20 member that tests key presence is ___', ['contains', 'contains()'], 'm.contains(k).'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'cx-st-3', title: 'Iterators and invalidation rules', concept: 'cpp-iterators',
      story: "Iterators are the glue of Stepanov's design: algorithms talk to iterators, containers provide them, and neither needs to know about the other. The price is a set of rules about when an iterator stops being valid, and those rules differ by container and operation. Iterator invalidation bugs are among the most common C++ defects found by sanitizers and debug standard libraries, because invalid iterators often keep \"working\" until a reallocation or rehash happens in production.",
      analogy: "An iterator is a bookmark. In a book that never changes, bookmarks are safe. In a ring binder (vector) that is re-bound into a bigger binder whenever it fills up, every bookmark falls out when you add the page that triggers the move.",
      timeline: [['1994', 'STL iterators', 'Input, output, forward, bidirectional, random-access categories.'], ['2011', 'C++11', 'begin/end free functions, range-based for, cbegin.'], ['2020', 'C++20', 'Iterator concepts (contiguous_iterator), sentinels, ranges.'], ['2020s', 'Debug modes', 'libstdc++ _GLIBCXX_DEBUG and MSVC checked iterators catch invalid use.']],
      explain: "Iterator **categories** describe capabilities: input (single pass read), output, forward (multi-pass), bidirectional (`--`, as in `list` and `map`), random access (`it + n`, as in `deque`), and contiguous (C++20, elements adjacent in memory: `vector`, `array`, `string`). Algorithms require a category: `std::sort` needs random access, which is why `std::list` has its own `sort()` member. **Invalidation rules** (the ones that bite): **vector** and **string**: insertion that reallocates (size would exceed capacity) invalidates **all** iterators, pointers, and references; insertion without reallocation, and erase, invalidate those **at or after** the position. `push_back` without reallocation invalidates only `end()`. **deque**: insertion at either end invalidates **all iterators** but keeps references valid; insertion or erase in the middle invalidates everything. **list** and **forward_list**: insertion invalidates nothing; erase invalidates only the erased elements. **map/set**: like list. **unordered** containers: insertion that causes a **rehash** invalidates all iterators (but not references); erase invalidates only the erased elements. The safe erase-in-loop idiom uses the iterator returned by `erase`: `it = c.erase(it);`.",
      diagram: "container       insert                         erase\nvector/string   realloc: ALL · else: at+after   at+after\ndeque           ends: all iterators (refs ok)   middle: all\n                middle: all\nlist/map/set    none                            only erased\nunordered_*     rehash: all iterators · else none   only erased",
      ex1: ['cpp', 'erasing while iterating', "std::map<int, Session> sessions;\nfor (auto it = sessions.begin(); it != sessions.end(); ) {\n  if (it->second.expired()) it = sessions.erase(it);   // erase returns next\n  else ++it;\n}\n// C++20 for any standard container: std::erase_if(sessions, pred);"],
      ex2: ['cpp', 'the reallocation trap', "std::vector<int> v{1, 2, 3};\nfor (int x : v) {\n  if (x == 2) v.push_back(4);   // may reallocate: the loop's iterators dangle (UB)\n}\n// fix: collect additions in a separate vector, then append after the loop"],
      deepDive: {
        explain: "A range-based for loop is sugar for iterating from `begin()` to `end()` with cached iterators, so modifying the container's size inside it is dangerous for vectors and deques. Debug modes help: libstdc++'s `-D_GLIBCXX_DEBUG` turns iterator misuse into immediate aborts with a message (with ABI and speed costs), `-D_GLIBCXX_ASSERTIONS` adds cheaper checks, MSVC has `_ITERATOR_DEBUG_LEVEL`, and libc++ offers hardening modes. ASan catches many cases where an invalid iterator points into freed memory. C++20 introduced iterator **concepts** (`std::random_access_iterator`, `std::contiguous_iterator`) and **sentinels**, allowing `end` to be a different type from `begin` (for example a null terminator), which ranges use heavily. Pointers into a `std::vector` and `std::string` stay valid as long as no reallocation happens, so calling `reserve` up front can make index-free algorithms safe, but storing **indices** is usually more robust than storing iterators across modifications.",
        example: ['cpp', 'iterator category decides the algorithm', "std::list<int> l{3, 1, 2};\n// std::sort(l.begin(), l.end());   // error: needs random-access iterators\nl.sort();                            // member sort for lists\nstd::vector<int> v{3, 1, 2};\nstd::sort(v.begin(), v.end());       // fine"],
        tradeoffs: [['Store…', 'Survives vector growth?', 'Survives map insert?'], ['Iterator', 'No (on reallocation)', 'Yes'], ['Pointer or reference', 'No (on reallocation)', 'Yes'], ['Index', 'Yes', 'n/a'], ['Key', 'n/a', 'Yes (lookup again)']],
        failures: [['Crash after push_back in a loop', 'Reallocation invalidated the loop iterators', 'Iterate by index or defer insertions'], ['Skipped elements when erasing', 'Incrementing after erase', 'it = c.erase(it)'], ['Random corruption after unordered insert', 'Iterators kept across a rehash', 'Reserve or re-find'], ['std::sort fails to compile on list', 'Wrong iterator category', 'list::sort()']],
      },
      warn: "Never keep iterators, pointers, or references into a vector across an operation that may reallocate it, and never modify a vector's size inside a range-based for loop over it.",
      production: {
        numbers: "A vector holding 1,000 elements with capacity 1,024 can take 24 more push_backs before reallocating; the 25th invalidates every iterator, pointer, and reference.",
        observe: "Run tests with -D_GLIBCXX_ASSERTIONS (cheap) or -D_GLIBCXX_DEBUG (thorough) and ASan; MSVC debug builds check iterators by default.",
        security: "Invalid iterators read or write freed memory: use-after-free. Hardened standard library modes and sanitizers turn these into deterministic failures.",
        checklist: ['erase via returned iterator or std::erase_if', 'No container growth inside range-for', 'Indices instead of iterators across modifications', 'reserve for unordered containers before bulk insert', 'Debug or hardened library mode in test builds', 'ASan CI job', 'Algorithms matched to iterator categories'],
        sources: ['cppreference.com: Containers library (iterator invalidation table)', 'ISO/IEC 14882:2024 [container.reqmts], [sequences], [unord.req]', 'libstdc++ manual: Debug Mode', 'Stepanov and McJones, "Elements of Programming" (2009)'],
      },
      tip: "Before calling insert or erase on a container you are iterating, look up its invalidation rule; if in doubt, collect changes and apply them after the loop.",
      faq: [['What does vector reallocation invalidate?', 'All iterators, pointers, and references to its elements.'], ['What does list insertion invalidate?', 'Nothing.'], ['What does deque push_back invalidate?', 'All iterators, but references to elements stay valid.'], ['How do you erase while iterating?', 'it = c.erase(it); or C++20 std::erase_if.'], ['Why can std::sort not sort a list?', 'It needs random-access iterators; list provides bidirectional ones.']],
      ex: {
        prompt: 'Write invalidated(container, op, full) returning which iterators an operation invalidates: "all", "at-and-after", "only-erased", or "none". Rules: vector push_back or insert when full (size == capacity) → "all"; vector push_back when not full → "none" (only end()); vector insert when not full → "at-and-after"; vector erase → "at-and-after"; list insert → "none"; list erase → "only-erased"; unordered_map insert → "all" if full (it rehashes) else "none"; unordered_map erase → "only-erased"; deque (any op) → "all".',
        fn: 'invalidated', params: 'container, op, full', sig: '(string container, string op, bool full) -> string',
        cpp: `class Solution {
public:
    string invalidated(string c, string op, bool full) {
        if (c == "vector") {
            if (op == "push_back") return full ? "all" : "none";
            if (op == "insert") return full ? "all" : "at-and-after";
            return "at-and-after";
        }
        if (c == "list") return op == "erase" ? "only-erased" : "none";
        if (c == "unordered_map") {
            if (op == "erase") return "only-erased";
            return full ? "all" : "none";
        }
        return "all";
    }
};
`,
        cases: [{ args: ['vector', 'push_back', true], expect: 'all' }, { args: ['vector', 'push_back', false], expect: 'none' }, { args: ['vector', 'insert', false], expect: 'at-and-after' }, { args: ['vector', 'erase', false], expect: 'at-and-after' }, { args: ['list', 'insert', false], expect: 'none' }, { args: ['list', 'erase', false], expect: 'only-erased' }, { args: ['unordered_map', 'insert', true], expect: 'all' }, { args: ['unordered_map', 'insert', false], expect: 'none' }, { args: ['unordered_map', 'erase', false], expect: 'only-erased' }, { args: ['deque', 'push_back', false], expect: 'all' }],
        solution: "function invalidated(c,op,full){if(c==='vector'){if(op==='push_back')return full?'all':'none';if(op==='insert')return full?'all':'at-and-after';return'at-and-after'}if(c==='list')return op==='erase'?'only-erased':'none';if(c==='unordered_map'){if(op==='erase')return'only-erased';return full?'all':'none'}return'all'}",
        hint: 'Contiguous storage moves on reallocation; node-based containers keep nodes in place.',
      },
      quiz: [
        choice('cx-st-3-q1', 'cpp-iterators', 'v.push_back(x) reallocates. Which iterators into v remain valid?', ['none', 'all', 'those before the end', 'only begin()'], 0, 'New buffer.'),
        choice('cx-st-3-q2', 'cpp-iterators', 'Inserting into a std::map invalidates...', ['nothing', 'all iterators', 'iterators after the key', 'only end()'], 0, 'Node-based.'),
        choice('cx-st-3-q3', 'cpp-iterators', 'Correct way to erase matching elements while iterating a map:', ['it = m.erase(it); else ++it', 'm.erase(it); ++it;', 'erase in a range-for', 'erase then restart from begin every time'], 0, 'Use the returned iterator.'),
        fill('cx-st-3-q4', 'cpp-iterators', 'std::sort requires ___-access iterators.', ['random'], 'Random access.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'cx-st-4', title: 'The algorithms library', concept: 'cpp-algorithms',
      story: "Sean Parent's 2013 talk \"C++ Seasoning\" made a simple rule famous: no raw loops. His example rewrote a page of hand-written loops for moving selected items in a list into a couple of calls to `std::stable_partition` and `std::rotate`. The point was not brevity for its own sake: named algorithms state intent, are tested, and carry known complexity, whereas a raw loop must be read line by line to discover that it is \"just a find\" with an off-by-one error.",
      analogy: "The algorithms library is a set of well-made kitchen tools. You can chop everything with one knife, but a peeler, a grater, and a sieve each say what they do and do it reliably.",
      timeline: [['1994', 'STL algorithms', 'sort, find, copy, transform, accumulate, and more.'], ['2011', 'C++11', 'all_of, any_of, none_of, is_sorted, minmax_element, iota.'], ['2017', 'C++17', 'Parallel execution policies; reduce, transform_reduce; sample, clamp.'], ['2020', 'C++20', 'Ranges versions in std::ranges with projections; constexpr algorithms.']],
      explain: "Algorithms take iterator ranges `[first, last)` and never change a container's size: `std::remove` only moves kept elements forward, so you must call `erase` (or C++20 `std::erase_if`). Families to know: **non-modifying** (`find`, `find_if`, `count_if`, `all_of`, `any_of`, `mismatch`, `search`), **modifying** (`copy`, `transform`, `fill`, `replace`, `remove_if`, `unique`, `reverse`, `rotate`), **sorting** (`sort` O(n log n) introsort, not stable; `stable_sort`; `partial_sort` for the top k; `nth_element` average O(n) selection), **binary search** on sorted ranges (`lower_bound`, `upper_bound`, `equal_range`, `binary_search`), **partitioning** (`partition`, `stable_partition`), **heap** operations, **set** operations on sorted ranges, and **numeric** (`accumulate`, `reduce`, `inner_product`, `iota`, `partial_sum`). Choose by required work: to get the k largest in order use `partial_sort` (O(n log k)); to find the median use `nth_element`; to deduplicate, `sort` then `unique` then `erase`. Comparators must define a **strict weak ordering** (`a < b`, never `<=`), or `std::sort` has undefined behaviour and may crash.",
      diagram: "need                          algorithm                       cost\nfirst match                   find_if                         O(n)\nsorted order                  sort                            O(n log n)\nk largest, in order           partial_sort(first, first+k, last, greater) O(n log k)\nk-th element only             nth_element                     O(n) average\nremove matches                erase(remove_if(…), end) / erase_if O(n)\nunique values                 sort + unique + erase           O(n log n)",
      ex1: ['cpp', 'top k with partial_sort', "std::vector<int> v{5, 1, 9, 3, 7};\nint k = 3;\nstd::partial_sort(v.begin(), v.begin() + k, v.end(), std::greater<>());\nv.resize(k);   // {9, 7, 5}"],
      ex2: ['cpp', 'deduplicate and binary search', "std::vector<int> v{4, 1, 4, 2, 1};\nstd::sort(v.begin(), v.end());                     // 1 1 2 4 4\nv.erase(std::unique(v.begin(), v.end()), v.end()); // 1 2 4\nbool has2 = std::binary_search(v.begin(), v.end(), 2);\nauto it = std::lower_bound(v.begin(), v.end(), 3); // points at 4"],
      deepDive: {
        explain: "`std::sort` is typically **introsort** (quicksort that switches to heapsort when recursion gets deep, plus insertion sort for small ranges), guaranteeing O(n log n) worst case since C++11; libc++ and libstdc++ have both refined their implementations, and LLVM's libc++ added debug checks that detect invalid comparators. A comparator using `<=` violates strict weak ordering (`comp(a, a)` must be false) and can make `std::sort` read out of bounds. `std::stable_sort` keeps equal elements in their original order using extra memory (O(n log n), or O(n log² n) without a buffer). Execution policies (`std::execution::par`, `par_unseq`) parallelise many algorithms in C++17; libstdc++ implements them using Intel's oneTBB, MSVC natively, and libc++ has partial support. C++20 makes most algorithms `constexpr` and adds `std::ranges::` versions that accept whole ranges and **projections** (`std::ranges::sort(people, {}, &Person::age)`). `std::accumulate` is strictly left-to-right; `std::reduce` may reorder operations (needs associativity and commutativity) to parallelise.",
        example: ['cpp', 'C++20 ranges algorithm with a projection', "struct Person { std::string name; int age; };\nstd::vector<Person> people = load();\nstd::ranges::sort(people, std::less<>{}, &Person::age);       // sort by age\nauto it = std::ranges::find(people, \"Ada\", &Person::name);    // find by name"],
        tradeoffs: [['Goal', 'Algorithm', 'Note'], ['Total order', 'sort', 'Not stable'], ['Keep equal elements in order', 'stable_sort', 'Extra memory'], ['Top k sorted', 'partial_sort', 'O(n log k)'], ['Median or k-th', 'nth_element', 'O(n) average; partially orders']],
        failures: [['std::remove did not shrink the vector', 'remove only moves elements', 'erase the tail or std::erase_if'], ['Crash inside std::sort', 'Comparator not a strict weak ordering (<=)', 'Use < and consistent keys'], ['binary_search gives wrong answers', 'Range not sorted with the same comparator', 'Sort first with the same ordering'], ['Floating-point sums differ between runs', 'std::reduce reorders additions', 'accumulate for deterministic order']],
      },
      warn: "A sort comparator must be a strict weak ordering: comp(a, a) must be false. Using <= in a comparator is undefined behaviour and can crash std::sort.",
      production: {
        numbers: "Sorting 10 million ints with std::sort takes on the order of a second on one core; partial_sort for the top 10 of the same data is several times faster, and nth_element is linear on average.",
        observe: "Profilers show time in sort and find; libc++ and libstdc++ debug/hardening modes detect some invalid comparators and unsorted inputs to binary searches.",
        security: "Invalid comparators can cause out-of-bounds reads in sort implementations. Comparators built from user-controlled data (for example NaN floats) must still be strict weak orderings.",
        checklist: ['Named algorithm instead of a raw loop', 'erase after remove (or erase_if)', 'Comparators use <, never <=', 'partial_sort or nth_element for top k and medians', 'Binary search only on sorted ranges', 'accumulate when order matters', 'Ranges versions with projections in C++20 code'],
        sources: ['Parent, "C++ Seasoning" (GoingNative 2013)', 'cppreference.com: Algorithms library; std::sort; std::nth_element', 'Musser, "Introspective Sorting and Selection Algorithms" (1997)', 'ISO/IEC 14882:2024 [alg.sorting] (strict weak ordering)'],
      },
      tip: "When you write a for loop, try to name what it does: find, count, transform, partition. If a standard algorithm has that name, use it.",
      faq: [['Does std::remove shrink a container?', 'No. It moves kept elements forward; erase the tail afterwards.'], ['Which algorithm finds the k largest in order?', 'std::partial_sort, in O(n log k).'], ['Is std::sort stable?', 'No; use std::stable_sort.'], ['What is strict weak ordering?', 'The comparator rules (irreflexive, transitive, with transitive incomparability) that sort requires.'], ['Difference between accumulate and reduce?', 'accumulate is in order; reduce may reorder for parallelism.']],
      ex: {
        prompt: 'Write kLargest(nums, k) returning the k largest values in descending order (0 <= k <= length). In C++, use std::partial_sort with std::greater<>.',
        fn: 'kLargest', params: 'nums, k', sig: '(int[] nums, int k) -> int[]',
        cpp: `class Solution {
public:
    vector<int> kLargest(vector<int>& nums, int k) {
        vector<int> v = nums;
        partial_sort(v.begin(), v.begin() + k, v.end(), greater<>());
        v.resize(k);
        return v;
    }
};
`,
        cases: [{ args: [[5, 1, 9, 3, 7], 3], expect: [9, 7, 5] }, { args: [[4, 4, 2], 2], expect: [4, 4] }, { args: [[], 0], expect: [] }, { args: [[-1, -5], 1], expect: [-1] }],
        solution: 'function kLargest(n,k){return [...n].sort((a,b)=>b-a).slice(0,k)}',
        hint: 'Only the first k positions need to be sorted.',
      },
      quiz: [
        choice('cx-st-4-q1', 'cpp-algorithms', 'After auto it = std::remove(v.begin(), v.end(), 0);, what else is needed to shrink v?', ['v.erase(it, v.end())', 'nothing', 'v.shrink_to_fit()', 'std::unique'], 0, 'Erase-remove idiom.'),
        choice('cx-st-4-q2', 'cpp-algorithms', 'Which algorithm finds the median in average linear time?', ['std::nth_element', 'std::sort', 'std::partial_sort', 'std::stable_sort'], 0, 'Selection.'),
        choice('cx-st-4-q3', 'cpp-algorithms', 'A comparator written with <= is...', ['undefined behaviour in std::sort', 'fine', 'stable', 'faster'], 0, 'Not strict weak ordering.'),
        fill('cx-st-4-q4', 'cpp-algorithms', 'In a sorted range, std::___ returns the first element not less than x.', ['lower_bound'], 'Binary search.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'cx-st-5', title: 'Lambdas and function objects', concept: 'cpp-lambdas',
      story: "Before C++11, passing a custom comparison to `std::sort` meant writing a named struct with `operator()` somewhere far from the call. Function objects were powerful (the compiler could inline them, unlike function pointers) but clumsy. C++11 lambdas, proposed by Jaakko Järvi and others, let you write the function object inline. Later standards added generic lambdas (C++14), `constexpr` lambdas (C++17), template lambdas and default-constructible stateless lambdas (C++20), and explicit object parameters that make recursive lambdas simple (C++23).",
      analogy: "A lambda is a sticky note with instructions plus a little pocket for things it should remember (its captures). Capturing by value puts photocopies in the pocket; capturing by reference puts addresses, which are useless if the house is gone.",
      timeline: [['1998', 'Function objects', 'Structs with operator() passed to algorithms.'], ['2011', 'C++11 lambdas', 'Inline anonymous function objects with captures.'], ['2014', 'C++14', 'Generic lambdas (auto parameters), init captures.'], ['2020–2023', 'C++20/23', 'Template lambdas; C++23 deducing this enables simple recursion.']],
      explain: "A lambda expression `[captures](params) -> ret { body }` creates an object of a unique, unnamed **closure type** with an `operator()`. **Captures**: `[x]` copies `x` at creation time; `[&x]` refers to `x`; `[=]` and `[&]` capture everything used by value or by reference (prefer explicit lists); `[this]` captures the object pointer, `[*this]` (C++17) copies the object; **init captures** (C++14) create new members: `[buf = std::move(buffer)]`, `[count = 0]`. By-value captures are **const** inside the body unless the lambda is declared **`mutable`**. Because each lambda has its own type, store them with `auto`, pass them to templates, or wrap in **`std::function<R(Args...)>`** when you need a uniform type (costs type erasure and possibly a heap allocation; C++23 adds `std::move_only_function`). Lambdas are ideal as comparators and predicates: `std::sort(v.begin(), v.end(), [](const P& a, const P& b) { return a.age < b.age; });`. Stateless lambdas convert to function pointers, which helps with C APIs.",
      diagram: "int base = 10;\nauto byVal = [base](int x) { return x + base; };    // copies 10 now\nauto byRef = [&base](int x) { return x + base; };   // reads base at call time\nbase = 20;\nbyVal(1) → 11     byRef(1) → 21\nclosure object: struct { int base; int operator()(int x) const { … } }",
      ex1: ['cpp', 'a comparator lambda for multi-key sorting', "struct Person { std::string name; int age; };\nstd::sort(people.begin(), people.end(), [](const Person& a, const Person& b) {\n  if (a.age != b.age) return a.age < b.age;\n  return a.name < b.name;\n});\n// or: return std::tie(a.age, a.name) < std::tie(b.age, b.name);"],
      ex2: ['cpp', 'mutable state and init captures', "auto counter = [n = 0]() mutable { return ++n; };\ncounter(); counter();          // 1, 2\nauto task = [data = std::move(bigVector)] { process(data); };   // move into the closure\nstd::function<int(int)> f = [](int x) { return x * 2; };          // type-erased"],
      deepDive: {
        explain: "The compiler turns each lambda into a class: captured variables become members, and the body becomes `operator()` (const unless `mutable`). Because the type is known at the call site, algorithms like `std::sort` inline the comparator, which is why `std::sort` with a lambda beats C's `qsort` with a function pointer. `std::function` erases the type: it stores small callables inline (small buffer optimisation, often 16–32 bytes) and heap-allocates larger ones, and each call is an indirect call. Dangling captures are the main bug: capturing locals by reference in a lambda stored for later (callbacks, threads, `std::async`) reads destroyed stack memory; `[=]` in a member function captures `this` implicitly (deprecated in C++20), so the lambda dangles if the object dies. Generic lambdas (`[](const auto& x)`) are templates; C++20 template lambdas (`[]<class T>(const std::vector<T>& v)`) give names to the types. C++23 \"deducing this\" lets a lambda refer to itself: `auto fib = [](this auto self, int n) -> int { return n < 2 ? n : self(n - 1) + self(n - 2); };`.",
        example: ['cpp', 'a dangling reference capture', "std::function<void()> makeTask() {\n  std::string msg = \"hello\";\n  return [&msg] { std::puts(msg.c_str()); };   // msg dies on return: UB when called\n}\n// fix: [msg] or [msg = std::move(msg)]"],
        tradeoffs: [['Callable', 'Overhead', 'Use'], ['Lambda via auto/template', 'None; inlined', 'Algorithms, local helpers'], ['std::function', 'Type erasure; maybe heap; indirect call', 'Stored callbacks with one type'], ['Function pointer', 'Indirect call; no state', 'C APIs'], ['Named function object', 'None; reusable', 'Shared comparators, hash functors']],
        failures: [['Callback prints garbage or crashes', 'Reference capture of a destroyed local', 'Capture by value or move'], ['Crash after object destroyed', 'Lambda captured this and outlived the object', 'Capture shared_from_this or weak_ptr'], ['Captured variable cannot be changed', 'By-value captures are const', 'mutable, or capture by reference deliberately'], ['Hot path slowed by callbacks', 'std::function indirection and allocation', 'Templates or function_ref-style views']],
      },
      warn: "Never capture locals by reference in a lambda that outlives the current scope (callbacks, threads, stored tasks). Capture by value or move instead.",
      production: {
        numbers: "std::sort with an inlined lambda comparator is commonly 2–3× faster than C qsort with a function pointer on integer data, because the comparison is inlined.",
        observe: "ASan detects stack-use-after-return from dangling reference captures (enable detect_stack_use_after_return); clang-tidy flags implicit this capture and std::function in hot loops.",
        security: "Callbacks that capture references or raw this and run later are a common source of use-after-free in asynchronous code; capture owned data or weak pointers.",
        checklist: ['Explicit capture lists', 'By-value or init captures for stored lambdas', 'No implicit this capture', 'std::function only where a single type is required', 'Comparators as lambdas inline', 'std::tie for multi-key comparisons', 'mutable only when state must change'],
        sources: ['Järvi, Freeman, Crowl, "Lambda Expressions and Closures" (N2550, 2008)', 'cppreference.com: Lambda expressions; std::function', 'C++ Core Guidelines F.50–F.54', 'P0847 "Deducing this" (C++23)'],
      },
      tip: "Use [&] only for lambdas that run immediately (passed to an algorithm). For anything stored, list captures explicitly and by value.",
      faq: [['What does a lambda compile to?', 'An object of a unique closure class with captured members and an operator().'], ['Difference between [x] and [&x]?', '[x] copies x when the lambda is created; [&x] refers to x when called.'], ['Why mutable?', 'By-value captures are const in the body unless the lambda is mutable.'], ['When use std::function?', 'When you need to store different callables under one type; it adds overhead.'], ['What is an init capture?', 'A capture that creates a new member, such as [p = std::move(ptr)].']],
      ex: {
        prompt: 'Write sortPeople(people) where each entry is "name:age". Return them sorted by age ascending, then by name ascending, as std::sort with a lambda comparator would.',
        fn: 'sortPeople', params: 'people', sig: '(string[] people) -> string[]',
        cpp: `class Solution {
public:
    vector<string> sortPeople(vector<string>& people) {
        vector<pair<int, string>> keyed;
        for (const string& p : people) {
            size_t c = p.find(':');
            keyed.push_back({stoi(p.substr(c + 1)), p});
        }
        sort(keyed.begin(), keyed.end(), [](const pair<int, string>& a, const pair<int, string>& b) {
            if (a.first != b.first) return a.first < b.first;
            return a.second.substr(0, a.second.find(':')) < b.second.substr(0, b.second.find(':'));
        });
        vector<string> out;
        for (auto& k : keyed) out.push_back(k.second);
        return out;
    }
};
`,
        cases: [{ args: [['ada:36', 'bo:25', 'cy:36', 'al:25']], expect: ['al:25', 'bo:25', 'ada:36', 'cy:36'] }, { args: [[]], expect: [] }, { args: [['z:1']], expect: ['z:1'] }],
        solution: "function sortPeople(p){return [...p].sort((a,b)=>{const[an,aa]=a.split(':'),[bn,ba]=b.split(':');return (+aa)-(+ba)||(an<bn?-1:an>bn?1:0)})}",
        hint: 'Compare ages first; only when they are equal compare names.',
      },
      quiz: [
        choice('cx-st-5-q1', 'cpp-lambdas', 'int b = 1; auto f = [b] { return b; }; b = 5; f() returns...', ['1', '5', 'undefined', '0'], 0, 'Copied at creation.'),
        choice('cx-st-5-q2', 'cpp-lambdas', 'Which keyword lets a lambda modify its by-value captures?', ['mutable', 'const', 'volatile', 'static'], 0, 'operator() non-const.'),
        choice('cx-st-5-q3', 'cpp-lambdas', 'Why does std::sort with a lambda often beat qsort?', ['the comparator is inlined', 'it uses threads', 'it skips comparisons', 'it sorts in parallel automatically'], 0, 'Known type.'),
        fill('cx-st-5-q4', 'cpp-lambdas', 'A type-erased wrapper that can hold any callable with signature int(int) is std::___<int(int)>', ['function'], 'std::function.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'cx-st-6', title: 'Ranges and views (C++20)', concept: 'cpp-ranges',
      story: "Eric Niebler's range-v3 library (from 2013) showed that C++ algorithms could take whole ranges instead of iterator pairs and could be composed lazily with the pipe operator, like Unix pipelines or C# LINQ. After years of work on concepts to support it, the Ranges library entered C++20. C++23 filled in many gaps (`std::ranges::to` to build containers, `views::zip`, `views::enumerate`, `views::chunk`, and more), and C++26 continues with further views and algorithms.",
      analogy: "A view is a recipe card describing steps (filter, then slice, then season) without cooking anything. Food appears only when someone actually eats a serving, and only as much as they eat.",
      timeline: [['2013', 'range-v3', 'Niebler\'s library prototypes ranges and views.'], ['2020', 'C++20 Ranges', 'Range concepts, constrained algorithms, views, pipe syntax.'], ['2023', 'C++23', 'std::ranges::to, zip, enumerate, chunk, slide, join_with, fold_left.'], ['2026', 'C++26', 'More views (for example concat) in the finalised draft.']],
      explain: "A **range** is anything with `begin()` and `end()` (where `end` may be a different **sentinel** type). **Constrained algorithms** in `std::ranges` take ranges directly (`std::ranges::sort(v)`), check requirements with concepts (clearer errors), and support **projections**. **Views** (`std::views::filter`, `transform`, `take`, `drop`, `reverse`, `iota`, `split`, `keys`, `values`) are lightweight, **lazy** adaptors: composing them with `|` builds a pipeline object, and no work happens until you iterate. `v | std::views::filter(isEven) | std::views::transform(square) | std::views::take(3)` reads left to right and stops after producing three values, even over an infinite `views::iota(1)`. Views do not own data (except `owning_view`), so they share the lifetime rules of `string_view`: a view of a temporary container dangles, and the library returns `std::ranges::dangling` from some algorithms to catch obvious cases at compile time. To materialise, C++23 offers `std::ranges::to<std::vector>()`; in C++20 you construct a container from the view's iterators. Runtime cost is usually comparable to hand-written loops, though complex pipelines can be slower to compile and sometimes defeat optimisations.",
      diagram: "nums | views::filter(even) | views::transform(square) | views::take(3)\n  1  2  3  4  5  6  7  8\n     ↓     ↓     ↓          filter: 2 4 6 (8 never examined)\n     4    16    36          transform on demand\n                            take(3) stops the pipeline\nresult (C++23): auto out = pipeline | std::ranges::to<std::vector>();",
      ex1: ['cpp', 'a lazy pipeline (C++20)', "#include <ranges>\nstd::vector<int> nums{1, 2, 3, 4, 5, 6, 7, 8};\nauto pipeline = nums | std::views::filter([](int x) { return x % 2 == 0; })\n                     | std::views::transform([](int x) { return x * x; })\n                     | std::views::take(3);\nfor (int x : pipeline) std::cout << x << ' ';   // 4 16 36"],
      ex2: ['cpp', 'infinite ranges and materialising (C++23)', "auto firstSquares = std::views::iota(1)\n                  | std::views::transform([](int n) { return n * n; })\n                  | std::views::take(5);\nstd::vector<int> v = firstSquares | std::ranges::to<std::vector>();   // {1, 4, 9, 16, 25}\nfor (auto [i, x] : std::views::enumerate(v)) { }                     // C++23"],
      deepDive: {
        explain: "Range **concepts** (`std::ranges::range`, `input_range`, `forward_range`, `random_access_range`, `contiguous_range`, `sized_range`, `view`) describe capabilities, and each view preserves what it can: `transform` over a random-access range stays random access, `filter` drops to bidirectional because it cannot jump. Some views **cache** results to meet complexity guarantees: `filter_view::begin()` caches the first matching position, so a `filter_view` must not be iterated through a `const` reference and must not be reused after the underlying data changes. Views are cheap to copy and pass **by value**. Pipelines that capture references must respect lifetimes: returning `vec | views::filter(...)` where `vec` is a local is a dangling view. `std::ranges::sort` accepts projections, and algorithms return richer results (`std::ranges::copy` returns both iterators). The runner used in this course compiles C++17, so exercises implement the same pipelines with loops; ranges compile with GCC 10 or later, Clang 15 or later (with libc++ 15+ or libstdc++), and MSVC 2019 16.10 or later in C++20 mode.",
        example: ['cpp', 'the equivalent C++17 loop', "std::vector<int> out;\nfor (int x : nums) {\n  if (x % 2 != 0) continue;   // filter\n  out.push_back(x * x);       // transform\n  if (out.size() == 3) break; // take\n}"],
        tradeoffs: [['Style', 'Strength', 'Weakness'], ['Raw loop', 'Explicit; easy to debug', 'Intent hidden; easy to get wrong'], ['Classic algorithms', 'Named, tested', 'Iterator pairs; no composition'], ['Ranges + views', 'Composable, lazy, readable', 'Compile times; lifetime pitfalls; caching rules'], ['Eager containers per step', 'Simple', 'Extra allocations and passes']],
        failures: [['Garbage values from a returned view', 'View over a destroyed local container', 'Return a container, or keep the source alive'], ['Compile error iterating a const filter view', 'filter_view caches begin() and is not const-iterable', 'Pass views by value'], ['Stale results after modifying data', 'Reusing a cached filter_view', 'Recreate the view'], ['Unexpectedly slow pipeline', 'Expensive transform evaluated repeatedly by later adaptors', 'Materialise intermediate results']],
      },
      warn: "Views do not own their data. Never return a view over a local container or a temporary; the view will dangle just like a string_view.",
      production: {
        numbers: "views::take(3) over a filter of a million-element vector examines only as many elements as needed to find three matches, instead of a full pass.",
        observe: "Compile-time profiling (-ftime-trace in Clang) reveals heavy range pipelines; benchmark pipelines against loops in hot code.",
        security: "Dangling views are use-after-free bugs; ASan detects them in tests. Prefer returning owning containers from functions.",
        checklist: ['std::ranges algorithms with projections', 'Views passed by value', 'No views returned over locals', 'ranges::to (C++23) to materialise', 'Intermediate results materialised when transforms are costly', 'Compiler versions confirmed for C++20/23 features', 'Benchmarks for hot pipelines'],
        sources: ['Niebler, Carter, Di Bella, "The One Ranges Proposal" (P0896R4, 2018)', 'cppreference.com: Ranges library', 'P1206 "ranges::to" and P2321 "zip" (C++23)', 'Niebler, range-v3 documentation'],
      },
      tip: "Read a pipeline right to left to see how much work it needs: take(3) at the end means the earlier stages only run until three results come out.",
      faq: [['Are views eager or lazy?', 'Lazy: elements are computed only when iterated.'], ['Do views own their elements?', 'No (except owning_view); they reference the underlying range.'], ['How do you build a vector from a view in C++23?', 'pipeline | std::ranges::to<std::vector>().'], ['What is a projection?', 'A callable applied to elements before comparison, such as &Person::age.'], ['Why might a const filter_view fail to iterate?', 'It caches its begin position, which requires mutation.']],
      ex: {
        prompt: 'Write pipeline(nums) equivalent to nums | views::filter(even) | views::transform(square) | views::take(3): return the squares of the first three even numbers, in order. In C++17, write the loop that stops as soon as three results exist.',
        fn: 'pipeline', params: 'nums', sig: '(int[] nums) -> int[]',
        cpp: `class Solution {
public:
    vector<int> pipeline(vector<int>& nums) {
        vector<int> out;
        for (int x : nums) {
            if (out.size() == 3) break;     // take(3): stop early
            if (x % 2 != 0) continue;       // filter
            out.push_back(x * x);           // transform
        }
        return out;
    }
};
`,
        cases: [{ args: [[1, 2, 3, 4, 5, 6, 7, 8]], expect: [4, 16, 36] }, { args: [[1, 3]], expect: [] }, { args: [[-2, 0, 2]], expect: [4, 0, 4] }, { args: [[]], expect: [] }],
        solution: 'function pipeline(n){return n.filter(x=>x%2===0).map(x=>x*x).slice(0,3)}',
        hint: 'Skip odd numbers, square the rest, and stop after three results.',
      },
      quiz: [
        choice('cx-st-6-q1', 'cpp-ranges', 'When does a views::transform pipeline do its work?', ['when elements are iterated', 'when the pipeline is created', 'at compile time', 'when the source is destroyed'], 0, 'Lazy.'),
        choice('cx-st-6-q2', 'cpp-ranges', 'Returning vec | views::filter(f) where vec is a local...', ['dangles', 'copies vec', 'is safe', 'does not compile'], 0, 'Views do not own.'),
        choice('cx-st-6-q3', 'cpp-ranges', 'Which C++23 facility builds a container from a view?', ['std::ranges::to', 'std::ranges::make', 'std::views::collect', 'std::vector::from'], 0, 'ranges::to.'),
        fill('cx-st-6-q4', 'cpp-ranges', 'Views are composed with the ___ operator, as in v | views::take(3).', ['|', 'pipe'], 'Pipe.'),
      ],
    }),
    deepTopic({
      id: 'l7', key: 'cx-st-7', title: 'Vocabulary types: optional, variant, any, and span', concept: 'cpp-vocabulary-types',
      story: "C and early C++ code signalled \"no value\" with magic numbers (`-1`, `nullptr`, `INT_MIN`) and stored \"one of several types\" in unions with a separate tag that programmers had to keep in sync. Boost provided `optional`, `variant`, and `any` for years; C++17 standardised all three, and C++20 added `std::span`. These \"vocabulary types\" matter because they let APIs from different libraries agree on how to say \"maybe\", \"one of\", and \"a view of contiguous elements\".",
      analogy: "optional is a gift box that may be empty, and you can check before opening. variant is a box that holds exactly one of a few known kinds of item, with a label saying which. span is a window onto a shelf: it shows a run of items without owning them.",
      timeline: [['2003–2008', 'Boost', 'boost::optional, boost::variant, boost::any.'], ['2017', 'C++17', 'std::optional, std::variant, std::any, std::string_view.'], ['2020', 'C++20', 'std::span.'], ['2023', 'C++23', 'Monadic optional (and_then, transform, or_else) and std::expected.']],
      explain: "**`std::optional<T>`** holds a `T` or nothing (`std::nullopt`), stored inline with no heap allocation. Check with `has_value()` or `if (opt)`, read with `*opt` (undefined if empty) or `value()` (throws if empty) or `value_or(default)`. Use it for return values that may be absent, such as parsing or lookup. C++23 adds `and_then`, `transform`, and `or_else` for chaining. **`std::expected<T, E>`** (C++23) holds either a value or an error, a structured alternative to exceptions or error codes. **`std::variant<A, B, C>`** is a type-safe tagged union: it always holds exactly one alternative; access with `std::get<T>` (throws on mismatch), `std::get_if` (pointer or null), or **`std::visit`** with an overloaded lambda set, which forces you to handle every alternative. **`std::any`** holds any copyable type with type erasure (possible heap allocation); use sparingly, mostly at plugin boundaries. **`std::span<T>`** (C++20) is a non-owning pointer plus length over contiguous elements, the safe replacement for `(T* data, size_t n)` parameters; like `string_view`, it must not outlive the data.",
      diagram: "std::optional<int>        [ has_value | int ]          empty or a value, inline\nstd::variant<int, string>  [ index | storage for the largest ]   exactly one alternative\nstd::any                   [ type info | small buffer or heap ]  anything copyable\nstd::span<int>             [ ptr | size ] ──► contiguous ints owned elsewhere\nstd::expected<T, E>        [ has_value | T or E ]        C++23",
      ex1: ['cpp', 'optional for parse results', "std::optional<int> parsePort(std::string_view s) {\n  int v = 0;\n  auto [p, ec] = std::from_chars(s.data(), s.data() + s.size(), v);\n  if (ec != std::errc{} || p != s.data() + s.size() || v < 1 || v > 65535) return std::nullopt;\n  return v;\n}\nint port = parsePort(env).value_or(8080);"],
      ex2: ['cpp', 'variant with std::visit', "template <class... Ts> struct overloaded : Ts... { using Ts::operator()...; };\ntemplate <class... Ts> overloaded(Ts...) -> overloaded<Ts...>;   // not needed in C++20\nusing Shape = std::variant<Circle, Square>;\ndouble area(const Shape& s) {\n  return std::visit(overloaded{\n    [](const Circle& c) { return 3.14159 * c.r * c.r; },\n    [](const Square& q) { return q.side * q.side; },\n  }, s);\n}"],
      deepDive: {
        explain: "`optional<T>` is about `sizeof(T)` plus a flag, rounded for alignment, so `optional<int>` is typically 8 bytes; `optional<T&>` was not allowed until C++26 adopted it. A variant is the size of its largest alternative plus an index. If an alternative's constructor throws during assignment, a variant can become **valueless_by_exception**, a rare but real state. `std::visit` dispatch is typically a jump table and compiles to code similar to a switch over the index. Variants offer an alternative to inheritance hierarchies for closed sets of types: no heap allocation, value semantics, and the compiler checks every case is handled; inheritance remains better for open sets extended by other modules. `std::any_cast<T>` must name the exact stored type. `span` comes in a dynamic extent form (`span<T>`) and a fixed extent (`span<T, N>`); `as_bytes` views it as bytes for serialisation. For error handling without exceptions, as in this course's runner and many game, embedded, and Google-style code bases, `optional` and `expected` are the idiomatic ways to return failure.",
        example: ['cpp', 'expected for errors with detail (C++23)', "std::expected<Config, std::string> load(std::string_view path) {\n  auto text = readFile(path);\n  if (!text) return std::unexpected(\"cannot read \" + std::string(path));\n  return parse(*text);\n}\nif (auto cfg = load(\"app.toml\")) use(*cfg); else log(cfg.error());"],
        tradeoffs: [['Type', 'Represents', 'Cost'], ['optional<T>', 'T or nothing', 'Inline; one flag'], ['expected<T, E>', 'T or an error E', 'Inline; C++23'], ['variant<Ts...>', 'Exactly one of a closed set', 'Largest alternative plus index'], ['any', 'Anything copyable', 'Type erasure; maybe heap'], ['span<T>', 'View of contiguous elements', 'Pointer plus length; non-owning']],
        failures: [['Crash reading an empty optional', '*opt on nullopt (UB)', 'Check first or use value_or'], ['bad_variant_access thrown', 'std::get with the wrong alternative', 'std::visit or get_if'], ['Magic -1 returned from a parser', 'Sentinel values', 'optional or expected'], ['span reads freed memory', 'Span outlived its vector', 'Keep the owner alive; do not store spans long term']],
      },
      warn: "Dereferencing an empty std::optional with * is undefined behaviour. Check has_value() first or use value_or.",
      production: {
        numbers: "sizeof(std::optional<int>) is typically 8 bytes and sizeof(std::span<int>) is 16 bytes on 64-bit platforms; neither allocates.",
        observe: "clang-tidy bugprone-unchecked-optional-access flags reads of optionals that might be empty.",
        security: "std::span with hardened library modes adds bounds checks on operator[]; replacing pointer-plus-length parameters with span removes a common source of buffer overflows.",
        checklist: ['optional instead of sentinel values', 'expected (or optional plus logging) for recoverable errors', 'variant with visit for closed sets', 'any only at true type-erasure boundaries', 'span instead of pointer plus length', 'Checked access to optionals', 'No long-lived spans'],
        sources: ['cppreference.com: std::optional, std::variant, std::any, std::span, std::expected', 'P0798 "Monadic operations for std::optional" and P0323 "std::expected" (C++23)', 'C++ Core Guidelines I.13 (do not pass an array as a single pointer), F.24', 'P2988 "std::optional<T&>" (C++26)'],
      },
      tip: "Make invalid states unrepresentable: optional for maybe, variant for one-of, span for bounded views, instead of flags and magic numbers.",
      faq: [['Does std::optional allocate?', 'No. It stores the value inline with a flag.'], ['How do you handle every variant alternative?', 'std::visit with an overload set of lambdas.'], ['What does value_or do?', 'Returns the contained value or the provided default if empty.'], ['When should you use std::any?', 'Rarely: at boundaries where the type truly cannot be known in advance.'], ['What replaces (T* data, size_t n) parameters?', 'std::span<T> (C++20).']],
      ex: {
        prompt: 'Write parsePort(s) returning the port number as an optional int: the input must be 1 to 5 ASCII digits with a value from 1 to 65535 (leading zeros allowed). Return null (std::nullopt) otherwise.',
        fn: 'parsePort', params: 's', sig: '(string s) -> int?',
        cpp: `class Solution {
public:
    optional<int> parsePort(string s) {
        if (s.empty() || s.size() > 5) return nullopt;
        int v = 0;
        for (char c : s) {
            if (c < '0' || c > '9') return nullopt;
            v = v * 10 + (c - '0');
        }
        if (v < 1 || v > 65535) return nullopt;
        return v;
    }
};
`,
        cases: [{ args: ['8080'], expect: 8080 }, { args: ['0'], expect: null }, { args: ['65536'], expect: null }, { args: ['abc'], expect: null }, { args: [''], expect: null }, { args: ['443'], expect: 443 }, { args: ['007'], expect: 7 }],
        solution: 'function parsePort(s){if(!/^[0-9]{1,5}$/.test(s))return null;const v=Number(s);return v>=1&&v<=65535?v:null}',
        hint: 'Reject empty, too long, and non-digit input before checking the range.',
      },
      quiz: [
        choice('cx-st-7-q1', 'cpp-vocabulary-types', 'Best return type for a lookup that may find nothing:', ['std::optional<T>', 'T with -1 as a sentinel', 'std::any', 'T*  to a static'], 0, 'Explicit absence.'),
        choice('cx-st-7-q2', 'cpp-vocabulary-types', 'Which function handles every alternative of a variant?', ['std::visit', 'std::get', 'std::any_cast', 'std::holds_alternative'], 0, 'Exhaustive.'),
        choice('cx-st-7-q3', 'cpp-vocabulary-types', 'std::span<int> owns its elements.', ['false', 'true', 'only when fixed extent', 'only on the heap'], 0, 'A view.'),
        fill('cx-st-7-q4', 'cpp-vocabulary-types', 'An empty std::optional compares equal to std::___', ['nullopt'], 'No value.'),
      ],
    }),
    deepTopic({
      id: 'l8', key: 'cx-st-8', title: 'Hashing and custom keys', concept: 'cpp-hashing',
      story: "Glenn Fowler, Landon Curt Noll, and Kiem-Phong Vo designed the FNV hash in 1991: a few lines of code that XOR in a byte and multiply by a prime, fast enough for compilers and DNS servers. In 2011 researchers showed that web frameworks using predictable hashes could be knocked over with a few kilobytes of crafted POST parameters that all collided (\"hash flooding\"), and languages such as Python, Ruby, and Rust switched to seeded hashes like SipHash. C++'s `std::hash` remains implementation-defined and unseeded, so knowing how to supply your own hash is part of production C++.",
      analogy: "A hash function is a coat-check ticket machine: the same coat must always get the same ticket number, and good machines spread coats evenly over the racks. A bad or predictable machine lets a prankster pile every coat onto one rack.",
      timeline: [['1991', 'FNV', 'Fowler, Noll, and Vo publish the FNV hash.'], ['2003', 'Algorithmic complexity attacks', 'Crosby and Wallach show hash-collision DoS.'], ['2011', 'Hash flooding at 28C3', 'Klink and Wälde demonstrate DoS on web platforms.'], ['2012', 'SipHash', 'Aumasson and Bernstein publish a fast keyed hash.']],
      explain: "To use a type as a key in `std::unordered_map`, you need **a hash** and **equality**. Provide equality with `operator==` (C++20 can default it: `bool operator==(const Key&) const = default;`). Provide the hash either by specialising **`std::hash<Key>`** in namespace std or by passing a hash **functor** as the third template argument. Hash requirements: equal keys must produce equal hashes; different keys should rarely collide. Combine member hashes rather than XORing them (XOR makes `(a, b)` and `(b, a)` collide and maps equal members to 0); a common combiner is Boost's `seed ^= h + 0x9e3779b9 + (seed << 6) + (seed >> 2)`. For ordered containers you need **`operator<`** or a comparator instead; C++20's defaulted `operator<=>` generates all comparisons memberwise. Simple non-cryptographic hashes like **FNV-1a** (32-bit: start at 2166136261, for each byte XOR then multiply by 16777619, modulo 2^32) are fine for internal data. For keys an attacker controls, use a **seeded** hash (SipHash, or a per-process random seed mixed into your hash) or an ordered map. Never use these hashes for passwords or integrity; use cryptographic functions (SHA-256, or Argon2 and bcrypt for passwords).",
      diagram: "FNV-1a (32-bit)\nh = 2166136261\nfor each byte b:  h = (h XOR b) × 16777619  (mod 2^32)\n\"\"  → 2166136261     \"a\" → 3826002220\nunordered_map<Key, V, KeyHash> needs:  KeyHash(key) → size_t   and   key == key\nmap<Key, V> needs:                     key < key (strict weak ordering)",
      ex1: ['cpp', 'a custom key for unordered_map', "struct Point {\n  int x, y;\n  bool operator==(const Point&) const = default;   // C++20\n};\nstruct PointHash {\n  size_t operator()(const Point& p) const noexcept {\n    size_t seed = std::hash<int>{}(p.x);\n    seed ^= std::hash<int>{}(p.y) + 0x9e3779b9 + (seed << 6) + (seed >> 2);\n    return seed;\n  }\n};\nstd::unordered_map<Point, std::string, PointHash> labels;"],
      ex2: ['cpp', 'FNV-1a in a few lines', "uint32_t fnv1a(std::string_view s) {\n  uint32_t h = 2166136261u;\n  for (unsigned char c : s) { h ^= c; h *= 16777619u; }   // unsigned wrap is defined\n  return h;\n}"],
      deepDive: {
        explain: "libstdc++ implements `std::hash<std::string>` with MurmurHash2-style code and `std::hash<int>` as the **identity** function, which is fast but means patterns in integer keys (all multiples of the bucket count) can cluster; libstdc++ mitigates this by using prime bucket counts, while power-of-two tables (Abseil, Boost flat maps) apply extra mixing. Hashes must be **deterministic within a process** but need not be stable across processes or versions, so never persist `std::hash` values to disk or send them over the network. Equality and hash must agree, including for normalised keys: if keys compare case-insensitively, hash the lowercased form. **Transparent** hashing (C++20 `is_transparent` on both hash and equality) allows lookups by `string_view` without building a string. For security, SipHash-1-3 or SipHash-2-4 with a random 128-bit key resists flooding; modern alternatives such as rapidhash or wyhash are faster but not designed as keyed PRFs. Cryptographic hashes (SHA-2, SHA-3, BLAKE3) are far slower and needed only for integrity or content addressing.",
        example: ['cpp', 'transparent hashing for string_view lookups (C++20)', "struct SvHash {\n  using is_transparent = void;\n  size_t operator()(std::string_view s) const noexcept { return std::hash<std::string_view>{}(s); }\n};\nstd::unordered_map<std::string, int, SvHash, std::equal_to<>> m;\nm.find(std::string_view(\"key\"));   // no temporary std::string"],
        tradeoffs: [['Hash', 'Speed', 'Use for'], ['std::hash', 'Fast; implementation-defined', 'Internal keys; not persisted'], ['FNV-1a', 'Simple; decent for short keys', 'Internal tables, checksums of identifiers'], ['SipHash (seeded)', 'Moderate', 'Attacker-controlled keys'], ['SHA-256 / BLAKE3', 'Slow (relative)', 'Integrity, content addressing']],
        failures: [['Lookups fail for keys that look equal', 'Hash and equality disagree', 'Hash exactly what equality compares'], ['Server CPU spikes on crafted requests', 'Hash flooding with an unseeded hash', 'Seeded hash or ordered map'], ['Different results after a library upgrade', 'Persisted std::hash values', 'Use a specified hash (FNV, xxHash) for persistence'], ['Many collisions for pair keys', 'XOR of member hashes', 'Proper combine function']],
      },
      warn: "Never persist std::hash values or use them across processes, and never use non-cryptographic hashes for passwords or integrity checks.",
      production: {
        numbers: "FNV-1a 32-bit uses offset basis 2,166,136,261 and prime 16,777,619. The 2011 hash-flooding demonstrations showed a single crafted POST request of around 2 MB could keep a CPU core busy for tens of seconds or more on vulnerable platforms.",
        observe: "For key-heavy maps, record bucket_count, load_factor, and max bucket size; alert on sudden growth in lookup latency for externally keyed tables.",
        security: "Seed hashes for attacker-controlled keys (SipHash with a random key) or use ordered maps with O(log n) worst cases; cap request sizes and key counts.",
        checklist: ['operator== defaulted or written to match the hash', 'Hash combines members properly', 'Specified hashes for persisted values', 'Seeded hash for untrusted keys', 'Transparent lookup for string keys', 'Bucket statistics in benchmarks', 'Cryptographic hashes only where needed'],
        sources: ['Fowler, Noll, Vo, "FNV hash" (IETF draft-eastlake-fnv)', 'Aumasson and Bernstein, "SipHash: a fast short-input PRF" (2012)', 'Klink and Wälde, "Efficient Denial of Service Attacks on Web Application Platforms" (28C3, 2011)', 'cppreference.com: std::hash; std::unordered_map'],
      },
      tip: "Write the equality operator first, then hash exactly the members it compares, combined with a proper mixer.",
      faq: [['What two things does unordered_map need for a custom key?', 'A hash function and equality.'], ['Why not XOR member hashes?', 'Swapped or equal members collide.'], ['Is std::hash stable across runs and versions?', 'It is not guaranteed; never persist it.'], ['What is hash flooding?', 'Sending keys chosen to collide so lookups become O(n), as a denial-of-service attack.'], ['What does FNV-1a do per byte?', 'XOR the byte into the hash, then multiply by the FNV prime.']],
      ex: {
        prompt: 'Write fnv1a(s) returning the 32-bit FNV-1a hash of the UTF-8 bytes of s as a non-negative integer: start at 2166136261; for each byte, XOR it in and multiply by 16777619 modulo 2^32.',
        fn: 'fnv1a', params: 's', sig: '(string s) -> long',
        cpp: `class Solution {
public:
    long long fnv1a(string s) {
        uint32_t h = 2166136261u;
        for (unsigned char c : s) {
            h ^= c;
            h *= 16777619u;      // unsigned overflow wraps (defined)
        }
        return h;
    }
};
`,
        cases: [{ args: [''], expect: 2166136261 }, { args: ['a'], expect: 3826002220 }, { args: ['foobar'], expect: 3214735720 }, { args: ['hello'], expect: 1335831723 }],
        solution: 'function fnv1a(s){let h=2166136261;for(const b of new TextEncoder().encode(s)){h^=b;h=Math.imul(h,16777619)>>>0}return h>>>0}',
        hint: 'In JavaScript, Math.imul and >>> 0 keep the arithmetic in unsigned 32 bits; in C++ use uint32_t.',
      },
      quiz: [
        choice('cx-st-8-q1', 'cpp-hashing', 'Which must hold for any valid hash?', ['equal keys have equal hashes', 'different keys have different hashes', 'hashes are stable across versions', 'hashes are cryptographic'], 0, 'Consistency with equality.'),
        choice('cx-st-8-q2', 'cpp-hashing', 'Defence against hash flooding with attacker-chosen keys:', ['a seeded hash such as SipHash, or an ordered map', 'a larger bucket count', 'std::hash', 'XOR combining'], 0, 'Unpredictable hashes.'),
        choice('cx-st-8-q3', 'cpp-hashing', 'libstdc++\'s std::hash<int> is...', ['the identity function', 'SHA-256', 'random per run', 'FNV-1a'], 0, 'Fast and simple.'),
        fill('cx-st-8-q4', 'cpp-hashing', 'A std::map with a custom key needs operator___ or a comparator.', ['<'], 'Ordering.'),
      ],
    }),
  ],
  exam: [
    choice('cx-st-e1', 'cpp-sequence-containers', 'Why is std::vector usually faster than std::list in practice?', ['contiguous memory is cache-friendly', 'it never allocates', 'it is a tree', 'it is lock-free'], 0, 'Cache.'),
    choice('cx-st-e2', 'cpp-associative', 'Which lookup does not insert a missing key?', ['m.find(k)', 'm[k]', 'm[k] = v', 'm.try_emplace(k)'], 0, 'operator[] inserts.'),
    choice('cx-st-e3', 'cpp-iterators', 'Erasing from a std::list invalidates...', ['only iterators to erased elements', 'all iterators', 'iterators after the position', 'nothing at all'], 0, 'Node-based.'),
    choice('cx-st-e4', 'cpp-algorithms', 'Top 10 of a million values, in order, most efficiently:', ['std::partial_sort', 'std::sort the whole vector', 'std::stable_sort', 'repeated std::max_element'], 0, 'O(n log k).'),
    choice('cx-st-e5', 'cpp-lambdas', 'Which lambda is unsafe to store and call after the function returns?', ['[&local] { use(local); }', '[local] { use(local); }', '[v = std::move(local)] { use(v); }', '[] { return 1; }'], 0, 'Dangling reference.'),
    choice('cx-st-e6', 'cpp-ranges', 'Views in C++20 are...', ['lazy and non-owning', 'eager copies', 'owning containers', 'thread-safe queues'], 0, 'Recipes.'),
    choice('cx-st-e7', 'cpp-vocabulary-types', 'Which type represents a value or an error (C++23)?', ['std::expected<T, E>', 'std::any', 'std::span<T>', 'std::optional<T&>'], 0, 'expected.'),
    choice('cx-st-e8', 'cpp-hashing', 'Combining member hashes with plain XOR causes...', ['collisions for swapped or equal members', 'faster lookups', 'cryptographic strength', 'compile errors'], 0, 'Use a mixer.'),
    choice('cx-st-e9', 'cpp-sequence-containers', 'Pushing 1,000 ints into an empty vector with doubling growth causes how many reallocations?', ['11', '1', '1000', '500'], 0, '1, 2, 4, … 1024.'),
    choice('cx-st-e10', 'cpp-associative', 'Need sorted iteration and range queries by key:', ['std::map', 'std::unordered_map', 'std::any', 'std::span'], 0, 'Tree.'),
    order('cx-st-e11', 'cpp-algorithms', 'Order the steps to deduplicate a vector.', ['std::sort the vector', 'std::unique to move duplicates to the end', 'erase from the returned iterator to end()'], 'Sort, unique, erase.'),
    fill('cx-st-e12', 'cpp-iterators', 'The safe erase-in-loop idiom is it = c.___(it);', ['erase'], 'Use the returned iterator.'),
  ],
};
