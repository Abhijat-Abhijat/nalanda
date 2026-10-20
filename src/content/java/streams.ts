import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const jvStreams: Chapter = {
  id: 'jv-streams',
  title: 'Streams and functional Java',
  summary: 'Functional programming in Java since version 8: lambdas and functional interfaces, how stream pipelines evaluate lazily, collectors for grouping and partitioning, primitive streams and reduction, when parallel streams help or hurt, and Optional for absent values. Based on the Java SE API and JSR 335; checked as of October 2026.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'jv-st-1', title: 'Lambdas and functional interfaces', concept: 'jv-lambdas',
      story: "Java 8 (March 2014) was the biggest change to the language since generics. JSR 335, led by Brian Goetz, added **lambda expressions** and **method references**, letting behaviour be passed as values without anonymous inner classes. Rather than add function types to the type system, the designers reused interfaces: any interface with a single abstract method is a **functional interface**, so existing APIs like `Runnable` and `Comparator` accepted lambdas immediately. Under the hood, lambdas compile to `invokedynamic` call sites rather than extra classes, keeping startup and memory costs low.",
      analogy: "Handing someone a recipe card instead of hiring a chef: the card describes what to do, and whoever holds it can follow it whenever needed.",
      timeline: [['1997', 'Anonymous inner classes', 'Java 1.1: verbose function objects.'], ['March 2014', 'Java 8 lambdas', 'Lambdas, method references, java.util.function (JSR 335).'], ['2014', 'invokedynamic for lambdas', 'LambdaMetafactory creates implementations at runtime.'], ['2018', 'var in lambda parameters', 'Annotations on lambda parameters (Java 11).']],
      explain: "A lambda `(a, b) -> a + b` implements a functional interface's single abstract method; the target type decides which interface. `java.util.function` provides the standard shapes: `Function<T, R>` (T to R), `Predicate<T>` (T to boolean), `Consumer<T>` (T to nothing), `Supplier<T>` (nothing to T), `BiFunction`, `UnaryOperator`, `BinaryOperator`, and primitive specialisations (`IntPredicate`, `ToIntFunction`) that avoid boxing. **Method references** are shorthand: `String::length`, `System.out::println`, `ArrayList::new`. Functions **compose**: `f.andThen(g)` applies f then g; `f.compose(g)` applies g then f; `Predicate.and`, `or`, `negate`. Lambdas can capture local variables only if they are **effectively final**, so they cannot change captured locals; this prevents data races on stack variables. `this` inside a lambda refers to the enclosing instance, unlike an anonymous class.",
      diagram: "Function<Integer, Integer> add3 = x -> x + 3;\nFunction<Integer, Integer> times2 = x -> x * 2;\nadd3.andThen(times2).andThen(x -> -x).apply(4)   → ((4 + 3) × 2) negated = −14\nadd3.compose(times2).apply(4)                     → (4 × 2) + 3 = 11",
      ex1: ['java', 'functional interfaces and method references', "Predicate<String> nonBlank = s -> !s.trim().isEmpty();\nFunction<String, Integer> length = String::length;\nSupplier<List<String>> newList = ArrayList::new;\nComparator<Order> byTotal = Comparator.comparing(Order::getTotal);\nRunnable task = () -> log.info(\"done\");"],
      ex2: ['java', 'effectively final capture', "int threshold = 10;\nlist.removeIf(x -> x < threshold);   // fine: threshold never changes\n// threshold++;                       // would make the lambda above a compile error"],
      deepDive: {
        explain: "Lambdas are compiled to private methods plus an `invokedynamic` instruction that, on first execution, asks `LambdaMetafactory` to create an implementation; non-capturing lambdas become singletons, while capturing lambdas allocate a small object per evaluation (often eliminated by the JIT). Checked exceptions do not fit standard functional interfaces: a lambda calling a method that throws `IOException` must catch it or use a custom interface, which is why stream code often wraps checked exceptions. Stack traces through lambdas include synthetic method names like `lambda$main$0`, which is worth recognising when debugging. Prefer method references when they read clearly, and extract named methods when a lambda grows past a few lines. Define your own functional interface (annotated `@FunctionalInterface`) when a domain name communicates more than `Function<Order, BigDecimal>`.",
        example: ['js', 'composing operations like Function.andThen', "function applyPipeline(ops, x) {             // ops: 'add:n', 'mul:n', 'neg'\n  for (const op of ops) {\n    const [k, v] = op.split(':');\n    if (k === 'add') x += +v;\n    else if (k === 'mul') x *= +v;\n    else if (k === 'neg') x = -x;\n  }\n  return x;\n}"],
        tradeoffs: [['Form', 'Strength', 'Weakness'], ['Lambda', 'Concise, inline', 'Hard to read when long'], ['Method reference', 'Shortest, names intent', 'Only for existing methods'], ['Named method', 'Testable, documented', 'More code'], ['Anonymous class', 'Can hold state, own this', 'Verbose']],
        failures: [['Compile error: variable must be effectively final', 'Mutating a captured local', 'Use a result from the stream or an AtomicX holder sparingly'], ['Lambda cannot throw IOException', 'Checked exceptions in standard interfaces', 'Wrap or use a custom functional interface'], ['Unreadable 20-line lambdas', 'Logic inlined', 'Extract a named method'], ['Boxing overhead in hot code', 'Function<Integer, Integer>', 'IntUnaryOperator and primitive specialisations']],
      },
      warn: "Do not work around effectively-final rules with one-element arrays or shared mutable holders in parallel code; it reintroduces the data races the rule prevents.",
      production: {
        numbers: "Non-capturing lambdas are created once and reused; capturing lambdas allocate a small object per evaluation, which escape analysis frequently removes in hot loops.",
        observe: "Stack traces show lambda frames as lambda$method$N; profilers attribute their time to the enclosing method's synthetic lambda method.",
        security: "Lambdas that capture request-scoped objects and are stored in long-lived structures (caches, static listeners) can leak data between requests and leak memory.",
        checklist: ['Standard java.util.function types first', 'Primitive specialisations in hot paths', 'Method references where they read clearly', 'Named methods for long logic', '@FunctionalInterface on custom interfaces', 'Checked exceptions handled deliberately', 'No captured request state in long-lived lambdas'],
        sources: ['JSR 335: Lambda Expressions for the Java Programming Language', 'Goetz, "Translation of Lambda Expressions" (OpenJDK, 2012)', 'Java SE API: java.util.function package'],
      },
      tip: "If a lambda needs a comment to explain what it does, turn it into a well-named method and pass a method reference instead.",
      faq: [['What is a functional interface?', 'An interface with exactly one abstract method.'], ['f.andThen(g) applies...', 'f first, then g.'], ['Why must captured locals be effectively final?', 'To avoid races and confusion over mutable stack variables.'], ['How are lambdas compiled?', 'To private methods linked via invokedynamic and LambdaMetafactory.'], ['How do you avoid boxing in functions?', 'Primitive specialisations such as IntUnaryOperator.']],
      ex: { prompt: 'Write applyPipeline(ops, x) applying ops in order, like chaining Function.andThen: "add:n" adds n, "mul:n" multiplies by n, "neg" negates. Return the result.', fn: 'applyPipeline', params: 'ops, x', sig: '(string[] ops, int x) -> int', java: `class Solution {
    public int applyPipeline(String[] ops, int x) {
        java.util.function.Function<Integer, Integer> f = java.util.function.Function.identity();
        for (String op : ops) {
            String[] p = op.split(":");
            final int v = p.length > 1 ? Integer.parseInt(p[1]) : 0;
            if (p[0].equals("add")) f = f.andThen(y -> y + v);
            else if (p[0].equals("mul")) f = f.andThen(y -> y * v);
            else f = f.andThen(y -> -y);
        }
        return f.apply(x);
    }
}
`, cases: [{ args: [['add:3', 'mul:2', 'neg'], 4], expect: -14 }, { args: [[], 7], expect: 7 }, { args: [['mul:0', 'add:5'], 9], expect: 5 }], solution: `function applyPipeline(ops,x){for(const op of ops){const[k,v]=op.split(':');if(k==='add')x+=+v;else if(k==='mul')x*=+v;else if(k==='neg')x=-x}return x}`, hint: 'Apply each operation to the running value in order.' },
      quiz: [
        choice('jv-st-1-q1', 'jv-lambdas', 'Which interface fits x -> x.length() > 3?', ['Predicate<String>', 'Supplier<String>', 'Consumer<String>', 'Runnable'], 0, 'To boolean.'),
        choice('jv-st-1-q2', 'jv-lambdas', 'f.compose(g).apply(x) computes...', ['f(g(x))', 'g(f(x))', 'f(x) + g(x)', 'g(x) only'], 0, 'compose runs g first.'),
        choice('jv-st-1-q3', 'jv-lambdas', 'A lambda reads a local that is reassigned later. Result?', ['compile error', 'uses the latest value', 'uses the first value', 'runtime exception'], 0, 'Effectively final.'),
        fill('jv-st-1-q4', 'jv-lambdas', 'String::length is a method ___', ['reference'], 'Shorthand.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'jv-st-2', title: 'Stream pipelines and laziness', concept: 'jv-stream-laziness',
      story: "Streams arrived in Java 8 to let developers describe *what* to compute over a collection rather than writing loops. Their key design choice, shared with functional languages, is **laziness**: intermediate operations such as `filter` and `map` do nothing until a terminal operation runs, and then elements flow through the whole pipeline one at a time. That lets `findFirst` or `limit` stop early, and it surprises people who put side effects in `peek` or `map` and see them run fewer times than expected, or not at all.",
      analogy: "An assembly line that only starts moving when an order arrives, and stops as soon as the order is filled, instead of manufacturing every part in advance.",
      timeline: [['March 2014', 'Streams', 'java.util.stream with lazy pipelines (Java 8).'], ['2017', 'takeWhile, dropWhile, iterate with predicate', 'Java 9 additions.'], ['2021', 'Stream.toList and mapMulti', 'Java 16 conveniences.'], ['2025', 'Stream gatherers', 'Custom intermediate operations (JEP 485, Java 24).']],
      explain: "A stream pipeline has a **source** (a collection, array, `Stream.of`, `IntStream.range`, a file's lines), zero or more **intermediate operations** (`filter`, `map`, `flatMap`, `sorted`, `distinct`, `limit`), and one **terminal operation** (`collect`, `forEach`, `reduce`, `count`, `findFirst`, `anyMatch`). Intermediate operations are lazy and return new streams; nothing happens until the terminal operation pulls elements. Elements are processed **vertically**: each element passes through filter then map before the next element starts, except for **stateful** operations like `sorted` and `distinct`, which must see all (or many) elements first. **Short-circuiting** operations (`limit`, `findFirst`, `anyMatch`, `takeWhile`) stop pulling once they have their answer, so `filter(even).limit(2)` evaluates the predicate only until the second even number. A stream can be consumed **once**; reusing it throws `IllegalStateException`.",
      diagram: "IntStream.of(1, 2, 3, 4, 5, 6, 7, 8).filter(x -> x % 2 == 0).limit(2)\n1 → filter ✗\n2 → filter ✓ → limit (1 of 2)\n3 → filter ✗\n4 → filter ✓ → limit (2 of 2) → stop\npredicate calls: 4 (elements 5–8 never examined)",
      ex1: ['java', 'a typical pipeline', "List<String> topCustomers = orders.stream()\n    .filter(o -> o.getTotal().compareTo(LIMIT) > 0)\n    .map(Order::getCustomerName)\n    .distinct()\n    .sorted()\n    .limit(10)\n    .collect(Collectors.toList());"],
      ex2: ['java', 'laziness surprises', "Stream<String> s = names.stream().peek(n -> log.info(n));   // logs nothing yet\nlong n = s.count();   // Java 9+: may log nothing at all, because count can skip the pipeline\ns.count();            // IllegalStateException: stream has already been operated upon"],
      deepDive: {
        explain: "Because laziness and short-circuiting depend on operation order, place cheap, selective filters early and expensive maps late. Put `sorted` after filtering to sort fewer elements. Since Java 9, `count()` may compute the size directly from a sized source without running intermediate operations, so side effects in `peek` or `map` may not run; never rely on side effects in intermediate operations (`peek` is for debugging). `Stream.iterate` and `Stream.generate` produce infinite streams that require a short-circuiting operation. Streams over I/O (`Files.lines`, `BufferedReader.lines`) hold resources and must be closed with try-with-resources. Readability matters more than cleverness: a three-line loop with a `break` can be clearer than a convoluted stream, and loops are easier to debug for complex control flow. Java 24's **gatherers** (`Stream.gather`) allow custom intermediate operations such as windowing and scanning.",
        example: ['js', 'counting predicate calls for filter(even).limit(n)', "function predicateCalls(xs, limit) {\n  if (limit === 0) return 0;\n  let calls = 0, found = 0;\n  for (const x of xs) {\n    calls++;                                   // filter examines this element\n    if (x % 2 === 0 && ++found === limit) break;   // limit satisfied: stop pulling\n  }\n  return calls;\n}"],
        tradeoffs: [['Style', 'Strength', 'Weakness'], ['Stream pipeline', 'Declarative, composable, short-circuits', 'Harder to debug complex flows'], ['for loop', 'Explicit control, easy debugging', 'More boilerplate'], ['Stateful ops (sorted, distinct)', 'Convenient', 'Buffer elements; lose laziness'], ['Infinite streams', 'Elegant generators', 'Must short-circuit']],
        failures: [['Log statements in peek never run', 'Terminal op skipped evaluation (count) or short-circuited', 'No side effects in intermediate ops'], ['IllegalStateException: stream already operated upon', 'Reusing a stream', 'Create a new stream or use a Supplier<Stream>'], ['Program hangs', 'Infinite stream without limit', 'Add limit or takeWhile'], ['File handle leak', 'Files.lines not closed', 'try-with-resources']],
      },
      warn: "Never depend on side effects inside map, filter, or peek. Laziness, short-circuiting, and count() optimisations mean they may run fewer times than you expect, or not at all.",
      production: {
        numbers: "In the example, filter(even).limit(2) over 8 elements calls the predicate 4 times; without limit it would call it 8 times. On million-element sources, early short-circuiting saves proportionally.",
        observe: "Profilers show stream overhead mainly in lambda dispatch and boxing; for hot paths, compare with a loop and with primitive streams before micro-optimising.",
        security: "Streams over untrusted input (for example Files.lines of an uploaded file) still need size limits; laziness does not bound memory if a terminal operation collects everything.",
        checklist: ['Selective filters first', 'sorted after filtering', 'No side effects in intermediate operations', 'Short-circuit where possible', 'One terminal operation per stream', 'try-with-resources for I/O streams', 'Loops where control flow is complex'],
        sources: ['Java SE API: java.util.stream package summary (laziness, statefulness, short-circuiting)', 'Java SE API: Stream.count (Java 9 implementation note)', 'OpenJDK JEP 485: Stream Gatherers (Java 24)'],
      },
      tip: "Read a stream pipeline as \"for each element, top to bottom\", not \"each operation over the whole list\". That model predicts laziness and short-circuiting correctly.",
      faq: [['When do intermediate operations run?', 'Only when a terminal operation pulls elements.'], ['What is a short-circuiting operation?', 'One that can finish without consuming the whole stream, such as limit or findFirst.'], ['Can a stream be reused?', 'No; it can be consumed once.'], ['Which operations are stateful?', 'sorted, distinct, and similar.'], ['What is peek for?', 'Debugging only.']],
      ex: { prompt: 'Write predicateCalls(xs, limit) returning how many elements filter(x -> x % 2 == 0) examines in the pipeline filter(even).limit(limit) when the terminal operation pulls all results. Elements are pulled in order until limit even numbers have passed (or the source ends). A limit of 0 examines nothing.', fn: 'predicateCalls', params: 'xs, limit', sig: '(int[] xs, int limit) -> int', java: `class Solution {
    public int predicateCalls(int[] xs, int limit) {
        if (limit == 0) return 0;
        int calls = 0, found = 0;
        for (int x : xs) {
            calls++;
            if (x % 2 == 0 && ++found == limit) break;
        }
        return calls;
    }
}
`, cases: [{ args: [[1, 2, 3, 4, 5, 6, 7, 8], 2], expect: 4 }, { args: [[1, 3, 5], 2], expect: 3 }, { args: [[2, 4], 0], expect: 0 }, { args: [[], 3], expect: 0 }], solution: `function predicateCalls(xs,limit){if(limit===0)return 0;let calls=0,found=0;for(const x of xs){calls++;if(x%2===0&&++found===limit)break}return calls}`, hint: 'Stop as soon as the limit is reached.' },
      quiz: [
        choice('jv-st-2-q1', 'jv-stream-laziness', 'list.stream().map(this::expensive); with no terminal op does...', ['nothing', 'maps every element', 'maps the first element', 'throws'], 0, 'Lazy.'),
        choice('jv-st-2-q2', 'jv-stream-laziness', 'Which operation must see all elements before emitting?', ['sorted', 'filter', 'map', 'peek'], 0, 'Stateful.'),
        choice('jv-st-2-q3', 'jv-stream-laziness', 'Stream.iterate(1, x -> x * 2).forEach(...) without limit...', ['never ends', 'stops at overflow', 'throws immediately', 'returns 1'], 0, 'Infinite.'),
        fill('jv-st-2-q4', 'jv-stream-laziness', 'Operations like limit and findFirst are short-___', ['circuiting'], 'Stop early.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'jv-st-3', title: 'Collectors: grouping, partitioning, and maps', concept: 'jv-collectors',
      story: "SQL has had `GROUP BY` since the 1970s, and Java developers spent years reimplementing it with nested maps and loops. Java 8's `Collectors` class brought declarative aggregation to in-memory data: `groupingBy`, `partitioningBy`, `toMap`, `joining`, `counting`, `summingInt`, `averagingDouble`, and **downstream collectors** that compose like SQL aggregate functions. The most common production bug with them is not complexity but a single overlooked rule: `toMap` throws on duplicate keys.",
      analogy: "Sorting the post into pigeonholes by postcode, then counting or bundling the letters in each hole.",
      timeline: [['1974', 'SQL GROUP BY', 'Declarative grouping in SEQUEL/SQL.'], ['March 2014', 'Collectors', 'groupingBy, partitioningBy, toMap, joining (Java 8).'], ['2017', 'filtering and flatMapping collectors', 'Java 9 downstream additions.'], ['2018', 'teeing and unmodifiable collectors', 'toUnmodifiableList (Java 10), teeing (Java 12).']],
      explain: "`collect(Collectors.groupingBy(classifier))` returns `Map<K, List<T>>`. Add a **downstream collector** to aggregate each group: `groupingBy(Order::getCustomer, counting())`, `groupingBy(Order::getStatus, summingDouble(Order::total))`, or `groupingBy(String::length, TreeMap::new, joining(\",\"))` to choose the map type and join values. `partitioningBy(predicate)` splits into exactly two groups keyed `true` and `false`. `toMap(keyFn, valueFn)` builds a map but throws `IllegalStateException` on duplicate keys unless you pass a **merge function** (`toMap(k, v, Integer::sum)`), and it rejects `null` values. `joining(\", \", \"[\", \"]\")` builds strings. Since Java 16, `stream.toList()` returns an unmodifiable list; `Collectors.toList()` makes no mutability guarantee (in practice an `ArrayList`). `teeing` (Java 12) combines two collectors, for example min and max in one pass.",
      diagram: "words: cat horse dog ox mouse\ngroupingBy(String::length, TreeMap::new, joining(\",\"))\n  2 → ox\n  3 → cat,dog\n  5 → horse,mouse\ntoMap(word, length) with duplicate keys → IllegalStateException unless merge function given",
      ex1: ['java', 'grouping with downstream collectors', "Map<Status, Long> countByStatus = orders.stream()\n    .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));\nMap<Boolean, List<Order>> bigOrSmall = orders.stream()\n    .collect(Collectors.partitioningBy(o -> o.getTotal().compareTo(BIG) >= 0));"],
      ex2: ['java', 'toMap with a merge function', "Map<String, Integer> stockBySku = lines.stream()\n    .collect(Collectors.toMap(Line::getSku, Line::getQty, Integer::sum));   // duplicates summed\nMap<String, Customer> byEmail = customers.stream()\n    .collect(Collectors.toMap(Customer::getEmail, c -> c, (a, b) -> a, LinkedHashMap::new));"],
      deepDive: {
        explain: "Choose the map factory when order matters (`TreeMap::new` for sorted keys, `LinkedHashMap::new` for encounter order); the default `HashMap` has no defined order. Nested grouping (`groupingBy(a, groupingBy(b))`) builds nested maps; flatten keys with records (`groupingBy(o -> new Key(o.region(), o.status()))`) when nested maps get awkward. For large datasets, prefer pushing aggregation into the database: grouping in Java after loading every row moves data needlessly. `groupingByConcurrent` exists for parallel streams but loses order. `Collectors.toMap` rejecting null values surprises people mapping optional fields; filter nulls or use `HashMap::put` in a loop. When a collector chain becomes hard to read, a small loop with `merge` is often clearer and equally fast.",
        example: ['js', 'group words by length (sorted keys, joined values)', "function groupByLength(words) {\n  const m = new Map();\n  for (const w of words) { if (!m.has(w.length)) m.set(w.length, []); m.get(w.length).push(w); }\n  return [...m.keys()].sort((a, b) => a - b).map((k) => k + '=' + m.get(k).join(','));\n}"],
        tradeoffs: [['Collector', 'Use', 'Pitfall'], ['groupingBy', 'Group into lists or aggregates', 'Unordered HashMap by default'], ['partitioningBy', 'Two-way split', 'Always both keys present'], ['toMap', 'Key-value maps', 'Throws on duplicates; no null values'], ['Database GROUP BY', 'Large datasets', 'Query design and indexes']],
        failures: [['IllegalStateException: Duplicate key', 'toMap without merge function', 'Provide a merge function'], ['NullPointerException in toMap', 'Null values', 'Filter nulls or collect differently'], ['Report rows in random order', 'Default HashMap from groupingBy', 'TreeMap::new or LinkedHashMap::new'], ['Out of memory aggregating a table', 'Loading all rows to group in Java', 'GROUP BY in SQL']],
      },
      warn: "Collectors.toMap throws IllegalStateException on the first duplicate key. Real data almost always has duplicates eventually; always decide how to merge them.",
      production: {
        numbers: "Grouping one million rows in Java means loading one million objects into the heap; the equivalent SQL GROUP BY returns only the aggregated rows.",
        observe: "Search logs for 'Duplicate key' IllegalStateExceptions; they reveal toMap calls that assumed unique keys.",
        security: "Grouping by user-supplied keys can create unbounded numbers of groups; cap distinct keys or aggregate in the database with limits.",
        checklist: ['Merge function on every toMap', 'Map factory chosen when order matters', 'Downstream collectors for aggregates', 'Records as composite grouping keys', 'Large aggregations pushed to SQL', 'Null values handled before toMap', 'Loop with merge when collectors get unreadable'],
        sources: ['Java SE API: java.util.stream.Collectors', 'Java SE API: Stream.toList (Java 16)', 'Urma, Fusco, Mycroft, "Modern Java in Action" (2018), chapter 6'],
      },
      tip: "Whenever you write toMap, write the merge function in the same keystroke, even if you think keys are unique. It documents the assumption and prevents a production crash.",
      faq: [['What does groupingBy return by default?', 'Map<K, List<T>> backed by a HashMap.'], ['What is a downstream collector?', 'A collector applied to each group, such as counting or joining.'], ['What does toMap do on duplicate keys?', 'Throws IllegalStateException unless given a merge function.'], ['partitioningBy keys?', 'true and false.'], ['Difference between toList() and Collectors.toList()?', 'Stream.toList() is unmodifiable; Collectors.toList() has no guarantee.']],
      ex: { prompt: 'Write groupByLength(words) grouping words by length with sorted keys, keeping encounter order within each group, and returning entries formatted as "length=w1,w2".', fn: 'groupByLength', params: 'words', sig: '(string[] words) -> string[]', java: `class Solution {
    public String[] groupByLength(String[] words) {
        Map<Integer, String> g = Arrays.stream(words).collect(
            java.util.stream.Collectors.groupingBy(String::length, TreeMap::new, java.util.stream.Collectors.joining(",")));
        List<String> out = new ArrayList<>();
        for (Map.Entry<Integer, String> e : g.entrySet()) out.add(e.getKey() + "=" + e.getValue());
        return out.toArray(new String[0]);
    }
}
`, cases: [{ args: [['cat', 'horse', 'dog', 'ox', 'mouse']], expect: ['2=ox', '3=cat,dog', '5=horse,mouse'] }, { args: [[]], expect: [] }], solution: `function groupByLength(words){const m=new Map();for(const w of words){if(!m.has(w.length))m.set(w.length,[]);m.get(w.length).push(w)}return [...m.keys()].sort((a,b)=>a-b).map(k=>k+'='+m.get(k).join(','))}`, hint: 'groupingBy with a TreeMap factory and joining downstream.' },
      quiz: [
        choice('jv-st-3-q1', 'jv-collectors', 'Count orders per customer:', ['groupingBy(Order::getCustomer, counting())', 'toMap(customer, 1)', 'partitioningBy(customer)', 'joining()'], 0, 'Downstream.'),
        choice('jv-st-3-q2', 'jv-collectors', 'toMap crashes with "Duplicate key". Fix?', ['add a merge function', 'use parallel stream', 'sort first', 'use peek'], 0, 'Merge.'),
        choice('jv-st-3-q3', 'jv-collectors', 'Split orders into paid and unpaid:', ['partitioningBy(Order::isPaid)', 'groupingBy(true)', 'filter twice only', 'toMap'], 0, 'Two groups.'),
        fill('jv-st-3-q4', 'jv-collectors', 'Collectors.___(", ") concatenates strings with a separator', ['joining'], 'Strings.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'jv-st-4', title: 'Primitive streams and reduction', concept: 'jv-primitive-streams',
      story: "A `Stream<Integer>` boxes every number into an `Integer` object, which costs allocation and pointer chasing. Java 8 therefore shipped three specialised streams, `IntStream`, `LongStream`, and `DoubleStream`, with arithmetic terminal operations (`sum`, `average`, `summaryStatistics`) and no boxing. Knowing when you are in a primitive stream, and converting deliberately with `mapToInt`, `boxed`, and `mapToObj`, is one of the simplest performance wins in stream code.",
      analogy: "Counting coins by weighing the bag rather than wrapping each coin in its own envelope first and then counting envelopes.",
      timeline: [['March 2014', 'Primitive streams', 'IntStream, LongStream, DoubleStream (Java 8).'], ['2014', 'Summary statistics', 'IntSummaryStatistics: count, min, max, sum, average in one pass.'], ['2017', 'iterate with predicate', 'IntStream.iterate(seed, hasNext, next) (Java 9).'], ['2020s', 'Valhalla aims', 'Future value types to reduce boxing generally.']],
      explain: "Create primitive streams with `IntStream.range(0, n)` (end exclusive), `rangeClosed`, `Arrays.stream(int[])`, `chars()` on strings, or `mapToInt(Order::getQuantity)` from object streams. Terminal operations include `sum()`, `average()` (an `OptionalDouble`), `min`/`max` (`OptionalInt`), and `summaryStatistics()` returning count, min, max, sum, and average in **one pass**. **Reduction**: `reduce(identity, accumulator)` folds elements into one value; the identity must be a true identity for the operation (0 for sum, 1 for product), and the accumulator must be **associative** for parallel streams to give correct results. Prefer specialised reductions (`sum`, `max`, `collect(counting())`) over hand-written `reduce` for clarity. Beware overflow: `IntStream.sum()` returns an `int` and wraps; use `mapToLong(...).sum()` or `asLongStream()` for large totals.",
      diagram: "Stream<Integer> ──mapToInt(Integer::intValue)──▶ IntStream ──boxed()──▶ Stream<Integer>\nIntStream ──mapToObj(i -> …)──▶ Stream<T>\nArrays.stream(new int[] {4, 8, 15, 16, 23, 42}).summaryStatistics()\n  count 6 · min 4 · max 42 · sum 108 · average 18.0",
      ex1: ['java', 'one-pass statistics', "IntSummaryStatistics s = orders.stream()\n    .mapToInt(Order::getQuantity)\n    .summaryStatistics();\nlog.info(\"n={} min={} max={} avg={}\", s.getCount(), s.getMin(), s.getMax(), s.getAverage());"],
      ex2: ['java', 'overflow in sum', "int total = IntStream.of(Integer.MAX_VALUE, 1).sum();          // −2147483648 (wrapped)\nlong safe = IntStream.of(Integer.MAX_VALUE, 1).asLongStream().sum();   // 2147483648"],
      deepDive: {
        explain: "Boxing costs show up in allocation profiles as streams of `Integer.valueOf` calls; for numeric pipelines over large arrays, primitive streams or plain loops can be several times faster than boxed streams. `reduce` with a non-associative operation (subtraction, string concatenation with a separator in the wrong place) gives different answers in parallel; and using `reduce` to build mutable containers is wrong because each step must return a new value; use `collect` for mutable reduction instead. `average()` on an empty stream returns `OptionalDouble.empty()`, and `IntSummaryStatistics` on no elements reports min as `Integer.MAX_VALUE` and max as `Integer.MIN_VALUE`, so check `getCount()` first. For money, `BigDecimal` streams with `reduce(BigDecimal.ZERO, BigDecimal::add)` are correct; never sum money with `DoubleStream`.",
        example: ['js', 'summary statistics: count, min, max, average', "function summary(xs) {\n  if (!xs.length) return [0, 0, 0, 0];              // guard: empty statistics are meaningless\n  return [xs.length, Math.min(...xs), Math.max(...xs), xs.reduce((a, b) => a + b, 0) / xs.length];\n}"],
        tradeoffs: [['Approach', 'Strength', 'Weakness'], ['IntStream / LongStream', 'No boxing, arithmetic ops', 'Fewer collectors'], ['Stream<Integer>', 'Full collector support', 'Boxing overhead'], ['reduce', 'General folding', 'Must be associative with true identity'], ['for loop over int[]', 'Fastest, simplest for hot paths', 'Less declarative']],
        failures: [['Negative total from sum()', 'int overflow', 'asLongStream().sum() or mapToLong'], ['Different results in parallel', 'Non-associative reduce', 'Associative operations or collect'], ['Min shows 2147483647', 'Statistics on an empty stream', 'Check getCount() first'], ['Money totals off by a cent', 'DoubleStream sum', 'BigDecimal reduce']],
      },
      warn: "IntStream.sum() returns an int and silently overflows. For counts or totals that can exceed two billion, convert to a LongStream first.",
      production: {
        numbers: "A boxed Stream<Integer> over one million values allocates up to one million Integer objects (outside the −128 to 127 cache); an IntStream over an int[] allocates none.",
        observe: "Allocation profiles (JFR) showing Integer.valueOf in stream code indicate boxing that mapToInt or primitive arrays would remove.",
        security: "Aggregations over untrusted numeric input should use overflow-safe types (long, Math.addExact, BigDecimal) to prevent wrapped totals bypassing limits.",
        checklist: ['mapToInt / mapToLong for numeric pipelines', 'summaryStatistics for one-pass stats', 'LongStream for large totals', 'Associative reduce with true identity', 'collect for mutable reduction', 'Empty-stream checks', 'BigDecimal for money'],
        sources: ['Java SE API: IntStream, IntSummaryStatistics, Stream.reduce', 'Java SE API: java.util.stream package (associativity requirements)', 'Bloch, "Effective Java" (3rd ed.), item 61: prefer primitive types to boxed primitives'],
      },
      tip: "If a stream ends with a numeric aggregate, check whether it is an IntStream, LongStream, or DoubleStream at that point. One mapToInt can remove all boxing.",
      faq: [['Why primitive streams?', 'To avoid boxing overhead.'], ['How do you go from IntStream to Stream<Integer>?', 'boxed().'], ['What does summaryStatistics give?', 'Count, min, max, sum, and average in one pass.'], ['Requirement for reduce in parallel?', 'An associative accumulator and a true identity.'], ['How do you avoid overflow in sums?', 'Use LongStream (asLongStream or mapToLong).']],
      ex: { prompt: 'Write summary(xs) returning [count, min, max, average] like IntSummaryStatistics; for an empty array return [0, 0, 0, 0].', fn: 'summary', params: 'xs', sig: '(int[] xs) -> double[]', java: `class Solution {
    public double[] summary(int[] xs) {
        if (xs.length == 0) return new double[] { 0, 0, 0, 0 };
        IntSummaryStatistics s = Arrays.stream(xs).summaryStatistics();
        return new double[] { s.getCount(), s.getMin(), s.getMax(), s.getAverage() };
    }
}
`, cases: [{ args: [[4, 8, 15, 16, 23, 42]], expect: [6, 4, 42, 18] }, { args: [[]], expect: [0, 0, 0, 0] }, { args: [[5]], expect: [1, 5, 5, 5] }], solution: `function summary(xs){if(!xs.length)return[0,0,0,0];return[xs.length,Math.min(...xs),Math.max(...xs),xs.reduce((a,b)=>a+b,0)/xs.length]}`, hint: 'One pass for count, min, max, and sum.' },
      quiz: [
        choice('jv-st-4-q1', 'jv-primitive-streams', 'Sum order quantities without boxing:', ['orders.stream().mapToInt(Order::getQty).sum()', 'map(Order::getQty).reduce(0, Integer::sum)', 'collect(toList()) then loop', 'boxed().sum()'], 0, 'mapToInt.'),
        choice('jv-st-4-q2', 'jv-primitive-streams', 'reduce(0, (a, b) -> a - b) on a parallel stream...', ['can give wrong results: not associative', 'is fine', 'throws', 'is faster'], 0, 'Associativity.'),
        choice('jv-st-4-q3', 'jv-primitive-streams', 'Total bytes of many files as int sum overflows. Fix?', ['mapToLong(...).sum()', 'use double', 'ignore', 'parallel()'], 0, 'LongStream.'),
        fill('jv-st-4-q4', 'jv-primitive-streams', 'IntStream.range(0, 5) excludes the end; rangeClosed ___ it', ['includes'], 'Inclusive.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'jv-st-5', title: 'Parallel streams: when they help and hurt', concept: 'jv-parallel-streams',
      story: "Adding `.parallel()` to a stream looked like free speed in 2014: one call and work spreads across cores using the **fork/join framework** Doug Lea built for Java 7. In practice many teams found parallel streams slower, or saw unrelated parts of the application stall. All parallel streams share one **common ForkJoinPool** sized to the number of cores minus one, so one blocking task can starve every other parallel stream in the JVM. Doug Lea's guidance, the **NQ model**, became the rule of thumb: parallelism pays off only when the number of elements times the cost per element is large.",
      analogy: "Hiring extra movers: worth it to move a house, counterproductive to carry one box, and disastrous if they all must share one narrow staircase.",
      timeline: [['2011', 'Fork/join framework', 'ForkJoinPool with work stealing (Java 7).'], ['March 2014', 'Parallel streams', '.parallel() uses the common pool (Java 8).'], ['2014', 'NQ model', 'Doug Lea\'s guidance on when to parallelise.'], ['2023', 'Virtual threads', 'Blocking I/O concurrency moves to virtual threads (Java 21).']],
      explain: "A parallel stream **splits** its source with a `Spliterator`, processes chunks on the common `ForkJoinPool` (parallelism defaults to available processors minus one, plus the calling thread), and **combines** results. It helps when: (1) **N × Q is large**, where N is the number of elements and Q the cost per element (Lea suggests roughly N × Q above 10,000 basic operations before parallelism can pay off); (2) the source **splits cheaply and evenly** (arrays, `ArrayList`, `IntStream.range`; not `LinkedList`, `Stream.iterate`, or I/O-backed streams); (3) operations are **stateless, non-interfering, and associative**; and (4) the work is **CPU-bound**. It hurts when tasks block on I/O (they occupy common-pool threads), when ordering constraints (`forEachOrdered`, `limit` on ordered streams, `findFirst`) force coordination, or when lambdas mutate shared state, which causes races. In server applications, request threads already provide parallelism; parallel streams inside requests often just add contention.",
      diagram: "worth parallelising?\n  N × Q ≥ ~10,000         (elements × cost per element)\n  source splits well      array · ArrayList · IntStream.range   ✓\n                          LinkedList · iterate · I/O lines      ✗\n  CPU-bound, stateless, associative\nall parallel streams share ForkJoinPool.commonPool() (cores − 1 threads)",
      ex1: ['java', 'a good candidate', "double total = IntStream.range(0, 50_000_000)\n    .parallel()\n    .mapToDouble(i -> simulate(i))      // CPU-heavy, independent\n    .sum();"],
      ex2: ['java', 'a bad candidate', "List<Profile> profiles = userIds.parallelStream()\n    .map(id -> restClient.fetchProfile(id))   // blocking I/O in the common pool\n    .collect(Collectors.toList());\n// better: virtual threads or an async HTTP client with bounded concurrency"],
      deepDive: {
        explain: "Measure before and after with realistic data (JMH for microbenchmarks, load tests for services); parallel streams have fixed overhead for splitting, task scheduling, and combining. Shared mutable state is the classic correctness bug: `list.parallelStream().forEach(x -> results.add(x))` into an `ArrayList` loses elements or throws; use `collect` instead. Ordering costs: an ordered parallel stream with `limit` or `findFirst` must track encounter order, so `unordered()` or `findAny` can be much faster when order does not matter. Blocking calls inside parallel streams can deadlock or starve other code using the common pool, including `CompletableFuture` default async tasks. You can run a parallel stream inside a custom `ForkJoinPool` via `pool.submit(() -> stream.parallel()…).get()`, but this relies on implementation behaviour; for I/O concurrency in Java 21+, virtual threads are the better tool.",
        example: ['js', 'applying the NQ rule of thumb', "function parallelWorthIt(n, q, source) {\n  const splitsWell = ['array', 'ArrayList', 'IntStream.range'].includes(source);\n  return n * q >= 10000 && splitsWell;      // large work AND cheap, even splitting\n}"],
        tradeoffs: [['Situation', 'Parallel stream?', 'Better option'], ['CPU-heavy work on large arrays', 'Often yes', 'Measure with JMH'], ['Small collections', 'No', 'Sequential stream'], ['Blocking I/O per element', 'No', 'Virtual threads, async clients'], ['Inside a busy web server', 'Rarely', 'Request-level concurrency']],
        failures: [['Slower after adding .parallel()', 'Small N × Q, splitting overhead', 'Stay sequential'], ['Elements missing from results', 'Mutating a shared ArrayList in forEach', 'collect instead of side effects'], ['Unrelated parallel code stalls', 'Blocking I/O in the common pool', 'Virtual threads or a dedicated executor'], ['No speed-up on LinkedList', 'Poor splitting source', 'Copy to ArrayList or array first']],
      },
      warn: "Never run blocking I/O inside a parallel stream. Every parallel stream and default CompletableFuture task in the JVM shares the same small common pool.",
      production: {
        numbers: "On an 8-core machine the common pool has 7 worker threads; Doug Lea's rule of thumb suggests N × Q of at least about 10,000 basic operations before parallel overhead is repaid.",
        observe: "Thread dumps with many ForkJoinPool.commonPool-worker threads blocked in socket reads indicate I/O in parallel streams or default async tasks.",
        security: "Parallel processing of untrusted data still needs input limits; splitting work does not reduce total CPU, so large inputs can still exhaust capacity.",
        checklist: ['Benchmark before using parallel', 'N × Q large and CPU-bound', 'Splittable sources only', 'Stateless, associative operations', 'No shared mutable state', 'No blocking I/O in the common pool', 'unordered or findAny when order does not matter'],
        sources: ['Lea, "When to use parallel streams" (draft notes, 2014)', 'Java SE API: ForkJoinPool.commonPool, Spliterator', 'Goetz, "Java Streams" articles on parallelism (IBM developerWorks, 2016)'],
      },
      tip: "Treat .parallel() as an optimisation that requires a benchmark, not as a default. In web services, request-level concurrency usually already uses the cores.",
      faq: [['Which pool runs parallel streams?', 'The common ForkJoinPool.'], ['What is the NQ model?', 'Parallelism pays when elements × cost per element is large.'], ['Which sources split well?', 'Arrays, ArrayList, IntStream.range.'], ['Why avoid I/O in parallel streams?', 'It blocks the shared common pool.'], ['How should results be gathered?', 'With collect, not by mutating shared collections.']],
      ex: { prompt: 'Write parallelWorthIt(n, q, source) applying the NQ rule: return true only if n × q ≥ 10,000 and source is one of "array", "ArrayList", or "IntStream.range".', fn: 'parallelWorthIt', params: 'n, q, source', sig: '(int n, int q, string source) -> bool', java: `class Solution {
    public boolean parallelWorthIt(int n, int q, String source) {
        boolean splitsWell = source.equals("array") || source.equals("ArrayList") || source.equals("IntStream.range");
        return (long) n * q >= 10000 && splitsWell;
    }
}
`, cases: [{ args: [1000000, 1, 'ArrayList'], expect: true }, { args: [100, 10, 'array'], expect: false }, { args: [1000000, 5, 'LinkedList'], expect: false }, { args: [5000, 2, 'IntStream.range'], expect: true }], solution: `function parallelWorthIt(n,q,source){return n*q>=10000&&['array','ArrayList','IntStream.range'].includes(source)}`, hint: 'Both conditions must hold.' },
      quiz: [
        choice('jv-st-5-q1', 'jv-parallel-streams', 'userIds.parallelStream().map(this::callRestApi) is risky because...', ['blocking I/O ties up the shared common pool', 'it is always sequential', 'REST is forbidden', 'it uses virtual threads'], 0, 'Common pool.'),
        choice('jv-st-5-q2', 'jv-parallel-streams', 'parallelStream().forEach(list::add) into an ArrayList...', ['can lose elements or throw', 'is safe', 'is ordered', 'is fastest'], 0, 'Race.'),
        choice('jv-st-5-q3', 'jv-parallel-streams', 'Which source splits poorly?', ['LinkedList', 'int[]', 'ArrayList', 'IntStream.range'], 0, 'Spliterator.'),
        fill('jv-st-5-q4', 'jv-parallel-streams', 'Parallel streams run on the common Fork___Pool', ['Join'], 'Work stealing.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'jv-st-6', title: 'Optional and absent values', concept: 'jv-optional',
      story: "Tony Hoare called the null reference, which he introduced in ALGOL W in 1965, his \"billion-dollar mistake\". Java 8 added `Optional<T>`, inspired by Guava's `Optional` and functional languages' `Maybe`, as a way for methods to say \"there may be no result\" in their return type. Brian Goetz has been explicit about its intended scope: a limited mechanism for library method return types, not a replacement for every null.",
      analogy: "A parcel locker notification that says either \"your parcel is in locker 12\" or \"no parcel today\", instead of a slip of paper that is sometimes blank and sometimes missing entirely.",
      timeline: [['1965', 'Null reference', 'Tony Hoare adds null to ALGOL W.'], ['2011', 'Guava Optional', 'Google\'s library popularises Optional in Java.'], ['March 2014', 'java.util.Optional', 'Return type for possibly absent results (Java 8).'], ['2017–2018', 'Optional improvements', 'or, ifPresentOrElse, stream (Java 9); orElseThrow() (Java 10).']],
      explain: "Return `Optional<T>` from methods that may legitimately find nothing (`findById`, `findFirst`, `max`). Callers then handle absence explicitly: `map` and `flatMap` transform the value if present; `filter` keeps it if a condition holds; `orElse(default)` supplies a value (evaluated eagerly), `orElseGet(supplier)` supplies one lazily, `orElseThrow()` throws `NoSuchElementException` or a custom exception; `ifPresent` and `ifPresentOrElse` run actions. **Avoid** `get()` without checking, which reintroduces the NPE problem with a different exception. Do **not** use Optional for fields, method parameters, collection elements, or to wrap collections (return an empty collection instead). Use `OptionalInt`, `OptionalLong`, `OptionalDouble` for primitives. Never return `null` from a method declared to return `Optional`.",
      diagram: "values: \"abc\" \"70000\" \"8080\" \"443\"\nstream().map(parsePort)       → Optional.empty, Optional[70000], Optional[8080], …\n        .flatMap(Optional::stream)  (Java 9) → 70000, 8080, 443\n        .filter(p -> p >= 1 && p <= 65535) → 8080, 443\n        .findFirst()                 → Optional[8080]\n.orElse(null) at the edge if an API needs null",
      ex1: ['java', 'idiomatic Optional chains (Java 8 compatible)', "String city = userRepo.findById(id)\n    .map(User::getAddress)\n    .map(Address::getCity)\n    .orElse(\"unknown\");\nUser u = userRepo.findById(id)\n    .orElseThrow(() -> new NotFoundException(\"user \" + id));"],
      ex2: ['java', 'orElse versus orElseGet', "Config c = cache.find(key).orElse(loadFromDisk(key));        // loadFromDisk ALWAYS runs\nConfig c = cache.find(key).orElseGet(() -> loadFromDisk(key)); // runs only when absent"],
      deepDive: {
        explain: "Optional is an object, so it allocates (often eliminated by the JIT in short chains), which is one reason it is discouraged as a field or in tight loops. Serialisation frameworks and JPA do not treat Optional fields well; expose `Optional` from getters if useful but store plain nullable fields. `Optional.of(null)` throws immediately; use `ofNullable` when wrapping values that may be null (for example from legacy APIs). Spring Data repositories return `Optional<T>` from `findById`, which pairs naturally with `orElseThrow` in service methods mapped to 404 responses. Static analysis annotations (`@Nullable`, JSpecify) complement Optional by marking nullable parameters and fields that Optional should not cover. In parsing and validation, returning Optional from small helpers composes cleanly with streams via `flatMap(Optional::stream)` (Java 9).",
        example: ['js', 'first valid port from string values', "function firstValidPort(values) {\n  for (const v of values) {\n    if (!/^-?\\d+$/.test(v.trim())) continue;          // not a number → empty\n    const n = parseInt(v.trim(), 10);\n    if (n >= 1 && n <= 65535) return n;                // filter, then findFirst\n  }\n  return null;                                          // Optional.empty at the boundary\n}"],
        tradeoffs: [['Approach', 'Use', 'Avoid'], ['Optional<T> return', 'Possibly absent single results', 'Fields, parameters'], ['Empty collection', 'Possibly empty many results', 'Optional<List<T>>'], ['@Nullable annotations', 'Fields and parameters', 'Without tooling to check them'], ['Exceptions', 'Truly exceptional absence', 'Normal not-found cases']],
        failures: [['NoSuchElementException in production', 'Optional.get() without a check', 'orElseThrow with a meaningful exception, or map/orElse'], ['Expensive call runs even when cached', 'orElse with a method call', 'orElseGet with a supplier'], ['NullPointerException from Optional.of', 'Wrapping a null value', 'Optional.ofNullable'], ['JSON or JPA mapping errors', 'Optional fields', 'Plain fields; Optional getters if needed']],
      },
      warn: "orElse(expensiveCall()) always runs the expensive call, even when the Optional has a value. Use orElseGet(() -> expensiveCall()) for anything costly or side-effecting.",
      production: {
        numbers: "A short Optional chain often compiles to no allocation after escape analysis, but Optional fields in millions of entities add one object each (roughly 16 bytes) to the heap.",
        observe: "Code search for Optional.get() and isPresent() followed by get(); replace them with map, orElse, or orElseThrow.",
        security: "Map absent resources to 404 and unauthorised ones to 403/404 deliberately; orElseThrow with distinct exceptions keeps those decisions explicit instead of leaking existence through null handling.",
        checklist: ['Optional only for return values', 'No get() without a guarantee', 'orElseGet for costly defaults', 'ofNullable when wrapping legacy values', 'Empty collections instead of Optional<List>', 'Primitive Optionals for numbers', 'Never return null as an Optional'],
        sources: ['Java SE API: java.util.Optional', 'Hoare, "Null References: The Billion Dollar Mistake" (QCon London, 2009)', 'Bloch, "Effective Java" (3rd ed.), item 55: return optionals judiciously'],
      },
      tip: "Treat Optional.get() as a code smell in review. Every use has a clearer alternative: map, orElse, orElseGet, or orElseThrow with a specific exception.",
      faq: [['Where should Optional be used?', 'As a return type for possibly absent results.'], ['orElse versus orElseGet?', 'orElse evaluates its argument always; orElseGet only when empty.'], ['Optional.of(null)?', 'Throws NullPointerException; use ofNullable.'], ['Should a list be wrapped in Optional?', 'No; return an empty list.'], ['Who called null a billion-dollar mistake?', 'Tony Hoare.']],
      ex: { prompt: 'Write firstValidPort(values) returning the first value that, after trimming, parses as an integer between 1 and 65535 inclusive; skip values that are not integers. Return null if none.', fn: 'firstValidPort', params: 'values', sig: '(string[] values) -> int?', java: `class Solution {
    public Integer firstValidPort(String[] values) {
        for (String v : values) {
            int n;
            try { n = Integer.parseInt(v.trim()); } catch (NumberFormatException e) { continue; }
            if (n >= 1 && n <= 65535) return n;
        }
        return null;
    }
}
`, cases: [{ args: [['abc', '70000', '8080', '443']], expect: 8080 }, { args: [['x', '0']], expect: null }, { args: [[' 22 ']], expect: 22 }], solution: `function firstValidPort(values){for(const v of values){if(!/^-?\\d+$/.test(v.trim()))continue;const n=parseInt(v.trim(),10);if(n>=1&&n<=65535)return n}return null}`, hint: 'Parse, skip failures, filter by range, take the first.' },
      quiz: [
        choice('jv-st-6-q1', 'jv-optional', 'Best way to turn an empty findById into a 404?', ['orElseThrow(() -> new NotFoundException(id))', 'get()', 'return null', 'isPresent then get'], 0, 'Explicit.'),
        choice('jv-st-6-q2', 'jv-optional', 'cache.find(k).orElse(db.load(k)) calls db.load...', ['every time', 'only when absent', 'never', 'twice'], 0, 'Eager.'),
        choice('jv-st-6-q3', 'jv-optional', 'A method may return no orders. Return type?', ['List<Order> (possibly empty)', 'Optional<List<Order>>', 'null', 'Optional<Order[]>'], 0, 'Empty collection.'),
        fill('jv-st-6-q4', 'jv-optional', 'Wrap a possibly null value with Optional.of___', ['Nullable'], 'Safe wrap.'),
      ],
    }),
  ],
  exam: [
    choice('jv-st-e1', 'jv-lambdas', 'A functional interface has...', ['exactly one abstract method', 'no methods', 'only default methods', 'two abstract methods'], 0, 'SAM.'),
    choice('jv-st-e2', 'jv-stream-laziness', 'Intermediate operations run when...', ['a terminal operation pulls elements', 'they are declared', 'the JVM starts', 'GC runs'], 0, 'Lazy.'),
    choice('jv-st-e3', 'jv-collectors', 'toMap with duplicate keys and no merge function...', ['throws IllegalStateException', 'keeps the last', 'keeps the first', 'merges into a list'], 0, 'Merge function.'),
    choice('jv-st-e4', 'jv-primitive-streams', 'Why mapToInt before sum?', ['avoid boxing and get IntStream.sum', 'sorting', 'thread safety', 'immutability'], 0, 'Primitive stream.'),
    choice('jv-st-e5', 'jv-parallel-streams', 'Parallel streams are a good fit for...', ['CPU-heavy work over large arrays', 'blocking HTTP calls', 'ten-element lists', 'LinkedList sources'], 0, 'NQ.'),
    choice('jv-st-e6', 'jv-optional', 'Optional should mainly be used as...', ['a return type', 'a field type', 'a parameter type', 'a collection element'], 0, 'Returns.'),
    choice('jv-st-e7', 'jv-stream-laziness', 'Side effects in peek may not run because...', ['laziness, short-circuiting, and count() optimisations', 'peek is deprecated', 'GC removes them', 'they always run'], 0, 'Debug only.'),
    choice('jv-st-e8', 'jv-collectors', 'Sorted keys from groupingBy:', ['pass TreeMap::new as the map factory', 'sort the stream first', 'use parallel', 'it is automatic'], 0, 'Factory.'),
    choice('jv-st-e9', 'jv-parallel-streams', 'All parallel streams share...', ['the common ForkJoinPool', 'one thread', 'a new pool each time', 'virtual threads'], 0, 'Starvation risk.'),
    order('jv-st-e10', 'jv-stream-laziness', 'Order the parts of a stream pipeline.', ['Source', 'Intermediate operations', 'Terminal operation', 'Result'], 'Pipeline.'),
    order('jv-st-e11', 'jv-optional', 'Order a typical Optional chain.', ['findById returns Optional', 'map to a nested value', 'filter by a condition', 'orElseThrow or orElse at the end'], 'Chain.'),
    fill('jv-st-e12', 'jv-lambdas', 'Lambdas arrived in Java ___', ['8'], 'JSR 335.'),
  ],
};
