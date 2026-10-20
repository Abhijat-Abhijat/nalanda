import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const cxPerformance: Chapter = {
  id: 'cx-performance',
  title: 'Performance: hardware, undefined behaviour, and measurement',
  summary: 'Writing fast C++ grounded in how hardware works: the cache hierarchy and memory access patterns, data layout and padding, undefined behaviour and what optimisers assume, sound benchmarking, branch prediction and SIMD vectorisation, and allocation strategies. Hardware figures are typical for 2024–2026 x86-64 and ARM server cores; library status as of October 2026, when C++26 (with std::simd) was technically complete but not yet published by ISO.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'cx-pf-1', title: 'Caches and memory access patterns', concept: 'cpp-cache-locality',
      story: "In the 1980s a CPU could read memory in about the same time it took to execute an instruction. Since then processor speed has outgrown memory latency by orders of magnitude, a gap William Wulf and Sally McKee called \"the memory wall\" in 1995. Modern CPUs hide it with a hierarchy of caches and hardware prefetchers that reward predictable, sequential access. Herb Sutter and Scott Meyers both gave widely watched talks showing that changing only the order of loops, or how data is laid out, can make code an order of magnitude faster without changing its algorithm.",
      analogy: "The CPU is a chef. L1 cache is the cutting board, L2 the counter, L3 the kitchen shelves, and main memory the warehouse across town. Every trip to the warehouse fetches a whole crate (a 64-byte cache line), so using everything in the crate before the next trip is what makes the kitchen fast.",
      timeline: [['1965', 'Caches proposed', 'Wilkes describes "slave memories".'], ['1995', 'The memory wall', 'Wulf and McKee warn about the growing CPU–DRAM gap.'], ['2007', 'Drepper\'s paper', '"What Every Programmer Should Know About Memory".'], ['2020s', 'Large caches', 'Server CPUs with hundreds of MB of L3 (for example AMD 3D V-Cache).']],
      explain: "Typical latencies on a modern core: **L1** about 4–5 cycles (32–64 KB per core), **L2** about 12–16 cycles (1–2 MB per core), **L3** about 40–70 cycles (shared, tens of MB), and **DRAM** about 80–120 ns, which is 300 or more cycles. Memory moves in **cache lines** of 64 bytes (128 on some Apple cores). **Spatial locality**: after touching one byte, nearby bytes are already in cache. **Temporal locality**: data used recently is likely still cached. Hardware **prefetchers** detect sequential and strided patterns and fetch ahead. In C++, a 2-D array is **row-major**: `a[r][c]` and `a[r][c+1]` are adjacent. Traversing row by row uses every byte of each line; traversing column by column jumps `cols × sizeof(T)` bytes per step, touching a new line almost every time. For a 64×64 `int` matrix, row order touches 256 distinct line loads in sequence while column order switches lines 4,096 times. Linked structures (`std::list`, trees of separately allocated nodes) defeat prefetching because the next address is unknown until the current node loads (**pointer chasing**). Practical rules: iterate in memory order, keep hot data contiguous (`std::vector`), block (tile) large loops so the working set fits in cache, and avoid **false sharing** between threads.",
      diagram: "level   size (per core)   latency\nL1d     32–64 KB          ~4–5 cycles\nL2      1–2 MB            ~12–16 cycles\nL3      tens of MB shared ~40–70 cycles\nDRAM    GBs               ~80–120 ns (300+ cycles)\n64×64 int matrix (16 ints per 64-byte line):\nrow order    → line changes every 16 elements → 256 line switches\ncolumn order → new line every element         → 4,096 line switches",
      ex1: ['cpp', 'loop order decides cache behaviour', "constexpr int N = 4096;\nstd::vector<float> m(N * N);\nfloat s1 = 0, s2 = 0;\nfor (int r = 0; r < N; ++r)          // row order: sequential, prefetcher-friendly\n  for (int c = 0; c < N; ++c) s1 += m[r * N + c];\nfor (int c = 0; c < N; ++c)          // column order: 16 KB stride, cache-hostile\n  for (int r = 0; r < N; ++r) s2 += m[r * N + c];\n// the second loop is commonly several times slower"],
      ex2: ['cpp', 'loop tiling for matrix multiply', "constexpr int B = 64;   // tile so three B×B blocks fit in L1/L2\nfor (int ii = 0; ii < n; ii += B)\n  for (int kk = 0; kk < n; kk += B)\n    for (int jj = 0; jj < n; jj += B)\n      for (int i = ii; i < std::min(ii + B, n); ++i)\n        for (int k = kk; k < std::min(kk + B, n); ++k)\n          for (int j = jj; j < std::min(jj + B, n); ++j)\n            C[i * n + j] += A[i * n + k] * Bm[k * n + j];"],
      deepDive: {
        explain: "Caches are **set-associative**: an address maps to one set, which holds a few lines (8–16 ways). Power-of-two strides (for example walking a column of a 4096-wide float matrix) can map many accesses to the same set and cause **conflict misses** even when the total data would fit; padding rows by one cache line fixes it. The **TLB** caches virtual-to-physical page translations; random access over gigabytes misses the TLB too, which **huge pages** (2 MB or 1 GB) mitigate. Memory bandwidth (tens to hundreds of GB/s per socket) caps streaming workloads; latency caps pointer chasing. Out-of-order cores overlap independent misses (memory-level parallelism), so code that issues many independent loads (for example processing several linked lists at once) can run much faster than one long dependent chain. Tools: `perf stat -e cache-misses,L1-dcache-load-misses,LLC-load-misses`, `perf c2c` for false sharing, Intel VTune memory access analysis, and `valgrind --tool=cachegrind` for simulation. NUMA systems add another level: memory attached to a different socket costs more; pin threads and allocate locally for memory-bound services.",
        example: ['text', 'measuring cache behaviour with perf', "perf stat -e cycles,instructions,L1-dcache-load-misses,LLC-load-misses ./matrix --order=row\nperf stat -e cycles,instructions,L1-dcache-load-misses,LLC-load-misses ./matrix --order=col\n# compare instructions per cycle and miss counts between the two runs"],
        tradeoffs: [['Pattern', 'Cache behaviour', 'Typical use'], ['Sequential (vector)', 'Every byte of each line used; prefetched', 'Default'], ['Strided', 'Partial line use; prefetchable if regular', 'Column access, AoS fields'], ['Random', 'Mostly misses', 'Hash tables, sparse graphs'], ['Pointer chasing (lists, trees)', 'Serial misses; no prefetch', 'Avoid in hot paths']],
        failures: [['Matrix code 5–10× slower than expected', 'Column-order traversal of row-major data', 'Swap loop order or transpose'], ['Performance cliff at certain sizes', 'Conflict misses from power-of-two strides', 'Pad rows'], ['Multithreaded code scales poorly', 'False sharing', 'Pad per-thread data to 64 bytes'], ['Slow traversal of a big tree', 'Pointer chasing', 'Flatten into arrays (B-trees, Eytzinger layout)']],
      },
      warn: "Algorithmic complexity hides constant factors of 10× or more from cache misses. An O(n) pointer-chasing loop can lose to an O(n log n) algorithm over contiguous data; measure on realistic sizes.",
      production: {
        numbers: "A DRAM access costs about 80–120 ns (300+ cycles) versus about 1 ns for L1; a 64-byte line holds 16 ints, so sequential int traversal misses at most once per 16 elements.",
        observe: "Instructions per cycle (IPC) below about 1 on compute code often signals memory stalls; check L1/LLC miss rates and TLB misses with perf or VTune.",
        security: "Cache timing is observable: Spectre (2018) and cache side channels leak secrets through access patterns. Cryptographic code must use constant-time, data-independent memory access.",
        checklist: ['Iterate in memory order', 'Contiguous containers for hot data', 'Tile large loops', 'Pad to avoid false sharing', 'Avoid power-of-two strides on large arrays', 'Huge pages for large random-access heaps', 'Measure misses, not just time'],
        sources: ['Drepper, "What Every Programmer Should Know About Memory" (2007)', 'Wulf and McKee, "Hitting the Memory Wall" (1995)', 'Hennessy and Patterson, "Computer Architecture: A Quantitative Approach" (6th ed.)', 'Intel and AMD optimisation reference manuals (latency tables)'],
      },
      tip: "Before optimising a loop, write down how many bytes it touches and in what order. If the order jumps around memory, fix that first.",
      faq: [['How big is a cache line on x86-64?', '64 bytes.'], ['Why is row-major traversal faster in C++?', 'Consecutive elements of a row are adjacent, so each cache line is fully used and prefetched.'], ['What is pointer chasing?', 'Following pointers where each address depends on the previous load, which defeats prefetching.'], ['What is false sharing?', 'Independent data on one cache line written by different cores.'], ['What do huge pages help with?', 'TLB misses for large, randomly accessed memory.']],
      ex: {
        prompt: 'Model a cache that holds a single 64-byte line. A rows × cols matrix of 4-byte ints is stored row-major starting at address 0 (element (r, c) at byte (r × cols + c) × 4). Traverse it in "row" order (r outer, c inner) or "col" order (c outer, r inner). Write lineSwitches(rows, cols, order) returning how many times the accessed line differs from the previous one (the first access counts).',
        fn: 'lineSwitches', params: 'rows, cols, order', sig: '(int rows, int cols, string order) -> int',
        cpp: `class Solution {
public:
    int lineSwitches(int rows, int cols, string order) {
        long long last = -1;
        int switches = 0;
        auto visit = [&](int r, int c) {
            long long line = ((long long)r * cols + c) * 4 / 64;
            if (line != last) { switches++; last = line; }
        };
        if (order == "row") { for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) visit(r, c); }
        else { for (int c = 0; c < cols; c++) for (int r = 0; r < rows; r++) visit(r, c); }
        return switches;
    }
};
`,
        cases: [{ args: [4, 16, 'row'], expect: 4 }, { args: [4, 16, 'col'], expect: 64 }, { args: [64, 64, 'row'], expect: 256 }, { args: [64, 64, 'col'], expect: 4096 }, { args: [1, 1, 'col'], expect: 1 }],
        solution: "function lineSwitches(rows,cols,order){let last=-1,n=0;const visit=(r,c)=>{const line=Math.floor((r*cols+c)*4/64);if(line!==last){n++;last=line}};if(order==='row'){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)visit(r,c)}else{for(let c=0;c<cols;c++)for(let r=0;r<rows;r++)visit(r,c)}return n}",
        hint: 'Compute each element\'s line as byte offset / 64 and count changes.',
      },
      quiz: [
        choice('cx-pf-1-q1', 'cpp-cache-locality', 'Approximate DRAM latency in CPU cycles on a modern core:', ['300 or more', '4', '12', '1'], 0, '~100 ns.'),
        choice('cx-pf-1-q2', 'cpp-cache-locality', 'Fastest loop order for summing a row-major 2-D array:', ['rows outer, columns inner', 'columns outer, rows inner', 'random order', 'it does not matter'], 0, 'Sequential.'),
        choice('cx-pf-1-q3', 'cpp-cache-locality', 'Why is std::list traversal slow on large lists?', ['pointer chasing defeats prefetching', 'it copies nodes', 'it sorts as it goes', 'it is locked'], 0, 'Dependent loads.'),
        fill('cx-pf-1-q4', 'cpp-cache-locality', 'On x86-64 a cache line is ___ bytes.', ['64'], '64 bytes.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'cx-pf-2', title: 'Data layout: padding, AoS versus SoA, and hot/cold splitting', concept: 'cpp-data-layout',
      story: "Mike Acton's CppCon 2014 keynote \"Data-Oriented Design and C++\" told a room of C++ programmers that their job was to transform data, not to model the world in class hierarchies, and that the hardware should drive the layout. Game engines had already learned this: processing positions of 100,000 particles is far faster when all x coordinates sit together than when each particle is an object with twenty fields. Entity-component systems in modern engines (Unity DOTS, Bevy, EnTT) are built on the same idea.",
      analogy: "Array of structs is a filing cabinet where each folder holds everything about one person; to read everyone's age you open every folder. Struct of arrays is a set of lists, one per field: reading all ages means reading one list from top to bottom.",
      timeline: [['1970s', 'Alignment rules', 'Hardware requires or prefers naturally aligned data.'], ['2009', 'Pitfalls of OOP', 'Tony Albrecht\'s talk on cache-hostile object layouts in games.'], ['2014', 'Data-oriented design', 'Mike Acton\'s CppCon keynote.'], ['2018–2020s', 'ECS engines', 'Unity DOTS, EnTT, Bevy popularise SoA-style layouts.']],
      explain: "Each type has an **alignment** (typically equal to its size for scalars: `char` 1, `short` 2, `int` 4, `double` and pointers 8 on 64-bit). The compiler places each member at an offset that is a multiple of its alignment, inserting **padding**, and rounds the struct size up to a multiple of its largest member alignment so arrays stay aligned. So `struct { char a; double b; char c; int d; }` is 24 bytes (1 + 7 padding + 8 + 1 + 3 padding + 4), while ordering the same members **largest first** (`double, int, char, char`) gives 16. Check with `sizeof`, `alignof`, `offsetof`, and `-Wpadded`. **AoS** (array of structs: `std::vector<Particle>`) is natural and good when you use most fields of each element together. **SoA** (struct of arrays: `struct Particles { std::vector<float> x, y, vx, vy; }`) is better when loops touch a few fields of many elements: no wasted bytes in each cache line, and compilers can vectorise. **Hot/cold splitting** moves rarely used fields (names, debug data) out of the hot struct, so more hot elements fit per cache line. Smaller types help too: `uint32_t` indices instead of 64-bit pointers, `float` instead of `double` where precision allows, and enums with an explicit small underlying type.",
      diagram: "struct A { char a; double b; char c; int d; };   sizeof = 24\n  a . . . . . . . | b b b b b b b b | c . . . d d d d\nstruct B { double b; int d; char a; char c; };   sizeof = 16\n  b b b b b b b b | d d d d a c . .\nAoS: [x y vx vy name…][x y vx vy name…]   loop over x reads every field's bytes\nSoA: x[ ] y[ ] vx[ ] vy[ ]                 loop over x reads only x",
      ex1: ['cpp', 'measuring padding', "struct Bad  { char a; double b; char c; int d; };\nstruct Good { double b; int d; char a; char c; };\nstatic_assert(sizeof(Bad) == 24);\nstatic_assert(sizeof(Good) == 16);\nstatic_assert(offsetof(Bad, b) == 8);   // 7 bytes of padding after a"],
      ex2: ['cpp', 'struct of arrays for a particle update', "struct Particles {\n  std::vector<float> x, y, vx, vy;\n  void step(float dt) {\n    for (size_t i = 0; i < x.size(); ++i) {   // contiguous floats: vectorises well\n      x[i] += vx[i] * dt;\n      y[i] += vy[i] * dt;\n    }\n  }\n};"],
      deepDive: {
        explain: "`alignas(N)` raises alignment (for example `alignas(64)` per-thread counters to avoid false sharing); `#pragma pack` or `[[gnu::packed]]` lowers it, which saves space but can cause slow or even faulting unaligned access on some architectures and makes taking member addresses dangerous. Since C++20, `[[no_unique_address]]` lets empty members (stateless allocators, comparators) take no space. Bit-fields pack flags but generate read-modify-write code and cannot be addressed. Layout matters for **vectorisation**: SoA gives unit-stride loads that map directly to SIMD registers, while AoS needs gathers or shuffles. A hybrid **AoSoA** (blocks of, say, 8 elements stored SoA) keeps SIMD-friendly access while improving locality for code that touches several fields per element. Measure the effect: layout changes help when loops are memory-bound and the hot working set exceeds cache; for small data that already fits in L1, they rarely matter. Keep the public API stable by hiding layout behind accessors or views when you change it.",
        example: ['cpp', 'hot/cold splitting', "struct Order {                // hot: scanned every tick\n  uint32_t id; uint32_t qty; int64_t priceCents; uint32_t detailsIdx;\n};                            // 24 bytes: 2–3 per cache line\nstruct OrderDetails {         // cold: only read on display or audit\n  std::string customerName, notes; std::chrono::system_clock::time_point created;\n};\nstd::vector<Order> orders; std::vector<OrderDetails> details;"],
        tradeoffs: [['Layout', 'Best when', 'Cost'], ['AoS', 'Most fields of each element used together', 'Wasted bandwidth for single-field loops'], ['SoA', 'Few fields over many elements; SIMD', 'More code to keep arrays in sync'], ['AoSoA', 'SIMD plus multi-field access', 'Complexity'], ['Hot/cold split', 'Large rarely-used fields', 'Extra indirection for cold access']],
        failures: [['Struct larger than the sum of its fields', 'Padding from member order', 'Order members by decreasing alignment'], ['Loop over one field is slow', 'AoS with wide elements', 'SoA or hot/cold split'], ['Crash on ARM after packing', 'Unaligned access via packed members', 'Avoid packing or copy fields out'], ['No speed-up from layout change', 'Data fits in cache already', 'Measure before refactoring']],
      },
      warn: "Do not use #pragma pack or packed attributes to save memory in general code; unaligned members can be slow, unsafe to reference, and fault on some CPUs. Reorder members instead.",
      production: {
        numbers: "Reordering {char, double, char, int} to {double, int, char, char} shrinks the struct from 24 to 16 bytes: a third less memory and 50% more elements per cache line.",
        observe: "static_assert on sizeof for hot structs (catches accidental growth), -Wpadded in reviews, pahole to print layouts from debug info, and memory bandwidth counters.",
        security: "Padding bytes can contain stale data; copying structs to the network or disk with memcpy can leak memory contents. Zero-initialise or serialise field by field.",
        checklist: ['Members ordered by decreasing alignment', 'static_assert(sizeof) on hot types', 'SoA for field-wise hot loops', 'Cold fields split out', 'Smaller index and value types where safe', 'alignas(64) for per-thread data', 'No raw memcpy of padded structs to external outputs'],
        sources: ['Acton, "Data-Oriented Design and C++" (CppCon 2014)', 'Albrecht, "Pitfalls of Object Oriented Programming" (2009)', 'cppreference.com: alignof, alignas, offsetof, [[no_unique_address]]', 'pahole (dwarves) documentation'],
      },
      tip: "Run pahole or print sizeof/offsetof for your hottest structs once; the padding you find is usually free memory and bandwidth.",
      faq: [['Why does a struct contain padding?', 'Each member must sit at an offset that is a multiple of its alignment, and the size is rounded to the largest alignment.'], ['How do you minimise padding?', 'Order members from largest to smallest alignment.'], ['When is SoA better than AoS?', 'When loops touch a few fields of many elements, especially with SIMD.'], ['What is hot/cold splitting?', 'Moving rarely used fields out of the frequently scanned struct.'], ['Why avoid packed structs?', 'Unaligned access can be slow, fault on some CPUs, and break references to members.']],
      ex: {
        prompt: 'Compute struct sizes on a typical 64-bit platform. Field types: char 1, bool 1, short 2, int 4, double 8, pointer 8 (alignment equals size). Place fields in order, each at the next offset that is a multiple of its alignment; round the total up to a multiple of the largest alignment (an empty struct is 0 here). Write structSize(fields) returning [size in the given order, size when fields are sorted by decreasing size].',
        fn: 'structSize', params: 'fields', sig: '(string[] fields) -> int[]',
        cpp: `class Solution {
    static int sizeOf(const string& t) {
        if (t == "char" || t == "bool") return 1;
        if (t == "short") return 2;
        if (t == "int") return 4;
        return 8;   // double, pointer
    }
    static int layout(const vector<string>& fs) {
        if (fs.empty()) return 0;
        int off = 0, align = 1;
        for (const string& t : fs) {
            int s = sizeOf(t);
            off = (off + s - 1) / s * s;   // align the member
            off += s;
            align = max(align, s);
        }
        return (off + align - 1) / align * align;   // tail padding
    }
public:
    vector<int> structSize(vector<string>& fields) {
        vector<string> sorted = fields;
        stable_sort(sorted.begin(), sorted.end(), [](const string& a, const string& b) { return sizeOf(a) > sizeOf(b); });
        return {layout(fields), layout(sorted)};
    }
};
`,
        cases: [{ args: [['char', 'double', 'char', 'int']], expect: [24, 16] }, { args: [['bool', 'pointer', 'bool']], expect: [24, 16] }, { args: [['int', 'int']], expect: [8, 8] }, { args: [[]], expect: [0, 0] }, { args: [['double', 'short', 'char']], expect: [16, 16] }],
        solution: "function structSize(f){const sz={char:1,short:2,int:4,double:8,pointer:8,bool:1};const lay=fs=>{let off=0,al=1;for(const t of fs){const s=sz[t];off=Math.ceil(off/s)*s;off+=s;al=Math.max(al,s)}return fs.length?Math.ceil(off/al)*al:0};return[lay(f),lay([...f].sort((a,b)=>sz[b]-sz[a]))]}",
        hint: 'Round each offset up to the member\'s alignment, then round the end up to the largest alignment.',
      },
      quiz: [
        choice('cx-pf-2-q1', 'cpp-data-layout', 'sizeof(struct { char a; double b; }) on x86-64 is...', ['16', '9', '8', '24'], 0, '7 bytes padding.'),
        choice('cx-pf-2-q2', 'cpp-data-layout', 'A loop updates only x and y of a million particles that each have 20 fields. Best layout:', ['struct of arrays', 'array of structs', 'linked list of particles', 'std::map by id'], 0, 'SoA.'),
        choice('cx-pf-2-q3', 'cpp-data-layout', 'Cheapest way to remove padding without packing:', ['reorder members by decreasing alignment', '#pragma pack(1)', 'use bit-fields everywhere', 'add virtual functions'], 0, 'Reorder.'),
        fill('cx-pf-2-q4', 'cpp-data-layout', 'The operator that gives a type\'s alignment requirement is ___', ['alignof'], 'alignof(T).'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'cx-pf-3', title: 'Undefined behaviour and what the optimiser assumes', concept: 'cpp-undefined-behaviour',
      story: "In 2009 a Linux kernel bug became the textbook example of undefined behaviour meeting an optimiser. A function in the TUN driver dereferenced a pointer (`sk = tun->sk;`) and only afterwards checked `if (!tun) return`. GCC reasoned that since `tun` had already been dereferenced, it could not be null, and deleted the check, turning a crash into an exploitable privilege escalation. John Regehr's blog and Chris Lattner's 2011 series \"What Every C Programmer Should Know About Undefined Behavior\" explained the mechanism to a generation of engineers.",
      analogy: "Undefined behaviour is a contract clause saying \"this never happens\". The optimiser is a lawyer who reads the contract literally: if you promised a pointer is never null after use, it will remove every check that assumes otherwise.",
      timeline: [['1989', 'C89', 'Undefined behaviour formalised in the C standard.'], ['2009', 'Linux TUN bug', 'Null check removed after a dereference (CVE-2009-1897).'], ['2011', 'Lattner\'s series', '"What Every C Programmer Should Know About Undefined Behavior".'], ['2023–2026', 'Erroneous behaviour', 'C++26 defines uninitialised reads as erroneous behaviour; hardened library mode adopted.']],
      explain: "**Undefined behaviour (UB)** means the standard places no requirements on the program, for the whole execution, not just the offending line. Compilers assume UB never happens and optimise on that basis. Common UB in C++: **signed integer overflow** (`INT_MAX + 1`; also `INT_MIN / -1`), **division by zero**, **shifting by a negative amount or by at least the bit width** (`1 << 32` for 32-bit `int`; since C++20, left-shifting negative values is defined as two's complement), out-of-bounds access, dereferencing null or dangling pointers, reading uninitialised variables (C++26 reclassifies this as erroneous behaviour with a defined value), data races, **strict aliasing** violations (accessing an object through a pointer of an unrelated type, for example reading a `float` through an `int*`), modifying a `const` object, and infinite loops without side effects (C++ allows the compiler to assume forward progress). Distinguish UB from **implementation-defined** behaviour (documented per platform, such as `sizeof(long)`) and **unspecified** behaviour (one of several outcomes, such as argument evaluation order). Defences: compiler warnings, UBSan in tests, `constexpr` tests, safe helpers (`std::bit_cast` instead of type punning, `std::memcpy` for reinterpretation, checked arithmetic), and hardened standard library modes.",
      diagram: "void f(Tun* tun) {\n  auto sk = tun->sk;     // dereference: compiler infers tun != nullptr\n  if (!tun) return;      // therefore this check is dead code → removed\n  use(sk);\n}\nint32 rules (C++20):  a + b overflow → UB   ·   a / 0 → UB   ·   INT_MIN / -1 → UB\n                      x << n with n < 0 or n >= 32 → UB   ·   -1 << 3 → -8 (defined since C++20)",
      ex1: ['cpp', 'an overflow check the optimiser may delete', "bool willOverflow(int a) {\n  return a + 1 < a;              // UB if a == INT_MAX: compiler may fold to false\n}\nbool safeCheck(int a) {\n  return a == std::numeric_limits<int>::max();   // correct\n}"],
      ex2: ['cpp', 'type punning: wrong and right', "float f = 1.0f;\n// int bits = *reinterpret_cast<int*>(&f);   // strict aliasing violation: UB\nauto bits = std::bit_cast<std::uint32_t>(f);   // C++20: defined, 0x3F800000\nstd::uint32_t b2; std::memcpy(&b2, &f, sizeof b2);   // pre-C++20 equivalent"],
      deepDive: {
        explain: "Optimisers do not \"detect UB and do something evil\"; they apply transformations that are valid only if UB does not occur, such as assuming `i + 1 > i` for signed `i` (so loops can use wider induction variables and be vectorised), assuming pointers of different types do not alias (so values can stay in registers), and assuming dereferenced pointers are non-null. Effects can travel **backwards in time**: because the whole execution with UB is undefined, code before the UB may also be changed. Flags trade speed for definedness: `-fwrapv` (signed overflow wraps), `-fno-strict-aliasing` (used by the Linux kernel), `-fno-delete-null-pointer-checks` (also kernel). C++20 made signed integers two's complement and defined left shifts of negative numbers, but kept overflow undefined. C++26 adds **erroneous behaviour** for uninitialised reads (defined but wrong; implementations may diagnose), a **hardened standard library** mode with checked preconditions, and **contracts** (`pre`, `post`, `contract_assert`). Tools: UBSan (`-fsanitize=undefined`, plus `-fsanitize=integer` in Clang for unsigned wrap checks), `constexpr` evaluation (UB is a compile error), static analysers, and fuzzing.",
        example: ['cpp', 'checked arithmetic helpers', "#include <limits>\nstd::optional<int> checkedAdd(int a, int b) {\n  int r;\n  if (__builtin_add_overflow(a, b, &r)) return std::nullopt;   // GCC/Clang\n  return r;\n}\n// C++26: std::add_sat(a, b) saturates instead of overflowing"],
        tradeoffs: [['Category', 'Meaning', 'Example'], ['Undefined', 'No requirements; optimiser assumes it never happens', 'Signed overflow, null dereference'], ['Implementation-defined', 'Documented per platform', 'sizeof(long), char signedness'], ['Unspecified', 'One of several allowed results', 'Function argument evaluation order'], ['Erroneous (C++26)', 'Defined but incorrect; may be diagnosed', 'Reading an uninitialised local']],
        failures: [['Security check silently removed', 'Check placed after a dereference, or depends on overflow', 'Check before use; avoid UB in checks'], ['Different results at -O0 and -O2', 'UB exploited by optimisation', 'UBSan, fix the code'], ['Wrong values after type punning', 'Strict aliasing violation', 'std::bit_cast or memcpy'], ['Loop disappears', 'Infinite loop without side effects assumed to terminate', 'Add an atomic or volatile side effect, or fix the logic']],
      },
      warn: "Never write checks that rely on undefined behaviour having happened, such as `if (a + b < a)` for signed integers or a null check after dereferencing. The compiler is allowed to delete them.",
      production: {
        numbers: "CVE-2009-1897 (Linux TUN driver) turned a null-pointer check removed by GCC into a local privilege escalation; the Linux kernel has built with -fno-strict-aliasing and -fno-delete-null-pointer-checks for years as a result.",
        observe: "UBSan in CI with -fno-sanitize-recover=all, warnings (-Wall -Wextra -Wstrict-aliasing -Wshift-overflow), constexpr unit tests, and fuzzing for input-handling code.",
        security: "UB in input validation, bounds checks, or size arithmetic is a frequent root cause of exploitable bugs; checked arithmetic and hardened library modes reduce the attack surface.",
        checklist: ['No signed overflow (check before or widen)', 'Shift amounts validated', 'No division by zero or INT_MIN / -1', 'std::bit_cast instead of pointer punning', 'Null checks before dereference', 'UBSan job in CI', 'Hardened library mode in release builds'],
        sources: ['Lattner, "What Every C Programmer Should Know About Undefined Behavior" (LLVM blog, 2011)', 'Regehr, "A Guide to Undefined Behavior in C and C++" (2010)', 'CVE-2009-1897 and the LWN article "Fun with NULL pointers" (2009)', 'cppreference.com: Undefined behavior; P2795 (erroneous behaviour) and P3471 (hardened standard library) for C++26'],
      },
      tip: "Write range checks in terms of the limits before the operation (`a > INT_MAX - b`), never by performing the operation and inspecting the result.",
      faq: [['What does UB permit the compiler to do?', 'Anything; in practice it optimises assuming the UB never happens.'], ['Is signed overflow defined in C++20?', 'No; representation is two\'s complement, but overflow remains undefined.'], ['Is 1 << 32 defined for a 32-bit int?', 'No; shifting by at least the bit width is undefined.'], ['How do you reinterpret float bits safely?', 'std::bit_cast (C++20) or std::memcpy.'], ['What is the difference between UB and unspecified behaviour?', 'Unspecified picks one of several valid outcomes; UB has no requirements at all.']],
      ex: {
        prompt: 'Write isUB(op, a, b) for 32-bit int operands under C++20 rules. op is "add" (UB if the true sum is outside the int range), "mul" (UB if the true product is outside the range), "div" (UB if b is 0, or a is INT_MIN and b is -1), or "shl" (a << b: UB if b < 0 or b >= 32; shifting negative a is defined since C++20). Return true if the operation is undefined.',
        fn: 'isUB', params: 'op, a, b', sig: '(string op, int a, int b) -> bool',
        cpp: `class Solution {
public:
    bool isUB(string op, int a, int b) {
        long long A = a, B = b;
        if (op == "add") { long long s = A + B; return s < INT_MIN || s > INT_MAX; }
        if (op == "mul") { long long p = A * B; return p < INT_MIN || p > INT_MAX; }
        if (op == "div") return b == 0 || (a == INT_MIN && b == -1);
        if (op == "shl") return b < 0 || b >= 32;
        return false;
    }
};
`,
        cases: [{ args: ['add', 2147483647, 1], expect: true }, { args: ['add', -5, 3], expect: false }, { args: ['mul', 65536, 65536], expect: true }, { args: ['div', 7, 0], expect: true }, { args: ['div', -2147483648, -1], expect: true }, { args: ['shl', 1, 31], expect: false }, { args: ['shl', 1, 32], expect: true }, { args: ['shl', -1, 3], expect: false }],
        solution: "function isUB(op,a,b){const MIN=-2147483648,MAX=2147483647;if(op==='add'){const s=a+b;return s<MIN||s>MAX}if(op==='mul'){const p=a*b;return p<MIN||p>MAX}if(op==='div')return b===0||(a===MIN&&b===-1);if(op==='shl')return b<0||b>=32;return false}",
        hint: 'Compute in a wider type (long long in C++, ordinary numbers in JavaScript) and compare with the 32-bit limits.',
      },
      quiz: [
        choice('cx-pf-3-q1', 'cpp-undefined-behaviour', 'Code dereferences p and then checks if (!p). The optimiser may...', ['delete the check', 'move the check earlier', 'add a second check', 'crash at compile time'], 0, 'p assumed non-null.'),
        choice('cx-pf-3-q2', 'cpp-undefined-behaviour', 'Safe C++20 way to read a float\'s bits as uint32_t:', ['std::bit_cast<std::uint32_t>(f)', '*reinterpret_cast<uint32_t*>(&f)', 'a C cast of the pointer', 'a union in all cases'], 0, 'No aliasing violation.'),
        choice('cx-pf-3-q3', 'cpp-undefined-behaviour', 'Which is undefined for 32-bit int?', ['INT_MIN / -1', '-1 << 3 (C++20)', '7 / 2', '1 << 31 in C++20'], 0, 'Overflow.'),
        fill('cx-pf-3-q4', 'cpp-undefined-behaviour', 'The sanitizer enabled by -fsanitize=___ reports signed overflow and invalid shifts.', ['undefined'], 'UBSan.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'cx-pf-4', title: 'Benchmarking without fooling yourself', concept: 'cpp-benchmarking',
      story: "Chandler Carruth's CppCon 2015 talk \"Tuning C++: Benchmarks, and CPUs, and Compilers! Oh My!\" showed a benchmark that ran impossibly fast because the compiler had deleted the code being measured, then demonstrated `benchmark::DoNotOptimize` and `ClobberMemory` to stop it. Google's Benchmark library (open-sourced in 2014) and later tools such as nanobench and Catch2's benchmarking made sound micro-benchmarks routine, but the classic mistakes (measuring debug builds, ignoring variance, warm-up effects, and dead-code elimination) remain the most common source of wrong performance claims.",
      analogy: "Benchmarking is weighing yourself: one reading after a big lunch on a tilted scale tells you little. Take many readings, at the same time, on a level floor, and look at the typical value, not the best or worst one.",
      timeline: [['2014', 'Google Benchmark', 'Open-sourced micro-benchmark library.'], ['2015', 'Carruth\'s talk', 'Dead-code elimination and DoNotOptimize explained.'], ['2019', 'nanobench', 'Lightweight benchmarking with error estimates.'], ['2020s', 'Continuous benchmarking', 'Per-commit performance tracking in CI (for example Bencher, codspeed).']],
      explain: "Rules for a trustworthy benchmark: **(1)** build with release flags (`-O2` or what you ship), never `-O0`. **(2)** Prevent the optimiser from deleting work: use the result (`benchmark::DoNotOptimize(x)`, `benchmark::ClobberMemory()`), and make inputs unknown at compile time. **(3)** **Warm up**: discard the first iterations, which pay for cold caches, page faults, lazy initialisation, and CPU frequency ramp-up. **(4)** **Repeat** and report a robust statistic: the **median** and a high **percentile** (p90 or p99) rather than the mean, which outliers skew; the **minimum** estimates best-case cost for CPU-bound code but hides variance. **(5)** Control noise: pin the CPU frequency or disable turbo where possible, pin threads to cores, close other workloads, and run long enough. **(6)** Benchmark realistic sizes and data: a lookup table that fits in L1 behaves differently from one that does not, and sorted input changes branch prediction. **(7)** Compare with statistics: report variance and run A/B comparisons interleaved, not hours apart. Micro-benchmarks answer narrow questions; confirm wins with end-to-end measurements or production metrics, since a faster function may not change overall latency (Amdahl).",
      diagram: "raw samples (ms):  50 12 | 10 11 13 10 30 11 12 10 11 12\n                   └warm-up┘ dropped\nsorted:            10 10 10 11 11 11 12 12 13 30\nmedian = 11   p90 (nearest rank) = 13   min = 10   mean = 13 (pulled up by the 30 outlier)",
      ex1: ['cpp', 'a Google Benchmark micro-benchmark', "#include <benchmark/benchmark.h>\nstatic void BM_Sort(benchmark::State& state) {\n  std::vector<int> base(state.range(0));\n  std::mt19937 rng(42);\n  for (auto& x : base) x = rng();\n  for (auto _ : state) {\n    auto v = base;                         // fresh unsorted copy each time\n    std::sort(v.begin(), v.end());\n    benchmark::DoNotOptimize(v.data());    // keep the work\n  }\n}\nBENCHMARK(BM_Sort)->Range(1 << 10, 1 << 20);\nBENCHMARK_MAIN();"],
      ex2: ['text', 'running with repetitions and reduced noise', "./bench --benchmark_repetitions=10 --benchmark_report_aggregates_only=true \\\n        --benchmark_min_warmup_time=0.5\n# Linux: pin to one core and keep frequency stable\ntaskset -c 3 ./bench\nsudo cpupower frequency-set --governor performance"],
      deepDive: {
        explain: "Modern CPUs change frequency with load and temperature (turbo boost, thermal throttling), so the same code can vary by 10–30% between runs; fixing the governor or reporting cycles from `perf stat` instead of time helps. Code alignment and link order can shift results by several percent (Mytkowicz et al., \"Producing Wrong Data Without Doing Anything Obviously Wrong!\", 2009); tools like Stabilizer randomise layout to average it out. Measurement overhead matters for very short operations: `std::chrono::steady_clock::now()` costs around 20 ns, so time batches of operations and divide. Use proper statistics for comparisons: repeated runs, confidence intervals, or a Mann–Whitney U test, since timing distributions are skewed. For latency-sensitive services, measure distributions under load with tools that avoid **coordinated omission** (wrk2, HdrHistogram), because naïve load generators stop sending while the server stalls and so under-report tail latency. Track performance continuously in CI with fixed hardware and alert on statistically significant regressions rather than single noisy runs.",
        example: ['cpp', 'timing a batch to amortise clock overhead', "auto t0 = std::chrono::steady_clock::now();\nfor (int i = 0; i < 1'000'000; ++i) benchmark::DoNotOptimize(hashOf(keys[i & mask]));\nauto t1 = std::chrono::steady_clock::now();\ndouble nsPerOp = std::chrono::duration<double, std::nano>(t1 - t0).count() / 1e6;"],
        tradeoffs: [['Statistic', 'Tells you', 'Weakness'], ['Mean', 'Average cost', 'Skewed by outliers'], ['Median', 'Typical cost', 'Ignores the tail'], ['p90 / p99', 'Tail behaviour', 'Needs many samples'], ['Minimum', 'Best case for CPU-bound code', 'Hides variance and contention']],
        failures: [['Benchmark reports near-zero time', 'Compiler removed the work', 'DoNotOptimize, use results, unknown inputs'], ['Results differ run to run by 20%', 'Frequency scaling and background noise', 'Pin cores, fix governor, more repetitions'], ['Optimisation wins in micro-benchmark, not in production', 'Unrealistic data or Amdahl', 'Measure end to end'], ['Tail latency looks great under load test', 'Coordinated omission', 'Constant-rate load generator with HdrHistogram']],
      },
      warn: "Never benchmark a debug build or report a single run. Use release flags, warm up, repeat, and report the median plus a tail percentile.",
      production: {
        numbers: "Frequency scaling and noise commonly move single runs by 10–30%; std::chrono::steady_clock::now() itself costs on the order of 20 ns, so time batches for operations shorter than about a microsecond.",
        observe: "Continuous benchmarks on dedicated hardware, perf stat cycles and instructions alongside time, and production latency percentiles before and after each optimisation.",
        security: "Benchmarks that use production data must handle it like production data; prefer synthetic inputs with realistic distributions.",
        checklist: ['Release build flags', 'Results consumed (DoNotOptimize)', 'Warm-up discarded', 'Many repetitions; median and p90/p99 reported', 'Noise controlled (pinning, governor)', 'Realistic data sizes and distributions', 'End-to-end confirmation'],
        sources: ['Carruth, "Tuning C++: Benchmarks, and CPUs, and Compilers! Oh My!" (CppCon 2015)', 'Google Benchmark documentation (github.com/google/benchmark)', 'Mytkowicz et al., "Producing Wrong Data Without Doing Anything Obviously Wrong!" (ASPLOS 2009)', 'Tene, "How NOT to Measure Latency" (2015) and HdrHistogram'],
      },
      tip: "Before trusting a speed-up, rerun both versions interleaved several times. If the difference is smaller than the run-to-run spread, you have not measured a win.",
      faq: [['Why discard warm-up iterations?', 'They include cold caches, page faults, and lazy initialisation that steady-state code does not pay.'], ['Why prefer the median to the mean?', 'Outliers skew the mean; the median reflects typical cost.'], ['What does benchmark::DoNotOptimize do?', 'Forces the compiler to treat a value as used, preventing dead-code elimination.'], ['What is coordinated omission?', 'Load generators pausing during stalls, which hides tail latency.'], ['Why pin CPU frequency for benchmarks?', 'Turbo and throttling change speed between runs and add noise.']],
      ex: {
        prompt: 'Write benchSummary(samples, warmup): drop the first warmup samples, then return [median, p90, min] of the rest. The median of an even count is the mean of the two middle values; p90 uses the nearest-rank method (the value at sorted position ceil(0.9 × n), 1-based). Return [0, 0, 0] if no samples remain.',
        fn: 'benchSummary', params: 'samples, warmup', sig: '(int[] samples, int warmup) -> double[]',
        cpp: `class Solution {
public:
    vector<double> benchSummary(vector<int>& samples, int warmup) {
        if ((int)samples.size() <= warmup) return {0, 0, 0};
        vector<int> x(samples.begin() + warmup, samples.end());
        sort(x.begin(), x.end());
        int n = (int)x.size();
        double median = n % 2 ? x[n / 2] : (x[n / 2 - 1] + x[n / 2]) / 2.0;
        int rank = (int)ceil(0.9 * n);
        return {median, (double)x[rank - 1], (double)x[0]};
    }
};
`,
        cases: [{ args: [[50, 12, 10, 11, 13, 10, 30, 11, 12, 10, 11, 12], 2], expect: [11, 13, 10] }, { args: [[5, 5], 2], expect: [0, 0, 0] }, { args: [[9, 1, 2, 3], 0], expect: [2.5, 9, 1] }],
        solution: 'function benchSummary(s,w){const x=s.slice(w).sort((a,b)=>a-b);const n=x.length;if(!n)return[0,0,0];const med=n%2?x[(n-1)/2]:(x[n/2-1]+x[n/2])/2;const p90=x[Math.ceil(0.9*n)-1];return[med,p90,x[0]]}',
        hint: 'Slice off the warm-up, sort, then index into the sorted array.',
      },
      quiz: [
        choice('cx-pf-4-q1', 'cpp-benchmarking', 'A benchmark of a pure function reports 0.3 ns per call for heavy work. Most likely:', ['the compiler eliminated the work', 'the CPU is very fast', 'caches are warm', 'the timer is precise'], 0, 'Dead code.'),
        choice('cx-pf-4-q2', 'cpp-benchmarking', 'Best summary for noisy timing samples:', ['median plus a tail percentile', 'the single fastest run', 'the first run', 'the mean only'], 0, 'Robust statistics.'),
        choice('cx-pf-4-q3', 'cpp-benchmarking', 'Which build should micro-benchmarks use?', ['the release flags you ship', '-O0 for accuracy', 'a sanitizer build', 'any build'], 0, 'Realistic.'),
        fill('cx-pf-4-q4', 'cpp-benchmarking', 'Discarding the first iterations to avoid cold-start effects is called ___-up.', ['warm'], 'Warm-up.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'cx-pf-5', title: 'Branch prediction and SIMD vectorisation', concept: 'cpp-branches-simd',
      story: "The most upvoted question in Stack Overflow's history (2012) asked why processing a sorted array was about six times faster than processing an unsorted one with identical code. The answer was branch prediction: with sorted data the `if (data[i] >= 128)` branch was predictable, and with random data the CPU guessed wrong half the time, throwing away work on each misprediction. The same years saw SIMD units widen from SSE's 128 bits to AVX2's 256 and AVX-512's 512 bits, and C++26 adopted `std::simd` (P1928) to make data-parallel code portable.",
      analogy: "A branch predictor is a train dispatcher who sets the points before the train arrives, based on where trains went before. Guess right and the train flies through; guess wrong and it must stop, reverse, and take the other track.",
      timeline: [['1990s', 'Dynamic prediction', 'Two-bit saturating counters and history-based predictors in CPUs.'], ['1999–2011', 'SIMD widens', 'SSE (128-bit), AVX (256-bit, 2011).'], ['2012', 'The sorted-array question', 'Stack Overflow\'s famous branch-prediction answer.'], ['2016–2026', 'AVX-512, SVE, std::simd', 'Wider vectors; C++26 adopts std::simd.']],
      explain: "Pipelined CPUs fetch instructions far ahead, so at each conditional branch they **predict** the direction. A **misprediction** flushes the pipeline, costing roughly **15–20 cycles** on modern cores. Predictors learn patterns: the classic building block is a **2-bit saturating counter** per branch (states 0–1 predict not taken, 2–3 predict taken; taken outcomes increment, not-taken decrement), which tolerates a single anomaly such as a loop exit. Modern predictors (TAGE-like) use long histories and predict regular patterns almost perfectly, but **random data-dependent branches** stay near 50% wrong. Remedies: sort or partition data so branches become predictable, replace branches with arithmetic or conditional moves (**branchless** code: `sum += (x >= 128) * x;`), use lookup tables, and hint rare paths with C++20 `[[likely]]`/`[[unlikely]]` (affects code layout, not the hardware predictor). **SIMD** (single instruction, multiple data) processes 4–16 values per instruction. Compilers **auto-vectorise** simple loops at `-O2`/`-O3` when iterations are independent, memory is contiguous, there is no aliasing doubt (`__restrict`), and there are few branches; check with `-fopt-info-vec` (GCC) or `-Rpass=loop-vectorize` (Clang). For explicit control use intrinsics (`<immintrin.h>`), libraries (Highway, xsimd, Eigen), or C++26 `std::simd`.",
      diagram: "2-bit counter: 0 strong N · 1 weak N · 2 weak T · 3 strong T\noutcome T → +1 (max 3)   outcome N → −1 (min 0)   predict T when state ≥ 2\nloop branch TTTN TTTN: one miss per exit after warm-up\nrandom branch: ~50% misses × ~15–20 cycles each\nSIMD: one AVX2 add on 8 floats   [a0..a7] + [b0..b7] → [c0..c7]",
      ex1: ['cpp', 'branchy versus branchless', "long long sumBig(const std::vector<int>& v) {\n  long long s = 0;\n  for (int x : v) if (x >= 128) s += x;           // unpredictable on random data\n  return s;\n}\nlong long sumBigBranchless(const std::vector<int>& v) {\n  long long s = 0;\n  for (int x : v) s += (x >= 128) ? x : 0;        // typically a cmov or vectorised blend\n  return s;\n}"],
      ex2: ['cpp', 'a loop the compiler can vectorise', "void saxpy(float a, const float* __restrict x, float* __restrict y, size_t n) {\n  for (size_t i = 0; i < n; ++i) y[i] = a * x[i] + y[i];   // independent, contiguous\n}\n// g++ -O3 -march=x86-64-v3 -fopt-info-vec saxpy.cpp  → \"loop vectorized using 32 byte vectors\""],
      deepDive: {
        explain: "Branchless code is not always faster: when a branch is highly predictable, the branchy version skips work, while the branchless one always pays for both sides, and compilers already choose conditional moves when profitable. Profile with `perf stat -e branches,branch-misses`; a miss rate above a few percent on a hot loop is worth attention. Profile-guided optimisation lets the compiler lay out code by real branch frequencies. For vectorisation, the obstacles are **loop-carried dependencies** (each iteration needs the previous result), **possible aliasing** between pointers (fixed with `__restrict` or by the compiler adding runtime checks), **non-contiguous access** (AoS layouts, gathers), function calls that cannot be inlined, and **floating-point reductions**: the compiler may not reorder `sum += x[i]` without `-ffast-math` or `-fassociative-math` because reassociation changes rounding; manual multiple accumulators or `std::reduce` with an execution policy solve it. AVX-512 can lower clock frequency on some older Intel parts, which made it a mixed blessing; newer cores largely removed the penalty. Portable SIMD (`std::experimental::simd` in libstdc++ since GCC 11, `std::simd` in C++26) expresses width-independent code; ARM's SVE takes this further with vector-length-agnostic instructions.",
        example: ['cpp', 'multiple accumulators for a vectorisable float sum', "float sum4(const float* x, size_t n) {\n  float a0 = 0, a1 = 0, a2 = 0, a3 = 0;\n  size_t i = 0;\n  for (; i + 4 <= n; i += 4) { a0 += x[i]; a1 += x[i + 1]; a2 += x[i + 2]; a3 += x[i + 3]; }\n  for (; i < n; ++i) a0 += x[i];\n  return (a0 + a1) + (a2 + a3);   // breaks the single dependency chain\n}"],
        tradeoffs: [['Technique', 'Helps when', 'Risk'], ['Sort or partition data', 'Data-dependent branches on random data', 'Sorting cost'], ['Branchless arithmetic / cmov', 'Unpredictable branches with cheap sides', 'Slower when branches are predictable'], ['[[likely]] / PGO', 'Skewed branches', 'Wrong hints hurt layout'], ['SIMD (auto or explicit)', 'Independent, contiguous, arithmetic-heavy loops', 'Portability; precision changes in reductions']],
        failures: [['Same code 5× slower on random input', 'Branch mispredictions', 'Sort, partition, or go branchless'], ['Loop not vectorised', 'Aliasing doubt or dependency', '__restrict, restructure, check -fopt-info-vec'], ['Float sum differs after optimisation', 'Reassociation under -ffast-math', 'Accept tolerance or keep strict order'], ['Crash with illegal instruction', 'AVX code on CPUs without AVX', 'Runtime dispatch or baseline -march']],
      },
      warn: "Do not apply -ffast-math globally to get vectorised reductions; it changes floating-point semantics everywhere. Restructure the loop or accept the cost in that one place.",
      production: {
        numbers: "A branch misprediction costs roughly 15–20 cycles on modern x86 and ARM cores; AVX2 processes 8 floats and AVX-512 16 floats per instruction.",
        observe: "perf stat -e branches,branch-misses; compiler vectorisation reports (-fopt-info-vec, -Rpass=loop-vectorize, -Rpass-missed); IPC changes after edits.",
        security: "Secret-dependent branches leak timing information; cryptographic code must be branch-free and constant-time on secret data. Spectre variant 1 exploits speculative execution past bounds checks.",
        checklist: ['Branch-miss rate checked on hot loops', 'Data sorted or partitioned where it helps', 'Branchless only after measuring', 'PGO for branch-heavy binaries', 'Vectorisation reports reviewed for hot loops', '__restrict or clear ownership of buffers', 'Runtime CPU dispatch for wide SIMD'],
        sources: ['Stack Overflow, "Why is processing a sorted array faster than processing an unsorted array?" (2012)', 'Seznec, "A new case for the TAGE branch predictor" (MICRO 2011)', 'Intel 64 and IA-32 Architectures Optimization Reference Manual', 'P1928 "std::simd — merge data-parallel types from the Parallelism TS 2" (C++26)'],
      },
      tip: "Count before you optimise: if branch-misses are under about 1% of branches, look elsewhere; if a hot loop is not vectorised, read the compiler's missed-optimisation remark first.",
      faq: [['How much does a branch misprediction cost?', 'Roughly 15–20 cycles on modern cores.'], ['How does a 2-bit saturating counter work?', 'States 0–3; taken increments, not taken decrements; predict taken at 2 or 3.'], ['When is branchless code worse?', 'When the branch is predictable and lets you skip expensive work.'], ['What prevents auto-vectorisation?', 'Loop-carried dependencies, possible aliasing, non-contiguous access, and calls.'], ['What does C++26 add for SIMD?', 'std::simd, portable data-parallel types.']],
      ex: {
        prompt: 'Simulate one 2-bit saturating counter branch predictor starting in state 1 (weakly not taken). For each outcome "T" (taken) or "N" (not taken): predict taken if the state is 2 or 3, count a misprediction if the prediction is wrong, then move the state up on T (max 3) or down on N (min 0). Write mispredicts(outcomes) returning the number of mispredictions.',
        fn: 'mispredicts', params: 'outcomes', sig: '(string outcomes) -> int',
        cpp: `class Solution {
public:
    int mispredicts(string outcomes) {
        int state = 1, misses = 0;
        for (char o : outcomes) {
            char predicted = state >= 2 ? 'T' : 'N';
            if (predicted != o) misses++;
            state = o == 'T' ? min(3, state + 1) : max(0, state - 1);
        }
        return misses;
    }
};
`,
        cases: [{ args: ['TTTTTTTT'], expect: 1 }, { args: ['TNTNTNTN'], expect: 8 }, { args: ['TTTNTTTN'], expect: 3 }, { args: [''], expect: 0 }, { args: ['NNNN'], expect: 0 }],
        solution: "function mispredicts(outcomes){let st=1,m=0;for(const o of outcomes){const pred=st>=2?'T':'N';if(pred!==o)m++;if(o==='T')st=Math.min(3,st+1);else st=Math.max(0,st-1)}return m}",
        hint: 'Predict from the current state, compare, then update the state with saturation.',
      },
      quiz: [
        choice('cx-pf-5-q1', 'cpp-branches-simd', 'Why can the same loop run several times faster on sorted data?', ['its branch becomes predictable', 'sorted data is smaller', 'the cache is larger', 'the compiler skips work'], 0, 'Prediction.'),
        choice('cx-pf-5-q2', 'cpp-branches-simd', 'A 2-bit counter in state 3 sees one not-taken outcome. Next prediction:', ['taken (state 2)', 'not taken', 'random', 'it resets to 0'], 0, 'Tolerates one anomaly.'),
        choice('cx-pf-5-q3', 'cpp-branches-simd', 'Which commonly blocks auto-vectorisation?', ['possible pointer aliasing', 'contiguous arrays', 'independent iterations', 'simple arithmetic'], 0, 'Use __restrict.'),
        fill('cx-pf-5-q4', 'cpp-branches-simd', 'The C++26 library type for portable data-parallel code is std::___', ['simd'], 'std::simd.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'cx-pf-6', title: 'Allocation strategies: size classes, pools, and arenas', concept: 'cpp-allocation-strategies',
      story: "Heap allocation was a recurring bottleneck in large C++ services. Google built tcmalloc (2005) with per-thread caches and size classes, Jason Evans built jemalloc for FreeBSD (2005) and later scaled it at Facebook, and Microsoft Research released mimalloc in 2019. Each showed that the general-purpose allocator matters, and that application-level strategies (pools, arenas, avoiding allocation in hot loops) matter even more. C++17's polymorphic memory resources (`std::pmr`) brought arenas and pools into the standard library.",
      analogy: "A size-class allocator is a shoe shop that stocks only certain sizes: ask for 10.3 and you get an 11, a little loose (internal fragmentation) but instantly available. An arena is a party venue booked for the evening: hand out space quickly, then clear everything at once when the party ends.",
      timeline: [['1987', 'dlmalloc', 'Doug Lea\'s allocator, basis of glibc malloc.'], ['2005', 'tcmalloc and jemalloc', 'Per-thread caches and size classes at scale.'], ['2017', 'C++17 std::pmr', 'memory_resource, monotonic_buffer_resource, pool resources.'], ['2019', 'mimalloc', 'Microsoft Research\'s compact, fast allocator.']],
      explain: "General-purpose allocators round small requests up to **size classes** (for example 16, 32, 48, 64, … bytes) and keep free lists per class, often per thread, so most `malloc`/`free` calls avoid locks. Rounding wastes the difference between class size and request: **internal fragmentation**. **External fragmentation** is free memory split into pieces too small to use. Large requests (hundreds of KB and up) usually go straight to `mmap`. Application strategies: **(1) avoid allocation** in hot paths: reuse buffers, `reserve` capacity, use small-buffer types (SSO strings, `small_vector`), and stack or inline storage. **(2) Object pools** for many same-sized objects: a free list of fixed slots gives O(1) allocate and free and good locality (the boss fight uses one). **(3) Arenas / monotonic allocators**: bump a pointer through a large block and free everything at once when a request or frame ends; `std::pmr::monotonic_buffer_resource` plus `std::pmr::vector`/`string`. **(4) Pool resources**: `std::pmr::unsynchronized_pool_resource` for single-threaded size-class pooling. **(5) Swap the global allocator** (jemalloc, tcmalloc, mimalloc via linking or `LD_PRELOAD`) and measure: services commonly gain several percent of CPU and reduce memory bloat.",
      diagram: "size classes: 16 32 64 128 256 | > 256 → large (mmap-backed or page heap)\nrequest 10  → class 16 (6 bytes wasted)\nrequest 33  → class 64 (31 wasted)\nrequest 200 → class 256 (56 wasted)\nrequest 300 → large\narena: [used used used | free ......]  bump pointer → O(1) alloc; free all at end",
      ex1: ['cpp', 'a per-request arena with std::pmr', "#include <memory_resource>\nvoid handle(const Request& req) {\n  std::array<std::byte, 64 * 1024> buf;\n  std::pmr::monotonic_buffer_resource arena(buf.data(), buf.size());   // falls back to heap if exceeded\n  std::pmr::vector<std::pmr::string> fields(&arena);\n  parseInto(req, fields);     // all allocations bump-allocated from buf\n}                             // everything released at once"],
      ex2: ['cpp', 'a fixed-size object pool', "template <class T, size_t N> class Pool {\n  union Slot { Slot* next; alignas(T) std::byte storage[sizeof(T)]; };\n  std::array<Slot, N> slots_; Slot* free_ = nullptr;\npublic:\n  Pool() { for (auto& s : slots_) { s.next = free_; free_ = &s; } }\n  template <class... A> T* make(A&&... a) {\n    if (!free_) return nullptr;\n    Slot* s = free_; free_ = s->next;\n    return new (s->storage) T(std::forward<A>(a)...);\n  }\n  void destroy(T* p) { p->~T(); auto* s = reinterpret_cast<Slot*>(p); s->next = free_; free_ = s; }\n};"],
      deepDive: {
        explain: "glibc's ptmalloc uses per-thread arenas but can suffer from fragmentation and memory not returned to the OS in long-running multithreaded services (a well-known cause of RSS growing without leaks); `malloc_trim` or a different allocator often fixes it. tcmalloc's newer design uses per-CPU caches (restartable sequences on Linux) and huge-page-aware placement. jemalloc offers rich profiling (`prof:true`) for finding allocation hot spots. Measuring matters: count allocations per request, bytes allocated per second, and peak RSS; heaptrack and allocator statistics show call sites. Arena pitfalls: objects allocated in an arena must not outlive it, destructors of arena objects may need explicit calls if memory is simply dropped, and `std::pmr` containers carry a resource pointer (8 bytes extra) and use virtual calls for allocation. Pools pitfalls: double free and use-after-free become silent corruption of the free list, so debug builds should poison freed slots and track ownership. Most importantly, the best allocation is the one you avoid: hoisting a `std::vector` out of a loop and calling `clear()` keeps its capacity.",
        example: ['text', 'swapping the allocator without code changes', "# link time\ng++ -O2 app.cpp -o app -ljemalloc        # or -ltcmalloc / -lmimalloc\n# or at run time (Linux)\nLD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.2 ./app\n# compare: requests/s, CPU per request, p99 latency, RSS after 1 hour"],
        tradeoffs: [['Strategy', 'Strength', 'Weakness'], ['General allocator (malloc/new)', 'Flexible', 'Overhead; fragmentation; contention'], ['Object pool', 'O(1), no fragmentation for one size', 'One size; manual lifetime'], ['Arena / monotonic', 'Fastest; bulk free', 'Cannot free individual objects'], ['Alternative global allocator', 'Drop-in gains', 'Must be measured per workload']],
        failures: [['RSS grows steadily without leaks', 'Allocator fragmentation or arenas not trimmed', 'jemalloc/tcmalloc, malloc_trim, fewer long-lived small objects'], ['Hot loop dominated by malloc', 'Allocation per iteration', 'Hoist and reuse; reserve'], ['Corrupted pool free list', 'Double free into a pool', 'Debug poisoning; ownership types'], ['Dangling pointers after request ends', 'Objects escaped the arena', 'Copy out results; arena lifetime rules']],
      },
      warn: "Objects allocated from an arena or pool must not outlive it. Returning arena-backed strings or pointers from a request handler creates use-after-free bugs once the arena resets.",
      production: {
        numbers: "Replacing glibc malloc with jemalloc, tcmalloc, or mimalloc commonly saves several percent of CPU and noticeably reduces RSS growth in multithreaded services; Google has reported tcmalloc optimisations saving fleet-wide resources at the level of whole data-centre percentages.",
        observe: "Allocations per request, allocation rate, peak and steady RSS, fragmentation statistics (malloc_stats, jemalloc stats), and allocation flame graphs from heaptrack or allocator profiling.",
        security: "Custom pools and arenas bypass hardened allocator checks; use-after-free and double free in them are silently exploitable. Keep sanitizer-compatible builds (ASan understands pmr via its heap) and poison freed slots in debug.",
        checklist: ['No allocation in hot loops', 'reserve and buffer reuse', 'Pools for many same-sized objects', 'Arenas per request or frame', 'Arena objects never escape', 'Allocator choice measured', 'Allocation metrics in production'],
        sources: ['Evans, "A Scalable Concurrent malloc(3) Implementation for FreeBSD" (BSDCan 2006)', 'Hunter et al., "Beyond malloc efficiency to fleet efficiency: a hugepage-aware memory allocator" (OSDI 2021)', 'Leijen, Zorn, de Moura, "Mimalloc: Free List Sharding in Action" (2019)', 'cppreference.com: std::pmr::monotonic_buffer_resource; std::pmr::unsynchronized_pool_resource'],
      },
      tip: "Count allocations per request before optimising anything else; a handler that allocates hundreds of times usually has a few obvious buffers to hoist.",
      faq: [['What is internal fragmentation?', 'Wasted bytes from rounding a request up to a size class.'], ['When is an arena a good fit?', 'Many allocations with the same lifetime, freed together, such as per request or per frame.'], ['What does std::pmr::monotonic_buffer_resource do?', 'Bump-allocates from a buffer and frees everything when destroyed.'], ['Why can RSS grow without a leak?', 'Fragmentation and allocator caching keep memory from returning to the OS.'], ['How can you switch allocators without code changes?', 'Link against jemalloc, tcmalloc, or mimalloc, or use LD_PRELOAD on Linux.']],
      ex: {
        prompt: 'Model a size-class allocator with classes 16, 32, 64, 128, and 256 bytes. Each request is rounded up to the smallest class that fits; requests above 256 bytes are "large" and not counted as waste. Write sizeClassWaste(requests) returning [total wasted bytes, number of large requests].',
        fn: 'sizeClassWaste', params: 'requests', sig: '(int[] requests) -> int[]',
        cpp: `class Solution {
public:
    vector<int> sizeClassWaste(vector<int>& requests) {
        const int classes[] = {16, 32, 64, 128, 256};
        int waste = 0, large = 0;
        for (int r : requests) {
            if (r > 256) { large++; continue; }
            for (int c : classes) if (c >= r) { waste += c - r; break; }
        }
        return {waste, large};
    }
};
`,
        cases: [{ args: [[10, 16, 33, 200, 300, 1]], expect: [108, 1] }, { args: [[]], expect: [0, 0] }, { args: [[256, 257]], expect: [0, 1] }],
        solution: 'function sizeClassWaste(req){const cls=[16,32,64,128,256];let waste=0,large=0;for(const r of req){if(r>256){large++;continue}const c=cls.find(c=>c>=r);waste+=c-r}return[waste,large]}',
        hint: 'For each request find the first class at least as big; the difference is waste.',
      },
      quiz: [
        choice('cx-pf-6-q1', 'cpp-allocation-strategies', 'A 33-byte request in a 16/32/64… size-class allocator wastes...', ['31 bytes', '1 byte', '0 bytes', '33 bytes'], 0, 'Rounded to 64.'),
        choice('cx-pf-6-q2', 'cpp-allocation-strategies', 'Best fit for thousands of small allocations freed together at the end of a request:', ['an arena (monotonic buffer)', 'a std::list', 'shared_ptr everywhere', 'a global mutex around new'], 0, 'Bulk free.'),
        choice('cx-pf-6-q3', 'cpp-allocation-strategies', 'Service RSS grows for days but LeakSanitizer finds nothing. Likely cause:', ['allocator fragmentation', 'a compiler bug', 'too few threads', 'stack overflow'], 0, 'Try another allocator.'),
        fill('cx-pf-6-q4', 'cpp-allocation-strategies', 'C++17 polymorphic memory resources live in namespace std::___', ['pmr'], 'std::pmr.'),
      ],
    }),
  ],
  exam: [
    choice('cx-pf-e1', 'cpp-cache-locality', 'Column-order traversal of a large row-major matrix is slow because...', ['each access touches a different cache line', 'columns are stored on disk', 'the compiler cannot loop', 'integers are unaligned'], 0, 'Stride.'),
    choice('cx-pf-e2', 'cpp-data-layout', 'Reordering members from largest to smallest alignment mainly reduces...', ['padding', 'instructions', 'branches', 'virtual calls'], 0, 'Smaller structs.'),
    choice('cx-pf-e3', 'cpp-data-layout', 'When does struct-of-arrays beat array-of-structs?', ['loops touch few fields of many elements', 'every field is always used', 'there is one element', 'never'], 0, 'Bandwidth and SIMD.'),
    choice('cx-pf-e4', 'cpp-undefined-behaviour', 'if (a + 1 < a) as an overflow check for int a is...', ['unreliable: overflow is UB and the check may be removed', 'correct', 'required by the standard', 'faster than alternatives'], 0, 'Check before.'),
    choice('cx-pf-e5', 'cpp-undefined-behaviour', 'Reading a float through an int* is...', ['a strict aliasing violation (UB)', 'fine', 'implementation-defined', 'unspecified'], 0, 'Use bit_cast.'),
    choice('cx-pf-e6', 'cpp-benchmarking', 'A micro-benchmark is 100× faster than expected. First suspect:', ['dead-code elimination', 'a faster CPU', 'better caching', 'clock drift'], 0, 'DoNotOptimize.'),
    choice('cx-pf-e7', 'cpp-benchmarking', 'Why report p99 as well as the median?', ['it shows tail behaviour that users feel', 'it is always lower', 'it removes outliers', 'it is required by C++'], 0, 'Tails.'),
    choice('cx-pf-e8', 'cpp-branches-simd', 'Approximate cost of a branch misprediction:', ['15–20 cycles', '1 cycle', '1,000 cycles', '1 ms'], 0, 'Pipeline flush.'),
    choice('cx-pf-e9', 'cpp-allocation-strategies', 'An arena allocator frees memory...', ['all at once when the arena is reset or destroyed', 'per object immediately', 'never', 'via garbage collection'], 0, 'Bulk.'),
    choice('cx-pf-e10', 'cpp-cache-locality', 'Size of an x86-64 cache line:', ['64 bytes', '8 bytes', '4 KB', '1 MB'], 0, 'Line.'),
    order('cx-pf-e11', 'cpp-benchmarking', 'Order a sound micro-benchmark run.', ['Build with release flags', 'Warm up and discard initial iterations', 'Run many repetitions while consuming results', 'Report the median and a tail percentile'], 'Build, warm, repeat, summarise.'),
    fill('cx-pf-e12', 'cpp-branches-simd', 'Single instruction, multiple data is abbreviated ___', ['SIMD'], 'Vector units.'),
  ],
};
