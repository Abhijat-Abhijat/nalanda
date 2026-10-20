import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const cxMove: Chapter = {
  id: 'cx-move',
  title: 'Move semantics and value categories',
  summary: 'The C++11 machinery that lets values be transferred instead of copied: lvalues, prvalues, and xvalues, rvalue references and std::move, the cost model of moves in containers, forwarding references and std::forward, copy elision and return value optimisation, sink parameters, and the rules for moved-from objects. Rules checked against the C++23 standard and cppreference as of October 2026.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'cx-mv-1', title: 'Value categories: lvalues, prvalues, and xvalues', concept: 'cpp-value-categories',
      story: "In C, an \"lvalue\" was simply something that could appear on the left of an assignment. When C++11 added move semantics, the committee needed a precise way to say \"this object is about to expire, so its resources can be stolen\". Bjarne Stroustrup's 2010 note \"New value terminology\" settled the taxonomy still used today: every expression has a type and a **value category**, and the categories are lvalue, xvalue, and prvalue, grouped into glvalues and rvalues. C++17 then redefined prvalues so that they no longer denote temporary objects at all until one is needed, which is what made copy elision guaranteed.",
      analogy: "An lvalue is a house with a street address you can return to. A prvalue is a set of building instructions: nothing exists until someone builds it somewhere. An xvalue is a house scheduled for demolition: it has an address, but everyone has agreed its furniture may be taken.",
      timeline: [['1972', 'C lvalues', 'Left-hand-side values with addresses.'], ['2010', 'New value terminology', 'Stroustrup\'s N3055 defines lvalue, xvalue, prvalue, glvalue, rvalue.'], ['2011', 'C++11', 'Rvalue references and move semantics.'], ['2017', 'C++17', 'Prvalues materialise temporaries only when needed; guaranteed copy elision.']],
      explain: "Every expression is exactly one of: an **lvalue** (has identity and is not about to expire: variable names, `*p`, `a[i]`, `++x`, a function call returning `T&`, string literals), a **prvalue** (a pure value that initialises an object: literals other than strings, `x + 1`, `x++`, a call returning `T` by value, lambdas), or an **xvalue** (an expiring object with identity: `std::move(x)`, a call returning `T&&`, a member of an rvalue). **glvalue** = lvalue or xvalue (has identity); **rvalue** = prvalue or xvalue (may be moved from). Category decides overload resolution: `T&` binds to lvalues, `T&&` binds to rvalues, and `const T&` binds to everything. The key surprise: **a named rvalue reference is an lvalue**. Inside `void f(std::string&& s)`, the expression `s` is an lvalue, so passing it on copies unless you write `std::move(s)`. `decltype` reveals categories: `decltype((x))` is `T&` for an lvalue, `T&&` for an xvalue, and `T` for a prvalue.",
      diagram: "                expression\n               /          \\\n          glvalue        rvalue\n          /     \\       /     \\\n     lvalue     xvalue      prvalue\n     x, *p,     std::move(x),  42, x + 1,\n     a[i], ++x  f() → T&&      x++, f() → T\nlvalue → binds T& and const T&      rvalue → binds T&& and const T&",
      ex1: ['cpp', 'overloads chosen by value category', "void take(const std::string&) { std::puts(\"copy\"); }\nvoid take(std::string&&)      { std::puts(\"move\"); }\nstd::string s = \"hi\";\ntake(s);                // copy: s is an lvalue\ntake(std::move(s));     // move: xvalue\ntake(std::string(\"t\")); // move: prvalue"],
      ex2: ['cpp', 'a named rvalue reference is an lvalue', "void sink(std::string&& s) {\n  store(s);              // calls store(const std::string&): copies!\n  store(std::move(s));   // calls store(std::string&&): moves\n}"],
      deepDive: {
        explain: "The two properties behind the categories are **identity** (can you take its address, and is it the same object as another expression?) and **movability** (may its resources be stolen?). lvalues have identity and are not movable by default; xvalues have both; prvalues have no identity until materialised. **Temporary materialisation** (C++17) converts a prvalue into an xvalue when an object is needed, for example when binding a reference or accessing a member. That is why `T x = T(T(T()));` constructs exactly one object. Some surprising categories: a string literal is an lvalue (an array with static storage); `this` is a prvalue; an enumerator is a prvalue; a member of an xvalue object is an xvalue; the result of the conditional operator depends on its operands. Function names are lvalues, and a call to a function returning an rvalue reference to a function type is an lvalue too, which is mostly trivia. Knowing categories is what makes overload sets, `decltype`, and forwarding predictable.",
        example: ['cpp', 'inspecting categories with decltype', "int x = 0;\nstatic_assert(std::is_same_v<decltype((x)), int&>);              // lvalue\nstatic_assert(std::is_same_v<decltype((std::move(x))), int&&>);  // xvalue\nstatic_assert(std::is_same_v<decltype((x + 1)), int>);           // prvalue"],
        tradeoffs: [['Category', 'Identity', 'Can be moved from'], ['lvalue', 'Yes', 'Only with std::move'], ['xvalue', 'Yes', 'Yes'], ['prvalue', 'No (until materialised)', 'Yes (initialises directly)'], ['const lvalue', 'Yes', 'No: std::move gives const T&&, which copies']],
        failures: [['Data copied when a move was expected', 'Named rvalue reference passed on without std::move', 'std::move (or std::forward in templates)'], ['std::move had no effect', 'Moving a const object selects the copy constructor', 'Do not make values you want to move const'], ['Overload ambiguity', 'Both T and T&& overloads for the same argument', 'Use const T& and T&& pairs'], ['Reference to a temporary dangles', 'Binding a member of a temporary returned by value', 'Copy the member or keep the owner alive']],
      },
      warn: "std::move on a const object silently copies, because const T&& binds to the copy constructor. Do not declare objects const if you intend to move from them.",
      production: {
        numbers: "Moving a std::string or std::vector copies three pointer-sized fields (24 bytes on 64-bit) regardless of length; copying a 1 MB vector copies 1 MB.",
        observe: "clang-tidy performance-move-const-arg flags std::move on const or trivially copyable values; performance-unnecessary-value-param flags copies that could be moves or references.",
        security: "Value categories do not change safety directly, but misunderstanding them causes dangling references to temporaries, which are use-after-free bugs.",
        checklist: ['Know that named rvalue references are lvalues', 'std::move when passing a parameter on for the last time', 'No std::move on const objects', 'const T& plus T&& overloads where needed', 'decltype((expr)) to check categories', 'No references to members of temporaries kept', 'clang-tidy performance checks'],
        sources: ['Stroustrup, "New value terminology" (N3055, 2010)', 'cppreference.com: Value categories', 'ISO/IEC 14882:2024 [basic.lval]', 'Meyers, "Effective Modern C++", items 23–25'],
      },
      tip: "Ask \"does it have a name?\". If it has a name, it is an lvalue, even if its type is T&&.",
      faq: [['What are the three primary value categories?', 'lvalue, xvalue, and prvalue.'], ['Is a named T&& parameter an lvalue or rvalue?', 'An lvalue; use std::move or std::forward to pass it on as an rvalue.'], ['What category is std::move(x)?', 'An xvalue.'], ['What category is a string literal?', 'An lvalue.'], ['What changed for prvalues in C++17?', 'They materialise a temporary only when needed, which guarantees copy elision.']],
      ex: {
        prompt: 'Write valueCategory(expr) returning "lvalue", "xvalue", or "prvalue" using these rules in order: starts with "std::move(" → xvalue; a string literal (starts with a double quote) → lvalue; prefix ++ or -- → lvalue; postfix ++ or -- → prvalue; contains a space (a binary expression like "x + 1") → prvalue; starts with a digit → prvalue; a call ending in "()" → xvalue if the name starts with "rref_" (returns T&&), lvalue if it starts with "ref_" (returns T&), otherwise prvalue (returns by value); anything else is a variable name → lvalue.',
        fn: 'valueCategory', params: 'expr', sig: '(string expr) -> string',
        cpp: `class Solution {
    static bool starts(const string& s, const string& p) { return s.compare(0, p.size(), p) == 0; }
    static bool ends(const string& s, const string& p) { return s.size() >= p.size() && s.compare(s.size() - p.size(), p.size(), p) == 0; }
public:
    string valueCategory(string e) {
        if (starts(e, "std::move(")) return "xvalue";
        if (e[0] == '"') return "lvalue";
        if (starts(e, "++") || starts(e, "--")) return "lvalue";
        if (ends(e, "++") || ends(e, "--")) return "prvalue";
        if (e.find(' ') != string::npos) return "prvalue";
        if (isdigit((unsigned char)e[0])) return "prvalue";
        if (ends(e, "()")) {
            if (starts(e, "rref_")) return "xvalue";
            if (starts(e, "ref_")) return "lvalue";
            return "prvalue";
        }
        return "lvalue";
    }
};
`,
        cases: [{ args: ['x'], expect: 'lvalue' }, { args: ['42'], expect: 'prvalue' }, { args: ['x + 1'], expect: 'prvalue' }, { args: ['std::move(x)'], expect: 'xvalue' }, { args: ['make()'], expect: 'prvalue' }, { args: ['ref_get()'], expect: 'lvalue' }, { args: ['rref_take()'], expect: 'xvalue' }, { args: ['"hi"'], expect: 'lvalue' }, { args: ['++x'], expect: 'lvalue' }, { args: ['x++'], expect: 'prvalue' }, { args: ['3.5'], expect: 'prvalue' }],
        solution: "function valueCategory(e){if(e.startsWith('std::move('))return'xvalue';if(e[0]==='\"')return'lvalue';if(e.startsWith('++')||e.startsWith('--'))return'lvalue';if(e.endsWith('++')||e.endsWith('--'))return'prvalue';if(e.includes(' '))return'prvalue';if(/^[0-9]/.test(e))return'prvalue';if(e.endsWith('()')){if(e.startsWith('rref_'))return'xvalue';if(e.startsWith('ref_'))return'lvalue';return'prvalue'}return'lvalue'}",
        hint: 'Apply the rules in exactly the given order; the first match wins.',
      },
      quiz: [
        choice('cx-mv-1-q1', 'cpp-value-categories', 'Inside void f(std::string&& s), the expression s is...', ['an lvalue', 'an xvalue', 'a prvalue', 'a constant'], 0, 'It has a name.'),
        choice('cx-mv-1-q2', 'cpp-value-categories', 'Which is a prvalue?', ['x + 1', 'x', '++x', 'std::move(x)'], 0, 'Pure value.'),
        choice('cx-mv-1-q3', 'cpp-value-categories', 'What does std::move(constObj) usually do when passed to a constructor?', ['copies', 'moves', 'fails to compile', 'destroys it'], 0, 'const T&& binds to copy.'),
        fill('cx-mv-1-q4', 'cpp-value-categories', 'std::move(x) produces an ___ (expiring value).', ['xvalue'], 'Expiring.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'cx-mv-2', title: 'Rvalue references, std::move, and the cost of moves', concept: 'cpp-move-semantics',
      story: "Before C++11, returning a `std::vector` from a function or growing a vector of strings meant deep copies, so experienced programmers wrote awkward output parameters and `swap` tricks. Howard Hinnant, Dave Abrahams, and Peter Dimov proposed move semantics in 2002 (N1377); it took until C++11 to ship. Overnight, the standard library got faster without source changes: recompiling code with a C++11 library made vector growth and sorting of strings move instead of copy.",
      analogy: "Copying is photocopying a filing cabinet page by page. Moving is handing over the keys to the cabinet: the new owner has everything instantly, and the old owner is left holding an empty key ring.",
      timeline: [['2002', 'N1377', 'Hinnant, Abrahams, Dimov propose move semantics.'], ['2011', 'C++11', 'Rvalue references, std::move, move constructors in the library.'], ['2014', 'C++14', 'std::exchange makes move constructors concise.'], ['2020s', 'Move-only types', 'unique_ptr, thread, future, and function wrappers rely on moves.']],
      explain: "An **rvalue reference** `T&&` binds to rvalues (temporaries and `std::move`d objects). A **move constructor** `T(T&& other) noexcept` steals the resources of `other` (pointer, size, capacity) and leaves it valid but empty; a **move assignment** does the same into an existing object. **`std::move` does not move anything**: it is a cast to `T&&` that says \"you may steal from this\"; the move happens only if an overload taking `T&&` is chosen. Moves are cheap for types that own heap resources (`vector`, `string`, `unique_ptr`: copy a few pointers) and **no cheaper than copies** for types that store data inline (`std::array<int, 1000>`, structs of ints, short strings in SSO). **Containers** use moves when they reallocate, but only if the element's move constructor is `noexcept` (or the type is not copyable): `std::vector` uses `std::move_if_noexcept` to keep its strong exception guarantee. `push_back(x)` copies an lvalue; `push_back(std::move(x))` or `push_back(T(...))` moves; `emplace_back(args...)` constructs in place. Use `reserve` when you know the size to avoid reallocations altogether.",
      diagram: "std::vector<std::string> v; (capacity doubles: 1, 2, 4, 8 …)\npush_back(s)            → 1 copy\npush_back(std::move(s)) → 1 move (s left empty)\ngrow from 4 to 8        → 4 moves if move ctor is noexcept, else 4 copies\nreserve(n) first        → no reallocation, no extra moves",
      ex1: ['cpp', 'a move constructor that steals and leaves the source empty', "class Blob {\n  size_t n_ = 0; int* p_ = nullptr;\npublic:\n  Blob(Blob&& o) noexcept\n    : n_(std::exchange(o.n_, 0)), p_(std::exchange(o.p_, nullptr)) {}\n  Blob& operator=(Blob&& o) noexcept {\n    if (this != &o) { delete[] p_; n_ = std::exchange(o.n_, 0); p_ = std::exchange(o.p_, nullptr); }\n    return *this;\n  }\n  ~Blob() { delete[] p_; }\n};"],
      ex2: ['cpp', 'copies versus moves into a vector', "std::vector<std::string> names;\nnames.reserve(3);                    // avoid reallocations\nstd::string a = \"Ada\";\nnames.push_back(a);                  // copy: a still usable\nnames.push_back(std::move(a));       // move: a is now valid but unspecified (usually empty)\nnames.emplace_back(10, 'x');         // constructs \"xxxxxxxxxx\" in place"],
      deepDive: {
        explain: "`std::move` is `static_cast<std::remove_reference_t<T>&&>(t)`; nothing else. The compiler generates move operations memberwise when no copy operations, move assignment, or destructor are user-declared, and each member is moved with its own move (falling back to copy for members without moves). **`noexcept` matters**: during reallocation, `std::vector` must not lose elements if a move throws half-way, so it copies unless moving cannot throw. A missing `noexcept` on a user move constructor therefore turns every growth into a full copy, a real and common performance bug, detectable with `static_assert(std::is_nothrow_move_constructible_v<T>)`. Moving is not always cheaper: for SSO strings, moving copies the inline buffer; for `std::array`, it moves each element. **Self-move** (`x = std::move(x)`) must leave `x` valid; the standard library only promises that. Returning a local by value moves implicitly (or elides), so `return std::move(local);` is unnecessary and can prevent elision.",
        example: ['cpp', 'catching a missing noexcept', "struct Row { std::string a, b; };                 // implicit moves are noexcept\nstatic_assert(std::is_nothrow_move_constructible_v<Row>);\nstruct Bad { Bad(Bad&&) {} Bad(const Bad&) = default; };\nstatic_assert(!std::is_nothrow_move_constructible_v<Bad>);   // vector will copy Bad"],
        tradeoffs: [['Operation', 'Cost for vector<int> of 1M elements', 'Source afterwards'], ['Copy', 'Allocate and copy 4 MB', 'Unchanged'], ['Move', 'Copy 3 pointers', 'Valid but unspecified (empty in practice)'], ['emplace_back', 'Construct in place', 'No source'], ['reserve + push_back', 'No reallocation copies or moves', 'n/a']],
        failures: [['Vector growth surprisingly slow', 'Move constructor not noexcept, so elements are copied', 'Mark moves noexcept; static_assert it'], ['Object empty after a call', 'Moved into a function that kept it', 'Do not use after move; pass by const& if still needed'], ['No speed-up from std::move', 'Type has no move constructor or stores data inline', 'Measure; moves only help with owned resources'], ['Moving from a const object copies', 'std::move on const', 'Drop const']],
      },
      warn: "std::move is only a cast. Using an object after moving from it is legal but gives an unspecified value; never rely on its contents until you assign to it again.",
      production: {
        numbers: "With geometric growth by 2 starting from capacity 1, pushing 5 elements reallocates at sizes 1, 2, and 4, relocating 7 existing elements in total; reserve(5) avoids all 7 relocations.",
        observe: "Profile allocation counts in hot paths; static_assert nothrow-move traits for element types; clang-tidy performance-noexcept-move-constructor.",
        security: "A moved-from object may be empty: code that reads it assuming its old contents can leak data or crash. Treat moved-from objects like freshly declared ones.",
        checklist: ['Moves noexcept', 'static_assert nothrow move for container element types', 'reserve when the size is known', 'std::move on last use of a local or parameter', 'No std::move in return statements of locals', 'emplace_back for in-place construction', 'No reads of moved-from values'],
        sources: ['Hinnant, Abrahams, Dimov, "A Proposal to Add Move Semantics Support to the C++ Language" (N1377, 2002)', 'cppreference.com: Move constructors; std::move; std::move_if_noexcept', 'Meyers, "Effective Modern C++", items 23, 29, 41', 'C++ Core Guidelines C.66, F.18'],
      },
      tip: "When a type owns heap memory, a missing noexcept on its move constructor quietly turns vector growth into copying. Add a static_assert next to the class.",
      faq: [['Does std::move move?', 'No. It casts to an rvalue reference; the move constructor or move assignment does the work.'], ['Why must move constructors be noexcept?', 'std::vector only moves during reallocation if moving cannot throw; otherwise it copies.'], ['Are moves always cheaper than copies?', 'No. Types storing data inline (std::array, SSO strings) gain little or nothing.'], ['What state is a moved-from std::string in?', 'Valid but unspecified; in practice usually empty.'], ['When use emplace_back?', 'To construct an element in place from constructor arguments.']],
      ex: {
        prompt: 'Simulate copies and moves while pushing into a std::vector that starts with capacity 0 and grows to max(1, 2 × capacity) when full. Each op is "lvalue" (push_back(x): one copy) or "rvalue" (push_back(std::move(x)): one move). When the vector grows, every existing element is relocated: moved if nothrowMove is true, copied otherwise. Write pushCost(ops, nothrowMove) returning [copies, moves].',
        fn: 'pushCost', params: 'ops, nothrowMove', sig: '(string[] ops, bool nothrowMove) -> int[]',
        cpp: `class Solution {
public:
    vector<int> pushCost(vector<string>& ops, bool nothrowMove) {
        int size = 0, cap = 0, copies = 0, moves = 0;
        for (const string& op : ops) {
            if (size == cap) {
                cap = max(1, cap * 2);
                (nothrowMove ? moves : copies) += size;   // relocate existing elements
            }
            (op == "lvalue" ? copies : moves) += 1;
            size++;
        }
        return {copies, moves};
    }
};
`,
        cases: [{ args: [['lvalue', 'rvalue', 'rvalue', 'lvalue', 'rvalue'], true], expect: [2, 10] }, { args: [['lvalue', 'rvalue', 'rvalue', 'lvalue', 'rvalue'], false], expect: [9, 3] }, { args: [[], true], expect: [0, 0] }, { args: [['rvalue', 'rvalue', 'rvalue'], true], expect: [0, 6] }],
        solution: "function pushCost(ops,nx){let size=0,cap=0,c=0,m=0;for(const op of ops){if(size===cap){cap=Math.max(1,cap*2);if(nx)m+=size;else c+=size}if(op==='lvalue')c++;else m++;size++}return[c,m]}",
        hint: 'Before each push, grow if size equals capacity and count the relocations; then count the push itself.',
      },
      quiz: [
        choice('cx-mv-2-q1', 'cpp-move-semantics', 'What does std::move(x) do by itself?', ['casts x to an rvalue reference', 'moves x\'s memory', 'destroys x', 'copies x'], 0, 'Only a cast.'),
        choice('cx-mv-2-q2', 'cpp-move-semantics', 'When does std::vector copy elements during reallocation?', ['when the move constructor may throw and a copy constructor exists', 'always', 'never', 'only for ints'], 0, 'move_if_noexcept.'),
        choice('cx-mv-2-q3', 'cpp-move-semantics', 'Moving a std::array<int, 1000> is...', ['about as expensive as copying it', 'free', 'a pointer swap', 'not allowed'], 0, 'Inline data.'),
        fill('cx-mv-2-q4', 'cpp-move-semantics', 'Move constructors should be marked ___ so containers use them.', ['noexcept'], 'Strong guarantee.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'cx-mv-3', title: 'Forwarding references and std::forward', concept: 'cpp-perfect-forwarding',
      story: "Library writers had a long-standing problem: a wrapper such as a factory or `emplace_back` must pass its arguments on exactly as received, lvalues as lvalues and rvalues as rvalues, or it either fails to compile or copies needlessly. Before C++11 this needed 2^N overloads for N parameters. C++11 solved it with a special deduction rule for `T&&` in templates plus reference collapsing; Scott Meyers named such parameters \"universal references\", and the standard later adopted the name **forwarding references**.",
      analogy: "A forwarding reference is a courier who delivers packages exactly as received: fragile stays fragile, express stays express. std::forward is the label that tells the next courier which kind of package it was.",
      timeline: [['2002', 'The forwarding problem', 'N1385 describes the need for perfect forwarding.'], ['2011', 'C++11', 'T&& deduction rule, reference collapsing, std::forward, variadic templates.'], ['2012', 'Universal references', 'Meyers names the idea in a talk and article.'], ['2014', 'Forwarding reference', 'The standard adopts the term (N4164).']],
      explain: "In `template <class T> void f(T&& x)`, and in `auto&& x = ...`, `T&&` is a **forwarding reference**, not an rvalue reference. Deduction: an lvalue argument of type `U` deduces `T = U&`; an rvalue deduces `T = U`. **Reference collapsing** then simplifies the parameter type: `& &`, `& &&`, and `&& &` collapse to `&`; only `&& &&` stays `&&`. So the parameter becomes `U&` for lvalues and `U&&` for rvalues. Inside the function, `x` has a name and is therefore an lvalue; **`std::forward<T>(x)`** casts it back to an rvalue only if `T` was deduced as a non-reference (the argument was an rvalue). Use `std::forward` on forwarding references and `std::move` on rvalue references, never the other way round. Variadic templates combine with forwarding: `template <class... Args> T* make(Args&&... args) { return new T(std::forward<Args>(args)...); }`, which is how `std::make_unique` and `emplace_back` work. `T&&` is only a forwarding reference when `T` is deduced at that call: `std::vector<T>::push_back(T&&)` is a plain rvalue reference because `T` is fixed by the class.",
      diagram: "template <class T> void f(T&& x);\nf(lv)   lv is int lvalue → T = int&  → T&& = int& &&  → int&\nf(42)   rvalue           → T = int   → T&& = int&&\ncollapse: & & → &   & && → &   && & → &   && && → &&\nstd::forward<T>(x): T = int& → lvalue · T = int → rvalue",
      ex1: ['cpp', 'a perfect-forwarding factory', "template <class T, class... Args>\nstd::unique_ptr<T> make(Args&&... args) {\n  return std::unique_ptr<T>(new T(std::forward<Args>(args)...));\n}\nstd::string name = \"Ada\";\nauto a = make<Person>(name, 36);              // name copied (lvalue)\nauto b = make<Person>(std::string(\"Grace\"), 85); // moved (rvalue)"],
      ex2: ['cpp', 'not every T&& forwards', "template <class T> void f(T&& x);           // forwarding reference\ntemplate <class T> void g(std::vector<T>&& v); // rvalue reference only\ntemplate <class T> struct Box { void put(T&& x); };  // rvalue reference: T fixed by Box<T>\nauto&& r = expr;                              // forwarding reference"],
      deepDive: {
        explain: "`std::forward<T>(x)` is `static_cast<T&&>(x)`: with `T = U&` the cast collapses to `U&` (lvalue), with `T = U` it yields `U&&` (rvalue). Forward each argument **at most once**: forwarding twice may move from it twice. Overloading on forwarding references is a trap: `template <class T> void f(T&&)` beats almost every other overload, including copy constructors when the argument is a non-const lvalue, so a class with a forwarding constructor can hijack copying. Constrain it with C++20 concepts (`requires (!std::same_as<std::remove_cvref_t<T>, Widget>)`) or `std::enable_if` in C++17. Forwarding fails for braced initialiser lists, `0` or `NULL` as null pointers, bit-fields, and overloaded function names. Lambdas forward with `auto&&` parameters and `std::forward<decltype(x)>(x)`; C++20 template lambdas (`[]<class T>(T&& x)`) make it cleaner.",
        example: ['cpp', 'constraining a forwarding constructor (C++20)', "class Widget {\n  std::string name_;\npublic:\n  template <class S>\n    requires std::constructible_from<std::string, S&&> &&\n             (!std::same_as<std::remove_cvref_t<S>, Widget>)\n  explicit Widget(S&& s) : name_(std::forward<S>(s)) {}\n  Widget(const Widget&) = default;   // no longer hijacked\n};"],
        tradeoffs: [['Parameter style', 'Handles', 'Cost'], ['const T&', 'Everything, read-only', 'Copies when storing'], ['T&& (non-template)', 'Rvalues only', 'Needs a const T& overload for lvalues'], ['Forwarding T&&', 'Everything, preserving category', 'Template; overload hijacking; error messages'], ['By value then move', 'Everything', 'One extra move']],
        failures: [['Copy constructor not called for non-const lvalues', 'Forwarding constructor is a better match', 'Constrain it with concepts or enable_if'], ['Object used after being moved twice', 'std::forward applied twice to one argument', 'Forward once, last'], ['Rvalue arguments copied in a wrapper', 'Passed x instead of std::forward<T>(x)', 'Forward'], ['Braced list fails to forward', 'Initialiser lists have no type to deduce', 'Create the object first or use std::initializer_list explicitly']],
      },
      warn: "Use std::forward only with forwarding references (deduced T&&) and std::move only with rvalue references. Mixing them up either moves lvalues the caller still needs or copies rvalues.",
      production: {
        numbers: "Without perfect forwarding, a wrapper with N parameters needs 2^N overloads to preserve lvalue and rvalue arguments: 8 overloads for 3 parameters, 1,024 for 10.",
        observe: "clang-tidy bugprone-move-forwarding-reference and cppcoreguidelines-missing-std-forward catch std::move on forwarding references and parameters that are never forwarded.",
        security: "Forwarding mistakes that move from a caller's lvalue leave the caller with an emptied object: a correctness bug that can surface as missing data or null dereferences.",
        checklist: ['std::forward only on deduced T&&', 'Forward each argument once', 'Forwarding constructors constrained', 'Variadic forwarding for factories and emplace', 'auto&& with decltype in generic lambdas', 'clang-tidy forwarding checks', 'Plain const& when no generic forwarding is needed'],
        sources: ['Hinnant, Dimov, Abrahams, "The Forwarding Problem: Arguments" (N1385, 2002)', 'Sutter, Stroustrup, Dos Reis, "Forwarding References" (N4164, 2014)', 'cppreference.com: Reference declaration (reference collapsing, forwarding references); std::forward', 'Meyers, "Effective Modern C++", items 24–30'],
      },
      tip: "If the && is attached to a template parameter deduced right there (T&& or auto&&), it forwards; anything else is a plain rvalue reference.",
      faq: [['What is a forwarding reference?', 'A T&& (or auto&&) where T is deduced at that call; it binds to lvalues and rvalues.'], ['What do & && and && & collapse to?', 'Both collapse to &.'], ['What does std::forward<T>(x) return for T = int&?', 'An lvalue reference (int&).'], ['Is std::vector<T>::push_back(T&&) a forwarding reference?', 'No; T is fixed by the class, so it is an rvalue reference.'], ['Why constrain forwarding constructors?', 'They can outcompete the copy constructor for non-const lvalues.']],
      ex: {
        prompt: 'Write collapseRefs(type) applying reference collapsing to a type written as a base name followed by reference tokens separated by spaces, such as "int& &&". The result is the base followed by "&&" if every token is &&, "&" if any token is &, or just the base if there are no tokens.',
        fn: 'collapseRefs', params: 'type', sig: '(string type) -> string',
        cpp: `class Solution {
public:
    string collapseRefs(string type) {
        size_t i = 0;
        while (i < type.size() && type[i] != '&' && type[i] != ' ') i++;
        string base = type.substr(0, i);
        bool any = false, allDouble = true;
        while (i < type.size()) {
            if (type[i] == '&') {
                any = true;
                if (i + 1 < type.size() && type[i + 1] == '&') i += 2;
                else { allDouble = false; i += 1; }
            } else i++;
        }
        if (!any) return base;
        return base + (allDouble ? "&&" : "&");
    }
};
`,
        cases: [{ args: ['int& &&'], expect: 'int&' }, { args: ['int&& &&'], expect: 'int&&' }, { args: ['T&& &'], expect: 'T&' }, { args: ['int& &'], expect: 'int&' }, { args: ['int&&'], expect: 'int&&' }, { args: ['int'], expect: 'int' }, { args: ['Widget&& && &&'], expect: 'Widget&&' }],
        solution: "function collapseRefs(t){const m=t.match(/^([^&\\s]+)\\s*(.*)$/);const refs=m[2].match(/&&|&/g)||[];if(!refs.length)return m[1];return m[1]+(refs.every(r=>r==='&&')?'&&':'&')}",
        hint: 'Read the base name, then scan the remaining tokens; a single & anywhere makes the result an lvalue reference.',
      },
      quiz: [
        choice('cx-mv-3-q1', 'cpp-perfect-forwarding', 'For template <class T> void f(T&& x); called with an int lvalue, T is...', ['int&', 'int', 'int&&', 'const int'], 0, 'Special deduction rule.'),
        choice('cx-mv-3-q2', 'cpp-perfect-forwarding', 'Which collapses to an rvalue reference?', ['&& &&', '& &&', '&& &', '& &'], 0, 'Only double-double.'),
        choice('cx-mv-3-q3', 'cpp-perfect-forwarding', 'Which function preserves an argument\'s category when passing it on from a forwarding reference?', ['std::forward<T>(x)', 'std::move(x)', 'static_cast<T>(x)', 'std::ref(x)'], 0, 'Conditional cast.'),
        fill('cx-mv-3-q4', 'cpp-perfect-forwarding', 'Combining & with && in templates is called reference ___', ['collapsing'], 'Collapsing rules.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'cx-mv-4', title: 'Copy elision and return value optimisation', concept: 'cpp-copy-elision',
      story: "Compilers have been allowed to skip copies when returning objects since the first C++ standard; Walter Bright's Zortech C++ compiler implemented named return value optimisation around 1991. For decades it remained an optional optimisation, so types still needed copy or move constructors even when they were never called. C++17 (P0135, \"guaranteed copy elision\") changed the rules: initialising an object from a prvalue of the same type now constructs it directly, with no copy or move to elide, so even non-movable types can be returned from factories.",
      analogy: "Instead of building furniture in the shop and then carrying it to your flat, the carpenter comes to your flat and builds it in the room where it will stay.",
      timeline: [['1991', 'NRVO in Zortech C++', 'Early named return value optimisation.'], ['1998', 'C++98', 'Copy elision permitted but optional.'], ['2011', 'C++11', 'Implicit move on return of locals.'], ['2017', 'C++17', 'Guaranteed copy elision for prvalues (P0135).']],
      explain: "**RVO** (return value optimisation) applies when a function returns a prvalue: `return Widget(args);` or `return Widget{...};`. Since C++17 this is **guaranteed**: the object is constructed directly in the caller's storage, and the type needs no copy or move constructor. **NRVO** (named RVO) applies to `Widget w; ...; return w;`: compilers usually construct `w` directly in the return slot, but it is **not guaranteed**, and fails when different named objects are returned on different paths. If NRVO does not happen, the language applies an **implicit move**: returning a local variable (or a by-value parameter) treats it as an rvalue first. So `return std::move(local);` is never needed and actively **prevents NRVO** (the expression is no longer just a name). Returning a **member** or a **global** copies, because they outlive the function; to transfer a member out, write `return std::move(member_);` deliberately. Passing a prvalue argument by value also elides: `f(Widget{})` constructs the parameter directly.",
      diagram: "Widget make() { return Widget{1}; }        → guaranteed elision (C++17): 0 copies, 0 moves\nWidget make() { Widget w; return w; }      → NRVO usually; else implicit move\nWidget make() { Widget w; return std::move(w); }  → forces a move: blocks NRVO\nWidget take(Widget p) { return p; }        → implicit move (parameters are not NRVO candidates)\nWidget get() { return member_; }           → copy (member outlives the call)",
      ex1: ['cpp', 'returning non-movable types (C++17)', "struct Lock {\n  Lock(const Lock&) = delete;\n  Lock(Lock&&) = delete;\n  explicit Lock(std::mutex& m);\n};\nLock acquire(std::mutex& m) { return Lock(m); }   // OK in C++17: no copy or move exists\nLock l = acquire(mtx);"],
      ex2: ['cpp', 'the std::move pessimisation', "std::vector<int> build() {\n  std::vector<int> v(1000);\n  return v;               // NRVO or implicit move\n  // return std::move(v); // worse: disables NRVO; -Wpessimizing-move warns\n}"],
      deepDive: {
        explain: "Mechanically, the caller allocates space for the return value and passes its address as a hidden argument; the callee constructs into it. Guaranteed elision follows from the C++17 rule that prvalues are not objects until materialised: `T x = T(T(T()))` simply initialises `x`. NRVO is easier for compilers when there is a single named return variable on all paths; returning different locals from different branches, or returning a function parameter, generally prevents it. C++20 (P1825) widened implicit move to rvalue reference parameters and more cases, and C++23 (P2266) simplified it further: a returned id-expression naming a local or parameter is treated as an xvalue. Elision also covers throwing and catching by value (optional) and initialising from temporaries. Because elision is guaranteed for prvalues, factories can return `std::atomic`, `std::mutex` wrappers, or other immovable types, and \"return by value\" is the idiomatic way to produce results instead of output parameters.",
        example: ['cpp', 'NRVO blocked by two named returns', "std::string pick(bool b) {\n  std::string x = \"left\", y = \"right\";\n  if (b) return x;   // two different named objects:\n  return y;          // NRVO unlikely; each return is an implicit move\n}"],
        tradeoffs: [['Return form', 'Copies/moves', 'Guaranteed?'], ['return T{...};', 'None', 'Yes (C++17)'], ['return local;', 'None with NRVO, else one move', 'NRVO no; implicit move yes'], ['return std::move(local);', 'One move', 'Blocks NRVO'], ['return member_;', 'One copy', 'n/a: member outlives call']],
        failures: [['Extra move in profiles', 'return std::move(local)', 'Return the name; -Wpessimizing-move'], ['Unexpected deep copy of a big member', 'Returning a member by value copies', 'Return const& or std::move the member if transferring'], ['Code relies on a copy constructor side effect', 'Elision skipped the constructor', 'Never put essential side effects in copy constructors'], ['Output-parameter APIs everywhere', 'Fear of copies from pre-C++11 days', 'Return by value']],
      },
      warn: "Do not write return std::move(localVariable); it disables NRVO and is never needed. Compilers warn with -Wpessimizing-move and -Wredundant-move.",
      production: {
        numbers: "Returning a std::vector<int> of 1,000,000 elements by value costs no element copies: elision costs nothing, and the fallback implicit move copies only 3 pointers.",
        observe: "-Wpessimizing-move and -Wredundant-move (GCC and Clang) flag unnecessary std::move in returns; Compiler Explorer shows whether NRVO happened.",
        security: "No direct security impact, but returning by value instead of out-parameters removes uninitialised-output bugs and aliasing surprises.",
        checklist: ['Return by value, not out-parameters', 'return T{...} for guaranteed elision', 'Single named return variable when possible', 'No std::move on returned locals', 'Deliberate std::move when returning a member you are giving away', 'No side effects in copy constructors', '-Wpessimizing-move enabled'],
        sources: ['Smith, "Guaranteed copy elision through simplified value categories" (P0135R1, C++17)', 'cppreference.com: Copy elision; return statement (automatic move)', 'P1825R0 "Merged wording for P0527R1 and P1155R3" (C++20) and P2266R3 "Simpler implicit move" (C++23)', 'Meyers, "Effective Modern C++", item 25'],
      },
      tip: "Write factories that return by value and let the compiler build the result in place; reach for out-parameters only for buffers you deliberately reuse.",
      faq: [['Is RVO guaranteed?', 'For prvalues (return T{...}) yes since C++17; NRVO for named locals is not guaranteed.'], ['What happens if NRVO does not apply?', 'The returned local is implicitly moved.'], ['Why avoid return std::move(local)?', 'It disables NRVO and forces a move.'], ['Can a function return a non-movable type?', 'Yes since C++17, if it returns a prvalue.'], ['Does returning a member move it?', 'No, it copies; members outlive the function.']],
      ex: {
        prompt: 'Write returnCost(kind) giving what happens on return for each pattern: "prvalue" (return T{...}) → "elided"; "named" (return local;) → "nrvo-or-move"; "move-local" (return std::move(local);) → "move"; "param" (return a by-value parameter) → "move"; "member" (return member_;) → "copy"; "global" (return a global) → "copy".',
        fn: 'returnCost', params: 'kind', sig: '(string kind) -> string',
        cpp: `class Solution {
public:
    string returnCost(string kind) {
        static const map<string, string> rules = {
            {"prvalue", "elided"}, {"named", "nrvo-or-move"}, {"move-local", "move"},
            {"param", "move"}, {"member", "copy"}, {"global", "copy"},
        };
        return rules.at(kind);
    }
};
`,
        cases: [{ args: ['prvalue'], expect: 'elided' }, { args: ['named'], expect: 'nrvo-or-move' }, { args: ['move-local'], expect: 'move' }, { args: ['param'], expect: 'move' }, { args: ['member'], expect: 'copy' }, { args: ['global'], expect: 'copy' }],
        solution: "function returnCost(k){return {prvalue:'elided',named:'nrvo-or-move','move-local':'move',param:'move',member:'copy',global:'copy'}[k]}",
        hint: 'Prvalues are built in place; locals and parameters move implicitly; objects that outlive the function are copied.',
      },
      quiz: [
        choice('cx-mv-4-q1', 'cpp-copy-elision', 'Since C++17, return Widget{1}; is...', ['guaranteed to construct directly in the caller', 'always a move', 'always a copy', 'undefined'], 0, 'P0135.'),
        choice('cx-mv-4-q2', 'cpp-copy-elision', 'What does return std::move(local); do?', ['forces a move and blocks NRVO', 'guarantees elision', 'copies', 'is required for performance'], 0, 'Pessimisation.'),
        choice('cx-mv-4-q3', 'cpp-copy-elision', 'Returning a data member by value...', ['copies it', 'moves it automatically', 'elides', 'is not allowed'], 0, 'It outlives the call.'),
        fill('cx-mv-4-q4', 'cpp-copy-elision', 'The optimisation that builds a returned named local in the caller\'s storage is abbreviated ___', ['NRVO'], 'Named RVO.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'cx-mv-5', title: 'Sink parameters: by value, by const reference, or overloads', concept: 'cpp-sink-parameters',
      story: "When move semantics arrived, a debate followed about how to write a setter that stores its argument. Dave Abrahams' 2009 article \"Want speed? Pass by value.\" argued for taking the parameter by value and moving it into place. Herb Sutter's CppCon 2014 talk \"Back to the Basics!\" pushed back with measurements: for types such as `std::string` that can reuse an existing buffer, by-value setters can be slower than `const&` because they always allocate a fresh copy. The modern answer depends on the operation: constructors that initialise members are good candidates for by-value, assignments into existing objects often are not.",
      analogy: "A sink parameter is a letter you are posting. By value is photocopying it at the counter and sending the copy (or handing over the original if you no longer need it). const& is letting the post office photocopy it. Two overloads are a counter that accepts either a copy request or your original envelope.",
      timeline: [['2009', '"Want speed? Pass by value."', 'Abrahams argues for by-value parameters with moves.'], ['2011', 'C++11', 'Move semantics make the pattern possible.'], ['2014', '"Back to the Basics!"', 'Sutter shows when const& wins for assignment-like setters.'], ['2020s', 'Core Guidelines F.15–F.18', 'Guidance per parameter kind.']],
      explain: "A **sink parameter** is one the function stores (keeps a copy of). Three styles: **(1) `const T&` then copy**: an lvalue argument costs one copy; an rvalue argument also costs one copy, because you cannot move from a const reference. **(2) `T` by value then `std::move` into place**: an lvalue costs one copy (into the parameter) plus one move; an rvalue costs a move into the parameter (often elided for prvalues) plus one move, so with two moves counted at worst. **(3) Two overloads**, `const T&` (copy) and `T&&` (move): one copy for lvalues and one move for rvalues, the minimum possible, at the cost of writing two functions (or 2^N for N parameters, where perfect forwarding takes over). Guidance: use by value for **constructors** and functions that always store a new object (cheap extra move, one function); use `const T&` for **setters on long-lived objects** where assignment can reuse existing capacity (`name_ = n;` may not allocate); use overloads or forwarding in hot library code. Never take by value types that are expensive to move (large `std::array`, structs of many fields).",
      diagram: "style              lvalue arg          rvalue arg\nconst T& + copy     1 copy              1 copy\nT + std::move       1 copy + 1 move     0 copies + 2 moves (1 if elided)\nconst T& / T&&      1 copy              1 move           ← minimal, two functions",
      ex1: ['cpp', 'by-value sink in a constructor', "class Person {\n  std::string name_;\npublic:\n  explicit Person(std::string name) : name_(std::move(name)) {}\n};\nstd::string n = \"Ada\";\nPerson a(n);                 // 1 copy + 1 move\nPerson b(std::string(\"Bo\")); // prvalue: parameter built in place, then 1 move"],
      ex2: ['cpp', 'overloaded setter for minimal cost', "class Config {\n  std::string path_;\npublic:\n  void setPath(const std::string& p) { path_ = p; }            // may reuse capacity\n  void setPath(std::string&& p) noexcept { path_ = std::move(p); }\n};"],
      deepDive: {
        explain: "The extra move in the by-value style is usually a few pointer copies, so it is negligible for strings and vectors. The hidden cost is **allocation**: a `const T&` setter assigning into an existing `std::string` with enough capacity performs no allocation, while the by-value version always constructs a new string for the parameter (allocating if longer than SSO) and then throws away the old buffer. Sutter's measurements showed by-value setters 2–3× slower for this case. For **constructors**, there is no existing buffer to reuse, so by-value is as good as overloads. With multiple sink parameters, overloads explode, and the choice becomes by-value or a constrained forwarding template. `std::string_view` parameters are a separate pattern for read-only access, not for sinks: storing from a `string_view` always copies. For move-only types (`std::unique_ptr`), by value is the clear choice: callers must write `std::move`, which documents the ownership transfer.",
        example: ['cpp', 'move-only sinks are always by value', "class Scene {\n  std::vector<std::unique_ptr<Shape>> shapes_;\npublic:\n  void add(std::unique_ptr<Shape> s) { shapes_.push_back(std::move(s)); }\n};\nscene.add(std::make_unique<Circle>(1.0));   // ownership transfer is explicit"],
        tradeoffs: [['Style', 'Best for', 'Drawback'], ['const T& + copy', 'Assignment-like setters; capacity reuse', 'Rvalues still copied'], ['T by value + move', 'Constructors; move-only types; simple APIs', 'Extra move; no capacity reuse'], ['const T& / T&& overloads', 'Hot paths needing minimal work', 'Two functions per sink'], ['Forwarding template', 'Many sink parameters, generic code', 'Template bloat; constraints needed']],
        failures: [['Setter allocates on every call', 'By-value parameter discards reusable capacity', 'const T& setter, or overloads'], ['Rvalue arguments copied', 'Only a const T& overload exists', 'Add a T&& overload or take by value'], ['Large struct passed by value is slow', 'Expensive-to-move type taken by value', 'const& for big trivially-copyable types'], ['Callers surprised that their object emptied', 'Function took T&& and moved silently', 'Make ownership transfer visible with by-value parameters']],
      },
      warn: "Do not take expensive-to-move types (large std::array or plain structs) by value as sinks; a move of inline data is a full copy.",
      production: {
        numbers: "Sutter's CppCon 2014 measurements showed by-value string setters about 2–3× slower than const& when the target string already had enough capacity, because they allocate a fresh buffer each call.",
        observe: "Count allocations in hot setters with a heap profiler; benchmark setter styles with realistic string lengths (inside and outside SSO).",
        security: "Unnecessary allocations in request paths increase memory pressure and denial-of-service surface; reuse capacity where inputs are attacker-sized.",
        checklist: ['Constructors take sinks by value and move', 'Setters on long-lived objects take const&', 'Hot paths: const& and && overloads', 'Move-only types by value', 'No by-value for large inline types', 'string_view for read-only, not sinks', 'Benchmark with realistic sizes'],
        sources: ['Abrahams, "Want Speed? Pass by Value." (C++Next, 2009)', 'Sutter, "Back to the Basics! Essentials of Modern C++ Style" (CppCon 2014)', 'C++ Core Guidelines F.15–F.18', 'Meyers, "Effective Modern C++", item 41'],
      },
      tip: "Constructors: by value and move. Setters: const& (plus && if hot). Ownership transfer of move-only types: by value.",
      faq: [['What is a sink parameter?', 'A parameter whose value the function stores.'], ['Cost of passing an lvalue to a by-value sink?', 'One copy into the parameter plus one move into place.'], ['Why can const& setters be faster than by-value?', 'Assignment can reuse the existing buffer\'s capacity instead of allocating.'], ['When are two overloads worth it?', 'In hot code where the minimum one copy or one move matters.'], ['How should unique_ptr sinks be taken?', 'By value; callers write std::move to transfer ownership.']],
      ex: {
        prompt: 'Write setterCost(style, arg) returning [copies, moves] for storing one std::string argument. style is "constref" (const T& then copy), "value" (T by value then std::move into the member), or "overloads" (const T& and T&& overloads). arg is "lvalue" or "rvalue" (an xvalue such as std::move(s), so the by-value parameter is move-constructed). Costs: constref → [1,0] for both; value → lvalue [1,1], rvalue [0,2]; overloads → lvalue [1,0], rvalue [0,1].',
        fn: 'setterCost', params: 'style, arg', sig: '(string style, string arg) -> int[]',
        cpp: `class Solution {
public:
    vector<int> setterCost(string style, string arg) {
        bool lv = arg == "lvalue";
        if (style == "constref") return {1, 0};                // rvalues still copied
        if (style == "value") return lv ? vector<int>{1, 1} : vector<int>{0, 2};
        return lv ? vector<int>{1, 0} : vector<int>{0, 1};     // overloads: minimal
    }
};
`,
        cases: [{ args: ['constref', 'lvalue'], expect: [1, 0] }, { args: ['constref', 'rvalue'], expect: [1, 0] }, { args: ['value', 'lvalue'], expect: [1, 1] }, { args: ['value', 'rvalue'], expect: [0, 2] }, { args: ['overloads', 'lvalue'], expect: [1, 0] }, { args: ['overloads', 'rvalue'], expect: [0, 1] }],
        solution: "function setterCost(style,arg){if(style==='constref')return[1,0];if(style==='value')return arg==='lvalue'?[1,1]:[0,2];return arg==='lvalue'?[1,0]:[0,1]}",
        hint: 'A const reference can only be copied from; a by-value parameter adds one move into the member.',
      },
      quiz: [
        choice('cx-mv-5-q1', 'cpp-sink-parameters', 'Passing an rvalue to a const std::string& sink that stores it costs...', ['one copy', 'one move', 'nothing', 'two moves'], 0, 'Cannot move from const.'),
        choice('cx-mv-5-q2', 'cpp-sink-parameters', 'Recommended style for a constructor storing a string:', ['take by value and std::move into the member', 'take by non-const reference', 'take a raw pointer', 'take std::string_view and store the view'], 0, 'Simple and near-optimal.'),
        choice('cx-mv-5-q3', 'cpp-sink-parameters', 'Why can a const& setter beat a by-value setter?', ['assignment reuses existing capacity', 'references are faster to pass', 'moves are expensive for strings', 'the compiler inlines it'], 0, 'No allocation.'),
        fill('cx-mv-5-q4', 'cpp-sink-parameters', 'A unique_ptr sink parameter is taken by ___', ['value'], 'Explicit transfer.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'cx-mv-6', title: 'Moved-from objects and use after move', concept: 'cpp-moved-from',
      story: "Move semantics gave C++ a new kind of bug. After `auto b = std::move(a);`, the object `a` still exists, its destructor will still run, and the compiler happily lets you read it. The standard library promises only that moved-from library objects are in a **valid but unspecified state**. Teams discovered this when code that read a moved-from string worked with one standard library (which left it empty) and behaved differently with another, or when a moved-from vector was reused without being cleared. Static analysers added \"use after move\" checks to catch it.",
      analogy: "A moved-from object is a house after the removal van has left: the building is still standing and can be furnished again, but you should not expect to find your sofa in the living room.",
      timeline: [['2011', 'C++11', 'Library objects left "valid but unspecified" after moves.'], ['2016', 'clang-tidy', 'bugprone-use-after-move check added.'], ['2017', 'C++17', 'Library wording on moved-from state stays the same; guidance matures.'], ['2020s', 'Static analysis', 'Compilers and analysers (MSVC, Clang static analyser) warn on use after move.']],
      explain: "After a move, the source object must still be **destructible** and **assignable**; for standard library types it is in a **valid but unspecified state**, meaning every operation without preconditions works (`size()`, `clear()`, `empty()`, assignment), but you must not assume its value. In practice `std::string`, `std::vector`, and `std::unique_ptr` end up empty or null, but only `unique_ptr`, `shared_ptr`, and a few others **guarantee** it (they are specified as null after a move). Safe uses of a moved-from object: destroy it, **assign** a new value to it, or call a function with no preconditions such as `clear()` to reset it to a known state. Unsafe uses: reading its value, calling `front()` or `operator[]`, or dereferencing a moved-from smart pointer. Your own types should leave moved-from objects in a simple, documented state (usually empty), never half-broken. Common bug patterns: moving inside a loop (`for (...) consume(std::move(buf));` moves an already-moved buffer on the second iteration), and moving an argument while also reading it in the same call (`f(std::move(s), s.size())`, where evaluation order matters).",
      diagram: "std::string a = \"hello\";\nauto b = std::move(a);\na.size()      → valid call, unspecified value (usually 0)\na[0]          → precondition may fail: do not\na = \"again\";  → fine: a has a known value again\na.clear();    → fine: a is now known empty\nunique_ptr after move → guaranteed nullptr",
      ex1: ['cpp', 'reusing a buffer correctly in a loop', "std::vector<Record> batch;\nwhile (read(r)) {\n  batch.push_back(r);\n  if (batch.size() == 100) {\n    send(std::move(batch));\n    batch.clear();          // reset to a known state before reuse\n  }\n}"],
      ex2: ['cpp', 'a classic use-after-move', "void log(std::string msg, size_t len);\nstd::string s = \"payload\";\nlog(std::move(s), s.size());   // s.size() may run after the move (unspecified order)\nauto n = s.size();             // before: read first\nlog(std::move(s), n);"],
      deepDive: {
        explain: "The C++ standard's library-wide rule ([lib.types.movedfrom]) says objects of library types that have been moved from are in a valid but unspecified state unless otherwise specified. Smart pointers, `std::thread`, `std::function` (unspecified in some cases), and similar handles specify exactly what happens. Evaluation order of function arguments is **unspecified** (indeterminately sequenced since C++17), so mixing a move and a read of the same object in one call is a bug even if it seems to work. Since C++17, some expressions do have a fixed order (`a.b(c)` evaluates `a` first, assignments evaluate the right side first, `<<` evaluates left to right), but relying on these subtleties for moves is fragile. Tooling: `clang-tidy bugprone-use-after-move` tracks moves within a function and treats reinitialisation (`clear()`, `assign`, `=`) as resetting the state. For your own classes, the strongest design is \"moved-from equals default-constructed\" (empty), which `std::exchange` makes easy, and which lets users reason about reuse.",
        example: ['cpp', 'a moved-from state that is well defined', "class Handle {\n  int fd_ = -1;\npublic:\n  Handle(Handle&& o) noexcept : fd_(std::exchange(o.fd_, -1)) {}   // source becomes empty\n  Handle& operator=(Handle&& o) noexcept { if (this != &o) { reset(); fd_ = std::exchange(o.fd_, -1); } return *this; }\n  bool valid() const { return fd_ >= 0; }\n  void reset() { if (fd_ >= 0) ::close(fd_); fd_ = -1; }\n  ~Handle() { reset(); }\n};"],
        tradeoffs: [['After a move you may…', 'Safe?', 'Why'], ['Destroy it', 'Yes', 'Must always work'], ['Assign a new value', 'Yes', 'Restores a known state'], ['Call clear()/empty()/size()', 'Yes', 'No preconditions'], ['Read its contents or call front()', 'No', 'Unspecified value; precondition may fail']],
        failures: [['Second loop iteration sends an empty batch', 'Moved inside the loop without resetting', 'clear() after the move or declare inside the loop'], ['Different behaviour across compilers', 'Relying on the moved-from value', 'Assign or clear before reuse'], ['Null dereference', 'Using a unique_ptr after std::move', 'Check or reassign first'], ['Wrong length logged', 'Move and read of the same object in one call', 'Read into a local first']],
      },
      warn: "Treat a moved-from object as if it were just declared: assign to it or clear it before using its value again.",
      production: {
        numbers: "clang-tidy bugprone-use-after-move runs in seconds per translation unit and finds use-after-move bugs that tests often miss because the moved-from value happens to look plausible.",
        observe: "Enable bugprone-use-after-move in CI; MSVC's C26800 warning and the Clang static analyser report similar cases.",
        security: "Use after move of a smart pointer is a null dereference; use after move of buffers can send empty or stale data. Both are correctness bugs that can become availability issues.",
        checklist: ['No reads after std::move until reassignment', 'clear() or assignment before reuse', 'No move and read of the same object in one expression', 'Own types: moved-from = empty', 'std::exchange in move operations', 'bugprone-use-after-move in CI', 'Loops do not move the same object twice'],
        sources: ['ISO/IEC 14882:2024 [lib.types.movedfrom]', 'cppreference.com: std::move (notes on moved-from state)', 'clang-tidy documentation: bugprone-use-after-move', 'C++ Core Guidelines ES.56 ("Write std::move() only when you need to explicitly move an object to another scope")'],
      },
      tip: "Put std::move only on the last use of a variable. If the variable is used again later, the move is either a bug or needs a reset right after it.",
      faq: [['What state is a moved-from std::vector in?', 'Valid but unspecified; usually empty, but call clear() before relying on it.'], ['Which types guarantee a null state after a move?', 'std::unique_ptr and std::shared_ptr, among others.'], ['What can you safely do with a moved-from object?', 'Destroy it, assign to it, or call functions without preconditions.'], ['Why is f(std::move(s), s.size()) a bug?', 'Argument evaluation order is unspecified, so size() may see the moved-from state.'], ['How do you design your own moved-from state?', 'Make it equal to the default (empty) state, often using std::exchange.']],
      ex: {
        prompt: 'Write useAfterMove(ops) flagging uses of moved-from variables. ops are "move:<v>" (v is moved from), "assign:<v>" or "clear:<v>" (v is reset to a known state), and "use:<v>" (reads v). Return "<v>@<index>" for each use of a variable that is currently moved-from, in order.',
        fn: 'useAfterMove', params: 'ops', sig: '(string[] ops) -> string[]',
        cpp: `class Solution {
public:
    vector<string> useAfterMove(vector<string>& ops) {
        set<string> moved;
        vector<string> out;
        for (size_t i = 0; i < ops.size(); i++) {
            size_t c = ops[i].find(':');
            string kind = ops[i].substr(0, c), v = ops[i].substr(c + 1);
            if (kind == "move") moved.insert(v);
            else if (kind == "assign" || kind == "clear") moved.erase(v);
            else if (moved.count(v)) out.push_back(v + "@" + to_string(i));
        }
        return out;
    }
};
`,
        cases: [{ args: [['use:a', 'move:a', 'use:a', 'assign:a', 'use:a']], expect: ['a@2'] }, { args: [['move:s', 'clear:s', 'use:s']], expect: [] }, { args: [['move:x', 'move:y', 'use:y', 'use:x']], expect: ['y@2', 'x@3'] }, { args: [[]], expect: [] }],
        solution: "function useAfterMove(ops){const moved=new Set();const out=[];ops.forEach((op,i)=>{const[k,v]=op.split(':');if(k==='move')moved.add(v);else if(k==='assign'||k==='clear')moved.delete(v);else if(moved.has(v))out.push(v+'@'+i)});return out}",
        hint: 'Keep a set of moved-from names; assignment and clear remove a name from it.',
      },
      quiz: [
        choice('cx-mv-6-q1', 'cpp-moved-from', 'A moved-from std::string is guaranteed to be...', ['valid but unspecified', 'empty', 'unchanged', 'destroyed'], 0, 'Library rule.'),
        choice('cx-mv-6-q2', 'cpp-moved-from', 'Which is safe on a moved-from std::vector?', ['v.clear()', 'v.front()', 'v[0]', 'v.back()'], 0, 'No preconditions.'),
        choice('cx-mv-6-q3', 'cpp-moved-from', 'After auto q = std::move(p); with unique_ptr p, p is...', ['guaranteed null', 'unspecified', 'dangling', 'a copy'], 0, 'Specified.'),
        fill('cx-mv-6-q4', 'cpp-moved-from', 'The clang-tidy check bugprone-use-after-___ finds reads of moved-from objects.', ['move'], 'Static analysis.'),
      ],
    }),
  ],
  exam: [
    choice('cx-mv-e1', 'cpp-value-categories', 'Which expression is an lvalue?', ['a variable name', '42', 'x + 1', 'std::move(x)'], 0, 'Has identity.'),
    choice('cx-mv-e2', 'cpp-value-categories', 'A named rvalue-reference parameter, used inside the function, is...', ['an lvalue', 'an xvalue', 'a prvalue', 'const'], 0, 'Named.'),
    choice('cx-mv-e3', 'cpp-move-semantics', 'std::vector copies instead of moving during growth when...', ['the element move constructor is not noexcept (and copying is possible)', 'the vector is small', 'elements are ints', 'reserve was called'], 0, 'Strong guarantee.'),
    choice('cx-mv-e4', 'cpp-move-semantics', 'Moving a std::vector<int> of a million elements costs about...', ['copying three pointers', 'copying 4 MB', 'one allocation', 'a million moves'], 0, 'Steal the buffer.'),
    choice('cx-mv-e5', 'cpp-perfect-forwarding', 'In template <class T> void f(T&& x), T&& is...', ['a forwarding reference', 'always an rvalue reference', 'a const reference', 'a pointer'], 0, 'Deduced.'),
    choice('cx-mv-e6', 'cpp-perfect-forwarding', 'Which pair collapses to &&?', ['&& and &&', '& and &&', '&& and &', '& and &'], 0, 'Only both rvalue.'),
    choice('cx-mv-e7', 'cpp-copy-elision', 'Which return form is guaranteed to elide copies and moves in C++17?', ['return Widget{...};', 'return local;', 'return std::move(local);', 'return member_;'], 0, 'Prvalue.'),
    choice('cx-mv-e8', 'cpp-copy-elision', 'If NRVO does not apply to return local;, the local is...', ['implicitly moved', 'copied', 'leaked', 'destroyed twice'], 0, 'Implicit move.'),
    choice('cx-mv-e9', 'cpp-sink-parameters', 'Passing an lvalue to a by-value sink that moves into a member costs...', ['one copy and one move', 'one move', 'two copies', 'nothing'], 0, 'Copy into parameter.'),
    choice('cx-mv-e10', 'cpp-moved-from', 'What should you do before reading a moved-from object\'s value?', ['assign a new value or clear it', 'nothing', 'call std::move again', 'cast it to const'], 0, 'Reset state.'),
    order('cx-mv-e11', 'cpp-perfect-forwarding', 'Order what happens when f(lv) is called with template <class T> void f(T&& x) and an int lvalue lv.', ['T is deduced as int&', 'The parameter type int& && is formed', 'Reference collapsing makes it int&', 'std::forward<T>(x) passes it on as an lvalue'], 'Deduce, form, collapse, forward.'),
    fill('cx-mv-e12', 'cpp-move-semantics', 'The standard cast that marks an object as movable is std::___', ['move'], 'A cast to T&&.'),
  ],
};
