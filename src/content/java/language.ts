import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const jvLanguage: Chapter = {
  id: 'jv-language',
  title: 'Java for experienced developers',
  summary: 'The modern Java language for developers coming from other languages or from Java 8: primitives and numeric pitfalls, strings and Unicode, records, sealed hierarchies, switch expressions and pattern matching, and text blocks, var, and the six-month release train. Feature versions checked against OpenJDK JEPs as of October 2026 (JDK 27 latest, JDK 25 current LTS).',
  lessons: [
    deepTopic({
      id: 'l1', key: 'jv-la-1', title: 'Primitives, wrappers, and numeric pitfalls', concept: 'jv-numeric-types',
      story: "Java was designed at Sun Microsystems by James Gosling's team and released in 1996 with a deliberate split: eight **primitive types** (`byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean`) stored as raw values for speed, and everything else as objects on the heap. Java 5 (2004) added **autoboxing**, which converts between `int` and `Integer` automatically. The convenience hid sharp edges that still appear in code reviews: integer overflow that wraps silently, `==` on boxed numbers that works for small values and fails for large ones, and `double` arithmetic that cannot represent 0.1 exactly.",
      analogy: "A car odometer with a fixed number of digits: drive far enough and it rolls back to zero without any warning light.",
      timeline: [['1996', 'Java 1.0', 'Eight primitive types with fixed sizes on every platform.'], ['2004', 'Java 5 autoboxing', 'Automatic conversion between primitives and wrappers; Integer cache for −128 to 127.'], ['2014', 'Java 8 Math.*Exact', 'Math.addExact and friends throw on overflow (added in Java 8).'], ['2020s', 'Project Valhalla', 'Value classes in development to close the gap between primitives and objects.']],
      explain: "Primitive sizes are fixed by the specification: `int` is 32-bit two's complement (−2,147,483,648 to 2,147,483,647), `long` 64-bit, `double` 64-bit IEEE 754. **Overflow wraps silently**: `Integer.MAX_VALUE + 1` equals `Integer.MIN_VALUE`. Use `long` for counts that can exceed two billion (milliseconds since 1970, byte sizes, database ids), or `Math.addExact`/`multiplyExact` to throw instead of wrapping. **Wrappers** (`Integer`, `Long`) are objects: they can be `null`, which causes `NullPointerException` on unboxing, and `==` compares references. `Integer.valueOf` caches values from −128 to 127, so `==` happens to work for small numbers and fails for larger ones; always use `equals`. **Floating point**: `0.1 + 0.2` is `0.30000000000000004`; use `BigDecimal` (constructed from strings) for money. Integer division truncates toward zero, and `%` keeps the sign of the dividend.",
      diagram: "int:  32-bit  −2,147,483,648 … 2,147,483,647   MAX_VALUE + 1 → MIN_VALUE (wraps)\nlong: 64-bit  ≈ ±9.22 × 10^18\nInteger a = 127, b = 127 → a == b true   (cached)\nInteger c = 128, d = 128 → c == d false  (different objects) → use equals\n0.1 + 0.2 = 0.30000000000000004 → BigDecimal(\"0.10\") for money",
      ex1: ['java', 'overflow and the safe alternatives', "int big = Integer.MAX_VALUE;\nSystem.out.println(big + 1);              // -2147483648 (wrapped)\nlong ok = (long) big + 1;                 // 2147483648\nint safe = Math.addExact(big, 1);         // throws ArithmeticException"],
      ex2: ['java', 'boxed equality', "Integer a = 1000, b = 1000;\nSystem.out.println(a == b);       // false: two objects\nSystem.out.println(a.equals(b));  // true\nInteger missing = null;\nint n = missing;                  // NullPointerException on unboxing"],
      deepDive: {
        explain: "The Java Language Specification defines exact semantics for every operation, which is why the same code gives the same result on every JVM. Widening conversions (`int` to `long`) are implicit; narrowing (`long` to `int`) needs a cast and silently drops high bits. Mixed expressions promote to the widest type, but only after each sub-expression is evaluated: `int a, b; long x = a * b;` overflows before widening, so write `(long) a * b`. `char` is an unsigned 16-bit UTF-16 code unit, not a character (see the next lesson). Autoboxing in hot loops allocates objects and pressures the garbage collector; collections of primitives (`int[]`, or libraries with primitive collections) avoid it. For money, `BigDecimal` with explicit `RoundingMode` is the standard; `new BigDecimal(0.1)` captures the binary error, so construct from strings or use `BigDecimal.valueOf(double)`.",
        example: ['js', 'detecting 32-bit int overflow', "function overflows(a, b) {\n  const s = a + b;                                   // JS numbers hold this exactly\n  return s > 2147483647 || s < -2147483648;          // outside Java int range?\n}"],
        tradeoffs: [['Choice', 'Benefit', 'Cost'], ['int', 'Fast, compact', 'Overflows at about 2.1 billion'], ['long', 'Range for ids, timestamps, sizes', 'Twice the memory'], ['Integer / Long', 'Nullable, usable in collections', 'Allocation, == pitfalls, NPE on unboxing'], ['BigDecimal', 'Exact decimal arithmetic', 'Slower, verbose']],
        failures: [['Negative totals after a busy day', 'int counter overflowed', 'long or Math.addExact'], ['Equality check fails only for ids above 127', '== on Integer objects', 'Use equals or primitives'], ['NullPointerException on a numeric line', 'Unboxing a null wrapper', 'Null checks or primitives'], ['Invoice totals off by a cent', 'double for money', 'BigDecimal from strings with RoundingMode']],
      },
      warn: "Never compare Integer, Long, or other wrapper objects with ==. It works for small cached values and fails in production when ids grow past 127.",
      production: {
        numbers: "int overflows at 2,147,483,647: a millisecond counter in an int wraps after about 24.8 days, and an int byte counter after 2 GiB.",
        observe: "Static analysis (for example SpotBugs or Error Prone) flags boxed == comparisons and suspicious narrowing casts; add it to CI rather than relying on review.",
        security: "Integer overflow in size or length calculations can bypass bounds checks; use Math.*Exact or long arithmetic when computing sizes from untrusted input.",
        checklist: ['long for ids, timestamps, and sizes', 'Math.*Exact where overflow must fail', 'equals, not ==, for wrappers', 'Null-safety around unboxing', 'BigDecimal from strings for money', 'Casts before multiplication when widening', 'Static analysis in CI'],
        sources: ['Oracle, The Java Language Specification (Java SE 25), chapters 4 and 5', 'Java SE API: Math.addExact, Integer.valueOf (cache −128 to 127)', 'Bloch, "Effective Java" (3rd ed., 2018), items 60 and 61'],
      },
      tip: "When a bug only appears for large ids or late in the day, suspect an int overflow or a boxed == comparison first.",
      faq: [['What is Integer.MAX_VALUE + 1?', 'Integer.MIN_VALUE; int arithmetic wraps silently.'], ['Why does == on Integer sometimes work?', 'Integer.valueOf caches −128 to 127, so small values share objects.'], ['How do you make overflow throw?', 'Math.addExact, multiplyExact, and related methods.'], ['What type should hold money?', 'BigDecimal, constructed from strings, with explicit rounding.'], ['Why is long x = a * b risky for ints?', 'The multiplication overflows in int before widening.']],
      ex: { prompt: 'Write overflows(a, b) returning true if a + b does not fit in a 32-bit Java int (−2,147,483,648 to 2,147,483,647). In Java, add as long and compare with Integer.MIN_VALUE and MAX_VALUE.', fn: 'overflows', params: 'a, b', sig: '(int a, int b) -> bool', java: `class Solution {
    public boolean overflows(int a, int b) {
        long s = (long) a + b;
        return s > Integer.MAX_VALUE || s < Integer.MIN_VALUE;
    }
}
`, cases: [{ args: [2147483647, 1], expect: true }, { args: [-2147483648, -1], expect: true }, { args: [1000, 2000], expect: false }, { args: [2147483647, -1], expect: false }], solution: `function overflows(a,b){const s=a+b;return s>2147483647||s<-2147483648}`, hint: 'Compute the sum in a wider type, then check the range.' },
      quiz: [
        choice('jv-la-1-q1', 'jv-numeric-types', 'Integer a = 500, b = 500; a == b is...', ['false: different objects outside the cache', 'true', 'a compile error', 'a NullPointerException'], 0, 'Use equals.'),
        choice('jv-la-1-q2', 'jv-numeric-types', 'Best type for a database id that may exceed 3 billion?', ['long', 'int', 'short', 'float'], 0, 'Range.'),
        choice('jv-la-1-q3', 'jv-numeric-types', 'Which makes overflow throw an exception?', ['Math.addExact', 'a cast to int', 'Integer.valueOf', 'using double'], 0, 'Exact methods.'),
        fill('jv-la-1-q4', 'jv-numeric-types', 'For exact decimal money arithmetic use Big___', ['Decimal'], 'From strings.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'jv-la-2', title: 'Strings, immutability, and Unicode', concept: 'jv-strings',
      story: "Java chose 16-bit `char` in 1996, when Unicode fitted in 65,536 code points. Unicode 2.0 later grew beyond that, so Java 5 (2004) adopted **UTF-16** with surrogate pairs: characters such as emoji use two `char` values. Java 9 (2017) introduced **compact strings** (JEP 254), storing Latin-1 text in one byte per character internally, which cut heap usage for many applications without changing the API. Strings have always been **immutable**, a decision that makes them safe to share, cache, and use as map keys.",
      analogy: "A printed book: you can read it, quote it, and lend it out safely, but to change a sentence you must print a new edition.",
      timeline: [['1996', 'Immutable String', 'Strings cannot change after creation.'], ['2004', 'Java 5 code points', 'Supplementary characters via surrogate pairs; codePointCount added.'], ['2017', 'Java 9 compact strings', 'Latin-1 strings stored in one byte per char internally (JEP 254).'], ['2018–2020', 'New String methods', 'isBlank, strip, lines, repeat (Java 11); stripIndent and formatted (Java 15).']],
      explain: "**Immutability**: every \"modifying\" method (`replace`, `toUpperCase`, `substring`) returns a new string. Building strings in a loop with `+` creates many intermediate objects; use `StringBuilder` (single thread). The compiler already optimises single-expression concatenation. **Equality**: `==` compares references; use `equals` (or `equalsIgnoreCase`). String literals are interned, which is why `==` sometimes appears to work. **Unicode**: `length()` counts UTF-16 code units, not user-visible characters; \"a😀b\".length() is 4 because the emoji needs a surrogate pair. Use `codePointCount`, `codePoints()`, or `BreakIterator` for user-perceived characters. **Encoding**: always specify `StandardCharsets.UTF_8` when converting bytes and strings; before Java 18 (JEP 400) the default charset depended on the platform. **Modern helpers**: `isBlank`, `strip` (Unicode-aware trim), `lines`, `repeat`, `formatted`.",
      diagram: "\"héllo\".length()           = 5  (é is one UTF-16 unit)\n\"a😀b\".length()             = 4  (emoji = surrogate pair)\n\"a😀b\".codePointCount(0, 4) = 3\nloop: s = s + x  → new String each time · StringBuilder sb.append(x) → one buffer",
      ex1: ['java', 'building and comparing strings', "StringBuilder sb = new StringBuilder();\nfor (String part : parts) sb.append(part).append(',');\nString csv = sb.toString();\nif (\"admin\".equals(role)) { … }        // null-safe: literal first"],
      ex2: ['java', 'code points versus chars', "String s = \"a\\uD83D\\uDE00b\";          // a😀b\ns.length();                           // 4\ns.codePointCount(0, s.length());      // 3\nbyte[] utf8 = s.getBytes(StandardCharsets.UTF_8);   // explicit charset"],
      deepDive: {
        explain: "Immutability enables several JVM optimisations: strings can be shared freely between threads, the hash code is cached after the first call (useful for `HashMap` keys), and literal strings are interned in a pool. Compact strings store each string as a `byte[]` plus a coder flag (Latin-1 or UTF-16), so ASCII-heavy applications typically see noticeably smaller heaps. `substring` copies characters (since Java 7u6), so it no longer leaks the parent's array. Pitfalls: `toUpperCase()` without a locale behaves differently in Turkish (dotless i), so use `Locale.ROOT` for identifiers; `split` takes a regular expression, so `split(\".\")` splits on every character; and comparing user-visible text needs `Collator` or normalisation (`Normalizer`) because \"é\" can be one code point or two. Since Java 18, UTF-8 is the default charset, but explicit charsets remain clearer and safe on older runtimes.",
        example: ['js', 'counting code points like Java codePointCount', "function codePointLength(s) {\n  return [...s].length;   // string iterator walks code points, like codePointCount\n}"],
        tradeoffs: [['Tool', 'Use', 'Watch out'], ['+ concatenation', 'Simple expressions', 'Loops create garbage'], ['StringBuilder', 'Building in loops', 'Not thread-safe (fine locally)'], ['String.format / formatted', 'Readable templates', 'Slower in hot paths'], ['codePoints / BreakIterator', 'Correct Unicode handling', 'More code than length()']],
        failures: [['Emoji cut in half in a truncated title', 'Truncating by char index', 'Truncate by code points or grapheme clusters'], ['Login fails for Turkish users', 'toUpperCase without Locale.ROOT', 'Locale.ROOT for identifiers'], ['split(".") returns an empty array', 'Regex metacharacter', 'split("\\\\.") or Pattern.quote'], ['Mojibake after deployment', 'Platform default charset', 'Explicit UTF-8 everywhere']],
      },
      warn: "length() counts UTF-16 code units, not characters. Truncating or validating user text by length() can split emoji and other supplementary characters.",
      production: {
        numbers: "Compact strings store Latin-1 text in 1 byte per character instead of 2, often a large share of heap savings in services dominated by ASCII strings such as JSON keys and identifiers.",
        observe: "Heap dumps show String and byte[] as the largest object types in many services; duplicate-string analysis (and G1 string deduplication, -XX:+UseStringDeduplication) can reveal savings.",
        security: "Normalise Unicode before comparing security-sensitive identifiers (usernames, domains) to prevent look-alike or composed-character bypasses; validate with explicit charsets.",
        checklist: ['equals, never ==, for content', 'StringBuilder in loops', 'Explicit UTF-8 charsets', 'Locale.ROOT for case conversion of identifiers', 'Code points for user-visible length', 'Pattern.quote for literal splits', 'Normalisation for security-sensitive comparisons'],
        sources: ['OpenJDK JEP 254: Compact Strings (Java 9)', 'OpenJDK JEP 400: UTF-8 by Default (Java 18)', 'Java SE API: String.codePointCount, StringBuilder', 'Unicode Standard Annex #29: Unicode Text Segmentation'],
      },
      tip: "Test every text feature with \"a😀b\" and a Turkish locale. Those two inputs catch most string bugs before users do.",
      faq: [['Why are Java strings immutable?', 'Safe sharing, caching of hash codes, use as keys, and security.'], ['What does length() count?', 'UTF-16 code units.'], ['How do you count code points?', 'codePointCount or codePoints().count().'], ['What did compact strings change?', 'Latin-1 strings use one byte per character internally.'], ['When use StringBuilder?', 'When building strings in loops.']],
      ex: { prompt: 'Write codePointLength(s) returning the number of Unicode code points in s (not UTF-16 units). In Java use s.codePointCount(0, s.length()).', fn: 'codePointLength', params: 's', sig: '(string s) -> int', java: `class Solution {
    public int codePointLength(String s) {
        return s.codePointCount(0, s.length());
    }
}
`, cases: [{ args: ['hello'], expect: 5 }, { args: ['héllo'], expect: 5 }, { args: ['a\u{1F600}b'], expect: 3 }], solution: `function codePointLength(s){return [...s].length}`, hint: 'Iterate by code point, not by char.' },
      quiz: [
        choice('jv-la-2-q1', 'jv-strings', '"a😀b".length() in Java returns...', ['4', '3', '2', '6'], 0, 'Surrogate pair.'),
        choice('jv-la-2-q2', 'jv-strings', 'Building a 10,000-line report in a loop. Use...', ['StringBuilder', 'repeated +', 'String.concat in a loop', 'char arrays only'], 0, 'One buffer.'),
        choice('jv-la-2-q3', 'jv-strings', 'Null-safe comparison with a constant?', ['"admin".equals(role)', 'role == "admin"', 'role.equals("admin")', 'role.compareTo("admin")'], 0, 'Literal first.'),
        fill('jv-la-2-q4', 'jv-strings', 'Java 9 compact strings store Latin-1 text in one ___ per character', ['byte'], 'JEP 254.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'jv-la-3', title: 'Records', concept: 'jv-records',
      story: "For two decades a simple data carrier in Java meant a class with private final fields, a constructor, getters, `equals`, `hashCode`, and `toString`: fifty lines that IDEs generated and libraries like Lombok hid. **Records**, previewed in Java 14 and finalised in Java 16 (JEP 395), made the intent explicit: a record is a transparent, shallowly immutable carrier for a fixed set of values, and the compiler generates the rest.",
      analogy: "A sealed envelope with a printed list of its contents on the front: everyone can see exactly what is inside, and nobody can swap the contents after sealing.",
      timeline: [['2011–2019', 'Boilerplate era', 'IDE generation and Lombok @Value for data classes.'], ['March 2020', 'Java 14 preview', 'Records previewed (JEP 359).'], ['March 2021', 'Java 16 final', 'Records standard (JEP 395).'], ['September 2023', 'Java 21 record patterns', 'Records deconstructed in patterns (JEP 440).']],
      explain: "`record Point(int x, int y) {}` declares **components** `x` and `y`. The compiler generates private final fields, a **canonical constructor**, accessor methods named after the components (`x()`, not `getX()`), and `equals`, `hashCode`, and `toString` based on all components; `toString` looks like `Point[x=1, y=2]`. Records are implicitly `final`, cannot extend other classes (they extend `java.lang.Record`), and cannot declare instance fields beyond the components. They can implement interfaces, declare static members and methods, and use a **compact constructor** to validate or normalise: `record Range(int lo, int hi) { Range { if (lo > hi) throw new IllegalArgumentException(); } }`. Immutability is **shallow**: a record holding a `List` still exposes a mutable list unless you copy it with `List.copyOf` in the constructor.",
      diagram: "record Point(int x, int y) {}\n  → private final int x, y\n  → Point(int x, int y)            canonical constructor\n  → int x(), int y()               accessors\n  → equals / hashCode on (x, y)\n  → toString: Point[x=1, y=2]",
      ex1: ['java', 'a record with validation and a defensive copy', "public record Order(String id, List<String> skus, BigDecimal total) {\n    public Order {\n        Objects.requireNonNull(id);\n        if (total.signum() < 0) throw new IllegalArgumentException(\"negative total\");\n        skus = List.copyOf(skus);          // shallow immutability made deep for the list\n    }\n}"],
      ex2: ['java', 'records as DTOs and map keys (Java 16+)', "record CacheKey(String customerId, String sku) {}\nMap<CacheKey, Price> cache = new HashMap<>();\ncache.put(new CacheKey(\"c42\", \"A1\"), price);   // equals/hashCode generated correctly"],
      deepDive: {
        explain: "Records are ideal for DTOs, API responses, event payloads, composite map keys, and multiple return values. Serialisation frameworks support them: Jackson (2.12+) maps JSON to record components, and Spring Boot binds configuration properties to records. They are a poor fit for JPA entities, which need a no-argument constructor, mutable state, and proxies; use records for projections and DTOs instead. Because `equals` and `hashCode` use all components, putting a mutable component (an array or mutable list) in a record breaks map lookups if it changes; arrays also compare by reference, so prefer lists copied with `List.copyOf`. In Java 21, **record patterns** let you deconstruct: `if (obj instanceof Point(int x, int y)) { … }`, and nest them in switch patterns, which pairs naturally with sealed interfaces in the next lesson.",
        example: ['js', 'formatting like a record\'s generated toString', "function recordToString(name, fields, values) {\n  return name + '[' + fields.map((f, i) => f + '=' + values[i]).join(', ') + ']';\n}"],
        tradeoffs: [['Option', 'Strength', 'Weakness'], ['Record', 'Concise, correct equals/hashCode, immutable', 'No inheritance; shallow immutability'], ['Hand-written class', 'Full control, mutability', 'Boilerplate and bugs in equals/hashCode'], ['Lombok @Value', 'Works on older Java', 'Annotation processing; hidden code'], ['JPA entity class', 'Persistence lifecycle', 'Not a record; needs mutability']],
        failures: [['Map lookup fails after adding items to a key\'s list', 'Mutable component in a record key', 'List.copyOf in the compact constructor'], ['Two records with equal arrays are not equal', 'Arrays compare by reference', 'Use lists or override equals carefully'], ['Hibernate fails to instantiate an entity', 'Record used as a JPA entity', 'Records for DTOs and projections only'], ['Invalid data enters the system', 'No validation in the constructor', 'Compact constructor with checks']],
      },
      warn: "Records are only shallowly immutable. A List or array component can still be modified by callers unless you copy it defensively in the compact constructor.",
      production: {
        numbers: "A typical three-field value class needs roughly 40–60 lines with constructor, accessors, equals, hashCode, and toString; the equivalent record is one line.",
        observe: "Code review should flag records with mutable components, records used as JPA entities, and hand-written equals/hashCode in classes that could be records.",
        security: "Records' generated toString prints every component; avoid logging records that contain secrets or personal data, or override toString to redact them.",
        checklist: ['Records for DTOs, events, keys, results', 'Compact constructor validation', 'Defensive copies of collections', 'No arrays as components where equality matters', 'Not used as JPA entities', 'toString redacts sensitive fields', 'Record patterns used on Java 21+'],
        sources: ['OpenJDK JEP 395: Records (Java 16)', 'OpenJDK JEP 440: Record Patterns (Java 21)', 'Java SE API: java.lang.Record'],
      },
      tip: "If you are about to write equals and hashCode by hand for a class whose fields never change, make it a record instead.",
      faq: [['What does a record generate?', 'Private final fields, canonical constructor, accessors, equals, hashCode, toString.'], ['Accessor name for component x?', 'x(), not getX().'], ['Can a record extend a class?', 'No; it implicitly extends java.lang.Record and is final.'], ['How do you validate a record?', 'A compact constructor.'], ['Are records deeply immutable?', 'No; only shallowly.']],
      ex: { prompt: 'Write recordToString(name, fields, values) producing the format of a record\'s generated toString: name, "[", then field=value pairs joined by ", ", then "]".', fn: 'recordToString', params: 'name, fields, values', sig: '(string name, string[] fields, string[] values) -> string', java: `class Solution {
    public String recordToString(String name, String[] fields, String[] values) {
        StringBuilder sb = new StringBuilder(name).append('[');
        for (int i = 0; i < fields.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(fields[i]).append('=').append(values[i]);
        }
        return sb.append(']').toString();
    }
}
`, cases: [{ args: ['Point', ['x', 'y'], ['1', '2']], expect: 'Point[x=1, y=2]' }, { args: ['Empty', [], []], expect: 'Empty[]' }], solution: `function recordToString(name,fields,values){return name+'['+fields.map((f,i)=>f+'='+values[i]).join(', ')+']'}`, hint: 'Join pairs with a comma and a space.' },
      quiz: [
        choice('jv-la-3-q1', 'jv-records', 'Where do you validate that a record\'s total is not negative?', ['in a compact constructor', 'in the accessor', 'in toString', 'records cannot validate'], 0, 'Compact constructor.'),
        choice('jv-la-3-q2', 'jv-records', 'Best use of a record in a Spring application?', ['a request or response DTO', 'a JPA entity', 'a mutable service bean', 'a thread pool'], 0, 'DTOs.'),
        choice('jv-la-3-q3', 'jv-records', 'record Point(int x, int y): how do you read x?', ['p.x()', 'p.getX()', 'p.x', 'p.get("x")'], 0, 'Accessors.'),
        fill('jv-la-3-q4', 'jv-records', 'Records became a standard feature in Java ___', ['16'], 'JEP 395.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'jv-la-4', title: 'Sealed classes and interfaces', concept: 'jv-sealed',
      story: "Before Java 17, a class hierarchy was either open to anyone (any class could extend a non-final class) or closed completely (`final`). There was no way to say \"a Shape is exactly a Circle, a Square, or a Rectangle\". **Sealed classes**, previewed in Java 15 and finalised in Java 17 (JEP 409), added that: a sealed type lists its permitted subtypes, and the compiler can then check that a switch handles every case, the way functional languages check algebraic data types.",
      analogy: "A restaurant menu printed with a fixed list of dishes: the kitchen knows every order it can receive, so it can prepare for each one and nothing unexpected arrives.",
      timeline: [['1996–2020', 'Open or final', 'Hierarchies either open to all or closed entirely.'], ['September 2020', 'Java 15 preview', 'Sealed classes previewed (JEP 360).'], ['September 2021', 'Java 17 final', 'Sealed classes standard (JEP 409) in an LTS release.'], ['September 2023', 'Java 21 exhaustive switch', 'Pattern matching for switch checks sealed hierarchies (JEP 441).']],
      explain: "`sealed interface Shape permits Circle, Square, Rectangle {}` restricts which classes may implement `Shape`. Each permitted subclass must be declared `final`, `sealed` (with its own permits), or `non-sealed` (reopening that branch). Permitted subclasses must be in the same module, or the same package in the unnamed module. Combined with records, sealed interfaces model **sum types**: `Payment` is a `Card`, a `BankTransfer`, or a `Wallet`, each with its own data. The payoff comes with **exhaustive switch** (Java 21): a switch over a sealed type without a `default` must cover every permitted subtype, so adding a new subtype makes every incomplete switch a **compile error** instead of a runtime surprise.",
      diagram: "sealed interface Payment permits Card, BankTransfer, Wallet {}\nrecord Card(String last4) implements Payment {}\nrecord BankTransfer(String iban) implements Payment {}\nrecord Wallet(String provider) implements Payment {}\nswitch (payment) { case Card c -> …; case BankTransfer b -> …; }   ✗ missing Wallet → compile error",
      ex1: ['java', 'a sealed result type (Java 21)', "sealed interface Result<T> permits Ok, Err {}\nrecord Ok<T>(T value) implements Result<T> {}\nrecord Err<T>(String message) implements Result<T> {}\n\nString describe(Result<Integer> r) {\n    return switch (r) {\n        case Ok<Integer> ok -> \"value \" + ok.value();\n        case Err<Integer> err -> \"error \" + err.message();\n    };   // no default needed: exhaustive\n}"],
      ex2: ['text', 'subclass modifiers', "final       → no further subclasses\nsealed      → its own permits list\nnon-sealed  → open again below this point (use sparingly)"],
      deepDive: {
        explain: "Sealed hierarchies move some checks from tests to the compiler, but only if you avoid `default` branches in switches over them: a `default` silently swallows new subtypes. Use sealed types for closed domain concepts you control (payment methods, events in a workflow, AST nodes, API result types), not for extension points meant for other teams or plugins. Library authors must weigh compatibility: adding a permitted subtype is a source-incompatible change for clients that switch exhaustively. Serialisation of sealed hierarchies needs type information (for example Jackson's `@JsonTypeInfo` with `@JsonSubTypes`). On Java 8–16 the same intent is usually approximated with an abstract class with a private constructor and nested subclasses, plus a visitor pattern for exhaustive handling, which is more verbose but gives similar guarantees.",
        example: ['js', 'which permitted subtypes does a switch miss?', "function missingCases(permitted, handled) {\n  const h = new Set(handled);\n  return permitted.filter((p) => !h.has(p));    // non-empty → compile error in an exhaustive switch\n}"],
        tradeoffs: [['Approach', 'Strength', 'Weakness'], ['Sealed + exhaustive switch', 'Compiler finds missing cases', 'Closed to outside extension'], ['Open interface + default branch', 'Extensible', 'New cases fail silently at runtime'], ['Visitor pattern', 'Exhaustive on old Java', 'Verbose; double dispatch'], ['Enum', 'Simple fixed set without per-case data shapes', 'Cases cannot carry different fields']],
        failures: [['New payment type silently ignored', 'default branch in switch over a sealed type', 'Remove default; let the compiler check'], ['Plugin team cannot add an implementation', 'Sealed used for an extension point', 'Keep extension points open'], ['JSON deserialisation fails for subtypes', 'No type discriminator', '@JsonTypeInfo and @JsonSubTypes'], ['Client code breaks after library upgrade', 'New permitted subtype added', 'Treat permits changes as breaking changes']],
      },
      warn: "A default branch in a switch over a sealed type defeats the purpose: the compiler can no longer tell you when a new subtype is unhandled.",
      production: {
        numbers: "With an exhaustive switch, adding one permitted subtype turns every incomplete switch in the codebase into a compile error; with default branches, the same change compiles and fails at runtime.",
        observe: "Search for switch statements over sealed types that include default branches, and for instanceof chains that could become exhaustive switches.",
        security: "Exhaustive handling of authorisation decisions or event types prevents unhandled cases from falling through to permissive defaults.",
        checklist: ['Sealed types for closed domain concepts', 'Records as permitted subtypes', 'No default in switches over sealed types', 'non-sealed used rarely and deliberately', 'Type discriminators for JSON', 'Permits changes treated as breaking', 'Visitor pattern on pre-17 code'],
        sources: ['OpenJDK JEP 409: Sealed Classes (Java 17)', 'OpenJDK JEP 441: Pattern Matching for switch (Java 21)', 'Goetz, "Data Oriented Programming in Java" (InfoQ, 2022)'],
      },
      tip: "Model each API result or workflow event as a sealed interface of records. The compiler then reviews every consumer when the domain grows.",
      faq: [['What does sealed do?', 'Restricts which classes may extend or implement a type.'], ['What modifiers must permitted subclasses use?', 'final, sealed, or non-sealed.'], ['Why avoid default with sealed switches?', 'It hides new unhandled subtypes.'], ['Which release finalised sealed classes?', 'Java 17 (JEP 409).'], ['What pairs well with sealed interfaces?', 'Records and pattern matching for switch.']],
      ex: { prompt: 'Write missingCases(permitted, handled) returning the permitted subtypes not present in handled, in the order of permitted. A non-empty result means an exhaustive switch would fail to compile.', fn: 'missingCases', params: 'permitted, handled', sig: '(string[] permitted, string[] handled) -> string[]', java: `class Solution {
    public String[] missingCases(String[] permitted, String[] handled) {
        Set<String> h = new HashSet<>(Arrays.asList(handled));
        List<String> out = new ArrayList<>();
        for (String p : permitted) if (!h.contains(p)) out.add(p);
        return out.toArray(new String[0]);
    }
}
`, cases: [{ args: [['Circle', 'Square', 'Rectangle'], ['Circle', 'Square']], expect: ['Rectangle'] }, { args: [['A', 'B'], ['B', 'A']], expect: [] }], solution: `function missingCases(permitted,handled){const h=new Set(handled);return permitted.filter(p=>!h.has(p))}`, hint: 'A set of handled names, then filter.' },
      quiz: [
        choice('jv-la-4-q1', 'jv-sealed', 'You add Wallet to a sealed Payment. What should happen to switches without default?', ['they fail to compile until Wallet is handled', 'they ignore Wallet', 'they throw at startup', 'nothing'], 0, 'Exhaustiveness.'),
        choice('jv-la-4-q2', 'jv-sealed', 'A plugin API where other teams add implementations. Sealed?', ['no; keep it open', 'yes, always', 'yes, with default', 'only with records'], 0, 'Extension point.'),
        choice('jv-la-4-q3', 'jv-sealed', 'Which modifier reopens a branch of a sealed hierarchy?', ['non-sealed', 'final', 'abstract', 'static'], 0, 'Use sparingly.'),
        fill('jv-la-4-q4', 'jv-sealed', 'A sealed type lists allowed subtypes after the keyword ___', ['permits'], 'Closed set.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'jv-la-5', title: 'Switch expressions and pattern matching', concept: 'jv-switch-patterns',
      story: "Java's original `switch` came from C: statements, fall-through between cases, and only integers (strings arrived in Java 7, enums in Java 5). Over five years the language transformed it: **switch expressions** with arrow labels (Java 14, JEP 361), **pattern matching for instanceof** (Java 16, JEP 394), and finally **pattern matching for switch** with record patterns (Java 21, JEPs 441 and 440). Together they let Java express data-oriented code that previously needed visitor classes or long `if-else` chains with casts.",
      analogy: "A mail sorter that not only reads the postcode but also recognises the parcel's shape and opens it to read the label, in one motion.",
      timeline: [['2011', 'Java 7 strings in switch', 'switch on String values.'], ['March 2020', 'Java 14 switch expressions', 'Arrow labels, no fall-through, yield (JEP 361).'], ['March 2021', 'Java 16 instanceof patterns', 'if (o instanceof String s) binds s (JEP 394).'], ['September 2023', 'Java 21 switch patterns', 'Type patterns, guards with when, record patterns (JEPs 441, 440).']],
      explain: "**Switch expressions** return a value: `int days = switch (month) { case FEB -> 28; case APR, JUN, SEP, NOV -> 30; default -> 31; };` Arrow cases never fall through; a block uses `yield` to return. Switch expressions must be **exhaustive**. **Instanceof patterns** test and bind in one step: `if (obj instanceof String s && !s.isEmpty())`. **Switch patterns** (Java 21) match on types and deconstruct records: `case Circle c -> Math.PI * c.r() * c.r();` or `case Rectangle(double w, double h) -> w * h;`. **Guards** refine cases: `case Circle c when c.r() == 0 -> 0;`. Switches can now handle `case null` explicitly; without it, a null selector still throws `NullPointerException`. Dominance rules require more specific cases before general ones.",
      diagram: "double area(Shape s) {\n  return switch (s) {\n    case Circle c when c.r() == 0 -> 0;\n    case Circle c                 -> Math.PI * c.r() * c.r();\n    case Rectangle(double w, double h) -> w * h;\n    case Square sq                -> sq.side() * sq.side();\n  };   // exhaustive over sealed Shape\n}",
      ex1: ['java', 'old style versus switch expression', "// Java 8\nint days;\nswitch (month) { case 2: days = 28; break; case 4: case 6: case 9: case 11: days = 30; break; default: days = 31; }\n// Java 14+\nint days = switch (month) { case 2 -> 28; case 4, 6, 9, 11 -> 30; default -> 31; };"],
      ex2: ['java', 'nested record patterns (Java 21)', "record Point(int x, int y) {}\nrecord Line(Point from, Point to) {}\nif (shape instanceof Line(Point(var x1, var y1), Point(var x2, var y2))) {\n    double len = Math.hypot(x2 - x1, y2 - y1);\n}"],
      deepDive: {
        explain: "Pattern matching shifts Java towards **data-oriented programming**: model data with records and sealed types, then write behaviour as functions that switch over the shapes, rather than spreading behaviour across subclasses. Both styles have a place: polymorphic methods suit open hierarchies with behaviour that belongs to each type; pattern switches suit closed hierarchies where operations are added more often than types (parsers, interpreters, event handlers, API result handling). Watch **dominance** (a `case Shape s` before `case Circle c` is a compile error), keep guards simple, and remember that an exhaustive switch over a sealed type gives you compile-time checking only without `default`. Unnamed patterns `_` (Java 22, JEP 456) make ignored components explicit. On Java 8 the equivalent is a string or enum switch with `break`, or `instanceof` plus casts.",
        example: ['js', 'dispatching on kind like a pattern switch', "function shapeArea(kind, d) {\n  let a;\n  if (kind === 'circle') a = Math.PI * d[0] * d[0];\n  else if (kind === 'rectangle') a = d[0] * d[1];\n  else if (kind === 'square') a = d[0] * d[0];\n  else return -1;                                  // unknown kind\n  return Math.round(a * 100) / 100;\n}"],
        tradeoffs: [['Style', 'Best when', 'Cost'], ['Pattern switch over sealed types', 'Closed set of types, many operations', 'Behaviour separate from data'], ['Polymorphic methods', 'Open set of types, behaviour per type', 'Adding an operation touches every class'], ['Visitor pattern', 'Pre-21 code needing exhaustiveness', 'Verbose'], ['if-else with casts', 'Legacy code', 'Error-prone, no exhaustiveness']],
        failures: [['Fall-through bug in an old switch', 'Missing break', 'Arrow-style switch expressions'], ['NullPointerException in switch', 'null selector without case null', 'Handle null explicitly or before the switch'], ['Compile error: dominated case label', 'General case before specific', 'Order specific cases first'], ['New subtype silently unhandled', 'default branch over a sealed type', 'Rely on exhaustiveness']],
      },
      warn: "A switch on a null value throws NullPointerException unless it has an explicit case null. Check inputs from JSON or databases before switching.",
      production: {
        numbers: "Converting a 40-line visitor to a pattern switch typically shrinks it to under 10 lines while gaining compile-time exhaustiveness on Java 21+.",
        observe: "Code review for leftover fall-through switches, instanceof-and-cast chains, and default branches over sealed types during Java 21 migrations.",
        security: "Exhaustive switches over authorisation outcomes or message types prevent unhandled cases from defaulting to allow; prefer explicit cases for every security-relevant variant.",
        checklist: ['Arrow labels; no fall-through', 'Switch expressions where a value is produced', 'instanceof patterns instead of casts', 'Record patterns for deconstruction', 'Specific cases before general', 'Explicit null handling', 'No default over sealed types'],
        sources: ['OpenJDK JEP 361: Switch Expressions (Java 14)', 'OpenJDK JEP 394: Pattern Matching for instanceof (Java 16)', 'OpenJDK JEP 441: Pattern Matching for switch (Java 21)', 'OpenJDK JEP 440: Record Patterns (Java 21)'],
      },
      tip: "When migrating to Java 21, search for `instanceof` followed by a cast on the next line; each is a candidate for a pattern.",
      faq: [['Do arrow cases fall through?', 'No.'], ['How does a block in a switch expression return a value?', 'With yield.'], ['What is a guard?', 'A when clause that refines a case pattern.'], ['What happens on a null selector without case null?', 'NullPointerException.'], ['Which release finalised pattern matching for switch?', 'Java 21.']],
      ex: { prompt: 'Write shapeArea(kind, dims) returning the area rounded to 2 decimals: "circle" uses dims[0] as radius (π r²), "rectangle" dims[0] × dims[1], "square" dims[0]². Return -1 for any other kind. In Java 8, use a switch on the string.', fn: 'shapeArea', params: 'kind, dims', sig: '(string kind, double[] dims) -> double', java: `class Solution {
    public double shapeArea(String kind, double[] d) {
        double a;
        switch (kind) {
            case "circle": a = Math.PI * d[0] * d[0]; break;
            case "rectangle": a = d[0] * d[1]; break;
            case "square": a = d[0] * d[0]; break;
            default: return -1;
        }
        return Math.round(a * 100) / 100.0;
    }
}
`, cases: [{ args: ['circle', [2]], expect: 12.57 }, { args: ['rectangle', [3, 4.5]], expect: 13.5 }, { args: ['square', [1.5]], expect: 2.25 }, { args: ['hexagon', [1]], expect: -1 }], solution: `function shapeArea(kind,d){let a;if(kind==='circle')a=Math.PI*d[0]*d[0];else if(kind==='rectangle')a=d[0]*d[1];else if(kind==='square')a=d[0]*d[0];else return -1;return Math.round(a*100)/100}`, hint: 'One branch per kind; round at the end.' },
      quiz: [
        choice('jv-la-5-q1', 'jv-switch-patterns', 'case Shape s appears before case Circle c. Result?', ['compile error: dominated label', 'Circle never matches at runtime only', 'works fine', 'NullPointerException'], 0, 'Dominance.'),
        choice('jv-la-5-q2', 'jv-switch-patterns', 'Which binds a variable while testing type?', ['if (o instanceof String s)', 'if (o == String)', 'if (o.class == String)', 'cast first'], 0, 'Java 16.'),
        choice('jv-la-5-q3', 'jv-switch-patterns', 'Refining a case with a condition uses...', ['when', 'if', 'where', 'guard'], 0, 'Guards.'),
        fill('jv-la-5-q4', 'jv-switch-patterns', 'A block inside a switch expression returns its value with ___', ['yield'], 'Not return.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'jv-la-6', title: 'Text blocks, var, and the release train', concept: 'jv-modern-syntax',
      story: "Java 9 (September 2017) ended the era of multi-year releases: since then a new feature release ships every **six months**, in March and September, with a **long-term-support** release every two years (17 in 2021, 21 in 2023, 25 in 2025). Features arrive as previews first and become standard after feedback. The result is a steady flow of small conveniences, such as `var` (Java 10), text blocks (Java 15), and compact source files with instance `main` methods (Java 25), alongside big projects like virtual threads.",
      analogy: "A train timetable: the train leaves every six months whether or not your feature is on board, so features ship when ready instead of delaying everything.",
      timeline: [['September 2017', 'Java 9 cadence', 'Six-month release train begins; modules arrive.'], ['March 2018', 'Java 10 var', 'Local variable type inference (JEP 286).'], ['September 2020', 'Java 15 text blocks', 'Multi-line string literals (JEP 378).'], ['September 2025', 'Java 25 LTS', 'Compact source files and instance main methods (JEP 512), among others.']],
      explain: "**`var`** infers the type of local variables from the initialiser: `var orders = new ArrayList<Order>();`. It is still statically typed; use it when the type is obvious from the right-hand side, not when it hides important information. **Text blocks** are multi-line string literals delimited by `\"\"\"`. The compiler removes **incidental indentation** (the common leading whitespace of the content lines and the closing delimiter), strips trailing spaces, and normalises line endings, so embedded JSON, SQL, or HTML stays readable. **Other modern conveniences**: `List.of`/`Map.of` immutable factories (Java 9), helpful `NullPointerException` messages naming the null variable (Java 14, JEP 358), `Stream.toList()` (Java 16), sequenced collections with `getFirst`/`getLast`/`reversed` (Java 21), and unnamed variables `_` (Java 22). **Upgrade strategy**: production systems usually move between LTS releases (17 to 21 to 25), testing with the newer JDK in CI before switching.",
      diagram: "String json = \"\"\"\n        {\n          \"id\": 1\n        }\n        \"\"\";          ← closing delimiter position sets the indent removed\nresult: \"{\\n  \\\"id\\\": 1\\n}\\n\"\nLTS: 8 (2014) · 11 (2018) · 17 (2021) · 21 (2023) · 25 (2025)",
      ex1: ['java', 'var and text blocks (Java 15+)', "var query = \"\"\"\n    SELECT id, total\n    FROM orders\n    WHERE customer_id = ?\n    \"\"\";\nvar rows = jdbc.queryForList(query, customerId);   // type obvious from context"],
      ex2: ['java', 'a compact source file (Java 25)', "// Hello.java, run with: java Hello.java\nvoid main() {\n    IO.println(\"Hello from Java 25\");\n}"],
      deepDive: {
        explain: "The release model changed how teams upgrade. Feature releases receive Oracle updates only until the next release, while LTS releases get years of updates from Oracle and other vendors (Eclipse Temurin, Amazon Corretto, Azul, Microsoft, Red Hat). Libraries and frameworks set baselines: Spring Boot 3 requires Java 17, so many organisations moved from 8 or 11 straight to 17 or 21. Preview features need `--enable-preview` at compile and run time and can change between releases, so keep them out of production code. When upgrading, the usual blockers are removed APIs (for example parts of Java EE removed from the JDK in Java 11), strong encapsulation of JDK internals (Java 16–17) breaking libraries that used reflection, and build plugins pinned to old versions. Run the test suite on the new JDK in CI first, update dependencies, then switch the runtime, then adopt language features.",
        example: ['js', 'removing incidental indentation like a text block', "function stripIndent(lines) {\n  const indents = lines.filter((l) => l.trim() !== '').map((l) => l.length - l.replace(/^\\s+/, '').length);\n  const m = indents.length ? Math.min(...indents) : 0;\n  return lines.map((l) => (l.trim() === '' ? '' : l.slice(m).replace(/\\s+$/, '')));\n}"],
        tradeoffs: [['Feature', 'Benefit', 'Caution'], ['var', 'Less noise for obvious types', 'Hides types when initialiser is unclear'], ['Text blocks', 'Readable embedded SQL, JSON, HTML', 'Indentation rules surprise at first'], ['Feature releases', 'Newest features quickly', 'Short support windows'], ['LTS releases', 'Long support, stable baseline', 'Wait up to two years for features']],
        failures: [['Production JVM out of support', 'Stayed on a non-LTS feature release', 'Run LTS in production; plan upgrades'], ['Upgrade breaks on reflective access', 'Library relies on JDK internals', 'Update library; --add-opens only as a stopgap'], ['Unreadable var-heavy code', 'var with unclear initialisers', 'Use var only when the type is obvious'], ['Build fails on new JDK', 'Old compiler or plugin versions', 'Upgrade build plugins first']],
      },
      warn: "Preview features can change or be removed between releases. Do not ship production code that requires --enable-preview.",
      production: {
        numbers: "A new feature release every six months and an LTS every two years: Java 21 (September 2023) and Java 25 (September 2025) are the current LTS baselines; JDK 27 shipped in September 2026.",
        observe: "Track JDK versions across services, vendor support end dates, and dependency baselines (for example Spring Boot 3 needs Java 17+); CI jobs on the next LTS catch issues early.",
        security: "Apply quarterly JDK security updates (critical patch updates in January, April, July, October) and avoid unsupported JDK versions in production.",
        checklist: ['LTS JDK in production', 'Quarterly security updates applied', 'CI job on the next LTS', 'No preview features in production', 'var only with obvious types', 'Text blocks for embedded SQL and JSON', 'Upgrade order: tests, dependencies, runtime, language features'],
        sources: ['OpenJDK JEP 286: Local-Variable Type Inference (Java 10)', 'OpenJDK JEP 378: Text Blocks (Java 15)', 'OpenJDK JEP 512: Compact Source Files and Instance Main Methods (Java 25)', 'OpenJDK, JDK project release schedule (accessed October 2026)'],
      },
      tip: "Keep one CI pipeline running your tests on the next LTS JDK all the time. Upgrades become routine instead of a project.",
      faq: [['How often does Java release?', 'Every six months, in March and September.'], ['Which releases are LTS recently?', '17, 21, and 25.'], ['Is var dynamic typing?', 'No; types are inferred at compile time.'], ['What sets the indentation removed from a text block?', 'The least-indented content line or the closing delimiter.'], ['Should preview features run in production?', 'No.']],
      ex: { prompt: 'Write stripIndent(lines) mimicking text-block indentation stripping: find the minimum leading whitespace over non-blank lines, remove that many characters from each non-blank line, strip trailing whitespace, and turn blank lines into "".', fn: 'stripIndent', params: 'lines', sig: '(string[] lines) -> string[]', java: `class Solution {
    public String[] stripIndent(String[] lines) {
        int m = Integer.MAX_VALUE;
        for (String l : lines) {
            if (l.trim().isEmpty()) continue;
            int i = 0;
            while (i < l.length() && Character.isWhitespace(l.charAt(i))) i++;
            m = Math.min(m, i);
        }
        if (m == Integer.MAX_VALUE) m = 0;
        String[] out = new String[lines.length];
        for (int k = 0; k < lines.length; k++) {
            String l = lines[k];
            if (l.trim().isEmpty()) { out[k] = ""; continue; }
            String s = l.substring(m);
            int e = s.length();
            while (e > 0 && Character.isWhitespace(s.charAt(e - 1))) e--;
            out[k] = s.substring(0, e);
        }
        return out;
    }
}
`, cases: [{ args: [['    {', '      "id": 1  ', '', '    }']], expect: ['{', '  "id": 1', '', '}'] }, { args: [['a', '  b']], expect: ['a', '  b'] }], solution: `function stripIndent(lines){const ind=lines.filter(l=>l.trim()!=='').map(l=>l.length-l.replace(/^\\s+/,'').length);const m=ind.length?Math.min(...ind):0;return lines.map(l=>l.trim()===''?'':l.slice(m).replace(/\\s+$/,''))}`, hint: 'Measure the minimum indent first, then slice and trim the end.' },
      quiz: [
        choice('jv-la-6-q1', 'jv-modern-syntax', 'Which JDK should a new production service target in October 2026?', ['an LTS release such as 21 or 25', 'JDK 27 only because it is newest', 'Java 8', 'any preview build'], 0, 'LTS.'),
        choice('jv-la-6-q2', 'jv-modern-syntax', 'var x = getThing(); is a poor use of var because...', ['the type is not obvious from the initialiser', 'var is dynamic', 'var is slower', 'var cannot hold objects'], 0, 'Readability.'),
        choice('jv-la-6-q3', 'jv-modern-syntax', 'Upgrading 11 → 21 fails on reflective access to JDK internals. Best fix?', ['upgrade the library that relies on internals', 'disable the module system', 'stay on 11 forever', 'use preview features'], 0, 'Strong encapsulation.'),
        fill('jv-la-6-q4', 'jv-modern-syntax', 'Text blocks are delimited by three double ___', ['quotes'], 'Java 15.'),
      ],
    }),
  ],
  exam: [
    choice('jv-la-e1', 'jv-numeric-types', 'Integer x = 200, y = 200; x == y is...', ['false', 'true', 'a compile error', 'random'], 0, 'Cache −128..127.'),
    choice('jv-la-e2', 'jv-strings', 'Why can a truncated title show a broken emoji?', ['truncation by UTF-16 units split a surrogate pair', 'fonts', 'GC', 'immutability'], 0, 'Code points.'),
    choice('jv-la-e3', 'jv-records', 'A record with a List component must defensively...', ['copy the list in the compact constructor', 'override hashCode only', 'make the list static', 'nothing'], 0, 'Shallow immutability.'),
    choice('jv-la-e4', 'jv-sealed', 'Benefit of sealed interfaces with exhaustive switch?', ['missing cases become compile errors', 'faster runtime', 'smaller jars', 'no need for tests'], 0, 'Compiler checks.'),
    choice('jv-la-e5', 'jv-switch-patterns', 'Arrow-style case labels...', ['never fall through', 'always fall through', 'require break', 'require yield'], 0, 'No fall-through.'),
    choice('jv-la-e6', 'jv-modern-syntax', 'How often are LTS releases now?', ['every two years', 'every six months', 'every five years', 'never'], 0, '17, 21, 25.'),
    choice('jv-la-e7', 'jv-numeric-types', 'Safest type for currency amounts?', ['BigDecimal', 'double', 'float', 'int cents in all cases without thought'], 0, 'Exact decimals.'),
    choice('jv-la-e8', 'jv-records', 'Records are a poor fit for...', ['JPA entities', 'DTOs', 'map keys', 'event payloads'], 0, 'Mutable proxies.'),
    choice('jv-la-e9', 'jv-switch-patterns', 'Which Java release finalised record patterns?', ['21', '16', '11', '8'], 0, 'JEP 440.'),
    order('jv-la-e10', 'jv-modern-syntax', 'Order a safe JDK upgrade.', ['Run the test suite on the new JDK in CI', 'Upgrade dependencies and build plugins', 'Switch the production runtime', 'Adopt new language features'], 'Upgrade path.'),
    order('jv-la-e11', 'jv-switch-patterns', 'Order these switch features by release.', ['Strings in switch (Java 7)', 'Switch expressions (Java 14)', 'instanceof patterns (Java 16)', 'Pattern matching for switch (Java 21)'], 'History.'),
    fill('jv-la-e12', 'jv-sealed', 'Sealed classes became standard in Java ___', ['17'], 'JEP 409.'),
  ],
};
