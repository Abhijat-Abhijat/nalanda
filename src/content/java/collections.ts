import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const jvCollections: Chapter = {
  id: 'jv-collections',
  title: 'Collections internals',
  summary: 'How the core collections work inside and what that means for performance and correctness: HashMap hashing and bucket selection, resizing and treeification, ArrayList growth versus LinkedList, fail-fast iterators, LinkedHashMap and LRU caches, and ConcurrentHashMap. Implementation details follow OpenJDK sources (Java 8 through 25); checked as of October 2026.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'jv-co-1', title: 'HashMap: hashing and buckets', concept: 'jv-hashmap',
      story: "Joshua Bloch designed the Java Collections Framework for Java 1.2 (1998), replacing the synchronised `Hashtable` and `Vector` with unsynchronised, interface-based collections. `HashMap` became the most used data structure in Java code. Its core is simple: an array of **buckets**, a hash function that picks a bucket, and `equals` to find the key inside it. Small details, such as how the hash is spread and why the table size is a power of two, decide whether a map with a million entries answers in nanoseconds or crawls.",
      analogy: "A cloakroom with numbered hooks: the attendant computes the hook number from your ticket, and only if several coats share a hook do they look through them one by one.",
      timeline: [['1996', 'Hashtable', 'Synchronised hash table in Java 1.0.'], ['1998', 'Collections Framework', 'HashMap, interfaces, and algorithms (Java 1.2).'], ['2004', 'Generics', 'HashMap<K, V> (Java 5).'], ['2014', 'Java 8 rewrite', 'Simplified hash spreading and tree bins for collisions (JEP 180).']],
      explain: "`HashMap` keeps a table whose length `n` is always a **power of two** (default 16). To store a key it computes `key.hashCode()`, then **spreads** it: `h ^ (h >>> 16)`, mixing the high 16 bits into the low bits. The bucket index is `(n - 1) & spread`, a fast bit mask equivalent to modulo for powers of two. Without spreading, keys whose hash codes differ only in high bits (common for floats or sequential ids shifted left) would all land in the same bucket of a small table. Each bucket holds a linked list of nodes (or a tree, next lesson); lookup walks the bucket comparing cached hashes first and then `equals`. With a good `hashCode`, `get` and `put` are O(1) on average. `HashMap` allows one `null` key (stored in bucket 0) and `null` values, and it is **not thread-safe**.",
      diagram: "h = key.hashCode()                 \"hello\" → 99162322\nspread = h ^ (h >>> 16)            99162322 ^ 1513 → …\nindex = spread & (n − 1)           n = 16 → bucket 11\nbucket 11: [node(hash, key, value)] → compare hash, then equals",
      ex1: ['java', 'the Java 8+ spreading function', "static final int hash(Object key) {\n    int h;\n    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);\n}\n// index = (table.length - 1) & hash"],
      ex2: ['java', 'presizing to avoid resizes', "// expect 10,000 entries: capacity must exceed 10,000 / 0.75\nMap<String, Order> byId = new HashMap<>(14_000);\n// Java 19+: HashMap.newHashMap(10_000) computes this for you"],
      deepDive: {
        explain: "The power-of-two table makes indexing cheap but uses only the low bits of the hash, which is why spreading matters. Java 8 simplified spreading to one XOR-shift (earlier versions used several shifts) because tree bins now protect against pathological collisions. The node stores the spread hash, so comparisons check `hash ==` before calling the potentially expensive `equals`, and resizing never recomputes `hashCode`. Iteration order depends on bucket layout and is unspecified; it changes when the map resizes and between JDK versions, so never rely on it (use `LinkedHashMap` or `TreeMap`). `Hashtable` and `Collections.synchronizedMap` serialise every operation with one lock; for concurrent access use `ConcurrentHashMap`. Memory: each entry is a node object of roughly 32 bytes plus key and value objects, so maps of millions of boxed numbers are expensive; primitive-specialised maps (from libraries) can use a fraction of the memory.",
        example: ['js', 'bucket index as in Java 8+', "function bucketIndex(h, n) {           // h: int hashCode, n: power-of-two table size\n  return (h ^ (h >>> 16)) & (n - 1);\n}"],
        tradeoffs: [['Map', 'Strength', 'Weakness'], ['HashMap', 'O(1) average, fast', 'Unordered, not thread-safe'], ['LinkedHashMap', 'Predictable order, LRU support', 'Extra links per entry'], ['TreeMap', 'Sorted, range queries, O(log n)', 'Slower than hashing'], ['ConcurrentHashMap', 'Thread-safe, scalable', 'No null keys or values']],
        failures: [['Tests break after a JDK upgrade', 'Relying on HashMap iteration order', 'LinkedHashMap or sort explicitly'], ['Lookups slow down as the map grows', 'Poor hashCode clustering keys', 'Hash all significant fields'], ['Infinite loop or lost entries under load', 'Concurrent writes to HashMap', 'ConcurrentHashMap'], ['Large heap for numeric maps', 'Boxed keys and node overhead', 'Primitive maps or arrays']],
      },
      warn: "HashMap iteration order is unspecified and can change after a resize or JDK upgrade. Never let output, tests, or business logic depend on it.",
      production: {
        numbers: "Default capacity 16 and load factor 0.75: the first resize happens at the 13th entry. Each entry costs roughly 32 bytes for the node plus the key and value objects.",
        observe: "Heap dumps show HashMap$Node counts and table sizes; very long buckets or many TreeNode objects indicate poor hash codes or attacks.",
        security: "Untrusted keys can be crafted to collide; Java 8's tree bins cap the damage at O(log n), but limit request sizes and key counts as well.",
        checklist: ['Good hashCode on keys', 'Presize maps with known sizes', 'No reliance on iteration order', 'No concurrent writes to HashMap', 'Immutable keys', 'Primitive maps for huge numeric data', 'Limits on untrusted key counts'],
        sources: ['OpenJDK source: java.util.HashMap (JDK 21)', 'OpenJDK JEP 180: Handle Frequent HashMap Collisions with Balanced Trees (Java 8)', 'Java SE API: HashMap.newHashMap (Java 19)'],
      },
      tip: "When you know roughly how many entries a map will hold, presize it. It removes several resizes and rehashing passes in hot code paths.",
      faq: [['How does HashMap choose a bucket?', 'Spread hash (h ^ h>>>16) masked with table length − 1.'], ['Why power-of-two table sizes?', 'Index by bit mask instead of modulo.'], ['Why spread the hash?', 'To use high bits when the table is small.'], ['Average cost of get and put?', 'O(1) with a good hashCode.'], ['Is HashMap thread-safe?', 'No.']],
      ex: { prompt: 'Write bucketIndex(h, n) returning the bucket Java 8+ HashMap uses for hash code h in a table of size n (a power of two): (h ^ (h >>> 16)) & (n − 1).', fn: 'bucketIndex', params: 'h, n', sig: '(int h, int n) -> int', java: `class Solution {
    public int bucketIndex(int h, int n) {
        return (h ^ (h >>> 16)) & (n - 1);
    }
}
`, cases: [{ args: [99162322, 16], expect: 11 }, { args: [2112, 16], expect: 0 }, { args: [-2147483648, 64], expect: 0 }, { args: [65536, 16], expect: 1 }, { args: [1, 16], expect: 1 }], solution: `function bucketIndex(h,n){return (h^(h>>>16))&(n-1)}`, hint: 'Unsigned shift right by 16, XOR, then mask.' },
      quiz: [
        choice('jv-co-1-q1', 'jv-hashmap', 'Why does HashMap XOR the hash with h >>> 16?', ['so high bits affect small-table indexes', 'encryption', 'to make hashes positive', 'thread safety'], 0, 'Spreading.'),
        choice('jv-co-1-q2', 'jv-hashmap', 'A report prints map entries in a different order after a JDK upgrade. Fix?', ['use LinkedHashMap or sort explicitly', 'pin the JDK forever', 'use Hashtable', 'nothing'], 0, 'Unspecified order.'),
        choice('jv-co-1-q3', 'jv-hashmap', 'With default settings, when does the first resize happen?', ['when the 13th entry is added', 'at 16 entries', 'at 8 entries', 'never'], 0, '16 × 0.75.'),
        fill('jv-co-1-q4', 'jv-hashmap', 'HashMap tables are always a power of ___', ['two', '2'], 'Bit masks.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'jv-co-2', title: 'Resizing and treeification', concept: 'jv-treeify',
      story: "In December 2011, researchers Alexander Klink and Julian Wälde presented **hash-flooding** attacks at the Chaos Communication Congress: by sending web requests with thousands of form parameters whose names collide, an attacker could make a server's hash table degrade to a linked list and burn CPU for minutes per request. Java responded in Java 8 (2014) with JEP 180: when a single bucket grows long, HashMap converts it into a **red-black tree**, so the worst case becomes O(log n) instead of O(n).",
      analogy: "A cloakroom hook that gets overloaded: first the staff add more hooks and redistribute coats; if one hook still ends up crowded, they replace it with a sorted rack.",
      timeline: [['1998', 'Resizing by doubling', 'Load factor 0.75 and power-of-two tables.'], ['December 2011', 'Hash flooding', 'Klink and Wälde demonstrate collision denial-of-service attacks.'], ['2014', 'Tree bins', 'Long buckets become red-black trees (Java 8, JEP 180).'], ['2014', 'Split on resize', 'Resizing splits buckets into low and high halves without rehashing.']],
      explain: "**Resizing**: when the number of entries exceeds `capacity × loadFactor` (default 0.75), the table **doubles**. Because sizes are powers of two, each bucket splits cleanly: an entry stays at index `i` or moves to `i + oldCapacity` depending on one bit of its stored hash, so no `hashCode` calls are repeated. Resizing is O(n) for that insert, giving amortised O(1). **Treeification**: when a single bucket reaches **8** nodes (`TREEIFY_THRESHOLD`), HashMap checks the table size. If the table is smaller than **64** (`MIN_TREEIFY_CAPACITY`), it **resizes** instead, since collisions in a small table are usually just crowding. Otherwise it converts the bucket into a red-black tree of `TreeNode`s ordered by hash and, for `Comparable` keys, by `compareTo`. When a tree shrinks to **6** nodes (`UNTREEIFY_THRESHOLD`), it turns back into a list. Tree nodes are about twice the size of list nodes, so trees are a safety net, not the normal case.",
      diagram: "size > capacity × 0.75 → double table, split buckets (i or i + oldCap)\nbin length ≥ 8:\n   table < 64  → resize\n   table ≥ 64  → convert bin to red-black tree (O(log n) lookups)\ntree shrinks to ≤ 6 → back to linked list",
      ex1: ['java', 'tuning thresholds from OpenJDK source', "static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;   // 16\nstatic final float DEFAULT_LOAD_FACTOR = 0.75f;\nstatic final int TREEIFY_THRESHOLD = 8;\nstatic final int UNTREEIFY_THRESHOLD = 6;\nstatic final int MIN_TREEIFY_CAPACITY = 64;"],
      ex2: ['text', 'resizes while inserting 100 entries', "capacity 16 → 32 at entry 13\n32 → 64 at entry 25\n64 → 128 at entry 49\n128 → 256 at entry 97"],
      deepDive: {
        explain: "Why 8? Under random hash codes with load factor 0.75, bucket sizes follow a Poisson distribution with mean about 0.5, and the probability of a bucket reaching 8 is about 6 in 100 million, so tree bins appear only with bad hash codes or deliberate attacks. The gap between 8 and 6 provides **hysteresis**, preventing a bucket from flipping between list and tree on alternating inserts and removes. Tree ordering uses `compareTo` only when keys are `Comparable` and of the same class; otherwise it falls back to identity-based tie-breaking, so trees of non-comparable colliding keys still degrade more than a perfectly balanced comparison would. Presizing avoids repeated resizes for bulk loads. A lower load factor trades memory for fewer collisions, and a higher one the reverse; the default suits almost all workloads.",
        example: ['js', 'what happens when a bin grows', "function binAction(binSize, capacity) {\n  if (binSize < 8) return 'list';                  // TREEIFY_THRESHOLD\n  return capacity < 64 ? 'resize' : 'treeify';     // MIN_TREEIFY_CAPACITY\n}"],
        tradeoffs: [['Mechanism', 'Benefit', 'Cost'], ['Doubling resize', 'Amortised O(1) inserts', 'O(n) pause on the resizing insert'], ['Tree bins', 'O(log n) worst case per bucket', 'TreeNode about twice the size'], ['Lower load factor', 'Fewer collisions', 'More memory'], ['Presizing', 'No resize pauses', 'Must estimate size']],
        failures: [['Latency spikes when bulk loading', 'Repeated resizes', 'Presize for the expected count'], ['CPU saturated by crafted request parameters', 'Hash flooding', 'Tree bins plus limits on parameter counts'], ['Memory jumps for a map with bad keys', 'Many tree bins', 'Fix hashCode distribution'], ['Slow maps of non-comparable colliding keys', 'Trees cannot order keys', 'Better hashCode; Comparable keys']],
      },
      warn: "Tree bins limit the damage of bad or malicious hash codes, but they are a safety net. A map full of tree bins is a symptom: fix the hashCode or limit untrusted input.",
      production: {
        numbers: "With random hashes, the chance of a bucket reaching 8 entries is about 0.00000006; inserting 100 entries from default capacity triggers 4 resizes (to 32, 64, 128, 256).",
        observe: "Heap histograms with many HashMap$TreeNode instances signal colliding keys; allocation profiles during bulk loads reveal resize churn.",
        security: "Limit the number of request parameters, headers, and JSON object keys (servlet containers and JSON libraries have settings for this) to defend against hash flooding.",
        checklist: ['Presize maps for bulk loads', 'Default load factor unless measured otherwise', 'Comparable keys where collisions are possible', 'TreeNode counts monitored in heap dumps', 'Request parameter and key-count limits', 'Good hashCode distribution', 'No reliance on bucket layout'],
        sources: ['OpenJDK source: java.util.HashMap implementation notes (Poisson analysis)', 'OpenJDK JEP 180 (Java 8)', 'Klink and Wälde, "Efficient Denial of Service Attacks on Web Application Platforms" (28C3, December 2011)'],
      },
      tip: "If you load a known number of entries in a loop, `new HashMap<>(expected * 4 / 3 + 1)` (or `HashMap.newHashMap(expected)` on Java 19+) removes every resize.",
      faq: [['When does HashMap resize?', 'When size exceeds capacity × load factor.'], ['How much does it grow?', 'It doubles.'], ['When does a bucket become a tree?', 'At 8 nodes, if the table has at least 64 buckets.'], ['What happens if the table is smaller than 64?', 'It resizes instead.'], ['Why convert back at 6?', 'Hysteresis to avoid flip-flopping.']],
      ex: { prompt: 'Write binAction(binSize, capacity) returning what HashMap does when a bucket has binSize nodes: "list" if binSize < 8; otherwise "resize" if capacity < 64, else "treeify".', fn: 'binAction', params: 'binSize, capacity', sig: '(int binSize, int capacity) -> string', java: `class Solution {
    public String binAction(int binSize, int capacity) {
        if (binSize < 8) return "list";
        return capacity < 64 ? "resize" : "treeify";
    }
}
`, cases: [{ args: [3, 16], expect: 'list' }, { args: [8, 16], expect: 'resize' }, { args: [9, 64], expect: 'treeify' }, { args: [7, 1024], expect: 'list' }], solution: `function binAction(b,c){if(b<8)return'list';return c<64?'resize':'treeify'}`, hint: 'Two thresholds: 8 nodes and 64 buckets.' },
      quiz: [
        choice('jv-co-2-q1', 'jv-treeify', 'A bucket reaches 8 entries in a table of 32. HashMap will...', ['resize the table', 'treeify the bucket', 'throw', 'ignore it'], 0, 'MIN_TREEIFY_CAPACITY 64.'),
        choice('jv-co-2-q2', 'jv-treeify', 'What attack did tree bins mitigate?', ['hash flooding denial of service', 'SQL injection', 'XSS', 'timing attacks on passwords'], 0, '2011.'),
        choice('jv-co-2-q3', 'jv-treeify', 'During a resize, where can an entry from bucket i go?', ['i or i + oldCapacity', 'anywhere', 'always i', 'always 0'], 0, 'Split.'),
        fill('jv-co-2-q4', 'jv-treeify', 'The default HashMap load factor is 0.___', ['75'], 'Resize trigger.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'jv-co-3', title: 'ArrayList versus LinkedList', concept: 'jv-arraylist',
      story: "Textbooks teach that linked lists win at insertion and arrays win at random access. On modern hardware, the textbook is usually wrong for Java: `LinkedList` allocates a node object per element, scattered across the heap, so traversal misses the CPU cache constantly. Joshua Bloch, who wrote `LinkedList`, remarked publicly in 2015 that he had never used it himself. `ArrayList` and `ArrayDeque`, backed by contiguous arrays, are the right default for nearly every workload.",
      analogy: "Books on one shelf versus a scavenger hunt: on the shelf you scan spines in order quickly; in a scavenger hunt each clue sends you across the building to find the next one.",
      timeline: [['1998', 'ArrayList and LinkedList', 'Both introduced with the Collections Framework.'], ['2006', 'ArrayDeque', 'Array-backed deque, faster than LinkedList for queues (Java 6).'], ['2013', 'Lazy default capacity', 'ArrayList allocates its 10-slot array on first add (Java 7u40 and 8).'], ['2023', 'Sequenced collections', 'getFirst, getLast, reversed on List and Deque (Java 21).']],
      explain: "`ArrayList` stores elements in an `Object[]`. `get(i)` is O(1); appending is amortised O(1). When the array is full, it grows by **1.5×** (`newCapacity = old + (old >> 1)`), copying elements with `Arrays.copyOf`; the default first allocation is 10 slots, created lazily on the first add. Inserting or removing in the middle shifts elements with `System.arraycopy`, O(n) but very fast in practice because it is a contiguous memory move. `LinkedList` is a doubly linked list: O(1) insert or remove **only when you already hold the node** (through a `ListIterator`), O(n) to find a position, O(n) for `get(i)`, and about 24 bytes of node overhead per element plus poor cache locality. For queues and stacks use **`ArrayDeque`**. Use `LinkedList` essentially never in new code; even its theoretical advantages rarely survive measurement.",
      diagram: "ArrayList capacity as elements are added\n10 → 15 → 22 → 33 → 49 → 73 (each × 1.5)\nget(i):     ArrayList O(1)            LinkedList O(n)\nadd(end):   amortised O(1)            O(1) + node allocation\ninsert mid: O(n) arraycopy (fast)     O(n) to find + O(1) link\nmemory:     ~4–8 bytes per reference  + ~24 bytes node per element",
      ex1: ['java', 'presizing and trimming', "List<Order> orders = new ArrayList<>(expectedCount);   // no growth copies\n// after a one-off bulk build that will not grow again:\n((ArrayList<Order>) orders).trimToSize();"],
      ex2: ['java', 'queues without LinkedList', "Deque<Task> stack = new ArrayDeque<>();\nstack.push(t1); stack.pop();\nQueue<Task> queue = new ArrayDeque<>();\nqueue.offer(t1); queue.poll();"],
      deepDive: {
        explain: "Amortised analysis: with 1.5× growth, the total copying cost over n appends is bounded by a constant times n, so each append costs O(1) on average, though individual appends that trigger growth copy the whole array. Presizing removes those copies and the garbage they create. Removing many elements from the middle of an `ArrayList` in a loop is O(n²); use `removeIf` (which compacts in one pass) or build a new list. `ArrayList` never shrinks automatically, so a list that once held a million elements keeps the large array until `trimToSize` or replacement. `Arrays.asList` returns a fixed-size list backed by the array (no add or remove), and `List.of` returns an immutable list; both surprise people who expect an `ArrayList`. For primitives, `int[]` or primitive collections avoid boxing entirely.",
        example: ['js', 'ArrayList capacity growth sequence', "function arrayListGrowth(adds) {\n  const caps = []; let cap = 0;\n  for (let size = 1; size <= adds; size++) {\n    if (size > cap) { cap = cap === 0 ? 10 : cap + (cap >> 1); caps.push(cap); }   // lazy 10, then × 1.5\n  }\n  return caps;\n}"],
        tradeoffs: [['Structure', 'Best for', 'Avoid for'], ['ArrayList', 'Almost all lists', 'Frequent removal from the front'], ['ArrayDeque', 'Queues, stacks, sliding windows', 'Indexed access'], ['LinkedList', 'Rare iterator-based splicing', 'Indexed access, memory-sensitive code'], ['int[] / primitive lists', 'Large numeric data', 'Frequent resizing without helpers']],
        failures: [['O(n²) slowdown removing items in a loop', 'remove(i) repeatedly on ArrayList', 'removeIf or rebuild'], ['Slow loop over a LinkedList', 'get(i) in a for loop', 'Iterate, or use ArrayList'], ['UnsupportedOperationException on add', 'Arrays.asList or List.of result', 'new ArrayList<>(...) copy'], ['Memory not released after clearing a big list', 'Backing array never shrinks', 'trimToSize or a new list']],
      },
      warn: "Calling get(i) inside a loop over a LinkedList turns an O(n) loop into O(n²). Prefer ArrayList, or iterate with a for-each loop.",
      production: {
        numbers: "Adding 50 elements to a default ArrayList allocates arrays of 10, 15, 22, 33, 49, and 73 slots; presizing to 50 allocates once.",
        observe: "Allocation profiling (for example JFR) shows Arrays.copyOf from ArrayList.grow in hot paths; presize those lists.",
        security: "Unbounded lists built from untrusted input (for example JSON arrays) can exhaust memory; enforce size limits at parsing.",
        checklist: ['ArrayList by default', 'ArrayDeque for queues and stacks', 'Presize when the size is known', 'removeIf for bulk removal', 'No get(i) loops over LinkedList', 'Copies of Arrays.asList / List.of when mutation is needed', 'Size limits for untrusted input'],
        sources: ['OpenJDK source: java.util.ArrayList (grow, newCapacity)', 'Java SE API: ArrayDeque, List.removeIf', 'Bloch, comment on LinkedList usage (Twitter, 2015)'],
      },
      tip: "Default to ArrayList and ArrayDeque. Reach for anything else only when a benchmark on your data shows a measurable win.",
      faq: [['How does ArrayList grow?', 'By about 1.5× (old + old >> 1).'], ['Default first capacity?', '10, allocated on first add.'], ['When is LinkedList insertion O(1)?', 'Only when you already hold the position via an iterator.'], ['Best queue implementation?', 'ArrayDeque.'], ['Why is LinkedList slow in practice?', 'Node allocation and poor cache locality.']],
      ex: { prompt: 'Write arrayListGrowth(adds) returning the capacities an ArrayList allocates while adding adds elements one by one: the first add allocates 10; whenever size exceeds capacity, the new capacity is old + (old >> 1).', fn: 'arrayListGrowth', params: 'adds', sig: '(int adds) -> int[]', java: `class Solution {
    public int[] arrayListGrowth(int adds) {
        List<Integer> caps = new ArrayList<>();
        int cap = 0;
        for (int size = 1; size <= adds; size++) {
            if (size > cap) {
                cap = cap == 0 ? 10 : cap + (cap >> 1);
                caps.add(cap);
            }
        }
        int[] out = new int[caps.size()];
        for (int i = 0; i < out.length; i++) out[i] = caps.get(i);
        return out;
    }
}
`, cases: [{ args: [50], expect: [10, 15, 22, 33, 49, 73] }, { args: [0], expect: [] }, { args: [10], expect: [10] }, { args: [11], expect: [10, 15] }], solution: `function arrayListGrowth(adds){const caps=[];let cap=0;for(let size=1;size<=adds;size++){if(size>cap){cap=cap===0?10:cap+(cap>>1);caps.push(cap)}}return caps}`, hint: 'Grow only when size exceeds capacity.' },
      quiz: [
        choice('jv-co-3-q1', 'jv-arraylist', 'Best structure for a FIFO work queue in one thread?', ['ArrayDeque', 'LinkedList', 'ArrayList with remove(0)', 'TreeSet'], 0, 'Array-backed deque.'),
        choice('jv-co-3-q2', 'jv-arraylist', 'for (int i = 0; i < list.size(); i++) list.get(i) on a LinkedList of n items costs...', ['O(n²)', 'O(n)', 'O(1)', 'O(log n)'], 0, 'Traversal per get.'),
        choice('jv-co-3-q3', 'jv-arraylist', 'Arrays.asList(a, b).add(c) throws because...', ['the list is fixed-size, backed by an array', 'nulls', 'generics', 'thread safety'], 0, 'Fixed size.'),
        fill('jv-co-3-q4', 'jv-arraylist', 'ArrayList grows its capacity by a factor of about 1.___', ['5'], 'old + old>>1.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'jv-co-4', title: 'Iterators and fail-fast behaviour', concept: 'jv-fail-fast',
      story: "Few Java exceptions confuse newcomers like `ConcurrentModificationException` thrown in a single-threaded loop. Its name suggests threads, but the usual cause is simpler: code removed an element from a list while a for-each loop was iterating over it. The Collections Framework's iterators are deliberately **fail-fast**: they detect structural changes made outside the iterator and stop immediately rather than continue with undefined results.",
      analogy: "A tour guide counting the group at every stop: if the headcount changed without the guide being told, the tour stops until someone explains, rather than wandering on with the wrong group.",
      timeline: [['1998', 'Fail-fast iterators', 'modCount checks in Java 1.2 collections.'], ['2004', 'Concurrent collections', 'java.util.concurrent with weakly consistent iterators (Java 5).'], ['2014', 'removeIf and forEach', 'Bulk operations reduce manual iteration (Java 8).'], ['2023', 'Sequenced collections', 'Reverse iteration via reversed() (Java 21).']],
      explain: "Most collections keep a `modCount` that increments on **structural modifications** (adds and removes, not `set`). An iterator records `expectedModCount` when created. Each `next()` checks that the two match; if not, it throws `ConcurrentModificationException`. Removing through the iterator itself (`iterator.remove()`) updates both counters, so it is safe. The check is **best-effort**: it is not guaranteed under real concurrency and must not be used for correctness, only bug detection. Safe ways to remove while iterating: `Iterator.remove`, `Collection.removeIf(predicate)`, collecting to-be-removed items first, or streams that build a new collection. Concurrent collections (`ConcurrentHashMap`, `CopyOnWriteArrayList`) use **weakly consistent** iterators that never throw this exception and may or may not show concurrent updates.",
      diagram: "it = list.iterator()      modCount 0, expected 0\nit.next()                 0 == 0 ✓\nlist.remove(x)            modCount 1  (outside the iterator)\nit.next()                 1 != 0 → ConcurrentModificationException\n---\nit.remove()               modCount 1, expected 1 → safe",
      ex1: ['java', 'the bug and three fixes', "for (Order o : orders) if (o.isCancelled()) orders.remove(o);   // CME on next iteration\n\nIterator<Order> it = orders.iterator();\nwhile (it.hasNext()) if (it.next().isCancelled()) it.remove();  // fix 1\norders.removeIf(Order::isCancelled);                              // fix 2 (Java 8)\nList<Order> active = orders.stream().filter(o -> !o.isCancelled()).collect(Collectors.toList());  // fix 3"],
      ex2: ['java', 'weakly consistent iteration', "Map<String, Integer> m = new ConcurrentHashMap<>();\nfor (String k : m.keySet()) m.remove(k);   // no exception; iteration is weakly consistent"],
      deepDive: {
        explain: "A subtle case: removing the second-to-last element of a list in a for-each loop does not throw, because `hasNext()` returns false (the size shrank) before `next()` can check modCount, so the last element is silently skipped. This is why fail-fast detection is described as best-effort. Under real multithreading, `HashMap` and `ArrayList` can corrupt themselves (lost entries, broken internal state, historically even infinite loops during concurrent resizes in Java 7's `HashMap`) without any exception; use concurrent collections or external synchronisation. `Collections.synchronizedList` makes individual calls thread-safe, but iteration still needs a `synchronized (list)` block around the whole loop. `CopyOnWriteArrayList` copies the array on every write, so iteration sees a snapshot: ideal for rarely changing listener lists, terrible for frequently written data.",
        example: ['js', 'simulating modCount checks', "function failFast(ops) {                     // ops: 'next', 'add', 'remove', 'itRemove'\n  let mod = 0, expected = 0;\n  for (let i = 0; i < ops.length; i++) {\n    const o = ops[i];\n    if (o === 'add' || o === 'remove') mod++;            // outside the iterator\n    else if (o === 'itRemove') { mod++; expected++; }     // through the iterator\n    else if (o === 'next' && mod !== expected) return 'ConcurrentModificationException at ' + i;\n  }\n  return 'ok';\n}"],
        tradeoffs: [['Approach', 'Safe', 'Notes'], ['Iterator.remove', 'Yes', 'Explicit, single pass'], ['removeIf', 'Yes', 'Concise; ArrayList compacts in one pass'], ['New filtered collection', 'Yes', 'Allocates; clear intent'], ['Remove inside for-each', 'No', 'CME or skipped elements']],
        failures: [['ConcurrentModificationException in a single thread', 'Collection modified inside for-each', 'Iterator.remove or removeIf'], ['Last element silently skipped', 'Removal of the second-to-last element', 'Same fixes; do not rely on CME'], ['Corrupted HashMap under load', 'Concurrent writes without synchronisation', 'ConcurrentHashMap'], ['Slow writes to listener list', 'CopyOnWriteArrayList with frequent writes', 'Use only for read-mostly data']],
      },
      warn: "Fail-fast detection is best-effort. Its absence does not prove your code is correct; modifying a collection during iteration can silently skip elements.",
      production: {
        numbers: "CopyOnWriteArrayList copies the whole array on every add: with 10,000 elements, each write copies 10,000 references, fine for rare writes and costly for frequent ones.",
        observe: "Treat any ConcurrentModificationException in logs as a bug; in multithreaded code it often signals a shared non-thread-safe collection.",
        security: "Shared mutable collections accessed from request threads without synchronisation can leak data between requests or corrupt state; keep request data request-scoped.",
        checklist: ['No structural changes inside for-each', 'Iterator.remove or removeIf for filtering', 'Concurrent collections for shared state', 'synchronized blocks around iteration of synchronised wrappers', 'CopyOnWrite only for read-mostly data', 'CME treated as a bug', 'Streams to build filtered copies'],
        sources: ['Java SE API: ConcurrentModificationException, ArrayList (fail-fast iterators)', 'Java SE API: java.util.concurrent package summary (weakly consistent iterators)', 'Goetz et al., "Java Concurrency in Practice" (2006), chapter 5'],
      },
      tip: "Default to removeIf for filtering in place. It is shorter than an explicit iterator and cannot trigger ConcurrentModificationException.",
      faq: [['What increments modCount?', 'Structural changes such as add and remove.'], ['Why does Iterator.remove not throw?', 'It updates both modCount and expectedModCount.'], ['Is fail-fast guaranteed?', 'No; it is best-effort.'], ['Do concurrent collections throw CME?', 'No; their iterators are weakly consistent.'], ['Simplest safe in-place filter?', 'removeIf.']],
      ex: { prompt: 'Write failFast(ops) simulating a fail-fast iterator. Start with modCount = expected = 0. "add" and "remove" increment modCount; "itRemove" increments both; "next" fails if they differ. Return "ConcurrentModificationException at i" for the first failing next (i is its index), else "ok".', fn: 'failFast', params: 'ops', sig: '(string[] ops) -> string', java: `class Solution {
    public String failFast(String[] ops) {
        int mod = 0, expected = 0;
        for (int i = 0; i < ops.length; i++) {
            String o = ops[i];
            if (o.equals("add") || o.equals("remove")) mod++;
            else if (o.equals("itRemove")) { mod++; expected++; }
            else if (o.equals("next") && mod != expected) return "ConcurrentModificationException at " + i;
        }
        return "ok";
    }
}
`, cases: [{ args: [['next', 'itRemove', 'next']], expect: 'ok' }, { args: [['next', 'remove', 'next']], expect: 'ConcurrentModificationException at 2' }, { args: [['add']], expect: 'ok' }, { args: [[]], expect: 'ok' }], solution: `function failFast(ops){let mod=0,exp=0;for(let i=0;i<ops.length;i++){const o=ops[i];if(o==='add'||o==='remove')mod++;else if(o==='itRemove'){mod++;exp++}else if(o==='next'&&mod!==exp)return'ConcurrentModificationException at '+i}return'ok'}`, hint: 'Two counters; only next checks them.' },
      quiz: [
        choice('jv-co-4-q1', 'jv-fail-fast', 'Single-threaded code throws ConcurrentModificationException. Likely cause?', ['removing from a list inside a for-each loop', 'GC', 'a race with another thread only', 'a JIT bug'], 0, 'modCount.'),
        choice('jv-co-4-q2', 'jv-fail-fast', 'Safest concise way to remove cancelled orders in place?', ['orders.removeIf(Order::isCancelled)', 'remove inside for-each', 'remove by index in a forward loop', 'clear and hope'], 0, 'Bulk op.'),
        choice('jv-co-4-q3', 'jv-fail-fast', 'Iterating a ConcurrentHashMap while another thread writes...', ['never throws CME; weakly consistent', 'always throws CME', 'deadlocks', 'corrupts the map'], 0, 'Concurrent.'),
        fill('jv-co-4-q4', 'jv-fail-fast', 'Collections track structural changes in a field called ___', ['modCount'], 'Counter.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'jv-co-5', title: 'LinkedHashMap, TreeMap, and LRU caches', concept: 'jv-linkedhashmap',
      story: "Many services need a small in-memory cache that evicts the least recently used entry when full. The JDK has had the building block since Java 1.4 (2002): `LinkedHashMap` with **access order** and an overridable `removeEldestEntry` hook, which turns it into an LRU cache in about five lines. For production caching most teams now use Caffeine, created by Ben Manes as a successor to Guava's cache, whose W-TinyLFU policy achieves better hit rates than pure LRU, but understanding the LinkedHashMap version explains the core idea.",
      analogy: "A desk with limited space: every time you use a file you put it on top of the pile, and when the desk is full you remove the file at the bottom, the one you have not touched for longest.",
      timeline: [['1998', 'TreeMap', 'Red-black tree sorted map (Java 1.2).'], ['2002', 'LinkedHashMap', 'Insertion or access order and removeEldestEntry (Java 1.4).'], ['2006', 'NavigableMap', 'floorKey, ceilingKey, subMap and more (Java 6).'], ['2015', 'Caffeine', 'High-performance cache with W-TinyLFU eviction.']],
      explain: "`LinkedHashMap` is a `HashMap` whose entries are also linked in a doubly linked list, giving predictable iteration in **insertion order** (default) or **access order** (constructor flag `accessOrder = true`, where `get` and `put` move an entry to the end). Override `removeEldestEntry` to return `true` when `size() > capacity`, and the map evicts the head (least recently used) after each insert: an **LRU cache**. `TreeMap` is a red-black tree implementing `NavigableMap`: O(log n) operations, keys sorted by natural order or a comparator, and range queries such as `floorKey`, `ceilingEntry`, `headMap`, and `subMap`, useful for time-based lookups, price tiers, and interval problems. Neither is thread-safe; wrap or use concurrent alternatives (`ConcurrentSkipListMap` for sorted concurrent maps, Caffeine for caches).",
      diagram: "LRU (capacity 2): put a, put b → [a, b]\nget a → [b, a]        (access moves a to the end)\nput c → [b, a, c] → evict eldest b → [a, c]\nget b → null · get a → 1 · get c → 3\nTreeMap: floorKey(105) in {100, 200} → 100 (price tier lookup)",
      ex1: ['java', 'an LRU cache with LinkedHashMap', "class LruCache<K, V> extends LinkedHashMap<K, V> {\n    private final int capacity;\n    LruCache(int capacity) { super(16, 0.75f, true); this.capacity = capacity; }   // access order\n    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {\n        return size() > capacity;\n    }\n}"],
      ex2: ['java', 'range lookups with TreeMap', "TreeMap<Integer, String> tiers = new TreeMap<>();\ntiers.put(0, \"bronze\"); tiers.put(1000, \"silver\"); tiers.put(5000, \"gold\");\ntiers.floorEntry(2750).getValue();   // \"silver\""],
      deepDive: {
        explain: "A LinkedHashMap LRU cache is fine for single-threaded or externally synchronised use, but production caches need more: thread safety without a global lock, size bounds by weight, expiry after write or access, refresh, statistics, and better eviction. Pure LRU suffers from **scan pollution**: one pass over many cold keys evicts the hot working set. Caffeine's W-TinyLFU combines a small LRU window with a frequency sketch to admit only entries likely to be reused, giving hit rates close to optimal on many workloads. TreeMap's comparator defines key equality, so the comparator-consistent-with-equals rule from the comparators lesson applies here too. Memory: each LinkedHashMap entry adds two references to a HashMap node; each TreeMap entry is a separate node with left, right, and parent pointers and a colour flag.",
        example: ['js', 'an LRU cache simulation (Map keeps insertion order)', "function lruSimulate(capacity, ops) {         // ops: 'put:k:v' or 'get:k'\n  const m = new Map(), out = [];\n  for (const op of ops) {\n    const p = op.split(':');\n    if (p[0] === 'get') {\n      if (m.has(p[1])) { const v = m.get(p[1]); m.delete(p[1]); m.set(p[1], v); out.push(v); }   // move to end\n      else out.push('null');\n    } else {\n      if (m.has(p[1])) m.delete(p[1]);\n      m.set(p[1], p[2]);\n      if (m.size > capacity) m.delete(m.keys().next().value);   // evict eldest\n    }\n  }\n  return out;\n}"],
        tradeoffs: [['Structure', 'Strength', 'Weakness'], ['LinkedHashMap (access order)', 'Five-line LRU', 'Not thread-safe; pure LRU'], ['Caffeine', 'Concurrent, W-TinyLFU, expiry, stats', 'Dependency'], ['TreeMap', 'Sorted, range queries', 'O(log n), not thread-safe'], ['ConcurrentSkipListMap', 'Sorted and concurrent', 'Higher overhead']],
        failures: [['Cache hit rate collapses after a batch job', 'LRU scan pollution', 'Frequency-aware policy (Caffeine)'], ['Corrupted cache under load', 'LinkedHashMap shared between threads', 'Caffeine or synchronisation'], ['Out of memory from a cache', 'No size bound or expiry', 'Maximum size and expiry'], ['Wrong price tier', 'ceiling vs floor confusion', 'Test boundaries explicitly']],
      },
      warn: "A LinkedHashMap LRU cache is not thread-safe, and a get on an access-ordered map is a structural change. Shared caches in servers need a concurrent cache such as Caffeine.",
      production: {
        numbers: "An access-ordered LinkedHashMap adds two references per entry over HashMap; Caffeine's documentation reports hit rates near optimal on common traces while scaling across cores.",
        observe: "For any cache, track hit rate, eviction count, size, and load latency; a falling hit rate after deployments or batch jobs suggests scan pollution or undersizing.",
        security: "Caches keyed by user-controlled values need size bounds to prevent memory exhaustion, and must include tenant or user identity when values are user-specific.",
        checklist: ['LinkedHashMap LRU only for single-threaded use', 'Caffeine for shared caches', 'Size bounds and expiry on every cache', 'Hit rate and eviction metrics', 'TreeMap for range lookups', 'ConcurrentSkipListMap for sorted concurrent maps', 'Tenant-aware cache keys'],
        sources: ['Java SE API: LinkedHashMap.removeEldestEntry, TreeMap, NavigableMap', 'Einziger, Friedman, Manes, "TinyLFU: A Highly Efficient Cache Admission Policy" (ACM TOS, 2017)', 'Caffeine project documentation (accessed October 2026)'],
      },
      tip: "Use the LinkedHashMap LRU to understand eviction, then reach for Caffeine in services. It gives concurrency, expiry, and metrics in one builder call.",
      faq: [['How do you make LinkedHashMap an LRU cache?', 'accessOrder = true and override removeEldestEntry.'], ['What does access order do?', 'Moves accessed entries to the end.'], ['What does TreeMap.floorKey return?', 'The greatest key less than or equal to the argument.'], ['Weakness of pure LRU?', 'Scan pollution evicts hot entries.'], ['Production cache library?', 'Caffeine.']],
      ex: { prompt: 'Write lruSimulate(capacity, ops) for an LRU cache. ops are "put:k:v" or "get:k". A get returns the value (and marks the key most recently used) or "null" if absent; a put inserts or updates (most recently used) and evicts the least recently used entry if size exceeds capacity. Return the results of all gets in order.', fn: 'lruSimulate', params: 'capacity, ops', sig: '(int capacity, string[] ops) -> string[]', java: `class Solution {
    public String[] lruSimulate(final int capacity, String[] ops) {
        LinkedHashMap<String, String> m = new LinkedHashMap<String, String>(16, 0.75f, true) {
            protected boolean removeEldestEntry(Map.Entry<String, String> e) { return size() > capacity; }
        };
        List<String> out = new ArrayList<>();
        for (String op : ops) {
            String[] p = op.split(":");
            if (p[0].equals("get")) {
                String v = m.get(p[1]);
                out.add(v == null ? "null" : v);
            } else {
                m.put(p[1], p[2]);
            }
        }
        return out.toArray(new String[0]);
    }
}
`, cases: [{ args: [2, ['put:a:1', 'put:b:2', 'get:a', 'put:c:3', 'get:b', 'get:a', 'get:c']], expect: ['1', 'null', '1', '3'] }, { args: [1, ['get:x']], expect: ['null'] }], solution: `function lruSimulate(cap,ops){const m=new Map();const out=[];for(const op of ops){const p=op.split(':');if(p[0]==='get'){if(m.has(p[1])){const v=m.get(p[1]);m.delete(p[1]);m.set(p[1],v);out.push(v)}else out.push('null')}else{if(m.has(p[1]))m.delete(p[1]);m.set(p[1],p[2]);if(m.size>cap)m.delete(m.keys().next().value)}}return out}`, hint: 'Move accessed keys to the end; evict from the front.' },
      quiz: [
        choice('jv-co-5-q1', 'jv-linkedhashmap', 'Which constructor flag makes LinkedHashMap track recency?', ['accessOrder = true', 'fair = true', 'sorted = true', 'lru = true'], 0, 'Access order.'),
        choice('jv-co-5-q2', 'jv-linkedhashmap', 'Find the shipping band for a 2.75 kg parcel from band start weights. Use...', ['TreeMap.floorEntry', 'HashMap.get', 'ArrayList.indexOf', 'LinkedList'], 0, 'Range lookup.'),
        choice('jv-co-5-q3', 'jv-linkedhashmap', 'A nightly report scan evicts the hot entries of an LRU cache. Name?', ['scan pollution', 'hash flooding', 'false sharing', 'thrashing GC'], 0, 'W-TinyLFU helps.'),
        fill('jv-co-5-q4', 'jv-linkedhashmap', 'Override removeEldest___ to evict when full', ['Entry'], 'Hook.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'jv-co-6', title: 'ConcurrentHashMap', concept: 'jv-concurrenthashmap',
      story: "Doug Lea's `java.util.concurrent` package (JSR 166, Java 5, 2004) gave Java a hash map that many threads could use at once. The first `ConcurrentHashMap` split the table into 16 **segments**, each with its own lock. Java 8 rewrote it completely: no segments, lock-free reads, **CAS** to insert into empty buckets, a lock only on the first node of a bucket being modified, cooperative multi-threaded resizing, and atomic compound operations such as `compute` and `merge`. It remains one of the most carefully engineered classes in the JDK.",
      analogy: "A large bank where each teller window has its own queue: customers at different windows never wait for each other, and only two customers at the same window take turns.",
      timeline: [['2004', 'JSR 166', 'ConcurrentHashMap with lock striping by segment (Java 5).'], ['2014', 'Java 8 rewrite', 'CAS on empty bins, per-bin locks, tree bins, compute and merge.'], ['2014', 'Bulk operations', 'forEach, search, reduce with parallelism thresholds.'], ['2020s', 'Virtual-thread friendly', 'Short critical sections suit high-concurrency workloads.']],
      explain: "**Reads** (`get`) take no lock: fields are `volatile` and nodes are safely published. **Writes** to an empty bucket use a single compare-and-set; writes to a non-empty bucket lock only that bucket's first node with `synchronized`, so threads writing to different buckets do not block each other. **Atomic compound operations** solve the check-then-act race: `putIfAbsent`, `computeIfAbsent(key, k -> new Value())`, `compute`, and `merge(word, 1, Integer::sum)` run atomically per key. Writing `if (!map.containsKey(k)) map.put(k, v)` is **not** atomic, even on a concurrent map. Constraints: **no null keys or values** (null would be ambiguous with \"absent\" under concurrency); `size()` is an estimate under concurrent updates (use `mappingCount()` for large maps); iterators are weakly consistent. The mapping functions passed to `compute` methods run while the bucket is locked, so keep them short and never modify the same map inside them.",
      diagram: "get(k)                    no lock (volatile reads)\nput into empty bin        CAS\nput into busy bin         synchronized(first node of that bin only)\nmerge(w, 1, Integer::sum) atomic per key\ncontainsKey + put         NOT atomic → race",
      ex1: ['java', 'atomic counting', "ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();\nwords.parallelStream().forEach(w -> counts.merge(w, 1, Integer::sum));   // no lost updates\n\n// even better under heavy contention:\nConcurrentHashMap<String, LongAdder> hot = new ConcurrentHashMap<>();\nhot.computeIfAbsent(w, k -> new LongAdder()).increment();"],
      ex2: ['java', 'the check-then-act race', "if (!cache.containsKey(id)) {          // two threads both see 'absent'\n    cache.put(id, loadExpensive(id));  // both load; one result overwrites the other\n}\ncache.computeIfAbsent(id, this::loadExpensive);   // atomic: loads once per key"],
      deepDive: {
        explain: "Per-key atomicity is not multi-key atomicity: updating two related keys still needs higher-level coordination. `computeIfAbsent` holds the bucket lock while the mapping function runs, so a slow function (a database call) blocks other writers to that bucket, and recursively updating the same map inside it can throw `IllegalStateException` or deadlock; for expensive loads, a cache library with asynchronous loading is better. Under extreme contention on a single key, an `Integer` value updated with `merge` serialises on that bucket; `LongAdder` values spread increments across cells. Resizing is cooperative: threads that encounter a resize help transfer buckets, so no single thread pays for the whole rehash. `Collections.synchronizedMap` and `Hashtable` lock the entire map for every operation and should not be used for shared maps in new code.",
        example: ['js', 'counting with merge, reported as sorted word=count pairs', "function mergeCounts(words) {\n  const m = new Map();\n  for (const w of words) m.set(w, (m.get(w) || 0) + 1);       // like merge(w, 1, Integer::sum)\n  return [...m.keys()].sort().map((k) => k + '=' + m.get(k));\n}"],
        tradeoffs: [['Option', 'Concurrency', 'Notes'], ['ConcurrentHashMap', 'Lock-free reads, per-bin writes', 'No nulls; per-key atomic ops'], ['Collections.synchronizedMap', 'One global lock', 'Simple, poor scalability'], ['Hashtable', 'One global lock', 'Legacy'], ['Caffeine cache', 'Concurrent with eviction and loading', 'For caches specifically']],
        failures: [['Duplicate expensive loads under load', 'containsKey then put', 'computeIfAbsent'], ['Counts lower than expected', 'get then put increments', 'merge or LongAdder'], ['Threads stuck in computeIfAbsent', 'Slow or recursive mapping function', 'Keep functions short; async cache loading'], ['NullPointerException on put', 'Null key or value', 'Use Optional or a sentinel; validate']],
      },
      warn: "A concurrent map does not make sequences of calls atomic. containsKey followed by put, or get followed by put, still races; use computeIfAbsent, compute, or merge.",
      production: {
        numbers: "Reads take no lock and writes lock a single bucket, so with thousands of buckets many threads can update different keys in parallel; contention appears only on hot keys.",
        observe: "Thread dumps showing many threads blocked in ConcurrentHashMap.compute or computeIfAbsent indicate slow mapping functions or hot keys.",
        security: "Shared maps keyed by untrusted input need size bounds; an unbounded ConcurrentHashMap cache is a memory-exhaustion vector.",
        checklist: ['ConcurrentHashMap for shared maps', 'computeIfAbsent / merge instead of check-then-act', 'LongAdder for hot counters', 'Short, non-recursive mapping functions', 'No null keys or values', 'mappingCount for large sizes', 'Bounded size or a real cache library'],
        sources: ['Java SE API: ConcurrentHashMap (Java 8+ implementation notes)', 'Lea, JSR 166: Concurrency Utilities', 'Goetz et al., "Java Concurrency in Practice" (2006)'],
      },
      tip: "Search your codebase for containsKey followed by put on shared maps; each one is a race that computeIfAbsent removes in a single line.",
      faq: [['Does get lock in ConcurrentHashMap?', 'No.'], ['What does a write lock?', 'Only the first node of its bucket (CAS for empty buckets).'], ['Are null keys allowed?', 'No; neither keys nor values.'], ['How do you count words safely?', 'merge(word, 1, Integer::sum) or LongAdder values.'], ['Is containsKey then put atomic?', 'No.']],
      ex: { prompt: 'Write mergeCounts(words) counting occurrences as ConcurrentHashMap.merge(word, 1, Integer::sum) would, and return the entries as "word=count" strings sorted by word.', fn: 'mergeCounts', params: 'words', sig: '(string[] words) -> string[]', java: `class Solution {
    public String[] mergeCounts(String[] words) {
        java.util.concurrent.ConcurrentHashMap<String, Integer> counts = new java.util.concurrent.ConcurrentHashMap<>();
        for (String w : words) counts.merge(w, 1, Integer::sum);
        List<String> out = new ArrayList<>();
        for (Map.Entry<String, Integer> e : new TreeMap<>(counts).entrySet()) out.add(e.getKey() + "=" + e.getValue());
        return out.toArray(new String[0]);
    }
}
`, cases: [{ args: [['a', 'b', 'a', 'c', 'a']], expect: ['a=3', 'b=1', 'c=1'] }, { args: [[]], expect: [] }], solution: `function mergeCounts(words){const m=new Map();for(const w of words)m.set(w,(m.get(w)||0)+1);return [...m.keys()].sort().map(k=>k+'='+m.get(k))}`, hint: 'Count, then sort the keys.' },
      quiz: [
        choice('jv-co-6-q1', 'jv-concurrenthashmap', 'Two threads both load the same expensive value into a ConcurrentHashMap. Fix?', ['computeIfAbsent', 'containsKey then put', 'synchronizedMap', 'volatile'], 0, 'Atomic per key.'),
        choice('jv-co-6-q2', 'jv-concurrenthashmap', 'map.put(key, null) on a ConcurrentHashMap...', ['throws NullPointerException', 'stores null', 'removes the key', 'is ignored'], 0, 'No nulls.'),
        choice('jv-co-6-q3', 'jv-concurrenthashmap', 'Millions of increments on one hot key from many threads. Value type?', ['LongAdder', 'Integer with get/put', 'AtomicInteger with locks', 'String'], 0, 'Striped counter.'),
        fill('jv-co-6-q4', 'jv-concurrenthashmap', 'Inserting into an empty bucket uses compare-and-___', ['set', 'swap'], 'CAS.'),
      ],
    }),
  ],
  exam: [
    choice('jv-co-e1', 'jv-hashmap', 'HashMap bucket index for table size n is...', ['(h ^ (h >>> 16)) & (n − 1)', 'h % n always', 'h / n', 'random'], 0, 'Spread and mask.'),
    choice('jv-co-e2', 'jv-treeify', 'A bucket becomes a red-black tree when...', ['it has 8+ nodes and the table has 64+ buckets', 'any collision occurs', 'the map has 1,000 entries', 'keys are Strings'], 0, 'Thresholds.'),
    choice('jv-co-e3', 'jv-arraylist', 'Default choice for a list in Java?', ['ArrayList', 'LinkedList', 'Vector', 'Stack'], 0, 'Locality.'),
    choice('jv-co-e4', 'jv-fail-fast', 'Removing items while iterating safely:', ['Iterator.remove or removeIf', 'list.remove inside for-each', 'remove by index forward', 'clear()'], 0, 'modCount.'),
    choice('jv-co-e5', 'jv-linkedhashmap', 'Five-line LRU cache in the JDK:', ['LinkedHashMap with access order and removeEldestEntry', 'TreeMap', 'HashSet', 'ArrayDeque'], 0, 'Hook.'),
    choice('jv-co-e6', 'jv-concurrenthashmap', 'Which is atomic on a ConcurrentHashMap?', ['merge(k, 1, Integer::sum)', 'get then put', 'containsKey then put', 'size then put'], 0, 'Per key.'),
    choice('jv-co-e7', 'jv-hashmap', 'Should tests rely on HashMap iteration order?', ['no; it is unspecified', 'yes', 'only on Java 8', 'only for strings'], 0, 'Unspecified.'),
    choice('jv-co-e8', 'jv-treeify', 'Why did Java 8 add tree bins?', ['to bound worst-case lookups under collisions and hash flooding', 'to sort maps', 'to save memory', 'for thread safety'], 0, 'JEP 180.'),
    choice('jv-co-e9', 'jv-linkedhashmap', 'Shared cache in a multithreaded service:', ['Caffeine', 'LinkedHashMap LRU', 'HashMap', 'TreeMap'], 0, 'Concurrent cache.'),
    order('jv-co-e10', 'jv-hashmap', 'Order HashMap.put steps.', ['Call key.hashCode()', 'Spread the hash and compute the bucket index', 'Search the bucket by hash and equals', 'Insert or replace, then resize if over threshold'], 'Put.'),
    order('jv-co-e11', 'jv-arraylist', 'Order the first ArrayList capacities.', ['10', '15', '22', '33'], '× 1.5.'),
    fill('jv-co-e12', 'jv-concurrenthashmap', 'ConcurrentHashMap does not allow null keys or ___', ['values'], 'Ambiguity.'),
  ],
};
