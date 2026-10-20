import type { Boss } from '../../schema';

export const cxBoss: Boss = {
  id: 'cx-boss',
  title: 'The leaking image server',
  steps: [
    {
      kind: 'choice', id: 'cx-boss-1', conceptId: 'cpp-unique-ptr',
      prompt: 'An image-resizing server grows by 200 MB an hour. Code review finds `Image* img = new Image(...)` in a request handler, with `delete img` at the end of the happy path, and several early `return` statements for bad input in between. What is the root cause and the idiomatic fix?',
      options: ['Ownership lives in a raw pointer, so early returns skip delete; hold the image in a std::unique_ptr (or by value) so its destructor always runs', 'The allocator is fragmented; switch to a different malloc', 'The garbage collector is not running often enough', 'Add more delete calls before each return'],
      answer: 0,
      explain: 'Manual new/delete leaks on every path that forgets delete. RAII ties the release to scope exit: std::unique_ptr<Image> (std::make_unique) or a plain value frees the image on every return path.',
    },
    {
      kind: 'js-code', id: 'cx-boss-2', conceptId: 'cpp-raii', fnName: 'poolLog',
      langs: ['js', 'ts', 'cpp'], sig: '(string[] ops, int capacity) -> string[]',
      cpp: { solution: `class Solution {
public:
    vector<string> poolLog(vector<string>& ops, int capacity) {
        vector<string> slots(capacity);          // "" means free
        vector<string> out;
        for (const string& op : ops) {
            size_t colon = op.find(':');
            string kind = op.substr(0, colon), name = op.substr(colon + 1);
            if (kind == "acq") {
                auto it = find(slots.begin(), slots.end(), string());
                if (it == slots.end()) { out.push_back("x:" + name); continue; }
                *it = name;
                out.push_back("a:" + name + ":" + to_string(it - slots.begin()));
            } else {
                auto it = find(slots.begin(), slots.end(), name);
                if (it != slots.end()) it->clear();
            }
        }
        long leaked = count_if(slots.begin(), slots.end(), [](const string& s) { return !s.empty(); });
        out.push_back("leaked=" + to_string(leaked));
        return out;
    }
};
` },
      prompt: 'The fix introduces a fixed-size buffer pool whose handles release their slot when they go out of scope. To test the pool logic, write poolLog(ops, capacity). ops are "acq:<name>" (take the lowest-numbered free slot and log "a:<name>:<slot>", or log "x:<name>" if none is free) and "rel:<name>" (free that name\'s slot; no log). After all ops, append "leaked=<number of slots still held>".',
      starter: 'function poolLog(ops, capacity) {\n  // your code\n}',
      cases: [
        { args: [['acq:img1', 'acq:img2', 'rel:img1', 'acq:img3', 'acq:img4'], 2], expect: ['a:img1:0', 'a:img2:1', 'a:img3:0', 'x:img4', 'leaked=2'] },
        { args: [['acq:a', 'rel:a', 'acq:b', 'rel:b'], 1], expect: ['a:a:0', 'a:b:0', 'leaked=0'] },
        { args: [[], 3], expect: ['leaked=0'] },
        { args: [['acq:a', 'acq:b', 'acq:c', 'rel:b', 'acq:d'], 3], expect: ['a:a:0', 'a:b:1', 'a:c:2', 'a:d:1', 'leaked=3'] },
      ],
      solution: "function poolLog(ops,cap){const slots=new Array(cap).fill(null);const out=[];for(const op of ops){const[k,n]=op.split(':');if(k==='acq'){const i=slots.indexOf(null);if(i<0)out.push('x:'+n);else{slots[i]=n;out.push('a:'+n+':'+i)}}else{const i=slots.indexOf(n);if(i>=0)slots[i]=null}}out.push('leaked='+slots.filter(s=>s!==null).length);return out}",
      hint: 'Keep an array of slots; acquire scans for the first free one, release clears the matching one.',
    },
    {
      kind: 'order', id: 'cx-boss-3', conceptId: 'cpp-sanitizers-debugging',
      prompt: 'Memory is stable now, but a rare crash remains under load. Order a disciplined sanitizer-driven investigation.',
      items: ['Reproduce the crash with a load test and a fixed input set', 'Rebuild with -fsanitize=address,undefined and -g', 'Run the reproduction and read the first sanitizer report with its allocation and free stacks', 'Fix the root cause and add a regression test that runs under the sanitizers in CI'],
      explain: 'Reproduce first, build with sanitizers, fix the first reported error (later ones are often consequences), and keep the sanitizer build in CI.',
    },
  ],
};
