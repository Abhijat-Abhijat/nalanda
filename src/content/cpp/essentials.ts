import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const cxEssentials: Chapter = {
  id: 'cx-essentials',
  title: 'Modern C++ essentials',
  summary: 'The core language as a modern C++ engineer uses it: fundamental types and overflow rules, references versus pointers, auto and type deduction, const and constexpr, uniform initialisation and narrowing, and std::string with std::string_view. Standards status checked as of October 2026: C++23 is the published standard, C++26 was technically finalised by WG21 in March 2026 and awaits ISO publication, and GCC 16 defaults to C++20.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'cx-es-1', title: 'Fundamental types, sizes, and overflow', concept: 'cpp-fundamental-types',
      story: "Bjarne Stroustrup began \"C with Classes\" at Bell Labs in 1979 and renamed it C++ in 1983. From C it inherited a deliberate vagueness about sizes: the standard guarantees only minimum ranges, so `int` is 16 bits on some microcontrollers and 32 bits on every mainstream desktop and server. It also inherited a sharp rule that still causes security bugs today: **unsigned** arithmetic wraps around modulo 2^N, while **signed** overflow is *undefined behaviour*, meaning the compiler may assume it never happens and optimise accordingly.",
      analogy: "Unsigned numbers are a clock face: go past 12 and you are back at 1. Signed overflow is driving off a cliff the map says does not exist: the optimiser has already planned the route as if it cannot happen.",
      timeline: [['1979', 'C with Classes', 'Stroustrup starts the language at Bell Labs.'], ['1998', 'C++98', 'First ISO standard; sizes are minimums, not exact.'], ['2011', 'C++11', '<cstdint> fixed-width types such as int32_t and uint64_t become standard C++.'], ['2020', 'C++20', 'Signed integers are required to be two\'s complement, but signed overflow stays undefined.']],
      explain: "The **fundamental types** are `bool`, the character types (`char`, `char8_t`, `char16_t`, `char32_t`, `wchar_t`), the integer types (`short`, `int`, `long`, `long long`, each signed or unsigned), and the floating types (`float`, `double`, `long double`). The standard fixes minimum widths: `int` at least 16 bits, `long` at least 32, `long long` at least 64. On today's 64-bit Linux and macOS (the LP64 model) `long` is 64 bits; on 64-bit Windows (LLP64) it is 32 bits, which is a classic portability bug. When the width matters, use `<cstdint>`: `int32_t`, `uint64_t`, `size_t` for sizes and indices. **Unsigned** arithmetic is defined to wrap modulo 2^N: `uint8_t(200 + 100)` is 44. **Signed** overflow is undefined behaviour (UB): `INT_MAX + 1` may give a negative number, crash, or let the compiler delete a bounds check that it decided could never fail. Mixing signed and unsigned converts the signed value to unsigned, so `-1 < 0u` is false. Whether plain `char` is signed is implementation-defined (signed on x86, unsigned on ARM Linux).",
      diagram: "uint8_t:  0 … 255          200 + 100 → 300 mod 256 = 44  (defined wrap)\nint32_t:  −2^31 … 2^31−1   INT_MAX + 1 → undefined behaviour\nLP64 (Linux, macOS):  int 32 · long 64 · pointer 64\nLLP64 (Windows):      int 32 · long 32 · long long 64 · pointer 64\n-1 < 0u  → false   (-1 converts to 4294967295)",
      ex1: ['cpp', 'defined unsigned wrap versus undefined signed overflow', "#include <cstdint>\n#include <climits>\nuint8_t a = 200, b = 100;\nuint8_t c = a + b;            // 44: promoted to int, then converted back mod 256\nint big = INT_MAX;\n// int bad = big + 1;         // undefined behaviour: do not do this\nlong long ok = (long long)big + 1;   // 2147483648"],
      ex2: ['cpp', 'the signed/unsigned comparison trap', "#include <vector>\nstd::vector<int> v{1, 2, 3};\nint i = -1;\nif (i < v.size()) { /* never runs: -1 becomes a huge size_t */ }\n// C++20: std::cmp_less(i, v.size()) compares correctly\n// or use std::ssize(v) to get a signed size"],
      deepDive: {
        explain: "**Integer promotion** converts types narrower than `int` to `int` before arithmetic, which is why `uint8_t a + b` does not overflow in the addition itself; the wrap happens when the result is stored back into 8 bits. **Usual arithmetic conversions** then bring both operands to a common type, and when one is unsigned of equal or greater rank the signed one is converted to unsigned. Compilers exploit signed-overflow UB: `for (int i = 0; i <= n; ++i)` can be assumed to terminate, and `x + 1 > x` can be folded to `true`. That is good for speed and dangerous for checks written after the fact, such as `if (a + b < a)` overflow tests on signed values, which the optimiser may delete. Safe patterns: check before the operation (`a > INT_MAX - b`), use the GCC and Clang builtins `__builtin_add_overflow`, widen to a larger type, or (C++26) use the saturating functions `std::add_sat`. `-fwrapv` makes signed overflow wrap, at a small optimisation cost; `-fsanitize=undefined` detects it at run time.",
        example: ['cpp', 'checking overflow before it happens', "bool addWouldOverflow(int a, int b) {\n  if (b > 0) return a > INT_MAX - b;   // check before adding\n  return a < INT_MIN - b;\n}\nint r;\nif (__builtin_add_overflow(a, b, &r)) { /* handle overflow */ }   // GCC and Clang"],
        tradeoffs: [['Type', 'Use for', 'Watch out for'], ['int', 'General arithmetic', 'UB on overflow; only 32 bits in practice'], ['size_t', 'Sizes and indices', 'Unsigned: 0 - 1 wraps to a huge value'], ['int64_t / uint64_t', 'Exact widths across platforms', 'Verbose; long differs on Windows'], ['double', 'Measurements', 'Not exact for money or large integers above 2^53']],
        failures: [['Loop never ends when counting down with size_t', 'Unsigned i >= 0 is always true', 'Use a signed index or count down with i-- > 0'], ['Code works at -O0 but breaks at -O2', 'Signed overflow UB exploited by the optimiser', 'Fix the overflow; test with -fsanitize=undefined'], ['Different results on Windows and Linux', 'long is 32 bits on LLP64', 'Use fixed-width types'], ['Bounds check bypassed by a large length', 'Signed/unsigned conversion of a negative length', 'Validate signs; use the C++20 std::cmp_* functions']],
      },
      warn: "Signed integer overflow is undefined behaviour, not \"wrapping\". Never rely on it, and never write overflow checks that perform the overflowing operation first.",
      production: {
        numbers: "INT_MAX is 2,147,483,647. A 32-bit millisecond counter wraps after about 49.7 days unsigned, and signed overflow (UB) is reached after about 24.8 days.",
        observe: "Build test binaries with -fsanitize=undefined (UBSan) and -Wall -Wextra -Wconversion -Wsign-compare; treat new warnings as failures in CI.",
        security: "Integer overflow in size calculations (count * sizeof(T)) is a classic route to heap buffer overflows. Check multiplication before allocating from untrusted sizes.",
        checklist: ['Fixed-width types for wire formats and files', 'size_t only for sizes, never for differences', 'Overflow checked before the operation', 'No signed/unsigned comparisons (-Wsign-compare)', 'UBSan in CI test builds', '-Wconversion reviewed', 'long avoided where Windows portability matters'],
        sources: ['ISO/IEC 14882:2024 (C++23), [basic.fundamental] and [expr.arith.conv]', 'cppreference.com: Fundamental types; Arithmetic operators (overflows)', 'Stroustrup, "A Tour of C++" (3rd ed., 2022), chapter 1', 'Clang documentation: UndefinedBehaviorSanitizer'],
      },
      tip: "If a bug disappears when you turn optimisation off, look for undefined behaviour first: signed overflow, uninitialised reads, or out-of-bounds access.",
      faq: [['Is signed overflow defined in C++20?', 'No. C++20 mandates two\'s complement representation, but overflow is still undefined behaviour.'], ['What is 200 + 100 stored in a uint8_t?', '44, because unsigned conversion is modulo 256.'], ['How wide is long?', 'At least 32 bits: 64 on Linux and macOS (LP64), 32 on Windows (LLP64).'], ['Why is -1 < v.size() false?', '-1 converts to a huge unsigned value before the comparison.'], ['How do you detect overflow safely?', 'Check before the operation, use __builtin_add_overflow, widen, or run UBSan in tests.']],
      ex: {
        prompt: 'Write wrapAddU8(a, b) for 0 <= a, b <= 255 returning the value of uint8_t(a + b), that is, the sum wrapped modulo 256 as unsigned 8-bit arithmetic does.',
        fn: 'wrapAddU8', params: 'a, b', sig: '(int a, int b) -> int',
        cpp: `class Solution {
public:
    int wrapAddU8(int a, int b) {
        unsigned char r = static_cast<unsigned char>(a + b);   // defined: modulo 256
        return r;
    }
};
`,
        cases: [{ args: [200, 100], expect: 44 }, { args: [255, 1], expect: 0 }, { args: [10, 20], expect: 30 }, { args: [0, 0], expect: 0 }],
        solution: 'function wrapAddU8(a,b){return (a+b)&255}',
        hint: 'Unsigned 8-bit arithmetic keeps only the low 8 bits: mask with 255 or take the sum modulo 256.',
      },
      quiz: [
        choice('cx-es-1-q1', 'cpp-fundamental-types', 'What does the C++ standard say about INT_MAX + 1?', ['it is undefined behaviour', 'it wraps to INT_MIN', 'it throws std::overflow_error', 'it saturates at INT_MAX'], 0, 'Signed overflow is UB, even in C++20.'),
        choice('cx-es-1-q2', 'cpp-fundamental-types', 'On 64-bit Windows, sizeof(long) is...', ['4', '8', '2', '16'], 0, 'LLP64 keeps long at 32 bits.'),
        choice('cx-es-1-q3', 'cpp-fundamental-types', 'Why is `int i = -1; i < v.size()` false?', ['-1 is converted to a huge unsigned value', 'size() is negative', 'the comparison is UB', 'vectors cannot be compared'], 0, 'Usual arithmetic conversions.'),
        fill('cx-es-1-q4', 'cpp-fundamental-types', 'Unsigned arithmetic wraps modulo 2 to the power ___ (the number of bits).', ['N', 'n', 'the bit width'], 'Defined wrap.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'cx-es-2', title: 'References versus pointers', concept: 'cpp-references-pointers',
      story: "C passed everything by value, so changing a caller's variable meant passing its address: `swap(&a, &b)`. Stroustrup added **references** to C++ in the 1980s mainly so that operator overloading could look natural (`a = b + c` on big matrices without copies or pointer syntax). The result is two tools that look similar and mean different things: a reference is another name for an existing object, bound once and never null; a pointer is an object that holds an address, can be null, and can be reseated.",
      analogy: "A reference is a nickname: \"Sam\" always means the same person. A pointer is a sticky note with an address written on it: it can be rewritten, left blank, or point at a house that has since been demolished.",
      timeline: [['1972', 'C pointers', 'Pass-by-address with & and *.'], ['1985', 'C++ references', 'Cfront 1.0 ships references for natural operator syntax.'], ['2011', 'C++11', 'Rvalue references (&&) and nullptr replace NULL.'], ['2020s', 'Guidelines', 'C++ Core Guidelines: raw pointers are non-owning; use references when null is impossible.']],
      explain: "A **reference** `T&` must be initialised, cannot be null, and cannot be reseated: assignment through it assigns to the referred object. A **pointer** `T*` holds an address, can be `nullptr`, can be changed to point elsewhere, and supports arithmetic within an array. Choosing a parameter type: pass small, cheap types (`int`, `double`, iterators, `string_view`) **by value**; pass large read-only objects by **`const T&`**; use **`T&`** for an in/out parameter the function must modify; use **`T*`** when \"no object\" is a valid input; and pass smart pointers only when the function takes part in ownership. Both references and pointers can **dangle**: returning a reference to a local variable, or keeping a pointer into a `std::vector` after it reallocates, refers to memory that no longer holds the object. In modern C++, a raw `T*` means \"I observe, I do not own\"; ownership lives in values, containers, and smart pointers.",
      diagram: "int x = 5;\nint& r = x;      r ─── is ───► x   (alias; always x)\nint* p = &x;     p ──holds──► address of x   (may be nullptr, may be reseated)\nr = 7;   → x is 7\np = &y;  → p now points at y; r still means x\nfunction parameters:  T (small)  ·  const T& (big, read)  ·  T& (modify)  ·  T* (optional)",
      ex1: ['cpp', 'an output parameter by reference', "void minMax(const std::vector<int>& v, int& lo, int& hi) {\n  lo = hi = v[0];\n  for (int x : v) { if (x < lo) lo = x; if (x > hi) hi = x; }\n}\nint lo, hi;\nminMax({3, 1, 4}, lo, hi);   // lo = 1, hi = 4"],
      ex2: ['cpp', 'two ways to dangle', "const std::string& bad() {\n  std::string s = \"temp\";\n  return s;                  // dangling: s is destroyed on return\n}\nstd::vector<int> v{1, 2, 3};\nint* p = &v[0];\nv.push_back(4);              // may reallocate\n// *p is now undefined behaviour"],
      deepDive: {
        explain: "Under the hood compilers usually implement references as pointers, but the language rules differ, and the rules are what let the optimiser and readers reason about code. A **const reference can bind to a temporary** and extends its lifetime to the reference's scope (`const std::string& s = makeName();` is safe), but this extension does not pass through function returns or member initialisers. Pointer arithmetic is only defined within one array (and one past its end); comparing unrelated pointers with `<` is unspecified, and `std::less<T*>` gives a total order. `nullptr` (C++11) has its own type, `std::nullptr_t`, so it picks the pointer overload where `NULL` (often `0`) would pick `int`. Returning references is fine when the object outlives the call: member accessors (`T& operator[]`), and chaining (`return *this;`). Smart-pointer parameters signal ownership: `std::unique_ptr<T>` by value means \"I take ownership\", `const std::shared_ptr<T>&` usually should just be `T&` or `T*`.",
        example: ['cpp', 'lifetime extension, and where it stops', "std::string make();\nconst std::string& ok = make();      // lifetime extended to ok's scope\nstruct Holder { const std::string& s; };\nHolder h{make()};                    // C++20 aggregate init: extended too, but fragile\nconst std::string& f(const std::string& x) { return x; }\nconst std::string& bad = f(make());  // dangling after this line"],
        tradeoffs: [['Parameter', 'Meaning', 'Cost'], ['T', 'Copy; caller unaffected', 'Copy cost for big types'], ['const T&', 'Read-only, no copy', 'Aliasing; lifetime must outlive the call'], ['T&', 'Must modify caller\'s object', 'Hidden mutation at call sites'], ['T*', 'Optional object', 'Null checks; unclear ownership if misused']],
        failures: [['Crash or garbage after a vector grows', 'Pointer or reference into reallocated storage', 'Store indices or reserve() capacity'], ['Returned string is garbage', 'Returning a reference to a local', 'Return by value (moves or elides)'], ['Null dereference crash', 'Pointer parameter that should never be null', 'Use a reference'], ['Lambda reads freed data later', 'Capturing locals by reference in a callback that outlives them', 'Capture by value']],
      },
      warn: "Never return a reference or pointer to a local variable, and never keep pointers, references, or iterators into a vector across an operation that can reallocate it.",
      production: {
        numbers: "Passing a 1 MB std::vector by value copies 1 MB on every call; by const reference it costs one address (8 bytes on 64-bit).",
        observe: "-Wreturn-stack-address (Clang) and -Wdangling-reference (GCC 14 and later) catch some dangling cases at compile time; AddressSanitizer catches use-after-free and stack-use-after-return at run time.",
        security: "Dangling pointers and use-after-free are among the most exploited memory-safety bugs in C and C++ software; keep raw pointers non-owning and short-lived.",
        checklist: ['Small types by value', 'Big read-only types by const&', 'T& only for out/in-out parameters', 'T* only when null is meaningful', 'No references to locals returned', 'No pointers kept across reallocation', 'ASan in test builds'],
        sources: ['C++ Core Guidelines, F.15–F.17 (parameter passing) and R.3 (raw pointers are non-owning)', 'cppreference.com: Reference declaration; Lifetime of a temporary', 'Stroustrup, "The C++ Programming Language" (4th ed.), chapter 7'],
      },
      tip: "Read a parameter list as a contract: by value means a copy, const& means borrowed for reading, & means it will be changed, * means it may be absent.",
      faq: [['Can a reference be null?', 'Not in a valid program; binding a reference by dereferencing a null pointer is undefined behaviour.'], ['Can a reference be reseated?', 'No. Assignment through a reference assigns to the referred object.'], ['When pass by const reference?', 'For types that are expensive to copy and only read.'], ['Why nullptr instead of NULL?', 'nullptr has its own type and cannot be mistaken for an integer in overload resolution.'], ['What does a raw pointer mean in modern C++?', 'A non-owning observer; ownership belongs to values, containers, or smart pointers.']],
      ex: {
        prompt: 'Write minMax(nums) returning [min, max] of a non-empty array. In C++, implement it with a helper that fills two int& output parameters, then return them.',
        fn: 'minMax', params: 'nums', sig: '(int[] nums) -> int[]',
        cpp: `class Solution {
    static void scan(const vector<int>& v, int& lo, int& hi) {
        lo = hi = v[0];
        for (int x : v) {
            if (x < lo) lo = x;
            if (x > hi) hi = x;
        }
    }
public:
    vector<int> minMax(vector<int>& nums) {
        int lo, hi;
        scan(nums, lo, hi);
        return {lo, hi};
    }
};
`,
        cases: [{ args: [[3, 1, 4, 1, 5]], expect: [1, 5] }, { args: [[7]], expect: [7, 7] }, { args: [[-2, -9, 0]], expect: [-9, 0] }],
        solution: 'function minMax(n){let lo=n[0],hi=n[0];for(const x of n){if(x<lo)lo=x;if(x>hi)hi=x}return[lo,hi]}',
        hint: 'Start both at the first element and update in one pass.',
      },
      quiz: [
        choice('cx-es-2-q1', 'cpp-references-pointers', 'Which can be reseated to refer to a different object?', ['a pointer', 'a reference', 'a const reference', 'neither'], 0, 'References bind once.'),
        choice('cx-es-2-q2', 'cpp-references-pointers', 'Best parameter type for a large std::string the function only reads:', ['const std::string&', 'std::string', 'std::string*', 'std::string&&'], 0, 'No copy, read-only. (std::string_view also works.)'),
        choice('cx-es-2-q3', 'cpp-references-pointers', 'Keeping int* p = &v[0] and then calling v.push_back(x) can...', ['leave p dangling after reallocation', 'update p automatically', 'throw at compile time', 'make p null'], 0, 'Reallocation moves elements.'),
        fill('cx-es-2-q4', 'cpp-references-pointers', 'The C++11 null pointer literal is ___', ['nullptr'], 'Typed null.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'cx-es-3', title: 'auto and type deduction', concept: 'cpp-auto-deduction',
      story: "In C++98, iterating over a `std::map<std::string, std::vector<int>>` meant typing `std::map<std::string, std::vector<int>>::const_iterator` before you could write a loop. C++11 repurposed the old, unused `auto` keyword to mean \"deduce this variable's type from its initialiser\", using the same rules as template argument deduction. C++14 extended it to return types and lambda parameters, and C++17 added structured bindings (`auto [key, value]`). Scott Meyers' advice became the mainstream style: almost always auto, as long as you know what the deduction rules do.",
      analogy: "auto is a tailor taking measurements from the person in front of them: the suit fits the initialiser exactly, except that by default the tailor ignores the jacket's const label and the fact that it was borrowed (a reference).",
      timeline: [['1998', 'C++98', 'Template argument deduction; auto means automatic storage (unused).'], ['2011', 'C++11', 'auto deduces variable types; decltype added.'], ['2014', 'C++14', 'auto return types, generic lambdas, decltype(auto).'], ['2017', 'C++17', 'Structured bindings and class template argument deduction (CTAD).']],
      explain: "`auto x = expr;` deduces the type from `expr` like a template parameter taken by value: **top-level const and references are dropped**, and arrays and functions decay to pointers. So `const int& r = n; auto a = r;` gives `int`, a copy. Write `auto&` or `const auto&` to keep a reference, and `auto&&` (a forwarding reference) to bind to anything. **Literal types**: `42` is `int`, `42u` is `unsigned int`, `42L` is `long`, `42LL` is `long long`, `3.14` is `double`, `2.5f` is `float`, `'x'` is `char`, `\"hi\"` is `const char[3]` which decays to `const char*` under `auto`, and `\"hi\"s` (with `using namespace std::literals`) is `std::string`. Braces are special: `auto x{5};` is `int` since C++17, but `auto x = {5};` is `std::initializer_list<int>`. `decltype(expr)` gives the declared type including references, and `decltype(auto)` deduces with those rules. **Structured bindings** unpack pairs, tuples, arrays, and simple structs: `for (const auto& [name, score] : scores)`.",
      diagram: "const int& r = n;\nauto a = r;          → int          (const and & dropped: a copy)\nconst auto& b = r;   → const int&   (kept)\nauto&& c = r;        → const int&   (forwarding reference)\nauto d = \"hi\";       → const char*  (array decays)\nauto e = {1, 2};     → std::initializer_list<int>\nauto f{1};           → int          (C++17)",
      ex1: ['cpp', 'auto in loops: copy versus reference', "std::map<std::string, std::vector<int>> m;\nfor (auto kv : m) { }              // copies every pair and vector\nfor (const auto& kv : m) { }       // no copies\nfor (const auto& [key, values] : m) {   // C++17 structured bindings\n  std::cout << key << ' ' << values.size() << '\\n';\n}"],
      ex2: ['cpp', 'literal suffixes decide the type', "auto a = 42;     // int\nauto b = 42u;    // unsigned int\nauto c = 42LL;   // long long\nauto d = 3.14;   // double\nauto e = 2.5f;   // float\nauto f = 'x';    // char\nauto g = \"hi\";   // const char*\nusing namespace std::literals;\nauto h = \"hi\"s;  // std::string"],
      deepDive: {
        explain: "Deduction for `auto` follows template deduction with one exception (braced initialisers). For `template<class T> void f(T x)`, passing a `const int&` deduces `T = int`; for `f(T& x)` it deduces `T = const int`; for `f(T&& x)` with an lvalue, **reference collapsing** makes `T = const int&`. That is exactly `auto`, `auto&`, and `auto&&`. Pitfalls: **proxy types** such as `std::vector<bool>::reference` make `auto x = v[0];` a proxy into the vector, not a `bool`, and it dangles if the vector dies; expression-template libraries (Eigen) have the same issue. `auto` hides implicit conversions too: `auto n = v.size();` is `size_t`, so `n - 1` with an empty vector wraps. Return type deduction requires all returns to deduce the same type. Class template argument deduction (C++17) lets you write `std::vector v{1, 2, 3};` and `std::pair p{1, 2.0};`. C++20 adds abbreviated function templates: `void print(const auto& x)` is a template.",
        example: ['cpp', 'decltype(auto) preserves references', "std::vector<int> v{1, 2, 3};\nauto get1(std::vector<int>& v, int i) { return v[i]; }            // returns int (copy)\ndecltype(auto) get2(std::vector<int>& v, int i) { return v[i]; }  // returns int&\nget2(v, 0) = 10;   // modifies v[0]"],
        tradeoffs: [['Style', 'Benefit', 'Risk'], ['auto', 'Short, no mismatched types', 'Silent copies; proxies'], ['const auto&', 'No copies, read-only', 'Dangling if bound to a temporary\'s member'], ['auto&&', 'Binds to anything (generic code)', 'Confusing in non-generic code'], ['Explicit type', 'Documents intent; forces conversion', 'Verbose; can silently narrow or convert']],
        failures: [['Loop is slow over a map of vectors', 'for (auto kv : m) copies each element', 'const auto&'], ['Changes in a loop do not stick', 'auto copy instead of auto&', 'Use auto&'], ['Crash using a vector<bool> element later', 'auto deduced a proxy that outlived the vector', 'Use bool explicitly'], ['initializer_list where an int was expected', 'auto x = {5}', 'auto x{5} or int x = 5']],
      },
      warn: "auto drops const and references. `for (auto x : container)` copies every element; write `const auto&` unless you want copies.",
      production: {
        numbers: "Iterating a map with 100,000 entries whose values are 1 KB vectors by `auto` instead of `const auto&` copies about 100 MB per loop.",
        observe: "clang-tidy checks performance-for-range-copy and modernize-use-auto flag accidental copies and verbose types; -Wrange-loop-construct warns too.",
        security: "Type deduction does not change safety, but unintended unsigned types from auto (size_t) can make subtraction wrap and break bounds checks.",
        checklist: ['const auto& in range-for by default', 'auto& when mutating elements', 'Explicit type where conversion is intended', 'Beware proxies (vector<bool>, expression templates)', 'Structured bindings for pairs and tuples', 'Literal suffixes for intended types', 'clang-tidy performance checks enabled'],
        sources: ['Meyers, "Effective Modern C++" (2014), items 1–6', 'cppreference.com: Placeholder type specifiers (auto); Template argument deduction', 'ISO/IEC 14882:2024 [dcl.spec.auto]', 'Sutter, GotW #94 "AAA Style (Almost Always Auto)"'],
      },
      tip: "When unsure what auto deduced, hover in your IDE or force an error: `decltype(x)::show;` makes the compiler print the type in the message.",
      faq: [['What does auto do with const int&?', 'Drops both, deducing int (a copy).'], ['What type is auto x = {1, 2}?', 'std::initializer_list<int>.'], ['What type is auto s = "hi"?', 'const char*; the array decays.'], ['Difference between auto&& and auto&?', 'auto&& is a forwarding reference that binds to lvalues and rvalues; auto& binds only to lvalues.'], ['What are structured bindings?', 'C++17 syntax to unpack pairs, tuples, arrays, and structs: auto [a, b] = p;']],
      ex: {
        prompt: 'Write deducedType(literal) returning the type that `auto x = literal;` deduces. Inputs: integer literals with optional u and l/ll suffixes (in any case and order), floating literals containing "." or "e" with an optional f or l suffix, a char literal in single quotes, a string literal in double quotes, or true/false. Return one of: "int", "unsigned int", "long", "unsigned long", "long long", "unsigned long long", "double", "float", "long double", "char", "const char*", "bool".',
        fn: 'deducedType', params: 'literal', sig: '(string literal) -> string',
        cpp: `class Solution {
public:
    string deducedType(string s) {
        if (s[0] == '\\'') return "char";
        if (s[0] == '"') return "const char*";
        if (s == "true" || s == "false") return "bool";
        string t = s;
        for (char& c : t) c = (char)tolower((unsigned char)c);
        if (t.find('.') != string::npos || t.find('e') != string::npos) {
            if (t.back() == 'f') return "float";
            if (t.back() == 'l') return "long double";
            return "double";
        }
        int u = 0, l = 0;
        for (int i = (int)t.size() - 1; i >= 0 && (t[i] == 'u' || t[i] == 'l'); i--) {
            if (t[i] == 'u') u++; else l++;
        }
        string base = l == 2 ? "long long" : l == 1 ? "long" : "int";
        return u ? "unsigned " + base : base;
    }
};
`,
        cases: [{ args: ['42'], expect: 'int' }, { args: ['42u'], expect: 'unsigned int' }, { args: ['42LL'], expect: 'long long' }, { args: ['3.14'], expect: 'double' }, { args: ['2.5f'], expect: 'float' }, { args: ["'x'"], expect: 'char' }, { args: ['"hi"'], expect: 'const char*' }, { args: ['true'], expect: 'bool' }, { args: ['7ul'], expect: 'unsigned long' }, { args: ['1e3'], expect: 'double' }],
        solution: "function deducedType(s){if(s[0]===\"'\")return'char';if(s[0]==='\"')return'const char*';if(s==='true'||s==='false')return'bool';const t=s.toLowerCase();if(t.includes('.')||t.includes('e')){if(t.endsWith('f'))return'float';if(t.endsWith('l'))return'long double';return'double'}const m=t.match(/[ul]*$/)[0];const u=m.includes('u'),l=(m.match(/l/g)||[]).length;return (u?'unsigned ':'')+(l===2?'long long':l===1?'long':'int')}",
        hint: 'Handle quotes and booleans first, then floating literals, then count trailing u and l characters.',
      },
      quiz: [
        choice('cx-es-3-q1', 'cpp-auto-deduction', 'Given const int& r = n; what does auto a = r; deduce?', ['int', 'const int', 'const int&', 'int&'], 0, 'auto drops top-level const and references.'),
        choice('cx-es-3-q2', 'cpp-auto-deduction', 'What does for (auto kv : bigMap) do?', ['copies every element', 'binds by reference', 'moves elements out', 'does not compile'], 0, 'Use const auto&.'),
        choice('cx-es-3-q3', 'cpp-auto-deduction', 'auto x = {5}; deduces...', ['std::initializer_list<int>', 'int', 'int[1]', 'an error'], 0, 'Copy-list-initialisation with auto.'),
        fill('cx-es-3-q4', 'cpp-auto-deduction', 'The C++17 syntax auto [key, value] = pair; is called structured ___', ['bindings', 'binding'], 'Unpacking.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'cx-es-4', title: 'const, constexpr, and consteval', concept: 'cpp-const-constexpr',
      story: "Stroustrup introduced `const` in early C++ (it was later adopted by C) as a way to say \"this will not change\" that the compiler could check. For decades compile-time computation in C++ meant macros or the accidental Turing-completeness of templates. C++11 added `constexpr` functions, so ordinary-looking code could run at compile time; C++14 relaxed them to allow loops and local variables; C++20 added `consteval` (must run at compile time) and `constinit`; and C++20 and C++23 allowed more of the standard library, including `std::vector` and `std::string` in limited ways, inside constant evaluation.",
      analogy: "const is a museum glass case: you can look but not touch through that case. constexpr is food prepared before the restaurant opens: the work happens at compile time, so serving it at run time is instant.",
      timeline: [['1980s', 'const', 'Introduced in C++ and later adopted by C89.'], ['2011', 'constexpr', 'Single-return constexpr functions.'], ['2014', 'Relaxed constexpr', 'Loops, branches, and locals allowed.'], ['2020', 'consteval and constinit', 'Immediate functions; constant-initialised statics; constexpr vector and string (transient).']],
      explain: "`const` is a promise not to modify through that name. For pointers, read declarations right to left: `const int* p` (or `int const* p`) is a pointer to const int, so `*p = 1` is an error but `p = &y` is allowed; `int* const p` is a const pointer to int, so `*p = 1` is fine but `p = &y` is an error; `const int* const p` forbids both. **const member functions** (`int size() const;`) promise not to change the object's observable state and are the only ones callable on const objects; `mutable` members (caches, mutexes) are the exception. **const correctness** spreads: once a function takes `const T&`, everything it calls on that object must be const. **`constexpr` variables** must be initialised by a constant expression and are usable as array sizes and template arguments. **`constexpr` functions** *may* run at compile time when given constant arguments and are ordinary functions otherwise. **`consteval`** functions *must* run at compile time. **`constinit`** guarantees a static is initialised at compile time, avoiding the static initialisation order problem, without making it const.",
      diagram: "int* p               → change *p: yes · reseat p: yes\nconst int* p         → change *p: no  · reseat p: yes   (pointer to const)\nint* const p         → change *p: yes · reseat p: no    (const pointer)\nconst int* const p   → change *p: no  · reseat p: no\nconstexpr  : may run at compile time  · consteval : must  · constinit : static initialised at compile time",
      ex1: ['cpp', 'const member functions and mutable caches', "class Shape {\n  double w_, h_;\n  mutable std::optional<double> area_;   // cache may change in const methods\npublic:\n  Shape(double w, double h) : w_(w), h_(h) {}\n  double area() const {\n    if (!area_) area_ = w_ * h_;\n    return *area_;\n  }\n};"],
      ex2: ['cpp', 'compile-time computation', "constexpr int factorial(int n) { return n <= 1 ? 1 : n * factorial(n - 1); }\nstatic_assert(factorial(5) == 120);       // checked by the compiler\nconstexpr int table_size = factorial(4);   // 24, usable as an array bound\nint arr[table_size];\nconsteval int square(int x) { return x * x; }\n// square(runtimeValue);                   // error: must be constant"],
      deepDive: {
        explain: "`const` on a variable with a constant initialiser at namespace scope also gives internal linkage; C++17 `inline constexpr` variables avoid one-definition-rule trouble in headers. `const` is shallow: a `const std::vector<int*>` stops you changing the pointers, not the ints they point at. Casting away const with `const_cast` and then writing is undefined behaviour if the object was originally defined const. Constant evaluation is checked: UB inside a constant expression (overflow, out-of-bounds access) is a compile error, which makes `constexpr` tests a cheap way to catch UB. `if constexpr` (C++17) discards the untaken branch at compile time in templates, and `std::is_constant_evaluated()` (C++20) or `if consteval` (C++23) lets a function choose a compile-time or run-time implementation. Not everything can be constexpr: I/O, `reinterpret_cast`, and (before C++26) most uses of `new` that survive to run time.",
        example: ['cpp', 'constexpr catches undefined behaviour', "constexpr int addOne(int x) { return x + 1; }\nconstexpr int ok = addOne(41);           // 42\n// constexpr int boom = addOne(INT_MAX); // error: overflow is not a constant expression\nconstexpr std::array<int, 3> a{1, 2, 3};\nstatic_assert(a[2] == 3);"],
        tradeoffs: [['Keyword', 'Guarantees', 'Use for'], ['const', 'No modification through this name', 'Parameters, members, locals'], ['constexpr', 'Usable in constant expressions', 'Tables, sizes, pure helpers'], ['consteval', 'Always evaluated at compile time', 'Compile-time validation (format strings)'], ['constinit', 'Static initialised at compile time', 'Globals that must avoid init-order bugs']],
        failures: [['Cannot call a method on a const object', 'Method not marked const', 'Add const to non-mutating methods'], ['Static init order fiasco crash at startup', 'Global depends on another translation unit\'s global', 'constinit or function-local statics'], ['Undefined behaviour after const_cast write', 'Object was originally const', 'Never write through cast-away const'], ['Header constant duplicated or ODR errors', 'Non-inline constexpr variables with external linkage', 'inline constexpr in headers']],
      },
      warn: "Never modify an object through const_cast unless you know it was not originally declared const; writing to a truly const object is undefined behaviour.",
      production: {
        numbers: "A lookup table computed with constexpr (for example 256 CRC entries) costs zero start-up time and lives in read-only data; the same table built at run time runs on every process start.",
        observe: "clang-tidy misc-const-correctness and readability-make-member-function-const suggest missing const; static_assert tests on constexpr functions run with every build.",
        security: "Read-only data (const and constexpr globals) is placed in non-writable memory pages, which removes some targets for memory-corruption exploits.",
        checklist: ['Non-mutating member functions marked const', 'Read-only parameters as const& or by value', 'constexpr for compile-time tables and limits', 'static_assert tests for constexpr helpers', 'inline constexpr for header constants', 'constinit for globals with static storage', 'No const_cast writes'],
        sources: ['cppreference.com: cv type qualifiers; constexpr specifier; consteval specifier; constinit specifier', 'C++ Core Guidelines, Con.1–Con.5', 'ISO/IEC 14882:2024 [dcl.constexpr]', 'Turner, "C++ Best Practices" (2020), constexpr chapters'],
      },
      tip: "Read pointer declarations right to left: `int* const p` is \"p is a const pointer to int\"; `const int* p` is \"p is a pointer to an int that is const\".",
      faq: [['Difference between const int* and int* const?', 'The first points to a const int (cannot change *p); the second is a const pointer (cannot reseat p).'], ['Does constexpr force compile-time evaluation?', 'Only in contexts that need a constant; consteval forces it always.'], ['What does a const member function promise?', 'It does not change the object\'s observable state, so it can be called on const objects.'], ['What is mutable for?', 'Members such as caches or mutexes that may change inside const methods.'], ['What problem does constinit solve?', 'The static initialisation order fiasco, by requiring compile-time initialisation.']],
      ex: {
        prompt: 'Write canModify(decl, target) for pointer declarations such as "int* p", "const int* p", "int const* p", "int* const p", and "const int* const p". target is "pointee" (can you assign *p = ...?) or "pointer" (can you assign p = ...?). A const before the * protects the pointee; a const after the * protects the pointer.',
        fn: 'canModify', params: 'decl, target', sig: '(string decl, string target) -> bool',
        cpp: `class Solution {
public:
    bool canModify(string decl, string target) {
        size_t star = decl.find('*');
        string before = decl.substr(0, star), after = decl.substr(star + 1);
        const string& side = target == "pointee" ? before : after;
        return side.find("const") == string::npos;
    }
};
`,
        cases: [{ args: ['int* p', 'pointee'], expect: true }, { args: ['const int* p', 'pointee'], expect: false }, { args: ['int const* p', 'pointee'], expect: false }, { args: ['int* const p', 'pointer'], expect: false }, { args: ['int* const p', 'pointee'], expect: true }, { args: ['const int* const p', 'pointer'], expect: false }, { args: ['const int* p', 'pointer'], expect: true }],
        solution: "function canModify(decl,target){const i=decl.indexOf('*');const side=target==='pointee'?decl.slice(0,i):decl.slice(i+1);return !side.includes('const')}",
        hint: 'Split the declaration at the * and look for const on the relevant side.',
      },
      quiz: [
        choice('cx-es-4-q1', 'cpp-const-constexpr', 'With int* const p = &x; which is allowed?', ['*p = 5', 'p = &y', 'both', 'neither'], 0, 'Const pointer, mutable pointee.'),
        choice('cx-es-4-q2', 'cpp-const-constexpr', 'Which keyword forces a function to run at compile time?', ['consteval', 'constexpr', 'const', 'constinit'], 0, 'Immediate functions.'),
        choice('cx-es-4-q3', 'cpp-const-constexpr', 'Which member can change inside a const method?', ['a mutable member', 'a static_assert', 'any member', 'none'], 0, 'mutable.'),
        fill('cx-es-4-q4', 'cpp-const-constexpr', 'The compile-time check ___(factorial(5) == 120); fails the build if the condition is false.', ['static_assert'], 'Checked by the compiler.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'cx-es-5', title: 'Initialisation and narrowing', concept: 'cpp-initialisation',
      story: "C++ inherited C's `int x = 5;`, added constructor syntax `Widget w(5);`, and accumulated so many forms that Scott Meyers called initialisation \"a bizarre mess\". C++11 introduced **uniform (brace) initialisation**, `int x{5}; Widget w{5}; std::vector<int> v{1, 2, 3};`, which works almost everywhere and refuses **narrowing conversions**. It also introduced new surprises, notably that `std::vector<int>(3, 0)` and `std::vector<int>{3, 0}` mean different things. C++20 added designated initialisers for aggregates.",
      analogy: "Brace initialisation is a strict customs officer: anything that would lose information on the way in (a double squeezed into an int, 300 into a char) is stopped at the border instead of quietly trimmed.",
      timeline: [['1998', 'C++98', 'Copy (=), direct (()), and aggregate ({}) initialisation.'], ['2011', 'C++11', 'Brace initialisation everywhere; narrowing banned in braces; std::initializer_list.'], ['2017', 'C++17', 'Guaranteed copy elision; auto x{5} deduces int.'], ['2020', 'C++20', 'Designated initialisers: Point p{.x = 1, .y = 2};']],
      explain: "Forms: **default** (`int x;` leaves a local uninitialised: reading it is undefined behaviour), **value** (`int x{};` gives 0), **copy** (`int x = 5;`), **direct** (`Widget w(5);`), and **list** (`Widget w{5};`). Brace initialisation **rejects narrowing**: `int x{3.0};` is an error even though 3.0 is whole, `char c{300};` is an error because 300 does not fit, and `unsigned u{-1};` is an error. A **constant** integer that fits is allowed (`char c{100};` compiles), and integer constants convert to floating types when the value is exactly representable. Brace initialisation also prefers **`std::initializer_list` constructors**: `std::vector<int> v{3, 0}` is the two elements `[3, 0]`, while `std::vector<int> v(3, 0)` is three zeros. It avoids the **most vexing parse**: `Widget w();` declares a function, but `Widget w{};` makes an object. **Aggregates** (structs with public members and no user constructors) take `{}` in member order, and C++20 **designated initialisers** name them: `Config c{.port = 8080, .verbose = true};` (in declaration order). Default member initialisers (`int retries = 3;`) keep every constructor consistent.",
      diagram: "int a;          → uninitialised (reading = UB)\nint b{};        → 0\nint c{3.0};     → error: narrowing double → int\nchar d{100};    → ok: constant fits\nchar e{300};    → error: does not fit\nvector<int>(3, 0) → [0, 0, 0]       vector<int>{3, 0} → [3, 0]\nWidget w();     → function declaration!   Widget w{}; → object",
      ex1: ['cpp', 'narrowing caught by braces', "double d = 3.7;\nint a = d;        // compiles: silently 3\n// int b{d};      // error: narrowing conversion\nint c{static_cast<int>(d)};   // explicit and visible\nconstexpr int k = 100;\nchar ch{k};       // ok: constant expression that fits"],
      ex2: ['cpp', 'aggregates and designated initialisers (C++20)', "struct Config {\n  int port = 80;\n  bool verbose = false;\n  int retries = 3;\n};\nConfig a{};                              // 80, false, 3\nConfig b{.port = 8080, .verbose = true}; // retries stays 3\n// Config c{.verbose = true, .port = 1}; // error: must follow declaration order"],
      deepDive: {
        explain: "Narrowing, as the standard defines it, covers floating to integer, wider floating to narrower floating (unless the value is a constant that fits exactly), integer to floating (unless a constant that fits exactly), and integer to a narrower integer or signed to unsigned (unless a constant whose value fits). Since C++17 a prvalue initialiser is **guaranteed to elide copies**: `Widget w = makeWidget();` constructs directly into `w`, even for types that cannot be copied or moved. Member initialisation order follows **declaration order**, not the order in the constructor's initialiser list, which is why `-Wreorder` exists. Static variables at namespace scope are zero-initialised, then constant- or dynamically initialised; locals are not zero-initialised unless you ask. Compilers can now help: Clang and GCC offer `-ftrivial-auto-var-init=zero` to zero locals as a hardening measure, and C++26 defines reading an uninitialised local as \"erroneous behaviour\" with a defined value rather than full undefined behaviour.",
        example: ['cpp', 'member initialisation follows declaration order', "struct Buffer {\n  size_t size_;\n  std::vector<char> data_;\n  Buffer(size_t n) : data_(n), size_(data_.size()) {}  // looks fine, is not\n};\n// size_ is declared first, so it is initialised first, from data_.size() of an\n// unconstructed vector: undefined behaviour. -Wreorder warns about the order."],
        tradeoffs: [['Form', 'Strength', 'Pitfall'], ['T x = v;', 'Familiar', 'Allows narrowing; explicit constructors excluded'], ['T x(v);', 'Calls exactly the constructor', 'Most vexing parse with empty parentheses'], ['T x{v};', 'No narrowing; works everywhere', 'Prefers initializer_list constructors'], ['T x{.a = 1};', 'Self-documenting aggregates', 'C++20; must follow declaration order']],
        failures: [['Random values in production only', 'Uninitialised local read (UB)', 'Initialise every variable; T x{}'], ['vector has 2 elements instead of 3', 'Braces chose initializer_list constructor', 'Use parentheses for count-value constructors'], ['Function declared instead of object', 'Most vexing parse: T x();', 'T x{};'], ['Member read before construction', 'Initialiser list order differs from declaration order', 'Declare in dependency order; -Wreorder']],
      },
      warn: "Reading an uninitialised local variable is undefined behaviour. Initialise every variable at its declaration; `T x{};` value-initialises to zero for built-in types.",
      production: {
        numbers: "Microsoft and Chromium security teams have both reported that around 70% of their serious security bugs are memory-safety issues; uninitialised memory is one recurring class, which is why automatic zero-initialisation flags exist.",
        observe: "-Wuninitialized, -Wmaybe-uninitialized, -Wreorder, and -Wnarrowing; MemorySanitizer (Clang) finds reads of uninitialised memory at run time.",
        security: "Uninitialised stack memory can leak secrets (keys, pointers that defeat ASLR) to attackers. Consider -ftrivial-auto-var-init=zero in hardened builds.",
        checklist: ['Every variable initialised at declaration', 'Braces by default; parentheses for count/value constructors', 'Default member initialisers', 'Members declared in dependency order', 'Designated initialisers for config structs', '-Wall -Wextra -Wreorder enabled', 'MSan or zero-init in hardened builds'],
        sources: ['cppreference.com: Initialization; List-initialization (narrowing conversions)', 'Meyers, "Effective Modern C++", item 7', 'ISO/IEC 14882:2024 [dcl.init.list]', 'P2795, "Erroneous behaviour for uninitialized reads" (adopted for C++26)'],
      },
      tip: "Default to braces, switch to parentheses only for constructors like vector(count, value), and let the compiler reject narrowing for you.",
      faq: [['Is int x{3.0}; valid?', 'No, double to int is narrowing in braces even for whole values.'], ['Is char c{100}; valid?', 'Yes, a constant that fits is not narrowing.'], ['What is vector<int>{3, 0}?', 'Two elements, 3 and 0, via the initializer_list constructor.'], ['What is the most vexing parse?', 'T x(); declares a function rather than defining an object.'], ['In what order are members initialised?', 'In declaration order, regardless of the initialiser list order.']],
      ex: {
        prompt: 'Write bracedOk(target, value) returning true if `target x{value};` compiles when value is a constant literal. target is "char" (signed 8-bit), "short", "int" (32-bit), "unsigned" (32-bit), or "double". value is an integer literal like "-1" or a floating literal containing "." like "3.0". Rules: any value into double is allowed; a floating literal into an integer type is narrowing; an integer constant is allowed only if it fits the target range.',
        fn: 'bracedOk', params: 'target, value', sig: '(string target, string value) -> bool',
        cpp: `class Solution {
public:
    bool bracedOk(string target, string value) {
        if (target == "double") return true;
        if (value.find('.') != string::npos) return false;
        long long v = stoll(value);
        long long lo, hi;
        if (target == "char") { lo = -128; hi = 127; }
        else if (target == "short") { lo = -32768; hi = 32767; }
        else if (target == "int") { lo = INT_MIN; hi = INT_MAX; }
        else { lo = 0; hi = 4294967295LL; }
        return v >= lo && v <= hi;
    }
};
`,
        cases: [{ args: ['char', '100'], expect: true }, { args: ['char', '300'], expect: false }, { args: ['unsigned', '-1'], expect: false }, { args: ['int', '3.0'], expect: false }, { args: ['double', '3'], expect: true }, { args: ['short', '-32768'], expect: true }, { args: ['unsigned', '4294967295'], expect: true }],
        solution: "function bracedOk(target,value){if(target==='double')return true;if(value.includes('.'))return false;const v=Number(value);const r={char:[-128,127],short:[-32768,32767],int:[-2147483648,2147483647],unsigned:[0,4294967295]}[target];return v>=r[0]&&v<=r[1]}",
        hint: 'Floating into integers is always narrowing; integer constants only need to fit the range.',
      },
      quiz: [
        choice('cx-es-5-q1', 'cpp-initialisation', 'What does std::vector<int> v{3, 0}; contain?', ['3 and 0', 'three zeros', 'nothing', 'it does not compile'], 0, 'initializer_list wins.'),
        choice('cx-es-5-q2', 'cpp-initialisation', 'Which is a compile error?', ['int x{2.0};', 'int x = 2.0;', 'char c{65};', 'double d{2};'], 0, 'Narrowing in braces.'),
        choice('cx-es-5-q3', 'cpp-initialisation', 'Widget w(); declares...', ['a function returning Widget', 'a default-constructed Widget', 'a null Widget', 'a Widget pointer'], 0, 'Most vexing parse.'),
        fill('cx-es-5-q4', 'cpp-initialisation', 'Class members are initialised in ___ order, not initialiser-list order.', ['declaration'], '-Wreorder.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'cx-es-6', title: 'std::string, std::string_view, and lifetimes', concept: 'cpp-strings-views',
      story: "C strings are `char` arrays ending in a zero byte, and decades of buffer overflows followed from `strcpy` and `sprintf`. C++98 gave us `std::string`, which owns and manages its buffer. That fixed safety but cost copies: every function taking `const std::string&` forced callers with a literal or a substring to allocate a temporary string. Google's `StringPiece` and LLVM's `StringRef` solved it inside those code bases, and C++17 standardised the idea as **`std::string_view`**: a cheap, non-owning (pointer, length) view of characters owned by someone else.",
      analogy: "A std::string is a book you own. A string_view is a bookmark with a page range: cheap to pass around, but useless and dangerous once the book has gone back to the library.",
      timeline: [['1972', 'C strings', 'Null-terminated char arrays; strcpy and friends.'], ['1998', 'std::string', 'Owning, growable string in the standard library.'], ['2011', 'C++11', 'std::string must be contiguous; copy-on-write implementations ruled out; small string optimisation common.'], ['2017', 'std::string_view', 'Non-owning view; C++20 adds starts_with/ends_with, C++23 contains.']],
      explain: "**`std::string`** owns a contiguous, null-terminated buffer and manages growth. Major implementations use the **small string optimisation (SSO)**: short strings (up to 15 characters in libstdc++ and MSVC, 22 in libc++) live inside the object with no heap allocation. **`std::string_view`** is a pointer plus a length; copying it is cheap (16 bytes on 64-bit), `substr` on a view creates another view with no allocation, and it accepts literals, `std::string`, and character buffers alike. Use `string_view` for **read-only parameters**; use `std::string` when you need ownership, storage, or a null-terminated string for a C API (`view.data()` is not guaranteed to be null-terminated). The big risk is **lifetime**: a view does not keep its characters alive. `std::string_view v = std::string(\"temp\");` dangles immediately, and returning a view into a local string, or storing views to strings that later change or reallocate, is undefined behaviour. Splitting with views is a classic win: parse a whole line into fields with zero allocations, then copy only the fields you keep.",
      diagram: "std::string s = \"hello world\";   [ptr|size|cap] ──► heap \"hello world\\0\" (or inline if short: SSO)\nstd::string_view v = s;           [ptr|len=11] ──► same characters (no copy)\nv.substr(6)                       [ptr+6|len=5] ──► \"world\"   (no allocation)\nstring_view x = std::string(\"t\"); ──► temporary destroyed ──► dangling",
      ex1: ['cpp', 'a read-only parameter that accepts everything', "bool hasPrefix(std::string_view s, std::string_view p) {\n  return s.substr(0, p.size()) == p;   // C++20: s.starts_with(p)\n}\nstd::string name = \"nalanda\";\nhasPrefix(name, \"nal\");        // no temporary strings created\nhasPrefix(\"literal\", \"lit\");"],
      ex2: ['cpp', 'splitting without allocating', "std::vector<std::string_view> split(std::string_view s, char d) {\n  std::vector<std::string_view> out;\n  size_t start = 0;\n  for (size_t i = 0; i <= s.size(); ++i)\n    if (i == s.size() || s[i] == d) { out.push_back(s.substr(start, i - start)); start = i + 1; }\n  return out;   // views into s: valid only while s's characters live\n}"],
      deepDive: {
        explain: "`std::string` guarantees contiguous storage and a terminating null at `s[s.size()]` (C++11), and `operator+` in a loop can be quadratic; `reserve` or `std::string::append` avoids repeated reallocation. Since C++11, implementations cannot use copy-on-write (the rules for iterator invalidation and `data()` forbid it), which is why GCC changed its ABI in 5.1. `string_view` is a **borrowed type**: tools and guidelines treat it like a reference, so do not store it in long-lived members unless the owner clearly outlives the object. Compilers increasingly warn: Clang's `-Wdangling-gsl` and lifetime annotations catch `string_view` bound to temporaries. C++20 added `starts_with` and `ends_with`, C++23 added `contains`. For formatted output, C++20 `std::format` and C++23 `std::print` replace `sprintf` and streams with type-safe, fast formatting. For text encoding, `std::string` holds bytes; treat its contents as UTF-8 by convention and use a library (ICU) for case mapping and normalisation, because `std::toupper` works on single bytes only.",
        example: ['cpp', 'C++20 and C++23 conveniences', "#include <format>\nstd::string_view path = \"/api/users/42\";\nif (path.starts_with(\"/api/\")) { }          // C++20\nstd::string msg = std::format(\"user {} has {} items\", 42, 7);   // C++20\n// std::print(\"{}\\n\", msg);                  // C++23 <print>"],
        tradeoffs: [['Type', 'Owns data', 'Best for'], ['std::string', 'Yes', 'Storing, building, passing to C APIs (c_str)'], ['std::string_view', 'No', 'Read-only parameters, parsing, slicing'], ['const char*', 'No, null-terminated', 'C interop only'], ['const std::string&', 'No (borrows a string)', 'Legacy APIs; forces callers to have a std::string']],
        failures: [['Garbage characters printed', 'string_view bound to a temporary string', 'Keep the owning string alive or store std::string'], ['C API reads past the end', 'Passing view.data() where a null-terminated string is required', 'Construct std::string(view).c_str()'], ['Slow string building in a loop', 'Repeated + creating temporaries', 'reserve and append, or std::format'], ['Wrong case conversion for non-ASCII', 'Byte-wise toupper on UTF-8', 'Use a Unicode library']],
      },
      warn: "A string_view does not own its characters. Never return a view into a local string, and never bind one to a temporary std::string.",
      production: {
        numbers: "Short strings up to 15 characters (libstdc++, MSVC) or 22 characters (libc++) avoid heap allocation thanks to SSO; a string_view is 16 bytes on 64-bit platforms.",
        observe: "Heap profilers (heaptrack, perf with allocation probes) reveal allocation-heavy string handling; ASan reports stack-use-after-return and heap-use-after-free for dangling views.",
        security: "Avoid strcpy, strcat, and sprintf; use std::string, std::format, or snprintf with checked sizes. Remember that std::string may contain embedded zero bytes that C APIs will truncate at.",
        checklist: ['string_view for read-only parameters', 'std::string for owned and stored text', 'No views to temporaries or locals returned', 'c_str() for C APIs, never view.data()', 'reserve before building large strings', 'std::format instead of sprintf', 'UTF-8 by convention; Unicode library for text rules'],
        sources: ['cppreference.com: std::basic_string; std::basic_string_view', 'C++ Core Guidelines, SL.str.1–SL.str.12', 'ISO/IEC 14882:2024 [string.view]', 'Abseil Tip of the Week #1: string_view'],
      },
      tip: "Take string_view parameters, return std::string values, and store std::string members: borrow in, own out.",
      faq: [['Does string_view own its data?', 'No. It is a pointer and length into characters owned elsewhere.'], ['Is view.data() null-terminated?', 'Not necessarily; use std::string(view).c_str() for C APIs.'], ['What is SSO?', 'Small string optimisation: short strings stored inside the string object with no heap allocation.'], ['Why prefer string_view parameters over const std::string&?', 'They accept literals and substrings without allocating a temporary std::string.'], ['When should you not use string_view?', 'For stored members or return values whose source may not outlive them.']],
      ex: {
        prompt: 'Write splitView(s, delim) splitting s on a one-character delimiter and returning every piece, including empty ones (an empty input gives one empty piece). In C++, scan with std::string_view slices and convert to std::string only for the result.',
        fn: 'splitView', params: 's, delim', sig: '(string s, string delim) -> string[]',
        cpp: `class Solution {
public:
    vector<string> splitView(string s, string delim) {
        string_view v(s);
        char d = delim[0];
        vector<string> out;
        size_t start = 0;
        for (size_t i = 0; i <= v.size(); ++i) {
            if (i == v.size() || v[i] == d) {
                out.emplace_back(v.substr(start, i - start));
                start = i + 1;
            }
        }
        return out;
    }
};
`,
        cases: [{ args: ['a,b,,c', ','], expect: ['a', 'b', '', 'c'] }, { args: ['', ','], expect: [''] }, { args: ['x', ','], expect: ['x'] }, { args: ['k=v=w', '='], expect: ['k', 'v', 'w'] }],
        solution: 'function splitView(s,d){return s.split(d)}',
        hint: 'Walk the string once; at each delimiter (and at the end) emit the slice since the last start.',
      },
      quiz: [
        choice('cx-es-6-q1', 'cpp-strings-views', 'std::string_view v = std::string("temp"); is...', ['dangling immediately', 'safe', 'a compile error', 'a copy'], 0, 'The temporary dies at the end of the statement.'),
        choice('cx-es-6-q2', 'cpp-strings-views', 'Best parameter type for a read-only text argument in C++17 and later:', ['std::string_view', 'std::string', 'char*', 'std::string&'], 0, 'Accepts everything without copies.'),
        choice('cx-es-6-q3', 'cpp-strings-views', 'What does substr on a string_view allocate?', ['nothing', 'a new std::string', 'a heap buffer', 'a null terminator'], 0, 'A new view.'),
        fill('cx-es-6-q4', 'cpp-strings-views', 'Storing short strings inside the object without heap allocation is the small string ___', ['optimisation', 'optimization'], 'SSO.'),
      ],
    }),
  ],
  exam: [
    choice('cx-es-e1', 'cpp-fundamental-types', 'Signed integer overflow in C++ is...', ['undefined behaviour', 'wrap-around by definition', 'a thrown exception', 'saturation'], 0, 'UB.'),
    choice('cx-es-e2', 'cpp-fundamental-types', 'Which type has the same 64-bit width on Linux and Windows?', ['long long', 'long', 'int', 'short'], 0, 'long differs (LP64 vs LLP64).'),
    choice('cx-es-e3', 'cpp-references-pointers', 'Which statement about references is true?', ['they must be initialised and cannot be reseated', 'they can be null', 'they support arithmetic', 'they own the object'], 0, 'Alias.'),
    choice('cx-es-e4', 'cpp-references-pointers', 'A raw T* in modern C++ conventionally means...', ['a non-owning observer', 'unique ownership', 'shared ownership', 'an array that must be deleted'], 0, 'Core Guidelines R.3.'),
    choice('cx-es-e5', 'cpp-auto-deduction', 'for (auto x : v) over a vector of big objects...', ['copies each element', 'moves each element', 'binds by reference', 'is a compile error'], 0, 'Use const auto&.'),
    choice('cx-es-e6', 'cpp-auto-deduction', 'auto s = "hi"; deduces...', ['const char*', 'std::string', 'char[3]', 'std::string_view'], 0, 'Array decays.'),
    choice('cx-es-e7', 'cpp-const-constexpr', 'const int* p means...', ['the int cannot be changed through p', 'p cannot be reseated', 'both', 'neither'], 0, 'Pointer to const.'),
    choice('cx-es-e8', 'cpp-const-constexpr', 'A constexpr function called with run-time arguments...', ['runs at run time like a normal function', 'fails to compile', 'throws', 'is skipped'], 0, 'consteval would fail.'),
    choice('cx-es-e9', 'cpp-initialisation', 'std::vector<int>(3, 0) contains...', ['three zeros', '3 and 0', 'nothing', 'one element'], 0, 'Count and value.'),
    choice('cx-es-e10', 'cpp-strings-views', 'Why must you not pass view.data() to a C function expecting a C string?', ['it may not be null-terminated', 'it is always null', 'it is a copy', 'it throws'], 0, 'Use std::string(view).c_str().'),
    order('cx-es-e11', 'cpp-initialisation', 'Order these from least to most protected against mistakes.', ['int x; (uninitialised)', 'int x = 3.7; (silent narrowing)', 'int x{3}; (narrowing rejected)'], 'Braces catch narrowing; uninitialised reads are UB.'),
    fill('cx-es-e12', 'cpp-strings-views', 'The C++17 non-owning view of characters is std::___', ['string_view'], 'Pointer plus length.'),
  ],
};
