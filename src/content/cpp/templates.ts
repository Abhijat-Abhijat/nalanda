import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const cxTemplates: Chapter = {
  id: 'cx-templates',
  title: 'Templates and generic programming',
  summary: 'Writing code once for many types: function and class templates and how instantiation works, specialisation and overloading, variadic templates and fold expressions, type traits and SFINAE, C++20 concepts, and constexpr compile-time programming. Language rules checked against the C++23 standard and cppreference as of October 2026, with notes on C++26 static reflection, which WG21 adopted in 2025.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'cx-tp-1', title: 'Function and class templates', concept: 'cpp-templates-basics',
      story: "Stroustrup added templates to C++ in 1988–1990 to write type-safe containers without macros or `void*`. The design deliberately made templates a compile-time mechanism: the compiler stamps out a separate copy of the code for each set of template arguments, so `std::vector<int>` and `std::vector<double>` are as fast as hand-written versions. Erwin Unruh's 1994 program that printed prime numbers in compiler error messages showed that templates were accidentally Turing-complete, which launched template metaprogramming and decades of both powerful libraries and famously long error messages.",
      analogy: "A template is a cookie cutter: one shape, stamped out separately for each kind of dough. Each stamped cookie (instantiation) is a real, independent cookie; the cutter itself is not something you can eat.",
      timeline: [['1990', 'Templates', 'Described in "The Annotated C++ Reference Manual".'], ['1994', 'Unruh\'s primes', 'Template metaprogramming discovered.'], ['2011', 'C++11', 'Variadic templates, alias templates, extern templates.'], ['2017–2020', 'C++17/20', 'CTAD, if constexpr, concepts, abbreviated templates.']],
      explain: "A **function template** `template <class T> T max(T a, T b)` is a pattern; calling `max(3, 7)` makes the compiler **deduce** `T = int` and **instantiate** `max<int>`. Deduction requires every use of `T` to agree: `max(3, 7.5)` fails because `T` would be both `int` and `double`; fix it with an explicit argument `max<double>(3, 7.5)` or two parameters. **Class templates** (`template <class T> class Stack`) are instantiated per argument list; each `Stack<int>` and `Stack<std::string>` is a distinct type, and member functions are instantiated only if used. C++17 **class template argument deduction** (CTAD) lets you write `std::pair p{1, 2.5};`. Templates can take **non-type parameters** (`template <size_t N>`, as in `std::array<int, N>`) and **template template parameters**. Because the compiler needs the full definition to instantiate, template code normally lives **in headers**. Each instantiation is separate machine code, which can increase binary size (**code bloat**); `extern template` declarations and keeping type-independent code out of templates help.",
      diagram: "template <class T> T max(T a, T b);\nmax(3, 7)        → deduce T = int     → instantiate max<int>\nmax(2.5, 1.0)    → deduce T = double  → instantiate max<double>\nmax(3, 7)        → reuse max<int>\nmax(3, 7.5)      → T = int vs double  → deduction error\nmax<double>(3, 7.5) → explicit T = double → OK",
      ex1: ['cpp', 'a function template and a class template', "template <class T>\nT clampTo(T v, T lo, T hi) { return v < lo ? lo : hi < v ? hi : v; }\n\ntemplate <class T, size_t N>\nclass Ring {\n  std::array<T, N> data_{};\n  size_t head_ = 0;\npublic:\n  void push(const T& x) { data_[head_++ % N] = x; }\n};\nRing<int, 8> r;          // distinct type from Ring<int, 16>\nclampTo(15, 0, 10);      // 10, T = int"],
      ex2: ['cpp', 'CTAD and explicit arguments', "std::pair p{1, 2.5};            // std::pair<int, double> (C++17 CTAD)\nstd::vector v{1, 2, 3};          // std::vector<int>\nauto m = std::max<double>(3, 7.5);   // explicit T avoids the deduction conflict"],
      deepDive: {
        explain: "Template code is checked in **two phases**: when the template is defined, non-dependent names and syntax are checked; when it is instantiated, everything that depends on `T` is checked. That is why dependent names sometimes need `typename` (`typename T::value_type x;`) and `template` disambiguators (`t.template get<0>()`). Instantiations in different translation units are merged by the linker (they are implicitly inline), but the compiler still does the work in every file, which is a major contributor to C++ build times; `extern template class std::vector<MyType>;` in headers plus one explicit instantiation in a .cpp file avoids repeated work. C++20 modules reduce header parsing costs further. Templates are resolved at compile time (**static polymorphism**), so calls can be inlined and there is no virtual dispatch, in contrast to inheritance-based **dynamic polymorphism**. Error messages improve greatly with concepts (lesson 5).",
        example: ['cpp', 'dependent names need typename', "template <class Container>\nvoid printFirst(const Container& c) {\n  typename Container::const_iterator it = c.begin();   // typename required\n  // C++11 shortcut: auto it = c.begin();\n  if (it != c.end()) std::cout << *it;\n}"],
        tradeoffs: [['Technique', 'Benefit', 'Cost'], ['Templates (static polymorphism)', 'Inlining; no virtual calls; type-safe', 'Compile time; code size; header-only'], ['Virtual functions (dynamic)', 'One compiled copy; runtime extensibility', 'Indirect calls; heap objects often'], ['void* and casts (C style)', 'One copy', 'No type safety'], ['Macros', 'None worth having', 'No scoping, no type checks']],
        failures: [['Deduction error on max(3, 7.5)', 'Conflicting deduced types', 'Explicit template argument or two parameters'], ['Undefined reference at link time', 'Template defined in a .cpp file but used elsewhere', 'Define in the header or instantiate explicitly'], ['Binary size balloons', 'Many instantiations of heavy templates', 'Hoist type-independent code; extern template'], ['Build times grow quickly', 'Heavy templates in widely included headers', 'extern template, modules, fewer includes']],
      },
      warn: "Template definitions usually belong in headers. Defining a template only in a .cpp file causes \"undefined reference\" link errors when other files use it.",
      production: {
        numbers: "Large C++ code bases often spend a significant share of build time parsing and instantiating templates in headers; Clang's -ftime-trace output typically shows template instantiation among the top costs.",
        observe: "Use -ftime-trace (Clang) or -ftime-report to find expensive instantiations; bloaty or nm --size-sort to find instantiation bloat in binaries.",
        security: "Templates do not add risks by themselves, but generic code that assumes properties of T (for example trivially copyable) must check them, or memcpy-based shortcuts can corrupt non-trivial types.",
        checklist: ['Templates defined in headers', 'Type-independent code hoisted out', 'extern template for common heavy instantiations', 'CTAD used where it reads clearly', 'typename for dependent types', 'Build-time profiling for template-heavy headers', 'Concepts to constrain parameters (C++20)'],
        sources: ['Vandevoorde, Josuttis, Gregor, "C++ Templates: The Complete Guide" (2nd ed., 2017)', 'cppreference.com: Templates; Template argument deduction; CTAD', 'Stroustrup, "The Design and Evolution of C++" (1994), chapter 15', 'Clang documentation: -ftime-trace'],
      },
      tip: "When a template error is long, read the first error and the \"required from here\" line that points at your code; the middle is the compiler's journey through the library.",
      faq: [['What is instantiation?', 'Generating concrete code from a template for specific template arguments.'], ['Why does max(3, 7.5) fail for template <class T> T max(T, T)?', 'T would have to be both int and double.'], ['Why are templates usually in headers?', 'The compiler needs the definition to instantiate it in each translation unit.'], ['What is CTAD?', 'Class template argument deduction (C++17): std::pair p{1, 2.5};'], ['What is a non-type template parameter?', 'A value parameter, such as size_t N in std::array<T, N>.']],
      ex: {
        prompt: 'Simulate instantiating template <class T> T max(T a, T b). Each call is "type1,type2" (the argument types). If the types match, the call instantiates max<type>; otherwise deduction fails. Write instantiate(calls) returning the distinct instantiations as "max<type>" sorted, followed by "error@<index>" for each failing call in order.',
        fn: 'instantiate', params: 'calls', sig: '(string[] calls) -> string[]',
        cpp: `class Solution {
public:
    vector<string> instantiate(vector<string>& calls) {
        set<string> made;
        vector<string> errors;
        for (size_t i = 0; i < calls.size(); i++) {
            size_t c = calls[i].find(',');
            string a = calls[i].substr(0, c), b = calls[i].substr(c + 1);
            if (a != b) errors.push_back("error@" + to_string(i));
            else made.insert("max<" + a + ">");
        }
        vector<string> out(made.begin(), made.end());
        out.insert(out.end(), errors.begin(), errors.end());
        return out;
    }
};
`,
        cases: [{ args: [['int,int', 'double,double', 'int,int']], expect: ['max<double>', 'max<int>'] }, { args: [['int,double', 'long,long']], expect: ['max<long>', 'error@0'] }, { args: [[]], expect: [] }],
        solution: "function instantiate(calls){const s=new Set(),err=[];calls.forEach((c,i)=>{const[a,b]=c.split(',');if(a!==b)err.push('error@'+i);else s.add('max<'+a+'>')});return [...s].sort().concat(err)}",
        hint: 'A set de-duplicates instantiations; collect errors separately and append them.',
      },
      quiz: [
        choice('cx-tp-1-q1', 'cpp-templates-basics', 'How many instantiations do max(1, 2), max(3, 4), and max(1.0, 2.0) produce?', ['2', '3', '1', '0'], 0, 'int and double.'),
        choice('cx-tp-1-q2', 'cpp-templates-basics', 'Are Stack<int> and Stack<long> the same type?', ['no, distinct types', 'yes', 'only on 64-bit', 'only if Stack is final'], 0, 'Per-argument types.'),
        choice('cx-tp-1-q3', 'cpp-templates-basics', 'Template defined only in widget.cpp and used from main.cpp gives...', ['an undefined reference link error', 'a warning only', 'correct code', 'a runtime crash'], 0, 'Needs the definition.'),
        fill('cx-tp-1-q4', 'cpp-templates-basics', 'In template <class T, size_t N>, N is a ___-type template parameter.', ['non'], 'A value.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'cx-tp-2', title: 'Specialisation and overloading', concept: 'cpp-specialisation',
      story: "The standard library itself showed both the power and the risk of template specialisation. `std::vector<bool>` (1998) was specialised to pack bits, saving memory but breaking the promise that `vector<T>` holds real `T` objects. Meanwhile `std::swap` and `std::hash` became the classic customisation points: library authors specialise or overload them so generic code can do the right thing for their types. Knowing how the compiler chooses between overloads and specialisations is what makes those customisations work.",
      analogy: "A generic template is the standard menu. A full specialisation is the chef's special version of one dish for one guest. A non-template overload is a separate dish on the menu that the waiter recommends first whenever it exactly matches the order.",
      timeline: [['1998', 'C++98', 'Full and partial specialisation; vector<bool> specialised.'], ['2003', 'Swap idiom', 'using std::swap; swap(a, b); for argument-dependent lookup.'], ['2011', 'C++11', 'Type traits implemented with partial specialisation.'], ['2020', 'C++20', 'Concepts give overloads by constraint; customisation point objects in ranges.']],
      explain: "**Full (explicit) specialisation** provides a completely separate implementation for specific arguments: `template <> struct Hash<std::string> { ... };`. **Partial specialisation** (class templates only) matches a pattern: `template <class T> struct IsPointer<T*> : std::true_type {};`. **Function templates cannot be partially specialised**; use **overloading** instead. Overload resolution for a call: collect candidates (non-template functions and template specialisations deduced from the arguments), rank by conversion quality, and if two are equally good, **prefer a non-template function** over a template, and among templates prefer the **more specialised** one. Explicit specialisations of function templates do **not participate** in overload resolution; the primary template is chosen first, and only then is its specialisation used. This is why Herb Sutter advises overloading rather than specialising function templates. Customise library behaviour the intended way: specialise `std::hash<T>` for your key type, and provide a free `swap` in your namespace found by argument-dependent lookup.",
      diagram: "template <class T> void show(T);        // primary template\ntemplate <> void show<int>(int);        // full specialisation of the template\nvoid show(int);                         // non-template overload\nshow(5)   → candidates: show(int) [non-template], show<int> [template]\n          → tie on conversions → non-template wins\nshow(2.5) → only the template matches → show<double>",
      ex1: ['cpp', 'partial specialisation for pointers', "template <class T> struct Describe        { static const char* name() { return \"value\"; } };\ntemplate <class T> struct Describe<T*>    { static const char* name() { return \"pointer\"; } };\ntemplate <>        struct Describe<bool>  { static const char* name() { return \"flag\"; } };\nDescribe<int>::name();    // value\nDescribe<int*>::name();   // pointer\nDescribe<bool>::name();   // flag"],
      ex2: ['cpp', 'customising swap through ADL', "namespace geo {\n  struct Mesh { std::vector<float> v; };\n  void swap(Mesh& a, Mesh& b) noexcept { a.v.swap(b.v); }   // found by ADL\n}\ntemplate <class T> void reorder(T& a, T& b) {\n  using std::swap;   // fallback\n  swap(a, b);        // picks geo::swap for Mesh, std::swap otherwise\n}"],
      deepDive: {
        explain: "Partial ordering of templates decides which of two matching templates is \"more specialised\": `f(T*)` beats `f(T)` for pointer arguments because every argument `f(T*)` accepts, `f(T)` also accepts, but not vice versa. Dimov and Abrahams' example shows the specialisation trap: with `template<class T> void f(T); template<class T> void f(T*); template<> void f<int*>(int*);`, the result of `f(&i)` depends on whether the explicit specialisation was declared before or after the `f(T*)` overload, because it specialises whichever primary template was visible. Specialising standard library templates is allowed only for program-defined types and only for templates that permit it (`std::hash`, `std::formatter`, `std::tuple_size` for structured bindings); adding overloads to namespace std is undefined behaviour. C++20 ranges use **customisation point objects** (`std::ranges::swap`, `std::ranges::begin`) that handle ADL lookup and fallbacks correctly. With concepts, many uses of specialisation become constrained overloads, which compose better.",
        example: ['cpp', 'teaching std::format about your type (C++20)', "struct Money { long long cents; };\ntemplate <> struct std::formatter<Money> : std::formatter<std::string> {\n  auto format(const Money& m, std::format_context& ctx) const {\n    return std::formatter<std::string>::format(\n      std::format(\"{}.{:02}\", m.cents / 100, m.cents % 100), ctx);\n  }\n};\nstd::format(\"{}\", Money{1999});   // \"19.99\""],
        tradeoffs: [['Technique', 'Use for', 'Pitfall'], ['Function overloading', 'Different behaviour per argument type', 'Implicit conversions can pick surprising overloads'], ['Full specialisation (class)', 'Special implementation for one type', 'Must match the primary interface by convention'], ['Partial specialisation (class)', 'Patterns such as pointers or containers', 'Not available for function templates'], ['Function template specialisation', 'Rarely needed', 'Does not participate in overload resolution']],
        failures: [['Specialisation never called', 'Function template specialisation ignored by overload resolution', 'Write an overload instead'], ['Undefined behaviour after adding to namespace std', 'Overloading std functions', 'Specialise only permitted templates; use ADL'], ['Generic code uses std::swap for a type with a cheap swap', 'Called std::swap(a, b) explicitly', 'using std::swap; swap(a, b);'], ['vector<bool> surprises', 'Library specialisation changes semantics', 'vector<char> or bitset']],
      },
      warn: "Do not explicitly specialise function templates to customise behaviour; specialisations do not take part in overload resolution. Overload the function instead.",
      production: {
        numbers: "Overload resolution considers every candidate in scope plus those found by argument-dependent lookup; heavily overloaded names in widely included headers measurably slow compilation.",
        observe: "When the wrong overload is chosen, compile a small test with static_assert or print __PRETTY_FUNCTION__ to see which instantiation ran.",
        security: "Unexpected overload selection through implicit conversions (for example bool or char overloads) can bypass validation paths; mark single-argument constructors explicit.",
        checklist: ['Overload, do not specialise, function templates', 'Partial specialisation for class traits', 'std::hash and std::formatter specialised for own types only', 'using std::swap; swap(a, b); in generic code', 'No additions to namespace std', 'explicit single-argument constructors', 'Constrained overloads with concepts in C++20'],
        sources: ['Sutter, "Why Not Specialize Function Templates?" (C/C++ Users Journal, 2001)', 'cppreference.com: Explicit (full) template specialization; Partial template specialization; Overload resolution', 'ISO/IEC 14882:2024 [namespace.std]', 'Niebler, "Customization Point Design in C++11 and Beyond" (2014)'],
      },
      tip: "If you want different behaviour for one type, write an overload. Reserve specialisation for class templates such as traits, std::hash, and std::formatter.",
      faq: [['Can function templates be partially specialised?', 'No; overload them instead.'], ['Which wins in a tie: template or non-template?', 'The non-template function.'], ['Which std templates may you specialise?', 'Those that allow it, such as std::hash and std::formatter, for your own types.'], ['What does using std::swap; swap(a, b); achieve?', 'Finds a type\'s own swap through ADL, falling back to std::swap.'], ['What is partial specialisation used for?', 'Matching patterns such as T* or std::vector<T> in class templates and traits.']],
      ex: {
        prompt: 'Model which candidate wins for a call show(arg), considering only exact type matches. available lists what is declared: "template" (the generic primary template), "full:<type>" (a specialisation of that template), and "overload:<type>" (a non-template function). Rules: an exact non-template overload wins; otherwise the template is used, and its full specialisation for that type replaces it if one exists; if nothing matches, return "none". Write pickOverload(argType, available).',
        fn: 'pickOverload', params: 'argType, available', sig: '(string argType, string[] available) -> string',
        cpp: `class Solution {
public:
    string pickOverload(string argType, vector<string>& available) {
        auto has = [&](const string& s) { return find(available.begin(), available.end(), s) != available.end(); };
        if (has("overload:" + argType)) return "overload:" + argType;   // non-template wins a tie
        if (!has("template")) return "none";
        if (has("full:" + argType)) return "full:" + argType;           // chosen after the template
        return "template";
    }
};
`,
        cases: [{ args: ['int', ['template', 'full:int', 'overload:int']], expect: 'overload:int' }, { args: ['int', ['template', 'full:int']], expect: 'full:int' }, { args: ['double', ['template', 'full:int']], expect: 'template' }, { args: ['char', ['overload:int']], expect: 'none' }],
        solution: "function pickOverload(arg,avail){if(avail.includes('overload:'+arg))return'overload:'+arg;if(!avail.includes('template'))return'none';if(avail.includes('full:'+arg))return'full:'+arg;return'template'}",
        hint: 'Check the non-template first; a specialisation only matters once the template has been chosen.',
      },
      quiz: [
        choice('cx-tp-2-q1', 'cpp-specialisation', 'Given void f(int) and template <class T> void f(T), f(5) calls...', ['the non-template f(int)', 'f<int>', 'is ambiguous', 'neither'], 0, 'Tie-breaker.'),
        choice('cx-tp-2-q2', 'cpp-specialisation', 'Which can be partially specialised?', ['class templates', 'function templates', 'both', 'neither'], 0, 'Functions overload.'),
        choice('cx-tp-2-q3', 'cpp-specialisation', 'Adding your own overload of std::swap inside namespace std is...', ['undefined behaviour', 'recommended', 'required for ADL', 'fine for any type'], 0, 'Use your namespace.'),
        fill('cx-tp-2-q4', 'cpp-specialisation', 'A free swap in your type\'s namespace is found by argument-dependent ___', ['lookup'], 'ADL.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'cx-tp-3', title: 'Variadic templates and fold expressions', concept: 'cpp-variadic',
      story: "Before C++11, libraries such as Boost emulated functions with \"any number of arguments\" by generating overloads for 0, 1, 2, … up to some limit with preprocessor macros, which produced enormous headers and cryptic errors. Douglas Gregor and Jaakko Järvi's variadic templates proposal, adopted in C++11, added parameter packs. C++17 fold expressions then removed most of the recursive boilerplate needed to process a pack, making `std::tuple`, `std::make_unique`, `std::format`, and `emplace` straightforward to implement.",
      analogy: "A parameter pack is a train of carriages of different kinds. A fold expression is a conductor walking the train with one instruction, such as \"add up the passengers\", applied carriage by carriage from one end.",
      timeline: [['2006', 'Variadic templates proposal', 'Gregor and Järvi (N2080).'], ['2011', 'C++11', 'Parameter packs, sizeof..., pack expansion.'], ['2017', 'C++17', 'Fold expressions; if constexpr eases recursion.'], ['2026', 'C++26', 'Pack indexing (Ts...[0]) in the finalised C++26 draft.']],
      explain: "`template <class... Ts> void log(Ts... args)` declares a **template parameter pack** `Ts` and a **function parameter pack** `args`. `sizeof...(Ts)` gives the count. **Pack expansion** applies a pattern to every element: `f(std::forward<Ts>(args)...)` forwards each argument; `std::vector<int>{args...}` builds a list. C++11 code processed packs recursively (handle the first element, recurse on the rest, with a base case). C++17 **fold expressions** reduce a pack with a binary operator in one expression: **unary right fold** `(args op ...)` computes `a1 op (a2 op (a3 op a4))`; **unary left fold** `(... op args)` computes `((a1 op a2) op a3) op a4`; binary folds add an initial value: `(init op ... op args)`. For associative operators like `+` and `*` the direction does not matter for integers, but for `-`, `/`, or string concatenation with side effects it does. Empty packs are allowed only for `&&` (true), `||` (false), and the comma operator; use a binary fold with an initial value otherwise. The comma fold `(f(args), ...)` calls `f` on each argument in order.",
      diagram: "args = 10, 3, 2, 1\n(... - args)   left fold   ((10 - 3) - 2) - 1 = 4\n(args - ...)   right fold  10 - (3 - (2 - 1)) = 8\n(args + ...)   = 16 either way (associative)\n(0 + ... + args)  binary fold: works for an empty pack\n(std::cout << ... << args)  prints left to right",
      ex1: ['cpp', 'sum, all-of, and printing with folds', "template <class... Ts> auto sum(Ts... xs) { return (0 + ... + xs); }   // 0 for empty\ntemplate <class... Ts> bool allPositive(Ts... xs) { return ((xs > 0) && ...); }\ntemplate <class... Ts> void print(const Ts&... xs) {\n  ((std::cout << xs << ' '), ...);   // comma fold: in order\n}\nsum(1, 2, 3);          // 6\nprint(\"id\", 42, 3.5);  // id 42 3.5"],
      ex2: ['cpp', 'the C++11 recursive style it replaced', "void printOld() {}                                   // base case\ntemplate <class T, class... Rest>\nvoid printOld(const T& first, const Rest&... rest) {\n  std::cout << first << ' ';\n  printOld(rest...);                                 // recurse on the tail\n}"],
      deepDive: {
        explain: "Pack expansion can appear in many contexts: function arguments, initialiser lists, base class lists (`struct overloaded : Ts... { using Ts::operator()...; };`), template argument lists, and lambda captures (`[...xs = std::move(xs)]` in C++20). Patterns may contain several packs expanded in lockstep, which must have equal length. Recursion-based processing instantiates one function per pack length and can hit compiler limits for long packs; folds instantiate one function. `std::index_sequence` and `std::make_index_sequence<N>` (C++14) generate packs of indices, the standard way to iterate a `std::tuple` (`std::apply` in C++17 wraps the pattern). Evaluation order: inside a braced initialiser list and in comma folds, elements are evaluated left to right, but in ordinary function call arguments the order is unspecified. C++26 adds **pack indexing** (`Ts...[0]`) and C++26 static reflection adds expansion statements for iterating over structures at compile time.",
        example: ['cpp', 'iterating a tuple with std::apply', "auto t = std::make_tuple(1, \"two\", 3.0);\nstd::apply([](const auto&... xs) { ((std::cout << xs << '\\n'), ...); }, t);"],
        tradeoffs: [['Technique', 'Strength', 'Weakness'], ['Fold expression (C++17)', 'One line; one instantiation', 'Only for binary operators'], ['Recursive templates (C++11)', 'Works for any processing', 'Many instantiations; boilerplate'], ['index_sequence + apply', 'Tuple element access by index', 'Verbose'], ['Initializer-list trick', 'Ordered side effects pre-C++17', 'Obscure']],
        failures: [['Compile error on an empty pack', 'Unary fold with an operator that has no empty value', 'Binary fold with an initial value'], ['Wrong result for subtraction', 'Left versus right fold confusion', 'Pick the fold direction deliberately'], ['Side effects out of order', 'Expansion in function call arguments', 'Use a comma fold or braced list'], ['Slow builds with long packs', 'Recursive instantiation', 'Folds or index sequences']],
      },
      warn: "Fold direction matters for non-associative operators: (... - args) and (args - ...) give different results. Choose deliberately and test with three or more arguments.",
      production: {
        numbers: "For args 10, 3, 2, 1, a left fold over - gives 4 and a right fold gives 8; for + both give 16.",
        observe: "Unit-test variadic utilities with zero, one, and several arguments of mixed types; static_assert(sizeof...(Ts) > 0) where an empty pack is meaningless.",
        security: "Variadic formatting replaces printf-style varargs, which have no type checking and enable format-string vulnerabilities; prefer std::format (C++20) with compile-time format checks.",
        checklist: ['Folds instead of recursion in C++17 code', 'Binary folds when packs may be empty', 'Comma folds for ordered side effects', 'std::forward<Ts>(args)... in forwarding wrappers', 'std::apply for tuples', 'Tests for 0, 1, and many arguments', 'std::format instead of C varargs'],
        sources: ['Gregor, Järvi, "Variadic Templates" (N2080, 2006)', 'Sutton, Smith, "Folding expressions" (N4295, 2014)', 'cppreference.com: Parameter pack; Fold expressions', 'P2662 "Pack Indexing" (C++26)'],
      },
      tip: "Write the fold out by hand for three arguments before trusting it: ((a op b) op c) for a left fold, a op (b op c) for a right fold.",
      faq: [['What is a parameter pack?', 'A template or function parameter that accepts zero or more arguments.'], ['What does sizeof...(Ts) return?', 'The number of elements in the pack.'], ['Difference between (... - xs) and (xs - ...)?', 'The first folds from the left, the second from the right.'], ['Which operators allow an empty unary fold?', '&& (true), || (false), and the comma operator (void()).'], ['How do you call f on each argument in order?', 'A comma fold: (f(args), ...);']],
      ex: {
        prompt: 'Write fold(op, args, dir) evaluating a fold expression over a non-empty list of integers. op is "+", "-", or "*". dir "left" computes ((a1 op a2) op a3) …; dir "right" computes a1 op (a2 op (a3 …)).',
        fn: 'fold', params: 'op, args, dir', sig: '(string op, int[] args, string dir) -> int',
        cpp: `class Solution {
    static int apply(const string& op, int a, int b) { return op == "-" ? a - b : op == "+" ? a + b : a * b; }
public:
    int fold(string op, vector<int>& args, string dir) {
        int n = (int)args.size();
        if (dir == "left") {
            int r = args[0];
            for (int i = 1; i < n; i++) r = apply(op, r, args[i]);
            return r;
        }
        int r = args[n - 1];
        for (int i = n - 2; i >= 0; i--) r = apply(op, args[i], r);
        return r;
    }
};
`,
        cases: [{ args: ['-', [10, 3, 2, 1], 'left'], expect: 4 }, { args: ['-', [10, 3, 2, 1], 'right'], expect: 8 }, { args: ['+', [1, 2, 3], 'left'], expect: 6 }, { args: ['*', [2, 3, 4], 'right'], expect: 24 }, { args: ['-', [5], 'left'], expect: 5 }],
        solution: "function fold(op,args,dir){const f=(a,b)=>op==='-'?a-b:op==='+'?a+b:a*b;if(dir==='left'){let r=args[0];for(let i=1;i<args.length;i++)r=f(r,args[i]);return r}let r=args[args.length-1];for(let i=args.length-2;i>=0;i--)r=f(args[i],r);return r}",
        hint: 'A left fold accumulates from the front; a right fold accumulates from the back with the element on the left side.',
      },
      quiz: [
        choice('cx-tp-3-q1', 'cpp-variadic', 'What does (... - xs) compute for xs = 10, 3, 2?', ['(10 - 3) - 2 = 5', '10 - (3 - 2) = 9', '15', '-5'], 0, 'Left fold.'),
        choice('cx-tp-3-q2', 'cpp-variadic', 'Which unary fold is valid on an empty pack?', ['(xs && ...)', '(xs + ...)', '(xs * ...)', '(xs - ...)'], 0, 'Empty && is true.'),
        choice('cx-tp-3-q3', 'cpp-variadic', 'How many elements does sizeof...(Ts) count for f(1, "a", 2.0)?', ['3', '1', '0', '6'], 0, 'Three arguments.'),
        fill('cx-tp-3-q4', 'cpp-variadic', 'The C++17 feature that reduces a parameter pack with a binary operator is the ___ expression.', ['fold'], 'Folds.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'cx-tp-4', title: 'Type traits, SFINAE, and if constexpr', concept: 'cpp-sfinae-traits',
      story: "\"Substitution failure is not an error\" was named by David Vandevoorde and Nicolai Josuttis in their 2002 book on templates. The rule was meant to keep overload resolution sane: if substituting a type into a template's signature produces something invalid, that template is silently removed from the candidate list. Library authors turned it into a technique for writing \"this overload only exists for integers\", and Boost's `enable_if` (2003) and type traits (standardised in C++11) became the tools. C++17's `if constexpr` and C++20's concepts replaced most uses with readable code.",
      analogy: "SFINAE is a job advert with hidden requirements: candidates who do not meet them are quietly removed from the shortlist instead of causing a scene. Type traits are the background checks that answer yes or no about each candidate.",
      timeline: [['2002', 'SFINAE named', 'Vandevoorde and Josuttis, "C++ Templates".'], ['2003', 'boost::enable_if', 'Conditional overloads via SFINAE.'], ['2011', '<type_traits>', 'is_integral, is_same, enable_if, decay, and more in std.'], ['2017', 'if constexpr', 'Compile-time branches discard the untaken path; _v and _t helpers.']],
      explain: "**Type traits** in `<type_traits>` answer questions about types at compile time: `std::is_integral_v<T>`, `std::is_floating_point_v<T>`, `std::is_pointer_v<T>`, `std::is_const_v<T>`, `std::is_same_v<A, B>`, `std::is_trivially_copyable_v<T>`, `std::is_arithmetic_v<T>` (integral or floating), `std::is_scalar_v<T>` (arithmetic, enum, pointer, member pointer, nullptr_t). Note that `std::is_const_v<const int*>` is **false**: the pointer is not const, only what it points to. Transformations produce new types: `std::remove_cvref_t<T>`, `std::decay_t<T>`, `std::make_unsigned_t<T>`, `std::conditional_t<B, X, Y>`. **SFINAE**: during overload resolution, if substituting deduced types into a declaration fails, that candidate is discarded rather than causing an error; `std::enable_if_t<cond, R>` exploits this to enable overloads conditionally. **`if constexpr (cond)`** (C++17) evaluates a constant condition and discards the untaken branch inside a template, so code that would not compile for some `T` can live in the other branch. In new code, prefer `if constexpr` for branching inside one function and **concepts** (next lesson) for selecting overloads.",
      diagram: "trait                         int   const double   int*   std::string   const char*\nis_integral_v                 ✓        –           –          –             –\nis_floating_point_v           –        ✓           –          –             –\nis_pointer_v                  –        –           ✓          –             ✓\nis_const_v                    –        ✓           –          –             –  (pointee const only)\nis_arithmetic_v               ✓        ✓           –          –             –\nis_scalar_v                   ✓        ✓           ✓          –             ✓",
      ex1: ['cpp', 'if constexpr selects code per type', "template <class T>\nstd::string toText(const T& x) {\n  if constexpr (std::is_arithmetic_v<T>) return std::to_string(x);\n  else if constexpr (std::is_same_v<T, std::string>) return x;\n  else return x.toString();   // only instantiated for other types\n}"],
      ex2: ['cpp', 'SFINAE with enable_if (C++11/14 style)', "template <class T, std::enable_if_t<std::is_integral_v<T>, int> = 0>\nT half(T x) { return x / 2; }          // only for integers\ntemplate <class T, std::enable_if_t<std::is_floating_point_v<T>, int> = 0>\nT half(T x) { return x * 0.5; }        // only for floating types\nhalf(7);    // 3\nhalf(7.0);  // 3.5"],
      deepDive: {
        explain: "SFINAE applies only to the **immediate context** of substitution: the function type, template parameter types, and default template arguments. An error inside the function body after a candidate was selected is a hard error. The \"detection idiom\" (`std::void_t<decltype(std::declval<T>().size())>`) tests whether an expression is valid, which is how pre-C++20 libraries asked \"does T have a size() member?\". Traits are mostly implemented by partial specialisation (`is_pointer<T*>` is `true_type`) and some by compiler intrinsics (`__is_trivially_copyable`). The `_v` (C++17) and `_t` (C++14) helpers shorten `::value` and `::type`. `if constexpr` only discards branches inside templates when the condition depends on a template parameter; in non-template code both branches must still compile. A common bug is `static_assert(false)` in a discarded branch, which before C++23 (P2593) made the program ill-formed even if never instantiated; the usual workaround was a dependent false (`static_assert(sizeof(T) == 0)`).",
        example: ['cpp', 'detecting a member with void_t (pre-C++20)', "template <class T, class = void> struct HasSize : std::false_type {};\ntemplate <class T> struct HasSize<T, std::void_t<decltype(std::declval<T>().size())>> : std::true_type {};\nstatic_assert(HasSize<std::vector<int>>::value);\nstatic_assert(!HasSize<int>::value);"],
        tradeoffs: [['Tool', 'Readability', 'Use when'], ['enable_if SFINAE', 'Poor', 'Pre-C++20 overload selection'], ['Tag dispatch', 'Moderate', 'Choosing implementations by trait in C++11/14'], ['if constexpr', 'Good', 'Branching inside one template (C++17)'], ['Concepts', 'Best', 'Constraining templates and overloads (C++20)']],
        failures: [['Hard error instead of overload removal', 'Failure inside the function body, not the signature', 'Move the condition into the signature or use concepts'], ['Both branches fail to compile', 'if constexpr in non-template code, or condition not dependent', 'Make the condition depend on T'], ['is_const_v<const char*> is false, surprising readers', 'Pointer itself is not const', 'Use is_const_v<std::remove_pointer_t<T>>'], ['Unreadable error walls', 'Deep enable_if chains', 'Concepts with named requirements']],
      },
      warn: "SFINAE only removes candidates when substitution fails in the declaration. Errors inside a selected function body are hard errors, not silent removal.",
      production: {
        numbers: "<type_traits> provides well over 100 traits and transformations; most are compile-time only and generate no machine code.",
        observe: "static_assert on traits documents assumptions (for example is_trivially_copyable before memcpy) and fails the build early when a type changes.",
        security: "memcpy or byte-wise serialisation of non-trivially-copyable types corrupts objects; guard such code with static_assert(std::is_trivially_copyable_v<T>).",
        checklist: ['if constexpr for per-type branches', 'Concepts for overload selection in C++20', 'static_assert for trait assumptions', '_v and _t helpers', 'remove_cvref_t before comparing types', 'No memcpy on non-trivial types', 'Dependent conditions in if constexpr'],
        sources: ['Vandevoorde, Josuttis, Gregor, "C++ Templates: The Complete Guide" (2nd ed.), chapters 8, 15, 19', 'cppreference.com: SFINAE; Type support library; if constexpr', 'Brown, "Modern Template Metaprogramming: A Compendium" (CppCon 2014)', 'P2593 "Allowing static_assert(false)" (C++23)'],
      },
      tip: "When reading old template code full of enable_if, translate each condition into words (\"only for integers\"); in new code, write that sentence as a concept.",
      faq: [['What does SFINAE stand for?', 'Substitution failure is not an error.'], ['Is std::is_const_v<const char*> true?', 'No; the pointer is not const, only the char it points to.'], ['What does if constexpr do?', 'Evaluates the condition at compile time and discards the untaken branch in templates.'], ['What does std::enable_if_t<cond, T> do when cond is false?', 'Names no type, so substitution fails and the overload is removed.'], ['What does is_scalar include?', 'Arithmetic types, enums, pointers, member pointers, and nullptr_t.']],
      ex: {
        prompt: 'Write traits(type) returning, sorted, which of these are true for the type: "is_const", "is_integral", "is_floating_point", "is_pointer", "is_arithmetic", "is_scalar". Types are a base among int, char, bool, long, short, unsigned, float, double, std::string, optionally prefixed by "const " and optionally ending with "*". A leading const on a pointer type applies to the pointee, so the pointer type is not const. Integral types are int, char, bool, long, short, unsigned; floating types are float and double; arithmetic = integral or floating; scalar = arithmetic or pointer.',
        fn: 'traits', params: 'type', sig: '(string type) -> string[]',
        cpp: `class Solution {
public:
    vector<string> traits(string t) {
        bool leadingConst = t.compare(0, 6, "const ") == 0;
        string base = leadingConst ? t.substr(6) : t;
        bool ptr = !base.empty() && base.back() == '*';
        set<string> integral = {"int", "char", "bool", "long", "short", "unsigned"};
        set<string> floating = {"float", "double"};
        vector<string> out;
        if (leadingConst && !ptr) out.push_back("is_const");
        bool isInt = !ptr && integral.count(base), isFloat = !ptr && floating.count(base);
        if (isInt) out.push_back("is_integral");
        if (isFloat) out.push_back("is_floating_point");
        if (ptr) out.push_back("is_pointer");
        if (isInt || isFloat) out.push_back("is_arithmetic");
        if (ptr || isInt || isFloat) out.push_back("is_scalar");
        sort(out.begin(), out.end());
        return out;
    }
};
`,
        cases: [{ args: ['int'], expect: ['is_arithmetic', 'is_integral', 'is_scalar'] }, { args: ['const double'], expect: ['is_arithmetic', 'is_const', 'is_floating_point', 'is_scalar'] }, { args: ['int*'], expect: ['is_pointer', 'is_scalar'] }, { args: ['bool'], expect: ['is_arithmetic', 'is_integral', 'is_scalar'] }, { args: ['std::string'], expect: [] }, { args: ['const char*'], expect: ['is_pointer', 'is_scalar'] }, { args: ['const int'], expect: ['is_arithmetic', 'is_const', 'is_integral', 'is_scalar'] }],
        solution: "function traits(t){const out=[];const lc=t.startsWith('const ');const base=lc?t.slice(6):t;const ptr=base.endsWith('*');if(lc&&!ptr)out.push('is_const');const isInt=!ptr&&['int','char','bool','long','short','unsigned'].includes(base);const isFl=!ptr&&['float','double'].includes(base);if(isInt)out.push('is_integral');if(isFl)out.push('is_floating_point');if(ptr)out.push('is_pointer');if(isInt||isFl)out.push('is_arithmetic');if(ptr||isInt||isFl)out.push('is_scalar');return out.sort()}",
        hint: 'Strip a leading const, detect a trailing *, then classify the base; remember a leading const on a pointer type is not top-level.',
      },
      quiz: [
        choice('cx-tp-4-q1', 'cpp-sfinae-traits', 'std::is_const_v<const char*> is...', ['false', 'true', 'ill-formed', 'implementation-defined'], 0, 'Pointer to const.'),
        choice('cx-tp-4-q2', 'cpp-sfinae-traits', 'What happens when substitution into an overload\'s signature fails?', ['that overload is removed from the candidates', 'a hard compile error', 'a runtime exception', 'the program is UB'], 0, 'SFINAE.'),
        choice('cx-tp-4-q3', 'cpp-sfinae-traits', 'Which C++17 feature discards the untaken branch in a template?', ['if constexpr', 'consteval', 'static_assert', 'constinit'], 0, 'Compile-time branch.'),
        fill('cx-tp-4-q4', 'cpp-sfinae-traits', 'std::___<A, B> is true when A and B are the same type.', ['is_same', 'is_same_v'], 'Type identity.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'cx-tp-5', title: 'Concepts and constrained templates (C++20)', concept: 'cpp-concepts',
      story: "Concepts have the longest gestation of any C++ feature. Stroustrup wanted constraints on templates in the 1980s; a large \"C++0x concepts\" design was voted into the draft in 2008 and then removed in 2009 for being too complex and slow to compile. Andrew Sutton, Bjarne Stroustrup, and Gabriel Dos Reis designed the lighter \"Concepts Lite\", shipped as a Technical Specification in 2015 and merged into C++20. The payoff is visible in every error message: \"T does not satisfy std::sortable\" instead of three screens of library internals.",
      analogy: "A concept is a job description listing required skills. Applicants (types) who lack a skill are told exactly which one is missing at the door, rather than failing mysteriously on their first day.",
      timeline: [['2008', 'C++0x concepts', 'Voted in, then removed in 2009.'], ['2015', 'Concepts TS', 'Concepts Lite as a Technical Specification.'], ['2020', 'C++20', 'Concepts, requires clauses, standard concepts in <concepts>; ranges built on them.'], ['2026', 'C++26', 'Concept and variable-template template parameters in the finalised draft.']],
      explain: "A **concept** is a named compile-time predicate on types: `template <class T> concept Hashable = requires(T a) { { std::hash<T>{}(a) } -> std::convertible_to<size_t>; };`. A **requires-expression** lists expressions that must be valid (and optionally their result types). Use concepts to constrain templates in four equivalent ways: `template <Hashable T>`, a **requires clause** `template <class T> requires Hashable<T>`, a trailing `requires`, or an **abbreviated template** `void f(Hashable auto x)`. The standard library provides many in `<concepts>` and `<iterator>`: `std::integral`, `std::floating_point`, `std::same_as`, `std::convertible_to`, `std::equality_comparable`, `std::totally_ordered`, `std::copyable`, `std::regular`, `std::invocable`, and iterator and range concepts such as `std::random_access_iterator` and `std::ranges::range`. Constrained overloads are selected by **subsumption**: if two candidates match, the one whose constraints are a superset (more specialised) wins, so `f(std::integral auto)` beats `f(auto)` for ints without any `enable_if` tricks. Constraints are checked at the call, so errors name the unmet requirement.",
      diagram: "template <class T>\nconcept Sortable = requires(T a, T b) { { a < b } -> std::convertible_to<bool>; std::swap(a, b); };\n\nvoid sortAll(std::vector<Sortable auto>& v);\nsortAll(ints)     ✓ int has < and swap\nsortAll(widgets)  ✗ error: Widget does not satisfy Sortable\n                     because 'a < b' would be invalid",
      ex1: ['cpp', 'defining and using a concept', "template <class T>\nconcept Number = std::integral<T> || std::floating_point<T>;\n\ntemplate <Number T>\nT average(const std::vector<T>& v) {\n  T sum{};\n  for (T x : v) sum += x;\n  return v.empty() ? T{} : sum / static_cast<T>(v.size());\n}\n// average(std::vector<std::string>{}) → error: std::string does not satisfy Number"],
      ex2: ['cpp', 'overloads chosen by constraints', "void describe(auto x)               { std::puts(\"something\"); }\nvoid describe(std::integral auto x) { std::puts(\"an integer\"); }\nvoid describe(std::unsigned_integral auto x) { std::puts(\"an unsigned integer\"); }\ndescribe(2.5);   // something\ndescribe(7);     // an integer\ndescribe(7u);    // an unsigned integer (most constrained wins)"],
      deepDive: {
        explain: "Concepts are evaluated by **satisfaction checking** at the point of use; a concept does not check that the template body only uses the listed operations (C++ concepts constrain callers, not definitions, unlike the abandoned C++0x design). **Subsumption** works on the normalised form of constraints: `std::unsigned_integral` is defined in terms of `std::integral`, so it subsumes it. Subsumption only works through named concepts combined with `&&` and `||`; two identical requires-expressions written inline are not recognised as related. Good concepts model **semantic** requirements too (for example, `std::totally_ordered` requires that `<` is a total order), even though the compiler can only check syntax; documenting those semantics is part of the design. Concepts compile faster than equivalent SFINAE in most implementations and give far better diagnostics. In C++26, static reflection (P2996, adopted June 2025) complements concepts by letting code inspect a type's members at compile time.",
        example: ['cpp', 'a requires-expression with several kinds of requirements', "template <class C>\nconcept Container = requires(C c, const C cc) {\n  typename C::value_type;                       // type requirement\n  { cc.size() } -> std::convertible_to<size_t>; // compound requirement\n  c.begin(); c.end();                           // simple requirements\n  requires std::default_initializable<C>;       // nested requirement\n};"],
        tradeoffs: [['Approach', 'Diagnostics', 'Overload ranking'], ['Unconstrained template', 'Errors deep inside the body', 'By deduction only'], ['enable_if / SFINAE', 'Poor', 'Hard to express priorities'], ['Concepts', 'Names the unmet requirement', 'Subsumption picks the most constrained'], ['Virtual interfaces', 'Clear at runtime boundaries', 'Runtime dispatch; heap objects']],
        failures: [['Ambiguous overload between two constrained templates', 'Constraints written inline cannot subsume each other', 'Name the concepts and build one from the other'], ['Concept satisfied but semantics wrong', 'Type has operator< that is not a strict weak order', 'Document and test semantic requirements'], ['Template accepts types it cannot handle', 'Unconstrained parameter', 'Add a concept'], ['Long error despite concepts', 'Concept too broad (auto everywhere)', 'Constrain at the API boundary']],
      },
      warn: "A concept only checks that expressions compile, not that they behave correctly. A type can satisfy std::totally_ordered syntactically while its operator< is broken; test semantics separately.",
      production: {
        numbers: "Concepts were removed from the C++0x draft in July 2009 and finally shipped 11 years later in C++20; GCC 10, Clang 10, and MSVC 19.28 (VS 2019 16.8) were the first releases with C++20 concepts support.",
        observe: "Compiler diagnostics now name unsatisfied constraints; keep library-facing templates constrained so users get those messages instead of errors deep in your code.",
        security: "Constraining templates prevents unintended instantiation with types whose operations do something unexpected (for example pointers where values were meant), a source of subtle logic bugs.",
        checklist: ['Public templates constrained with concepts', 'Standard concepts before custom ones', 'Custom concepts built from named concepts for subsumption', 'Semantic requirements documented and tested', 'Abbreviated templates for simple cases', 'static_assert(Concept<T>) tests for key types', 'enable_if retired in C++20 code'],
        sources: ['Sutton, Stroustrup, Dos Reis, "Concepts Lite" (N3580, 2013)', 'cppreference.com: Constraints and concepts; Concepts library', 'Stroustrup, "Thriving in a Crowded and Changing World: C++ 2006–2020" (HOPL IV, 2020)', 'P2996 "Reflection for C++26" (adopted June 2025)'],
      },
      tip: "Constrain at the boundary: a template that callers see should say what it needs in a concept, even if internal helpers stay unconstrained.",
      faq: [['What is a concept?', 'A named compile-time predicate on template arguments.'], ['What is a requires-expression?', 'A list of expressions and types that must be valid for the concept to hold.'], ['How are constrained overloads ranked?', 'By subsumption: the more constrained candidate wins.'], ['Do concepts check the template body?', 'No; they constrain the arguments at the call site.'], ['What is an abbreviated function template?', 'A function with a constrained auto parameter, such as void f(std::integral auto x).']],
      ex: {
        prompt: 'Model concept checking. Each concept requires operations: Sortable needs "<" and "swap"; Hashable needs "==" and "hash"; Printable needs "<<"; Regular needs "==", "copy", and "default". Write missing(ops, conceptName) returning the required operations the type does not provide, sorted (empty means the type satisfies the concept).',
        fn: 'missing', params: 'ops, conceptName', sig: '(string[] ops, string conceptName) -> string[]',
        cpp: `class Solution {
public:
    vector<string> missing(vector<string>& ops, string conceptName) {
        static const map<string, vector<string>> req = {
            {"Sortable", {"<", "swap"}}, {"Hashable", {"==", "hash"}},
            {"Printable", {"<<"}}, {"Regular", {"==", "copy", "default"}},
        };
        set<string> have(ops.begin(), ops.end());
        vector<string> out;
        for (const string& r : req.at(conceptName)) if (!have.count(r)) out.push_back(r);
        sort(out.begin(), out.end());
        return out;
    }
};
`,
        cases: [{ args: [['<', 'swap', '=='], 'Sortable'], expect: [] }, { args: [['=='], 'Hashable'], expect: ['hash'] }, { args: [[], 'Printable'], expect: ['<<'] }, { args: [['copy', 'default', '<<'], 'Regular'], expect: ['=='] }],
        solution: "function missing(ops,conceptName){const req={Sortable:['<','swap'],Hashable:['==','hash'],Printable:['<<'],Regular:['==','copy','default']}[conceptName];return req.filter(r=>!ops.includes(r)).sort()}",
        hint: 'Look up the requirements and keep those the type does not provide.',
      },
      quiz: [
        choice('cx-tp-5-q1', 'cpp-concepts', 'void f(auto) and void f(std::integral auto) both exist. f(3) calls...', ['the std::integral overload', 'the auto overload', 'is ambiguous', 'neither'], 0, 'Subsumption.'),
        choice('cx-tp-5-q2', 'cpp-concepts', 'Main practical benefit of concepts over SFINAE:', ['clear errors naming the unmet requirement', 'faster programs at run time', 'runtime type checks', 'smaller binaries always'], 0, 'Diagnostics.'),
        choice('cx-tp-5-q3', 'cpp-concepts', 'In which standard did concepts ship?', ['C++20', 'C++11', 'C++17', 'C++23'], 0, 'After a 2009 removal.'),
        fill('cx-tp-5-q4', 'cpp-concepts', 'A ___-expression lists operations a type must support, e.g. requires(T a) { a.size(); }', ['requires'], 'requires-expression.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'cx-tp-6', title: 'Compile-time programming with constexpr', concept: 'cpp-compile-time',
      story: "Template metaprogramming computed things at compile time by abusing recursive template instantiation: factorial was a struct with a nested enum, and lookup tables were generated with recursive variadic templates. Gabriel Dos Reis and Bjarne Stroustrup's `constexpr` proposal (2007, in C++11) let ordinary-looking functions run in the compiler. Each standard since has widened what is allowed, and in 2025 WG21 adopted static reflection for C++26, letting programs inspect and generate code from type information at compile time.",
      analogy: "constexpr is meal prep on Sunday: the chopping and cooking happen before the week starts, so on Wednesday dinner is just served. The compiler is the Sunday cook.",
      timeline: [['1994–2010', 'Template metaprogramming', 'Compile-time computation via recursive templates.'], ['2011', 'constexpr', 'Single-expression constexpr functions.'], ['2014–2020', 'Relaxed constexpr', 'Loops (C++14), lambdas (C++17), virtual, try, vector and string (C++20).'], ['2025–2026', 'C++26 reflection', 'P2996 static reflection adopted; constexpr exceptions and more.']],
      explain: "A `constexpr` function can be evaluated at compile time when called in a **constant expression** context (initialising a `constexpr` variable, an array bound, a template argument, a `static_assert`), and runs normally at run time otherwise. Since C++14 it can use loops, branches, and local variables; C++20 allows `std::vector` and `std::string` inside constant evaluation as long as memory is freed before evaluation ends (transient allocation), plus virtual calls and `try` blocks. **Compile-time evaluation checks for undefined behaviour**: overflow, out-of-bounds access, or reading uninitialised memory in a constant expression is a compile error, which makes `static_assert` tests on constexpr functions a cheap UB detector. Use it for **lookup tables** (CRC, sine tables, character classes), **validation** (C++20 `std::format` checks format strings at compile time via `consteval`), and **configuration** constants. `consteval` forces compile-time evaluation; `constinit` forces compile-time initialisation of a static without making it const. Compilers limit evaluation effort (for example Clang's default of about 1,048,576 steps per constant expression, `-fconstexpr-steps`), so very heavy computations may need increased limits.",
      diagram: "constexpr std::array<int, 10> primes = firstPrimes<10>();   // computed by the compiler\nstatic_assert(primes[9] == 29);                              // checked at build time\nint n = read();\nauto p = sieve(n);        // same function, run time\nconsteval int check(…)    // must run at compile time\nUB inside a constant expression → compile error",
      ex1: ['cpp', 'a compile-time lookup table', "constexpr std::array<bool, 31> makeSieve() {\n  std::array<bool, 31> isPrime{};\n  for (int i = 2; i < 31; ++i) isPrime[i] = true;\n  for (int i = 2; i * i < 31; ++i)\n    if (isPrime[i]) for (int j = i * i; j < 31; j += i) isPrime[j] = false;\n  return isPrime;\n}\nconstexpr auto kPrimes = makeSieve();\nstatic_assert(kPrimes[29] && !kPrimes[27]);"],
      ex2: ['cpp', 'compile-time format checking (C++20)', "std::string s = std::format(\"{} items\", 3);   // checked at compile time\n// std::format(\"{} {}\", 3);                   // compile error: missing argument\nstd::string pattern = getPattern();\nstd::vformat(pattern, std::make_format_args(x));   // runtime format: runtime checks"],
      deepDive: {
        explain: "The compiler evaluates constant expressions in an interpreter that tracks object lifetimes, so it can reject reads of uninitialised or dead objects that ordinary execution would silently allow. `std::is_constant_evaluated()` (C++20) and `if consteval` (C++23) let one function choose a constant-evaluation-friendly algorithm and a fast run-time one (for example using intrinsics). Heavy compile-time work moves cost from run time to build time: large tables computed in headers are recomputed in every translation unit that needs them, so put them in one .cpp file or use `inline constexpr` variables that the linker deduplicates. Template metaprogramming is still needed for **type** computations (selecting types), while `constexpr` handles **value** computations; C++26 reflection blurs the line by representing types as values (`std::meta::info`) that constexpr code can manipulate, enabling things like automatic enum-to-string or struct serialisation without macros.",
        example: ['cpp', 'testing a function for UB at compile time', "constexpr int midpoint(int a, int b) { return (a + b) / 2; }        // overflows for big inputs\n// static_assert(midpoint(INT_MAX, INT_MAX) == INT_MAX);   // compile error: overflow\nconstexpr int safeMid(int a, int b) { return a + (b - a) / 2; }\nstatic_assert(safeMid(INT_MAX - 2, INT_MAX) == INT_MAX - 1);   // C++20: std::midpoint"],
        tradeoffs: [['Technique', 'Computes', 'Notes'], ['constexpr function', 'Values, compile or run time', 'Default choice'], ['consteval function', 'Values, compile time only', 'Validation, guaranteed folding'], ['Template metaprogramming', 'Types', 'Harder to read; still needed for type selection'], ['Code generation scripts', 'Anything', 'Extra build step; generated files to manage']],
        failures: [['Build time grows after adding a table', 'Large constexpr computation in a header', 'Compute once in a .cpp or precompute'], ['Constant expression evaluation step limit exceeded', 'Computation too heavy for default limits', 'Simplify or raise -fconstexpr-steps'], ['Function silently runs at run time', 'Called outside a constant context', 'Assign to a constexpr variable or use consteval'], ['Error: not a constant expression', 'Non-constexpr call, I/O, or UB inside', 'Remove the operation or fix the UB']],
      },
      warn: "constexpr does not force compile-time evaluation. Only constant-expression contexts (constexpr variables, static_assert, template arguments) or consteval guarantee it.",
      production: {
        numbers: "Clang limits constant evaluation to 1,048,576 steps by default (-fconstexpr-steps) and GCC to 33,554,432 operations (-fconstexpr-ops-limit); typical tables of a few thousand entries fit easily.",
        observe: "static_assert tests on constexpr functions run with every build; -ftime-trace shows constant-evaluation cost in compile times.",
        security: "Moving parsing or validation of fixed inputs (format strings, configuration literals) to compile time removes runtime failure paths; untrusted data still needs runtime validation.",
        checklist: ['constexpr for pure helpers and tables', 'static_assert tests for constexpr logic', 'consteval for must-be-compile-time checks', 'inline constexpr for header constants', 'Heavy tables computed once', 'std::format compile-time checks used', 'Build-time cost monitored'],
        sources: ['Dos Reis, Stroustrup, "General Constant Expressions for System Programming Languages" (2010) and N2235', 'cppreference.com: constexpr specifier; consteval; Constant expressions', 'P2996 "Reflection for C++26"', 'Clang and GCC documentation: -fconstexpr-steps, -fconstexpr-ops-limit'],
      },
      tip: "Write constexpr functions plus static_assert tests: you get unit tests that run inside the compiler and detect undefined behaviour for free.",
      faq: [['Does constexpr guarantee compile-time evaluation?', 'No; only in constant-expression contexts. consteval guarantees it.'], ['Can std::vector be used in constexpr functions?', 'Since C++20, if all allocations are freed before evaluation ends.'], ['What happens with UB in a constant expression?', 'Compilation fails.'], ['What is std::is_constant_evaluated for?', 'Choosing different implementations for compile time and run time.'], ['What does C++26 reflection add?', 'Compile-time inspection of types and declarations as values.']],
      ex: {
        prompt: 'Write primesUpTo(n) returning all primes from 2 to n inclusive in ascending order using the sieve of Eratosthenes, the kind of table a constexpr function would compute at compile time.',
        fn: 'primesUpTo', params: 'n', sig: '(int n) -> int[]',
        cpp: `class Solution {
public:
    vector<int> primesUpTo(int n) {
        vector<int> out;
        if (n < 2) return out;
        vector<bool> sieve(n + 1, true);
        for (int i = 2; i <= n; i++) {
            if (!sieve[i]) continue;
            out.push_back(i);
            for (long long j = (long long)i * i; j <= n; j += i) sieve[j] = false;
        }
        return out;
    }
};
`,
        cases: [{ args: [30], expect: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29] }, { args: [1], expect: [] }, { args: [2], expect: [2] }],
        solution: 'function primesUpTo(n){const s=new Array(n+1).fill(true);const out=[];for(let i=2;i<=n;i++){if(s[i]){out.push(i);for(let j=i*i;j<=n;j+=i)s[j]=false}}return out}',
        hint: 'Mark multiples of each prime starting from its square.',
      },
      quiz: [
        choice('cx-tp-6-q1', 'cpp-compile-time', 'When is a constexpr function guaranteed to run at compile time?', ['when its result is required in a constant expression', 'always', 'never', 'only with -O2'], 0, 'Context decides.'),
        choice('cx-tp-6-q2', 'cpp-compile-time', 'Signed overflow inside a constant expression causes...', ['a compile error', 'wrap-around', 'a warning only', 'nothing'], 0, 'UB is diagnosed.'),
        choice('cx-tp-6-q3', 'cpp-compile-time', 'Which C++26 feature lets code inspect types as compile-time values?', ['static reflection', 'modules', 'coroutines', 'contracts'], 0, 'P2996.'),
        fill('cx-tp-6-q4', 'cpp-compile-time', 'A function that must always be evaluated at compile time is declared ___', ['consteval'], 'Immediate function.'),
      ],
    }),
  ],
  exam: [
    choice('cx-tp-e1', 'cpp-templates-basics', 'Where do template definitions normally live?', ['in headers', 'only in .cpp files', 'in the linker script', 'in a DLL'], 0, 'Needed for instantiation.'),
    choice('cx-tp-e2', 'cpp-templates-basics', 'max(3, 7.5) with template <class T> T max(T, T) fails because...', ['T is deduced as both int and double', 'max is reserved', 'doubles cannot be compared', 'templates need explicit types always'], 0, 'Deduction conflict.'),
    choice('cx-tp-e3', 'cpp-specialisation', 'To customise a function template for one type, prefer...', ['an overload', 'a full specialisation', 'a macro', 'a partial specialisation'], 0, 'Specialisations skip overload resolution.'),
    choice('cx-tp-e4', 'cpp-specialisation', 'Which standard template may you specialise for your own key type?', ['std::hash', 'std::vector', 'std::swap (in namespace std)', 'std::sort'], 0, 'Permitted customisation.'),
    choice('cx-tp-e5', 'cpp-variadic', '(args + ...) over 1, 2, 3 is...', ['6', '0', '123', 'an error'], 0, 'Fold.'),
    choice('cx-tp-e6', 'cpp-sfinae-traits', 'std::enable_if_t<false, int> in a signature makes the overload...', ['disappear from overload resolution', 'a hard error', 'return int', 'run slower'], 0, 'SFINAE.'),
    choice('cx-tp-e7', 'cpp-sfinae-traits', 'is_scalar_v is true for...', ['int* and double', 'std::string', 'std::vector<int>', 'void'], 0, 'Arithmetic and pointers.'),
    choice('cx-tp-e8', 'cpp-concepts', 'An error "T does not satisfy std::sortable" comes from...', ['a concept constraint', 'SFINAE', 'a runtime check', 'the linker'], 0, 'Concepts.'),
    choice('cx-tp-e9', 'cpp-concepts', 'Two constrained overloads both match; the compiler picks...', ['the more constrained one (subsumption)', 'the first declared', 'a random one', 'the template with fewer parameters'], 0, 'Subsumption.'),
    choice('cx-tp-e10', 'cpp-compile-time', 'static_assert on a constexpr function call is useful because...', ['it tests the function at build time and catches UB', 'it speeds up run time only', 'it disables optimisation', 'it adds logging'], 0, 'Compile-time tests.'),
    order('cx-tp-e11', 'cpp-variadic', 'Order the evaluation of the left fold (... - xs) for xs = 10, 3, 2, 1.', ['10 - 3 = 7', '7 - 2 = 5', '5 - 1 = 4'], 'Left to right.'),
    fill('cx-tp-e12', 'cpp-concepts', 'A C++20 named predicate on template arguments is called a ___', ['concept'], 'Concepts.'),
  ],
};
