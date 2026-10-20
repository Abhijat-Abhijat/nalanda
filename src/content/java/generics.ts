import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const jvGenerics: Chapter = {
  id: 'jv-generics',
  title: 'Generics',
  summary: 'Java generics from everyday use to library design: generic types and methods, bounded type parameters, wildcards and the PECS rule, type erasure and its consequences, variance of generics versus arrays, and type-safe API patterns such as type tokens and heterogeneous containers. Based on the Java Language Specification and Effective Java; checked as of October 2026.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'jv-ge-1', title: 'Generic types and methods', concept: 'jv-generics-basics',
      story: "Before Java 5, collections held `Object`, so every `get` needed a cast and mistakes surfaced as `ClassCastException` far from where the wrong object was inserted. Martin Odersky and Philip Wadler's **Generic Java (GJ)** research prototype (1998) showed how to add type parameters while staying compatible with existing bytecode, and it became the basis for generics in Java 5 (2004, JSR 14). Odersky also wrote the javac compiler of that era before going on to create Scala.",
      analogy: "Labelled storage boxes: a box marked \"invoices only\" lets the post room reject a sandwich at the door, instead of someone finding it months later in the accounts.",
      timeline: [['1998', 'Generic Java (GJ)', 'Odersky and Wadler\'s design with erasure for compatibility.'], ['2004', 'Java 5 generics', 'Type parameters for classes, interfaces, and methods (JSR 14).'], ['2011', 'Diamond operator', 'new ArrayList<>() infers type arguments (Java 7).'], ['2018', 'var', 'Local inference reduces repetition further (Java 10).']],
      explain: "A **generic type** declares type parameters: `class Box<T> { private T value; T get() { return value; } }`. A **generic method** declares its own: `static <T> T firstOrNull(List<T> xs)`. The compiler checks types at compile time and inserts casts for you, so `List<String>` cannot accept an `Integer`. **Type inference** works out type arguments from context: the diamond `new HashMap<>()`, method arguments, and target types (`List<String> xs = Collections.emptyList();`). Conventions: `T` for type, `E` for element, `K`/`V` for key and value, `R` for result. Avoid **raw types** (`List` without arguments): they switch off checking and exist only for compatibility with pre-2004 code. Primitive types cannot be type arguments (`List<int>` is illegal), so collections box values (`List<Integer>`).",
      diagram: "List rawList = new ArrayList();        raw: no checking, casts needed\nList<String> names = new ArrayList<>(); checked: add(42) is a compile error\nstatic <T> T mostFrequent(List<T> xs)   generic method: T inferred per call\nList<int> ✗   →  List<Integer> (boxing)",
      ex1: ['java', 'a generic method (Java 8 compatible)', "static <T> T mostFrequent(List<T> xs) {\n    Map<T, Integer> counts = new HashMap<>();\n    T best = null; int bestCount = 0;\n    for (T x : xs) {\n        int n = counts.merge(x, 1, Integer::sum);\n        if (n > bestCount) { bestCount = n; best = x; }\n    }\n    return best;\n}"],
      ex2: ['java', 'raw types defeat checking', "List raw = new ArrayList();\nraw.add(42);\nList<String> names = raw;          // unchecked warning only\nString s = names.get(0);           // ClassCastException here, far from the bug"],
      deepDive: {
        explain: "Generic code is checked once at compile time and runs as ordinary code: there is a single `ArrayList` class at runtime, not one per type argument (see erasure later in this chapter). Treat **unchecked warnings** as errors: each one marks a place where a `ClassCastException` can appear somewhere else. When unavoidable (for example inside a generic array-backed collection), suppress the warning on the smallest scope with `@SuppressWarnings(\"unchecked\")` and a comment proving safety. Generic methods are often more flexible than generic classes: `Collections.max`, `Comparator.comparing`, and `Optional.map` are all generic methods whose type parameters are inferred per call. Inference has limits: complex chains sometimes need explicit type witnesses (`Collections.<String>emptyList()`) or intermediate variables.",
        example: ['js', 'most frequent element (first to reach the top count wins ties)', "function mostFrequent(xs) {\n  const counts = new Map();\n  let best = null, bestCount = 0;\n  for (const x of xs) {\n    const n = (counts.get(x) || 0) + 1;\n    counts.set(x, n);\n    if (n > bestCount) { bestCount = n; best = x; }\n  }\n  return best;\n}"],
        tradeoffs: [['Choice', 'Benefit', 'Cost'], ['Generic class', 'Type-safe containers and services', 'Type parameter on every use'], ['Generic method', 'Flexible, inferred per call', 'Inference limits in long chains'], ['Raw types', 'Legacy compatibility', 'No checking; hidden ClassCastException'], ['Object parameters', 'Simple signatures', 'Casts and runtime errors']],
        failures: [['ClassCastException far from the insert', 'Raw type or ignored unchecked warning', 'Parameterise; fix warnings'], ['Cannot create List<int>', 'Primitives as type arguments', 'Boxed types or primitive arrays'], ['Inference fails on a stream chain', 'Insufficient target type information', 'Type witness or intermediate variable'], ['Warnings ignored across the codebase', 'Suppressed broadly', 'Suppress only on the smallest proven-safe scope']],
      },
      warn: "Raw types switch off type checking. One raw List can let a wrong element in, and the ClassCastException appears later in unrelated code.",
      production: {
        numbers: "A compile-time error costs seconds to fix; the equivalent ClassCastException in production can take hours to trace back to the raw-typed insertion point.",
        observe: "Fail CI on javac -Xlint:unchecked and rawtypes warnings in new code (for example with -Werror on those lint categories).",
        security: "Deserialising into generic types with unchecked casts can admit unexpected object types; validate deserialised data against the expected types.",
        checklist: ['No raw types in new code', 'Unchecked warnings treated as errors', 'Suppressions minimal and justified', 'Diamond and var for inference', 'Generic methods for reusable algorithms', 'Boxed types understood for collections', 'Type witnesses when inference fails'],
        sources: ['Bracha, Odersky, Stoutamire, Wadler, "Making the future safe for the past: Adding Genericity to the Java Programming Language" (OOPSLA 1998)', 'JSR 14: Add Generic Types to the Java Programming Language', 'Bloch, "Effective Java" (3rd ed.), items 26–27'],
      },
      tip: "Compile with -Xlint:all in CI and keep the warning count at zero; generics warnings are cheap to fix when new and expensive when ignored.",
      faq: [['What problem did generics solve?', 'Compile-time type checking for collections and other containers instead of casts.'], ['What is a raw type?', 'A generic type used without type arguments.'], ['Can type arguments be primitives?', 'No; use wrappers.'], ['What does the diamond operator do?', 'Infers constructor type arguments.'], ['When suppress unchecked warnings?', 'Only on the smallest scope you have proven safe.']],
      ex: { prompt: 'Write mostFrequent(xs) returning the most frequent string; on ties, return the value that first reached the highest count while scanning left to right. Return null for an empty array.', fn: 'mostFrequent', params: 'xs', sig: '(string[] xs) -> string?', java: `class Solution {
    public String mostFrequent(String[] xs) {
        Map<String, Integer> counts = new HashMap<>();
        String best = null;
        int bestCount = 0;
        for (String x : xs) {
            int n = counts.containsKey(x) ? counts.get(x) + 1 : 1;
            counts.put(x, n);
            if (n > bestCount) { bestCount = n; best = x; }
        }
        return best;
    }
}
`, cases: [{ args: [['b', 'a', 'b', 'a', 'c']], expect: 'b' }, { args: [['x']], expect: 'x' }, { args: [[]], expect: null }], solution: `function mostFrequent(xs){const c=new Map();let best=null,bc=0;for(const x of xs){const n=(c.get(x)||0)+1;c.set(x,n);if(n>bc){bc=n;best=x}}return best}`, hint: 'Track counts and update the best only when a count strictly exceeds it.' },
      quiz: [
        choice('jv-ge-1-q1', 'jv-generics-basics', 'List names = new ArrayList(); is...', ['a raw type with no checking', 'fully generic', 'a compile error', 'faster'], 0, 'Avoid raw types.'),
        choice('jv-ge-1-q2', 'jv-generics-basics', 'How do you store ints in a generic list?', ['List<Integer>', 'List<int>', 'List<Int>', 'impossible'], 0, 'Boxing.'),
        choice('jv-ge-1-q3', 'jv-generics-basics', 'Who designed Generic Java (GJ), the basis of Java generics?', ['Odersky and Wadler with Bracha and Stoutamire', 'Gosling alone', 'Bloch alone', 'Oracle in 2014'], 0, '1998.'),
        fill('jv-ge-1-q4', 'jv-generics-basics', 'new HashMap<>() uses the ___ operator', ['diamond'], 'Java 7.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'jv-ge-2', title: 'Bounded type parameters', concept: 'jv-bounded-types',
      story: "`Collections.max` has one of the most intimidating signatures in the JDK: `public static <T extends Object & Comparable<? super T>> T max(Collection<? extends T> coll)`. Every part of it exists for a reason. The bound `Comparable<? super T>` lets it work with types that inherit their comparison from a parent, and the `Object &` part keeps the erased signature returning `Object`, compatible with the pre-generics method. Bounded type parameters are how generic code says what it needs from its types.",
      analogy: "A job advert that says \"must hold a driving licence\": any applicant qualifies, as long as they can do the one thing the job requires.",
      timeline: [['2004', 'Bounds in Java 5', 'extends bounds, including intersection types with &.'], ['2004', 'Collections.max signature', 'Bounds keep binary compatibility with pre-generic code.'], ['2014', 'Comparator.comparing', 'Bounded generics power Java 8 combinators.'], ['2020s', 'Records and sealed types', 'Bounds combine with new types in modern APIs.']],
      explain: "An **upper bound** restricts a type parameter: `<T extends Comparable<T>>` lets the method call `compareTo` on values of type `T`; `<N extends Number>` lets it call `doubleValue()`. **Multiple bounds** use `&`: `<T extends Number & Comparable<T>>` (a class bound first, then interfaces). The bound determines which methods are available inside the generic code and what the parameter **erases** to (the first bound). Prefer the flexible form `<T extends Comparable<? super T>>`: it accepts types like `java.sql.Timestamp` or a `Manager` that is comparable only as its parent type `Employee`. Type parameters have only upper bounds; lower bounds (`super`) exist only on wildcards (next lesson). **Recursive bounds** such as `<T extends Comparable<T>>` or the builder pattern `<B extends Builder<B>>` express \"a type comparable to itself\" or \"a builder returning its own subtype\".",
      diagram: "<T extends Comparable<? super T>> T max(List<? extends T> xs)\n  T must compare against itself or a supertype\n  erasure: T → Comparable (first bound)\n<T extends Number & Comparable<T>>   class bound first, then interfaces",
      ex1: ['java', 'a bounded generic max (Java 8 compatible)', "static <T extends Comparable<? super T>> T maxOf(List<? extends T> xs) {\n    if (xs.isEmpty()) return null;\n    T best = xs.get(0);\n    for (T x : xs) if (x.compareTo(best) > 0) best = x;\n    return best;\n}"],
      ex2: ['java', 'a self-typed builder', "abstract class Builder<B extends Builder<B>> {\n    String name;\n    @SuppressWarnings(\"unchecked\") B name(String n) { this.name = n; return (B) this; }\n}\nfinal class UserBuilder extends Builder<UserBuilder> { UserBuilder email(String e) { … return this; } }\nnew UserBuilder().name(\"Asha\").email(\"a@example.com\");   // chaining keeps the subtype"],
      deepDive: {
        explain: "Bounds are a contract in both directions: callers must supply qualifying types, and the implementation may use only what the bound guarantees. Over-tight bounds (`<T extends ArrayList<String>>`) reduce reuse; prefer interfaces (`List`, `Comparable`, `CharSequence`). Because erasure replaces `T` with its first bound, the order of bounds affects the bytecode signature, which matters for binary compatibility in libraries (hence the `Object &` trick in `Collections.max`). Bounded generics also interact with overloading: two methods that differ only in type parameters can clash after erasure (`void f(List<String>)` and `void f(List<Integer>)` cannot coexist). For numeric code, bounds like `<N extends Number>` are less useful than they look, because `Number` offers only conversions; specialised methods for `int`, `long`, and `double` are usually clearer and faster.",
        example: ['js', 'maximum by natural ordering, null when empty', "function maxOf(xs) {\n  if (!xs.length) return null;\n  let m = xs[0];\n  for (const x of xs) if (x > m) m = x;     // like compareTo(x, m) > 0\n  return m;\n}"],
        tradeoffs: [['Bound', 'Enables', 'Watch out'], ['T extends Comparable<T>', 'compareTo on T', 'Rejects types comparable via a supertype'], ['T extends Comparable<? super T>', 'Works with inherited comparison', 'Harder to read'], ['T extends A & B', 'Methods of both types', 'Erases to A only'], ['Recursive self type', 'Fluent subclass builders', 'Unchecked casts and complexity']],
        failures: [['Cannot call compareTo inside a generic method', 'Unbounded T', 'Add a Comparable bound'], ['Subclass instances rejected by max', 'Bound Comparable<T> instead of <? super T>', 'Use Comparable<? super T>'], ['Two overloads clash at compile time', 'Same erasure', 'Rename methods or change parameters'], ['Builder chain loses the subtype', 'Builder returns the base type', 'Self-typed builder or separate builders']],
      },
      warn: "Inside generic code you may call only the methods guaranteed by the bound. If you find yourself casting T to a concrete class, the bound or the design is wrong.",
      production: {
        numbers: "Collections.max has carried its bounded signature since Java 5 in 2004, preserving binary compatibility with code compiled against the pre-generic version for two decades.",
        observe: "Code review: unchecked casts of type parameters, instanceof checks on T, and bounds tighter than the operations used.",
        security: "Bounds do not validate values; generic code that accepts any Comparable still needs input validation for business rules.",
        checklist: ['Bounds only as tight as the operations used', 'Comparable<? super T> for ordering', 'Interfaces as bounds', 'Erasure considered for public library signatures', 'Overload clashes after erasure avoided', 'Self types only where fluent subclassing pays off', 'No casts of T to concrete classes'],
        sources: ['The Java Language Specification, section 4.4: type variables and bounds', 'Java SE API: Collections.max', 'Naftalin and Wadler, "Java Generics and Collections" (2006)'],
      },
      tip: "Read a complex bound from the inside out: what must T be able to do, and against which types? Then check whether a simpler bound would do.",
      faq: [['What does T extends Comparable<T> allow?', 'Calling compareTo on T values.'], ['Why Comparable<? super T>?', 'To accept types that inherit comparison from a supertype.'], ['How are multiple bounds written?', 'With &, class first: T extends Number & Comparable<T>.'], ['What does T erase to?', 'Its first bound, or Object if unbounded.'], ['Can type parameters have lower bounds?', 'No; only wildcards can use super.']],
      ex: { prompt: 'Write maxOf(xs) returning the greatest string by natural (ordinal) ordering, or null for an empty array, as a bounded generic max over Comparable would.', fn: 'maxOf', params: 'xs', sig: '(string[] xs) -> string?', java: `class Solution {
    public String maxOf(String[] xs) {
        if (xs.length == 0) return null;
        String best = xs[0];
        for (String x : xs) if (x.compareTo(best) > 0) best = x;
        return best;
    }
}
`, cases: [{ args: [['pear', 'apple', 'zebra', 'mango']], expect: 'zebra' }, { args: [[]], expect: null }], solution: `function maxOf(xs){if(!xs.length)return null;let m=xs[0];for(const x of xs)if(x>m)m=x;return m}`, hint: 'Keep the best so far using compareTo.' },
      quiz: [
        choice('jv-ge-2-q1', 'jv-bounded-types', 'Inside <T> T max(List<T> xs) you cannot call compareTo. Fix?', ['add the bound T extends Comparable<? super T>', 'cast to String', 'use raw types', 'use Object'], 0, 'Bounds.'),
        choice('jv-ge-2-q2', 'jv-bounded-types', 'In <T extends Number & Comparable<T>>, what does T erase to?', ['Number', 'Comparable', 'Object', 'Integer'], 0, 'First bound.'),
        choice('jv-ge-2-q3', 'jv-bounded-types', 'Why use Builder<B extends Builder<B>>?', ['so chained methods return the subclass type', 'for speed', 'for serialisation', 'it is required'], 0, 'Self type.'),
        fill('jv-ge-2-q4', 'jv-bounded-types', 'Multiple bounds are joined with the symbol ___', ['&'], 'Intersection.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'jv-ge-3', title: 'Wildcards and PECS', concept: 'jv-pecs',
      story: "Generics are **invariant**: a `List<Integer>` is not a `List<Number>`, even though an `Integer` is a `Number`. If it were, you could add a `Double` to a list of integers through the `List<Number>` reference. Wildcards restore flexibility safely. Joshua Bloch summarised the rule in the second edition of *Effective Java* (2008) with a mnemonic that stuck: **PECS, producer extends, consumer super**.",
      analogy: "A fruit stand: if you only take fruit from a basket (it produces), any basket of apples or pears will do; if you only put apples into a box (it consumes), any box that accepts apples, or fruit in general, will do.",
      timeline: [['2004', 'Wildcards in Java 5', '? extends, ? super, and unbounded ?.'], ['2008', 'PECS mnemonic', 'Bloch\'s Effective Java, 2nd edition.'], ['2014', 'Wildcards in Java 8 APIs', 'Function<? super T, ? extends R> throughout streams.'], ['2020s', 'Still central', 'Library APIs rely on PECS for flexible signatures.']],
      explain: "A parameter that **produces** values you read (`for (T x : src)`) should be `Collection<? extends T>`: it accepts a collection of `T` or any subtype. You can read elements as `T`, but you cannot add (except `null`), because the real element type is unknown. A parameter that **consumes** values you write (`dst.add(x)`) should be `Collection<? super T>`: it accepts a collection of `T` or any supertype. You can add `T` values, but reading gives only `Object`. If a parameter both produces and consumes, use the exact type `T`. If you neither read typed values nor write, use unbounded `?` (`Collection<?>` for size or clear). `Collections.copy(List<? super T> dest, List<? extends T> src)` is the textbook example. Wildcards belong in **method parameters**, not return types: returning `List<? extends Number>` forces wildcards on every caller.",
      diagram: "read from it  (producer) → ? extends T\nwrite to it   (consumer) → ? super T\nboth                     → T\nneither                  → ?\ncopy(List<? super T> dest, List<? extends T> src)",
      ex1: ['java', 'a PECS signature', "static <T> void copyAll(Collection<? super T> dst, Collection<? extends T> src) {\n    for (T x : src) dst.add(x);\n}\nList<Number> numbers = new ArrayList<>();\ncopyAll(numbers, Arrays.asList(1, 2, 3));      // Integer source, Number destination\ncopyAll(numbers, Arrays.asList(1.5, 2.5));     // Double source works too"],
      ex2: ['java', 'why ? extends forbids add', "List<? extends Number> xs = new ArrayList<Integer>();\nNumber n = xs.get(0);    // fine: everything is a Number\nxs.add(3.14);            // compile error: the list might be List<Integer>"],
      deepDive: {
        explain: "Wildcards make APIs accept more callers without weakening safety. Java 8's functional interfaces show PECS everywhere: `Stream.map(Function<? super T, ? extends R> mapper)` means a mapper that accepts `T` or a supertype and returns `R` or a subtype is fine. `Comparator<? super T>` lets a comparator for `Employee` sort a list of `Manager`. When a wildcard type prevents an operation you know is safe (for example swapping two elements of a `List<?>`), a private generic **helper method** can capture the wildcard (`<T> void swapHelper(List<T> l, …)`), a technique called wildcard capture. Keep return types concrete. A rule of thumb from the JDK designers: if a type parameter appears only once in a method signature, replace it with a wildcard.",
        example: ['js', 'choosing a wildcard from how a parameter is used', "function pecsRole(ops) {                  // ops: which of 'read', 'write' the method does\n  const r = ops.includes('read'), w = ops.includes('write');\n  if (r && w) return 'T';\n  if (r) return '? extends T';              // producer extends\n  if (w) return '? super T';                // consumer super\n  return '?';\n}"],
        tradeoffs: [['Parameter type', 'Accepts', 'Allows'], ['List<T>', 'Exactly List<T>', 'Read and write T'], ['List<? extends T>', 'List of T or subtypes', 'Read as T; no add'], ['List<? super T>', 'List of T or supertypes', 'Add T; read as Object'], ['List<?>', 'Any list', 'size, clear, read as Object']],
        failures: [['Callers cannot pass List<Integer> to sum(List<Number>)', 'Invariant parameter for a producer', 'List<? extends Number>'], ['Cannot add to a List<? extends T>', 'Using a producer as a consumer', 'Use ? super T or exact T'], ['Callers forced to write wildcards', 'Wildcard in return type', 'Return concrete types'], ['Comparator for supertype rejected', 'Comparator<T> parameter', 'Comparator<? super T>']],
      },
      warn: "Do not put wildcards in return types. They spread to every caller and make results hard to use; keep wildcards in parameters.",
      production: {
        numbers: "Stream.map, filter, flatMap, sorted, and collect all use ? super / ? extends in their parameters; without PECS, many everyday lambdas and method references would fail to compile.",
        observe: "API reviews of shared libraries should check every collection or function parameter for the right variance before release, since changing it later can break callers.",
        security: "Wildcards do not change runtime behaviour or validation; a ? extends parameter can still contain unexpected subtypes, so validate inputs as usual.",
        checklist: ['Producers use ? extends T', 'Consumers use ? super T', 'Exact T when both', 'Unbounded ? when neither', 'Comparators and functions use PECS', 'No wildcards in return types', 'Wildcard capture helpers where needed'],
        sources: ['Bloch, "Effective Java" (3rd ed.), item 31: use bounded wildcards to increase API flexibility', 'Java SE API: Collections.copy, Stream.map', 'The Java Tutorials: Wildcards and guidelines for wildcard use'],
      },
      tip: "For each generic parameter, ask \"do I read from it, write to it, or both?\" The answer gives the wildcard directly.",
      faq: [['What does PECS stand for?', 'Producer extends, consumer super.'], ['Is List<Integer> a List<Number>?', 'No; generics are invariant.'], ['What can you add to List<? extends Number>?', 'Only null.'], ['What do you read from List<? super Integer>?', 'Object.'], ['Where should wildcards appear?', 'In parameters, not return types.']],
      ex: { prompt: 'Write pecsRole(ops) where ops lists which of "read" and "write" a method does with a collection parameter. Return "T" for both, "? extends T" for read only, "? super T" for write only, and "?" for neither.', fn: 'pecsRole', params: 'ops', sig: '(string[] ops) -> string', java: `class Solution {
    public String pecsRole(String[] ops) {
        List<String> o = Arrays.asList(ops);
        boolean r = o.contains("read"), w = o.contains("write");
        if (r && w) return "T";
        if (r) return "? extends T";
        if (w) return "? super T";
        return "?";
    }
}
`, cases: [{ args: [['read']], expect: '? extends T' }, { args: [['write']], expect: '? super T' }, { args: [['read', 'write']], expect: 'T' }, { args: [[]], expect: '?' }], solution: `function pecsRole(ops){const r=ops.includes('read'),w=ops.includes('write');if(r&&w)return'T';if(r)return'? extends T';if(w)return'? super T';return'?'}`, hint: 'Producer extends, consumer super.' },
      quiz: [
        choice('jv-ge-3-q1', 'jv-pecs', 'double sum(Collection<___> xs) should accept List<Integer> and List<Double>. Fill in.', ['? extends Number', '? super Number', 'Number', 'Object'], 0, 'Producer.'),
        choice('jv-ge-3-q2', 'jv-pecs', 'void fill(List<___> dst) adds Integers. Most flexible type?', ['? super Integer', '? extends Integer', 'Integer', '?'], 0, 'Consumer.'),
        choice('jv-ge-3-q3', 'jv-pecs', 'Why is List<Integer> not a List<Number>?', ['otherwise you could add a Double to a list of Integers', 'performance', 'erasure', 'historical accident only'], 0, 'Invariance.'),
        fill('jv-ge-3-q4', 'jv-pecs', 'PECS: producer extends, consumer ___', ['super'], 'Bloch.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'jv-ge-4', title: 'Type erasure and its consequences', concept: 'jv-erasure',
      story: "Java 5 had to run generic code on existing JVMs and let new generic code call old non-generic libraries, and vice versa. The GJ design achieved this with **erasure**: type arguments are checked by the compiler and then removed, so `List<String>` and `List<Integer>` are the same `List` class at runtime. C# took the opposite path in 2005 with reified generics, at the cost of a new runtime. Erasure explains most of Java generics' limitations, and **Project Valhalla** is working on value types and specialised generics to lift some of them.",
      analogy: "A cloakroom ticket that says \"coat\": when you hand it in, staff check you are the owner, but the coat itself carries no tag saying whose it is once it is back on the rack.",
      timeline: [['1998', 'GJ chooses erasure', 'Compatibility with existing JVMs and libraries.'], ['2004', 'Java 5 ships erasure', 'Generic types checked at compile time only.'], ['2005', 'C# 2.0 reified generics', 'A contrasting design with runtime type arguments.'], ['2014–2026', 'Project Valhalla', 'Value classes and specialised generics under development.']],
      explain: "After compilation, each type parameter is replaced by its **erasure**: its first bound, or `Object` if unbounded; parameterised types become raw types (`List<String>` becomes `List`); the compiler inserts casts where values come out and **bridge methods** to keep overriding working. Consequences: you **cannot** use `new T()`, `new T[n]`, `instanceof List<String>`, `T.class`, or static fields of type `T`; you cannot overload methods whose parameters differ only in type arguments; and `getClass()` on any `ArrayList` returns `ArrayList.class`. Generic information does survive in **declarations** (class signatures, field and method types), which is why frameworks such as Jackson and Spring can read `List<Order>` from a field via reflection or from an anonymous subclass (`new TypeReference<List<Order>>() {}`). To create instances or arrays of `T`, pass a `Class<T>`, a `Supplier<T>`, or an `IntFunction<T[]>`.",
      diagram: "source:   class Box<T extends Comparable<T>> { T value; }   List<String> xs\nbytecode: class Box { Comparable value; }                    List xs   + casts\nnew T() ✗   new T[10] ✗   xs instanceof List<String> ✗   T.class ✗\nworkarounds: Class<T> token · Supplier<T> · IntFunction<T[]> · TypeReference<…>",
      ex1: ['java', 'creating instances with a token or supplier', "static <T> List<T> fill(int n, Supplier<T> make) {\n    List<T> out = new ArrayList<>();\n    for (int i = 0; i < n; i++) out.add(make.get());   // instead of new T()\n    return out;\n}\nList<StringBuilder> bufs = fill(3, StringBuilder::new);"],
      ex2: ['java', 'reading generic types that survive in declarations', "// Jackson: an anonymous subclass captures List<Order> in its superclass signature\nList<Order> orders = mapper.readValue(json, new TypeReference<List<Order>>() {});"],
      deepDive: {
        explain: "**Heap pollution** occurs when a variable of a parameterised type refers to an object of a different parameterisation, typically through raw types, unchecked casts, or generic varargs (`List<String>...` creates a `List[]` at runtime). The failure appears later as a `ClassCastException` at a compiler-inserted cast. `@SafeVarargs` (Java 7) documents that a varargs method does not store into or expose its generic array. Reflection-heavy frameworks rely on the generic signatures preserved in class files (the `Signature` attribute): Spring resolves `Repository<Order, Long>` type arguments, Jackson resolves field types, and JPA reads `List<LineItem>` associations. Bridge methods appear in stack traces and reflection listings as synthetic methods, which is occasionally confusing when debugging. Valhalla's goal is that future `List<int>`-style specialisations avoid boxing, but as of October 2026 value classes remain in preview builds, not in a final release.",
        example: ['js', 'erasing a type expression', "function erase(t) {\n  t = t.trim();\n  const m = /^[A-Z]\\s+extends\\s+(.+)$/.exec(t);\n  if (m) return erase(m[1].split('&')[0]);        // type variable → first bound\n  if (/^[A-Z]$/.test(t)) return 'Object';         // unbounded type variable\n  let out = '', depth = 0;\n  for (const ch of t) { if (ch === '<') depth++; else if (ch === '>') depth--; else if (depth === 0) out += ch; }\n  return out.trim();                              // drop type arguments\n}"],
        tradeoffs: [['Design', 'Strength', 'Weakness'], ['Erasure (Java)', 'Binary compatibility, one class per generic type', 'No runtime type arguments; boxing'], ['Reification (C#)', 'Runtime types, no boxing for value types', 'Required a new runtime'], ['Type tokens', 'Runtime type when needed', 'Extra parameters'], ['Specialisation (Valhalla)', 'Future: no boxing for value types', 'Still in development']],
        failures: [['Cannot write new T[]', 'Erasure removes T', 'IntFunction<T[]> or Class<T> with Array.newInstance'], ['Jackson returns LinkedHashMap instead of Order', 'Element type erased in a Class<List> call', 'TypeReference<List<Order>>'], ['Overloads clash: name clash have the same erasure', 'Methods differ only in type arguments', 'Rename methods'], ['ClassCastException at a line with no cast', 'Heap pollution via raw types or varargs', 'Remove raw types; @SafeVarargs only when safe']],
      },
      warn: "A ClassCastException on a line without any visible cast usually means heap pollution: a compiler-inserted cast failed because a raw type or unchecked cast let the wrong type in earlier.",
      production: {
        numbers: "List<String> and List<Integer> share one runtime class; a List<Integer> of one million elements holds one million boxed Integer objects (outside the small-value cache), a large overhead compared with an int[] of 4 MB.",
        observe: "For memory-heavy generic collections of numbers, heap dumps show Integer or Long objects dominating; primitive arrays or specialised libraries reduce footprint.",
        security: "Deserialisation that relies on erased types (raw collections) can accept unexpected element types; bind to fully specified types such as TypeReference<List<Order>>.",
        checklist: ['No new T() or new T[]; use tokens or suppliers', 'TypeReference for generic deserialisation', 'No overloads differing only in type arguments', '@SafeVarargs only when proven safe', 'Primitive arrays for large numeric data', 'Raw types removed', 'Understand bridge methods in traces'],
        sources: ['The Java Language Specification, section 4.6: type erasure', 'The Java Tutorials: Type Erasure, Bridge Methods, Heap Pollution', 'OpenJDK Project Valhalla (accessed October 2026)'],
      },
      tip: "When you need the runtime type of T, add a Class<T> or Supplier<T> parameter instead of reaching for reflection tricks; it documents the need in the signature.",
      faq: [['What is type erasure?', 'Type arguments are checked at compile time and removed from runtime classes.'], ['What does an unbounded T erase to?', 'Object.'], ['Why can\'t you write new T()?', 'T is unknown at runtime after erasure.'], ['How does Jackson know List<Order>?', 'From generic signatures preserved in declarations, via TypeReference.'], ['What is heap pollution?', 'A parameterised variable referring to an object of a different parameterisation.']],
      ex: { prompt: 'Write erase(t) returning the erasure of a type expression: for "X extends A & B" (a single-letter type variable with bounds), return the erasure of the first bound; for a bare single uppercase letter, return "Object"; otherwise remove everything inside angle brackets (including nested ones) and trim.', fn: 'erase', params: 't', sig: '(string t) -> string', java: `class Solution {
    public String erase(String t) {
        t = t.trim();
        if (t.length() > 10 && Character.isUpperCase(t.charAt(0)) && t.startsWith(" extends ", 1)) {
            return erase(t.substring(9).split("&")[0]);
        }
        if (t.length() == 1 && Character.isUpperCase(t.charAt(0))) return "Object";
        StringBuilder out = new StringBuilder();
        int depth = 0;
        for (char ch : t.toCharArray()) {
            if (ch == '<') depth++;
            else if (ch == '>') depth--;
            else if (depth == 0) out.append(ch);
        }
        return out.toString().trim();
    }
}
`, cases: [{ args: ['List<String>'], expect: 'List' }, { args: ['Map<String, List<Integer>>'], expect: 'Map' }, { args: ['T'], expect: 'Object' }, { args: ['T extends Comparable<T>'], expect: 'Comparable' }, { args: ['T extends Number & Comparable<T>'], expect: 'Number' }, { args: ['List<T>[]'], expect: 'List[]' }], solution: `function erase(t){t=t.trim();const m=/^[A-Z]\\s+extends\\s+(.+)$/.exec(t);if(m)return erase(m[1].split('&')[0]);if(/^[A-Z]$/.test(t))return'Object';let out='',d=0;for(const ch of t){if(ch==='<')d++;else if(ch==='>')d--;else if(d===0)out+=ch}return out.trim()}`, hint: 'Handle bounded type variables first, then strip angle-bracket content.' },
      quiz: [
        choice('jv-ge-4-q1', 'jv-erasure', 'new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass() is...', ['true', 'false', 'a compile error', 'random'], 0, 'One class.'),
        choice('jv-ge-4-q2', 'jv-erasure', 'Jackson returns maps instead of Order objects for a List. Fix?', ['use TypeReference<List<Order>>', 'cast the result', 'use raw List', 'add @SafeVarargs'], 0, 'Type token.'),
        choice('jv-ge-4-q3', 'jv-erasure', 'How do you create T instances in generic code?', ['pass a Supplier<T> or Class<T>', 'new T()', 'T.class.newInstance()', 'reflection on T'], 0, 'Tokens.'),
        fill('jv-ge-4-q4', 'jv-erasure', 'OpenJDK project working on value classes and specialised generics: Project ___', ['Valhalla'], 'In development.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'jv-ge-5', title: 'Variance: generics versus arrays', concept: 'jv-variance',
      story: "Java arrays were made **covariant** in 1996: a `String[]` is an `Object[]`. Without generics, that was the only way to write a general `sort(Object[])`. The price is a runtime check: storing an `Integer` into an `Object[]` that is really a `String[]` throws `ArrayStoreException`. When generics arrived, the designers made them **invariant**, catching the same mistake at compile time, and added wildcards for controlled flexibility. Mixing the two models is why `new List<String>[10]` is forbidden.",
      analogy: "An airport baggage belt labelled \"suitcases\": arrays let anyone put things on and a guard at the end rejects the wrong items, while generics check every item at the entry gate.",
      timeline: [['1996', 'Covariant arrays', 'String[] is an Object[]; ArrayStoreException at runtime.'], ['2004', 'Invariant generics', 'List<String> is not List<Object>; wildcards add variance.'], ['2004', 'No generic array creation', 'new List<String>[n] disallowed to keep the type system sound.'], ['2014', 'Use-site variance everywhere', 'Java 8 functional APIs depend on wildcards.']],
      explain: "**Covariance**: if `Integer` is a subtype of `Number`, a container of `Integer` is a subtype of the container of `Number`. Arrays are covariant, so `Number[] ns = new Integer[3]; ns[0] = 1.5;` compiles and throws `ArrayStoreException`. **Invariance**: generic types ignore the subtype relation of their arguments: `List<Integer>` is neither a subtype nor a supertype of `List<Number>`. **Use-site variance** through wildcards: `List<Integer>` is a subtype of `List<? extends Number>` (covariant view, read-only) and `List<Object>` is a subtype of `List<? super Integer>` (contravariant view, write-friendly). Class-level subtyping still applies with the same type argument: `ArrayList<String>` is a `List<String>`. Because arrays check element types at runtime and generics are erased, a generic array would lose that check, so creating arrays of parameterised types is illegal; prefer `List<List<String>>`.",
      diagram: "Integer[]          ≤ Number[]               ✓ (covariant arrays, runtime check)\nList<Integer>      ≤ List<Number>           ✗ (invariant)\nList<Integer>      ≤ List<? extends Number> ✓\nList<Object>       ≤ List<? super Integer>  ✓\nList<Double>       ≤ List<? super Integer>  ✗\nArrayList<String>  ≤ List<String>           ✓",
      ex1: ['java', 'the array store check', "Object[] objects = new String[2];\nobjects[0] = \"ok\";\nobjects[1] = 42;           // compiles, throws ArrayStoreException at runtime"],
      ex2: ['java', 'the generic version fails at compile time', "List<Object> objects = new ArrayList<String>();   // compile error: incompatible types\nList<? extends Object> view = new ArrayList<String>();\nview.add(42);                                      // compile error: cannot add"],
      deepDive: {
        explain: "Prefer lists to arrays in APIs (Effective Java item 28): lists give compile-time variance checking and interoperate with generics; arrays are best for primitives and performance-critical internals. When a generic class needs an array internally (for example an `ArrayList`-like structure), store an `Object[]` and cast elements on the way out, or accept an `IntFunction<E[]>` to create correctly typed arrays (as `Collection.toArray(IntFunction)` does since Java 11). Kotlin and Scala offer **declaration-site variance** (`out T`, `in T`, `+T`, `-T`), which declares variance once on the type; Java chose use-site variance, which is more flexible per method but noisier. Understanding variance also explains why `Comparator<Object>` can sort a `List<String>` and why `Function<Object, Integer>` can be passed where `Function<? super String, ? extends Number>` is expected.",
        example: ['js', 'checking subtyping with arrays and wildcards (small fixed hierarchy)', "const PARENT = { Integer: 'Number', Double: 'Number', Number: 'Object', String: 'Object', ArrayList: 'List', List: 'Collection', Collection: 'Object' };\nconst cls = (a, b) => { for (let x = a; x; x = PARENT[x]) if (x === b) return true; return false; };\nfunction isSubtype(a, b) {\n  if (a.endsWith('[]') && b.endsWith('[]')) return isSubtype(a.slice(0, -2), b.slice(0, -2));   // covariant\n  if (a.endsWith('[]') || b.endsWith('[]')) return b === 'Object' && a.endsWith('[]');\n  const ga = /^(\\w+)<(.+)>$/.exec(a), gb = /^(\\w+)<(.+)>$/.exec(b);\n  if (!ga && !gb) return cls(a, b);\n  if (!ga || !gb || !cls(ga[1], gb[1])) return false;\n  const x = ga[2].trim(), y = gb[2].trim();\n  if (y.startsWith('? extends ')) return !x.startsWith('?') && cls(x, y.slice(10));\n  if (y.startsWith('? super ')) return !x.startsWith('?') && cls(y.slice(8), x);\n  return x === y;                                                                              // invariant\n}"],
        tradeoffs: [['Model', 'Checked when', 'Flexibility'], ['Covariant arrays', 'Runtime (ArrayStoreException)', 'High, unsafe writes'], ['Invariant generics', 'Compile time', 'Low without wildcards'], ['Use-site wildcards (Java)', 'Compile time', 'Per method, verbose'], ['Declaration-site variance (Kotlin)', 'Compile time', 'Declared once on the type']],
        failures: [['ArrayStoreException in production', 'Writing through a covariant array reference', 'Use List<T>; avoid array upcasts'], ['Generic array creation error', 'new List<String>[n]', 'List<List<String>>'], ['Cannot pass List<Integer> where List<Number> expected', 'Invariance', 'Wildcard parameter'], ['Unchecked cast warnings in a generic container', 'E[] created as Object[]', 'Keep Object[] internally, cast on read; or IntFunction<E[]>']],
      },
      warn: "Covariant arrays move type errors to runtime. Avoid exposing arrays of reference types in APIs; return lists instead.",
      production: {
        numbers: "An ArrayStoreException check runs on every reference-array store; JITs often eliminate it when the exact array type is known, but the semantic risk remains.",
        observe: "ArrayStoreException in logs points to an upcast array being written through a supertype reference; search for Object[] or supertype array parameters.",
        security: "APIs that return internal arrays let callers modify internal state; return copies or unmodifiable lists.",
        checklist: ['Lists instead of reference arrays in APIs', 'No generic array creation', 'Wildcards for flexible parameters', 'toArray(IntFunction) for typed arrays', 'Object[] internally in generic containers', 'Array parameters never written through supertypes', 'Copies when exposing arrays'],
        sources: ['Bloch, "Effective Java" (3rd ed.), item 28: prefer lists to arrays', 'The Java Language Specification, section 10.5: array store exception', 'Java SE API: Collection.toArray(IntFunction) (Java 11)'],
      },
      tip: "If you see Object[] or a supertype array in a public method signature, ask whether a List with a wildcard would express the intent safely.",
      faq: [['Are Java arrays covariant?', 'Yes; String[] is a subtype of Object[].'], ['Are generics covariant?', 'No; they are invariant, with wildcards for variance.'], ['What exception does a bad array store throw?', 'ArrayStoreException.'], ['Why is new List<String>[10] illegal?', 'Erased generics would break the array runtime type check.'], ['How does Kotlin differ?', 'Declaration-site variance with in and out.']],
      ex: { prompt: 'Write isSubtype(a, b) using the hierarchy Integer→Number, Double→Number, Number→Object, String→Object, ArrayList→List, List→Collection, Collection→Object. Arrays are covariant (X[] ≤ Y[] if X ≤ Y). For generics G<A> ≤ H<B>: G must be a subtype of H as classes, then if B is "? extends X", A ≤ X; if B is "? super X", X ≤ A; otherwise A must equal B exactly. Plain names use the class hierarchy.', fn: 'isSubtype', params: 'a, b', sig: '(string a, string b) -> bool', java: `class Solution {
    static final Map<String, String> P = new HashMap<>();
    static {
        P.put("Integer", "Number"); P.put("Double", "Number"); P.put("Number", "Object");
        P.put("String", "Object"); P.put("ArrayList", "List"); P.put("List", "Collection");
        P.put("Collection", "Object");
    }
    static boolean cls(String a, String b) {
        for (String x = a; x != null; x = P.get(x)) if (x.equals(b)) return true;
        return false;
    }
    public boolean isSubtype(String a, String b) {
        if (a.endsWith("[]") && b.endsWith("[]")) return isSubtype(a.substring(0, a.length() - 2), b.substring(0, b.length() - 2));
        if (a.endsWith("[]") || b.endsWith("[]")) return b.equals("Object") && a.endsWith("[]");
        int ia = a.indexOf('<'), ib = b.indexOf('<');
        if (ia < 0 && ib < 0) return cls(a, b);
        if (ia < 0 || ib < 0) return false;
        if (!cls(a.substring(0, ia), b.substring(0, ib))) return false;
        String x = a.substring(ia + 1, a.length() - 1).trim(), y = b.substring(ib + 1, b.length() - 1).trim();
        if (y.startsWith("? extends ")) return !x.startsWith("?") && cls(x, y.substring(10));
        if (y.startsWith("? super ")) return !x.startsWith("?") && cls(y.substring(8), x);
        return x.equals(y);
    }
}
`, cases: [{ args: ['List<Integer>', 'List<Number>'], expect: false }, { args: ['List<Integer>', 'List<? extends Number>'], expect: true }, { args: ['ArrayList<String>', 'List<String>'], expect: true }, { args: ['Integer[]', 'Number[]'], expect: true }, { args: ['List<Object>', 'List<? super Integer>'], expect: true }, { args: ['List<Double>', 'List<? super Integer>'], expect: false }, { args: ['Integer', 'Object'], expect: true }], solution: `function isSubtype(a,b){const P={Integer:'Number',Double:'Number',Number:'Object',String:'Object',ArrayList:'List',List:'Collection',Collection:'Object'};const cls=(a,b)=>{for(let x=a;x;x=P[x])if(x===b)return true;return false};if(a.endsWith('[]')&&b.endsWith('[]'))return isSubtype(a.slice(0,-2),b.slice(0,-2));if(a.endsWith('[]')||b.endsWith('[]'))return b==='Object'&&a.endsWith('[]');const ga=/^(\\w+)<(.+)>$/.exec(a),gb=/^(\\w+)<(.+)>$/.exec(b);if(!ga&&!gb)return cls(a,b);if(!ga||!gb)return false;if(!cls(ga[1],gb[1]))return false;const x=ga[2].trim(),y=gb[2].trim();if(y.startsWith('? extends '))return !x.startsWith('?')&&cls(x,y.slice(10));if(y.startsWith('? super '))return !x.startsWith('?')&&cls(y.slice(8),x);return x===y}`, hint: 'Arrays first, then plain classes, then generic arguments by wildcard kind.' },
      quiz: [
        choice('jv-ge-5-q1', 'jv-variance', 'Object[] xs = new String[1]; xs[0] = 1; happens when?', ['compiles, ArrayStoreException at runtime', 'compile error', 'works', 'ClassCastException at compile time'], 0, 'Covariant arrays.'),
        choice('jv-ge-5-q2', 'jv-variance', 'Is List<Object> a subtype of List<? super Integer>?', ['yes', 'no', 'only with raw types', 'only for arrays'], 0, 'Contravariant view.'),
        choice('jv-ge-5-q3', 'jv-variance', 'Why is new List<String>[10] illegal?', ['erasure would defeat the array store check', 'arrays cannot hold lists', 'performance', 'it is legal'], 0, 'Soundness.'),
        fill('jv-ge-5-q4', 'jv-variance', 'Java arrays are ___ while generics are invariant', ['covariant'], 'String[] ≤ Object[].'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'jv-ge-6', title: 'Type-safe API patterns', concept: 'jv-generic-api',
      story: "Libraries need to store and retrieve values of many types safely: configuration with integer ports and string hosts, request attributes, plugin registries. Joshua Bloch named the solution the **typesafe heterogeneous container** (Effective Java item 33): use `Class<T>` objects as keys, so `getFavorite(Integer.class)` returns an `Integer` without casts at call sites. The same idea, **type tokens**, powers Spring's `getBean(OrderService.class)`, Guice's `Key<T>`, and Jackson's `TypeReference`.",
      analogy: "A pharmacy shelf where every drawer is labelled with both the medicine name and its form (tablet, syrup): asking for the syrup never hands you tablets by mistake.",
      timeline: [['2004', 'Class<T> generified', 'Class literals carry their type (Java 5).'], ['2006', 'Super type tokens', 'Neal Gafter\'s technique for capturing full generic types.'], ['2008', 'Typesafe heterogeneous container', 'Effective Java 2nd edition, item 29 (item 33 in 3rd).'], ['2010s', 'Frameworks adopt tokens', 'Spring ResolvableType, Guice Key, Jackson TypeReference.']],
      explain: "A **type token** is a `Class<T>` passed so that code can use the type at runtime: `<T> T get(Class<T> type)` with `type.cast(value)` performs a checked cast and returns `T`. A **typesafe heterogeneous container** stores `Map<Class<?>, Object>` and exposes `<T> void put(Class<T> type, T value)` and `<T> T get(Class<T> type)`; the API guarantees that the value under `Integer.class` is an `Integer`. Combine type and name for configuration-style keys: a `Key<T>` record holding a name and a `Class<T>`. Class tokens cannot express parameterised types (`List<String>.class` does not exist), so **super type tokens** capture them from an anonymous subclass's generic superclass, as in `new TypeReference<List<String>>() {}`. Other generic API patterns: generic factories (`static <T> Result<T> ok(T value)`), `Optional<T>` return types for absent values, and functional interfaces with PECS-friendly signatures.",
      diagram: "Map<Key<?>, Object> store\nput(Key<Integer>(\"port\"), 8080)\nget(Key<Integer>(\"port\"))  → 8080 (Integer, checked by type.cast)\nget(Key<String>(\"port\"))   → absent: a different key\nList<String>.class ✗ → new TypeReference<List<String>>() {}",
      ex1: ['java', 'a typesafe container (Java 8 compatible)', "final class Settings {\n    private final Map<Class<?>, Map<String, Object>> store = new HashMap<>();\n    <T> void put(String name, Class<T> type, T value) {\n        store.computeIfAbsent(type, k -> new HashMap<>()).put(name, type.cast(value));\n    }\n    <T> T get(String name, Class<T> type) {\n        Map<String, Object> m = store.get(type);\n        return m == null ? null : type.cast(m.get(name));\n    }\n}\nint port = settings.get(\"port\", Integer.class);"],
      ex2: ['java', 'tokens in frameworks', "OrderService svc = context.getBean(OrderService.class);           // Spring\nList<Order> xs = mapper.readValue(json, new TypeReference<List<Order>>() {});   // Jackson"],
      deepDive: {
        explain: "Tokens trade a little verbosity for safety: callers state the type once, and the container enforces it at insertion with `Class.cast`, so a wrong value fails immediately where it is stored rather than later where it is read. Limitations: `Class<T>` tokens erase generic arguments, and primitive class literals (`int.class`) must be mapped to wrappers before `cast`. Frameworks build richer tokens: Spring's `ResolvableType` resolves generics through class hierarchies, so it can inject a `Repository<Order>` bean when several repositories exist. Other API design rules for generics: return `Optional<T>` instead of null from finders (not as fields or parameters); prefer generic static factories for inference (`Map.of`, `List.of`); keep type parameter lists short (more than two or three is a design smell); and document what each type parameter means.",
        example: ['js', 'lookup keyed by name and type', "function typesafeGet(keys, types, values, key, type) {\n  for (let i = 0; i < keys.length; i++) {\n    if (keys[i] === key && types[i] === type) return values[i];   // name AND type must match\n  }\n  return null;\n}"],
        tradeoffs: [['Pattern', 'Strength', 'Limit'], ['Class<T> token', 'Simple, checked cast', 'Cannot express List<String>'], ['Super type token', 'Full generic types', 'Anonymous subclass per use'], ['Key<T> (name + type)', 'Typed configuration and DI keys', 'More classes'], ['Map<String, Object> with casts', 'Simplest', 'ClassCastException at reads']],
        failures: [['ClassCastException when reading config', 'Untyped Map<String, Object>', 'Typed keys with Class.cast on put'], ['Spring cannot choose between beans', 'Several beans of the raw type', 'Generic type resolution or qualifiers'], ['Generic type lost when deserialising', 'Class token for a parameterised type', 'TypeReference / super type token'], ['NullPointerException from a finder', 'Returning null for absence', 'Return Optional<T>']],
      },
      warn: "Optional is for return values. Using Optional as a field or method parameter adds allocation and ambiguity without making code safer.",
      production: {
        numbers: "Class.cast at insertion moves failures from an unpredictable later read to the exact line that stored the wrong type, turning hours of debugging into a stack trace that points at the bug.",
        observe: "Search for Map<String, Object> holding configuration or context with casts at read sites; they are candidates for typed keys.",
        security: "Typed configuration rejects wrong types early, but still validate values (port ranges, URL schemes) after binding.",
        checklist: ['Class<T> tokens for typed lookups', 'Class.cast on insertion', 'TypeReference for generic types', 'Key<T> for named typed entries', 'Optional<T> for absent results only', 'Short, documented type parameter lists', 'Values validated after typed binding'],
        sources: ['Bloch, "Effective Java" (3rd ed.), item 33: consider typesafe heterogeneous containers', 'Gafter, "Super Type Tokens" (2006 blog post)', 'Spring Framework reference: ResolvableType (accessed October 2026)'],
      },
      tip: "If your code reads a value from a map and casts it, put the type into the key instead; the cast then happens once, safely, inside the container.",
      faq: [['What is a type token?', 'A Class<T> (or richer object) passed to make a type available at runtime.'], ['What does Class.cast do?', 'A checked cast that throws if the value is not of that type.'], ['How do you represent List<String> at runtime?', 'A super type token such as TypeReference.'], ['Where should Optional be used?', 'As a return type for possibly absent results.'], ['Who named the typesafe heterogeneous container?', 'Joshua Bloch in Effective Java.']],
      ex: { prompt: 'Write typesafeGet(keys, types, values, key, type) for a container that stores entries as parallel arrays (name, type name, value). Return the value of the first entry whose name equals key and whose type equals type, or null if none.', fn: 'typesafeGet', params: 'keys, types, values, key, type', sig: '(string[] keys, string[] types, string[] values, string key, string type) -> string?', java: `class Solution {
    public String typesafeGet(String[] keys, String[] types, String[] values, String key, String type) {
        for (int i = 0; i < keys.length; i++) {
            if (keys[i].equals(key) && types[i].equals(type)) return values[i];
        }
        return null;
    }
}
`, cases: [{ args: [['port', 'host'], ['Integer', 'String'], ['8080', 'db.local'], 'port', 'Integer'], expect: '8080' }, { args: [['port'], ['Integer'], ['8080'], 'port', 'String'], expect: null }, { args: [[], [], [], 'x', 'String'], expect: null }], solution: `function typesafeGet(keys,types,values,key,type){for(let i=0;i<keys.length;i++)if(keys[i]===key&&types[i]===type)return values[i];return null}`, hint: 'Both the name and the type must match.' },
      quiz: [
        choice('jv-ge-6-q1', 'jv-generic-api', 'Configuration values are read with casts from Map<String, Object>. Safer design?', ['typed keys with Class<T> and Class.cast on put', 'more casts', 'raw types', 'reflection'], 0, 'Tokens.'),
        choice('jv-ge-6-q2', 'jv-generic-api', 'How do you pass "List<Order>" as a runtime type?', ['new TypeReference<List<Order>>() {}', 'List<Order>.class', 'List.class', 'Order.class'], 0, 'Super type token.'),
        choice('jv-ge-6-q3', 'jv-generic-api', 'Good use of Optional?', ['return type of findById', 'entity field', 'method parameter', 'collection element'], 0, 'Returns only.'),
        fill('jv-ge-6-q4', 'jv-generic-api', 'Class<T>.___(obj) performs a checked cast', ['cast'], 'Safe.'),
      ],
    }),
  ],
  exam: [
    choice('jv-ge-e1', 'jv-generics-basics', 'Why avoid raw types?', ['they disable compile-time type checking', 'they are slower', 'they are deprecated keywords', 'they cannot hold nulls'], 0, 'Safety.'),
    choice('jv-ge-e2', 'jv-bounded-types', 'Most flexible bound for a generic max method?', ['T extends Comparable<? super T>', 'T extends Comparable<T>', 'T extends Object', 'none'], 0, 'Inherited comparison.'),
    choice('jv-ge-e3', 'jv-pecs', 'A method only reads numbers from a list. Parameter type?', ['List<? extends Number>', 'List<? super Number>', 'List<Number>', 'List<Object>'], 0, 'Producer extends.'),
    choice('jv-ge-e4', 'jv-erasure', 'Which is legal in generic code?', ['passing a Supplier<T> to create T', 'new T()', 'new T[10]', 'x instanceof List<String>'], 0, 'Erasure.'),
    choice('jv-ge-e5', 'jv-variance', 'Integer[] is a subtype of Number[] because arrays are...', ['covariant', 'invariant', 'contravariant', 'erased'], 0, 'Runtime check.'),
    choice('jv-ge-e6', 'jv-generic-api', 'Spring\'s getBean(OrderService.class) is an example of...', ['a type token', 'erasure', 'a raw type', 'a wildcard'], 0, 'Class<T>.'),
    choice('jv-ge-e7', 'jv-pecs', 'Where should wildcards appear?', ['method parameters', 'return types', 'field types only', 'class names'], 0, 'Callers.'),
    choice('jv-ge-e8', 'jv-erasure', 'A ClassCastException on a line with no cast suggests...', ['heap pollution from raw types or unchecked casts', 'a JIT bug', 'GC', 'a missing import'], 0, 'Inserted casts.'),
    choice('jv-ge-e9', 'jv-variance', 'List<Integer> is a subtype of...', ['List<? extends Number>', 'List<Number>', 'List<Object>', 'ArrayList<Integer>'], 0, 'Wildcards.'),
    order('jv-ge-e10', 'jv-pecs', 'Order how to choose a collection parameter type.', ['Ask whether the method reads from the parameter', 'Ask whether it writes to it', 'Pick ? extends for read-only, ? super for write-only', 'Use exact T if both, ? if neither'], 'PECS.'),
    order('jv-ge-e11', 'jv-erasure', 'Order what javac does with generic code.', ['Check type arguments at compile time', 'Erase type parameters to bounds', 'Insert casts where values are read', 'Generate bridge methods where needed'], 'Compilation.'),
    fill('jv-ge-e12', 'jv-generics-basics', 'Generics were added to Java in version ___', ['5'], '2004.'),
  ],
};
