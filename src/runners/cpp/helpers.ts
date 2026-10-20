// C++ versions of the JS/Python helpers, attached when the JS starter declares the marker class.
const LIST = String.raw`struct ListNode { int val; ListNode* next; ListNode(int v = 0, ListNode* n = nullptr) : val(v), next(n) {} };
static ListNode* fromArray(const vector<int>& a) { ListNode* h = nullptr; for (int i = (int)a.size() - 1; i >= 0; i--) h = new ListNode(a[i], h); return h; }
static vector<int> toArray(ListNode* h) { vector<int> o; for (; h; h = h->next) o.push_back(h->val); return o; }`;

const TREE = String.raw`struct TreeNode { int val; TreeNode* left; TreeNode* right; TreeNode(int v = 0, TreeNode* l = nullptr, TreeNode* r = nullptr) : val(v), left(l), right(r) {} };
static TreeNode* buildTree(const vector<optional<int>>& a) {
  if (a.empty() || !a[0]) return nullptr;
  TreeNode* root = new TreeNode(*a[0]); deque<TreeNode*> q{root}; size_t i = 1;
  while (!q.empty() && i < a.size()) {
    TreeNode* n = q.front(); q.pop_front();
    if (i < a.size() && a[i]) { n->left = new TreeNode(*a[i]); q.push_back(n->left); } i++;
    if (i < a.size() && a[i]) { n->right = new TreeNode(*a[i]); q.push_back(n->right); } i++;
  }
  return root;
}
static TreeNode* buildTree(const vector<int>& a) { vector<optional<int>> o(a.begin(), a.end()); return buildTree(o); }
static vector<optional<int>> treeToArray(TreeNode* root) {
  vector<optional<int>> o; deque<TreeNode*> q{root};
  while (!q.empty()) { TreeNode* n = q.front(); q.pop_front(); if (n) { o.push_back(n->val); q.push_back(n->left); q.push_back(n->right); } else o.push_back(nullopt); }
  while (!o.empty() && !o.back()) o.pop_back();
  return o;
}`;

// cmp(a, b) < 0 means a comes out first; the default is a min-heap.
const HEAP = String.raw`template <class T> struct Heap {
  vector<T> a; function<int(const T&, const T&)> cmp;
  Heap() : cmp([](const T& x, const T& y) { return x < y ? -1 : (y < x ? 1 : 0); }) {}
  explicit Heap(function<int(const T&, const T&)> c) : cmp(c) {}
  int size() const { return (int)a.size(); }
  T peek() const { return a[0]; }
  void push(T x) { a.push_back(x); size_t i = a.size() - 1; while (i > 0) { size_t p = (i - 1) / 2; if (cmp(a[i], a[p]) >= 0) break; swap(a[i], a[p]); i = p; } }
  T pop() {
    T top = a[0]; T last = a.back(); a.pop_back();
    if (!a.empty()) { a[0] = last; size_t i = 0; for (;;) { size_t l = 2 * i + 1, r = l + 1, m = i; if (l < a.size() && cmp(a[l], a[m]) < 0) m = l; if (r < a.size() && cmp(a[r], a[m]) < 0) m = r; if (m == i) break; swap(a[i], a[m]); i = m; } }
    return top;
  }
};`;

const RANDOM = String.raw`struct RNode { int val; RNode* next = nullptr; RNode* random = nullptr; explicit RNode(int v) : val(v) {} };
static RNode* buildRandom(const vector<vector<optional<int>>>& pairs) {
  vector<RNode*> ns; for (auto& p : pairs) ns.push_back(new RNode(*p[0]));
  for (size_t i = 0; i < ns.size(); i++) { ns[i]->next = i + 1 < ns.size() ? ns[i + 1] : nullptr; ns[i]->random = pairs[i][1] ? ns[*pairs[i][1]] : nullptr; }
  return ns.empty() ? nullptr : ns[0];
}
static vector<vector<optional<int>>> serializeRandom(RNode* h) {
  vector<RNode*> ns; for (; h; h = h->next) ns.push_back(h);
  vector<vector<optional<int>>> o;
  for (auto* n : ns) { optional<int> r; for (size_t i = 0; i < ns.size(); i++) if (ns[i] == n->random) r = (int)i; o.push_back({ n->val, r }); }
  return o;
}`;

const GRAPH = String.raw`struct GNode { int val; vector<GNode*> neighbors; explicit GNode(int v) : val(v) {} };
static GNode* buildGraph(const vector<vector<int>>& adj) {
  vector<GNode*> ns; for (size_t i = 0; i < adj.size(); i++) ns.push_back(new GNode((int)i + 1));
  for (size_t i = 0; i < adj.size(); i++) for (int v : adj[i]) ns[i]->neighbors.push_back(ns[v - 1]);
  return ns.empty() ? nullptr : ns[0];
}
static vector<vector<int>> graphToAdj(GNode* node) {
  if (!node) return {};
  map<int, GNode*> seen{{node->val, node}}; deque<GNode*> q{node};
  while (!q.empty()) { GNode* n = q.front(); q.pop_front(); for (GNode* m : n->neighbors) if (!seen.count(m->val)) { seen[m->val] = m; q.push_back(m); } }
  vector<vector<int>> o; for (auto& kv : seen) { vector<int> nb; for (GNode* m : kv.second->neighbors) nb.push_back(m->val); o.push_back(nb); }
  return o;
}`;

const BLOCKS: [string, string][] = [['class ListNode', LIST], ['class TreeNode', TREE], ['class Heap', HEAP], ['class RNode', RANDOM], ['class GNode', GRAPH]];

export const cppHelpersFor = (jsStarter: string) => BLOCKS.filter(([m]) => jsStarter.includes(m)).map(([, b]) => b).join('\n');
