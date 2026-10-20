const PY_LIST = `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def fromArray(a):
    head = None
    for v in reversed(a):
        head = ListNode(v, head)
    return head

def toArray(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out`;

const PY_TREE = `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def buildTree(a):
    if not a or a[0] is None:
        return None
    root = TreeNode(a[0])
    q = deque([root])
    i = 1
    while q and i < len(a):
        n = q.popleft()
        if i < len(a) and a[i] is not None:
            n.left = TreeNode(a[i])
            q.append(n.left)
        i += 1
        if i < len(a) and a[i] is not None:
            n.right = TreeNode(a[i])
            q.append(n.right)
        i += 1
    return root

def treeToArray(root):
    out, q = [], deque([root])
    while q:
        n = q.popleft()
        if n:
            out.append(n.val)
            q.append(n.left)
            q.append(n.right)
        else:
            out.append(None)
    while out and out[-1] is None:
        out.pop()
    return out`;

const PY_HEAP = `class Heap:
    """Binary heap; cmp(a, b) < 0 means a comes out first. Default: min-heap."""
    def __init__(self, cmp=lambda a, b: a - b):
        self.a = []
        self.cmp = cmp
    def size(self):
        return len(self.a)
    def peek(self):
        return self.a[0] if self.a else None
    def push(self, x):
        a = self.a
        a.append(x)
        i = len(a) - 1
        while i > 0:
            p = (i - 1) // 2
            if self.cmp(a[i], a[p]) >= 0:
                break
            a[i], a[p] = a[p], a[i]
            i = p
    def pop(self):
        a = self.a
        if not a:
            return None
        top = a[0]
        last = a.pop()
        if a:
            a[0] = last
            i = 0
            while True:
                l, r, m = 2 * i + 1, 2 * i + 2, i
                if l < len(a) and self.cmp(a[l], a[m]) < 0: m = l
                if r < len(a) and self.cmp(a[r], a[m]) < 0: m = r
                if m == i: break
                a[i], a[m] = a[m], a[i]
                i = m
        return top`;

const PY_RANDOM = `class RNode:
    def __init__(self, val):
        self.val = val
        self.next = None
        self.random = None

# pairs: [[val, randomIndex or None], ...] -> head of a list with random pointers
def buildRandom(pairs):
    ns = [RNode(v) for v, _ in pairs]
    for i, n in enumerate(ns):
        n.next = ns[i + 1] if i + 1 < len(ns) else None
        n.random = None if pairs[i][1] is None else ns[pairs[i][1]]
    return ns[0] if ns else None

def serializeRandom(head):
    ns = []
    while head:
        ns.append(head)
        head = head.next
    pos = {id(n): i for i, n in enumerate(ns)}
    return [[n.val, pos[id(n.random)] if n.random else None] for n in ns]`;

const PY_GRAPH = `from collections import deque

class GNode:
    def __init__(self, val):
        self.val = val
        self.neighbors = []

# adj[i] lists the neighbours of node i + 1 (1-indexed, undirected). Returns node 1 or None.
def buildGraph(adj):
    ns = [GNode(i + 1) for i in range(len(adj))]
    for i, nb in enumerate(adj):
        ns[i].neighbors = [ns[v - 1] for v in nb]
    return ns[0] if ns else None

def graphToAdj(node):
    if not node:
        return []
    seen, q = {node.val: node}, deque([node])
    while q:
        n = q.popleft()
        for m in n.neighbors:
            if m.val not in seen:
                seen[m.val] = m
                q.append(m)
    return [[m.val for m in seen[v].neighbors] for v in sorted(seen)]`;

export function preludeFor(jsStarter: string): string {
  const parts: string[] = [];
  if (jsStarter.includes('class ListNode')) parts.push(PY_LIST);
  if (jsStarter.includes('class TreeNode')) parts.push(PY_TREE);
  if (jsStarter.includes('class Heap')) parts.push(PY_HEAP);
  if (jsStarter.includes('class RNode')) parts.push(PY_RANDOM);
  if (jsStarter.includes('class GNode')) parts.push(PY_GRAPH);
  return parts.join('\n\n');
}

export const lineCount = (s: string) => (s ? s.split('\n').length : 0);

export function pyStarter(fnName: string, jsStarter: string): string {
  const m = new RegExp(`function\\s+${fnName}\\s*\\(([^)]*)\\)`).exec(jsStarter);
  const params = (m?.[1] ?? '').split(',').map((p) => p.trim().replace(/\s*=.*$/, '')).filter(Boolean).join(', ');
  return `def ${fnName}(${params}):\n    # your code\n    pass\n`;
}

// Learner code with the helper prelude in front, plus the prelude's line count so errors point at the learner's line.
export function withPrelude(code: string, jsStarter: string): { source: string; offset: number } {
  const pre = preludeFor(jsStarter);
  return pre ? { source: `${pre}\n\n${code}`, offset: lineCount(pre) + 1 } : { source: code, offset: 0 };
}
