// Java versions of the JS/Python helpers. Node classes are top-level; static helper methods live in Helpers,
// which the harness makes Solution extend so learners can call them unqualified.
const LIST_CLASS = 'class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; } }';
const LIST_METHODS = `  static ListNode fromArray(int[] a) { ListNode h = null; for (int i = a.length - 1; i >= 0; i--) h = new ListNode(a[i], h); return h; }
  static int[] toArray(ListNode h) { List<Integer> o = new ArrayList<>(); for (; h != null; h = h.next) o.add(h.val); int[] r = new int[o.size()]; for (int i = 0; i < r.length; i++) r[i] = o.get(i); return r; }`;
const TREE_CLASS = 'class TreeNode { int val; TreeNode left, right; TreeNode() {} TreeNode(int val) { this.val = val; } TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; } }';
const TREE_METHODS = `  static TreeNode buildTree(Integer[] a) {
    if (a.length == 0 || a[0] == null) return null;
    TreeNode root = new TreeNode(a[0]); Deque<TreeNode> q = new ArrayDeque<>(); q.add(root); int i = 1;
    while (!q.isEmpty() && i < a.length) {
      TreeNode n = q.poll();
      if (i < a.length && a[i] != null) { n.left = new TreeNode(a[i]); q.add(n.left); } i++;
      if (i < a.length && a[i] != null) { n.right = new TreeNode(a[i]); q.add(n.right); } i++;
    }
    return root;
  }
  static TreeNode buildTree(int[] a) { Integer[] b = new Integer[a.length]; for (int i = 0; i < a.length; i++) b[i] = a[i]; return buildTree(b); }
  static Integer[] treeToArray(TreeNode root) {
    List<Integer> o = new ArrayList<>(); LinkedList<TreeNode> q = new LinkedList<>(); q.add(root);
    while (!q.isEmpty()) { TreeNode n = q.poll(); if (n != null) { o.add(n.val); q.add(n.left); q.add(n.right); } else o.add(null); }
    while (!o.isEmpty() && o.get(o.size() - 1) == null) o.remove(o.size() - 1);
    return o.toArray(new Integer[0]);
  }`;
const HEAP_CLASS = `class Heap<T> {
  private final ArrayList<T> a = new ArrayList<>(); private final Comparator<T> cmp;
  @SuppressWarnings("unchecked") Heap() { this((x, y) -> ((Comparable<T>) x).compareTo(y)); }
  Heap(Comparator<T> cmp) { this.cmp = cmp; }
  int size() { return a.size(); }
  T peek() { return a.isEmpty() ? null : a.get(0); }
  void push(T x) { a.add(x); int i = a.size() - 1; while (i > 0) { int p = (i - 1) / 2; if (cmp.compare(a.get(i), a.get(p)) >= 0) break; Collections.swap(a, i, p); i = p; } }
  T pop() {
    if (a.isEmpty()) return null;
    T top = a.get(0); T last = a.remove(a.size() - 1);
    if (!a.isEmpty()) { a.set(0, last); int i = 0; while (true) { int l = 2 * i + 1, r = l + 1, m = i; if (l < a.size() && cmp.compare(a.get(l), a.get(m)) < 0) m = l; if (r < a.size() && cmp.compare(a.get(r), a.get(m)) < 0) m = r; if (m == i) break; Collections.swap(a, i, m); i = m; } }
    return top;
  }
}`;
const RANDOM_CLASS = 'class RNode { int val; RNode next, random; RNode(int val) { this.val = val; } }';
const RANDOM_METHODS = `  static RNode buildRandom(Integer[][] pairs) {
    RNode[] ns = new RNode[pairs.length]; for (int i = 0; i < ns.length; i++) ns[i] = new RNode(pairs[i][0]);
    for (int i = 0; i < ns.length; i++) { ns[i].next = i + 1 < ns.length ? ns[i + 1] : null; ns[i].random = pairs[i][1] == null ? null : ns[pairs[i][1]]; }
    return ns.length == 0 ? null : ns[0];
  }
  static Integer[][] serializeRandom(RNode h) {
    List<RNode> ns = new ArrayList<>(); for (; h != null; h = h.next) ns.add(h);
    Integer[][] o = new Integer[ns.size()][];
    for (int i = 0; i < o.length; i++) { RNode n = ns.get(i); o[i] = new Integer[] { n.val, n.random == null ? null : ns.indexOf(n.random) }; }
    return o;
  }`;
const GRAPH_CLASS = 'class GNode { int val; List<GNode> neighbors = new ArrayList<>(); GNode(int val) { this.val = val; } }';
const GRAPH_METHODS = `  static GNode buildGraph(int[][] adj) {
    GNode[] ns = new GNode[adj.length]; for (int i = 0; i < ns.length; i++) ns[i] = new GNode(i + 1);
    for (int i = 0; i < ns.length; i++) for (int v : adj[i]) ns[i].neighbors.add(ns[v - 1]);
    return ns.length == 0 ? null : ns[0];
  }
  static int[][] graphToAdj(GNode node) {
    if (node == null) return new int[0][];
    TreeMap<Integer, GNode> seen = new TreeMap<>(); seen.put(node.val, node); Deque<GNode> q = new ArrayDeque<>(); q.add(node);
    while (!q.isEmpty()) { GNode n = q.poll(); for (GNode m : n.neighbors) if (!seen.containsKey(m.val)) { seen.put(m.val, m); q.add(m); } }
    int[][] o = new int[seen.size()][]; int k = 0;
    for (GNode n : seen.values()) { int[] nb = new int[n.neighbors.size()]; for (int i = 0; i < nb.length; i++) nb[i] = n.neighbors.get(i).val; o[k++] = nb; }
    return o;
  }`;

export function javaHelpersFor(jsStarter: string): string {
  const has = (m: string) => jsStarter.includes(m);
  const classes: string[] = [];
  const methods: string[] = [];
  if (has('class ListNode')) { classes.push(LIST_CLASS); methods.push(LIST_METHODS); }
  if (has('class TreeNode')) { classes.push(TREE_CLASS); methods.push(TREE_METHODS); }
  if (has('class Heap')) classes.push(HEAP_CLASS);
  if (has('class RNode')) { classes.push(RANDOM_CLASS); methods.push(RANDOM_METHODS); }
  if (has('class GNode')) { classes.push(GRAPH_CLASS); methods.push(GRAPH_METHODS); }
  return [...classes, `class Helpers {\n${methods.join('\n')}\n}`].join('\n');
}
