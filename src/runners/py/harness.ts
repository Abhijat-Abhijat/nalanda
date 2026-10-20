export const PYODIDE_VERSION = '314.0.7';
export const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Python source shared by the browser worker and the Node test suite.
export const PY_HARNESS = String.raw`
import json, sys, traceback
sys.setrecursionlimit(3000)

def _norm(v):
    if v is None or isinstance(v, (bool, str)):
        return v
    if isinstance(v, float):
        return int(v) if v.is_integer() and abs(v) < 2**53 else v
    if isinstance(v, int):
        return v
    if isinstance(v, (list, tuple)):
        return [_norm(x) for x in v]
    if isinstance(v, (set, frozenset)):
        return sorted(_norm(x) for x in v)
    if isinstance(v, dict):
        return {str(k): _norm(x) for k, x in v.items()}
    return repr(v)

def _canon(v):
    return json.dumps(v, separators=(',', ':'), ensure_ascii=False, sort_keys=True)

def _describe(e, offset):
    line = None
    if isinstance(e, SyntaxError) and e.filename == '<learner>':
        line = e.lineno
    else:
        for fr in traceback.extract_tb(e.__traceback__):
            if fr.filename == '<learner>':
                line = fr.lineno
    msg = type(e).__name__ + ': ' + (e.msg if isinstance(e, SyntaxError) else str(e))
    if line is not None:
        msg += ' (line ' + str(max(1, line - offset)) + ')'
    return msg

def run_cases(code, fn_name, cases_json, offset):
    ns = {'__name__': '__learner__'}
    try:
        exec(compile(code, '<learner>', 'exec'), ns)
    except BaseException as e:
        return json.dumps({'passed': False, 'results': [], 'error': _describe(e, offset)})
    fn = ns.get(fn_name)
    if not callable(fn):
        return json.dumps({'passed': False, 'results': [], 'error': 'Define a function named ' + fn_name + '.'})
    results = []
    for c in json.loads(cases_json):
        try:
            got = _norm(fn(*c['args']))
            if _canon(got) == _canon(_norm(c['expect'])):
                results.append({'ok': True})
            else:
                results.append({'ok': False, 'got': got})
        except BaseException as e:
            results.append({'ok': False, 'error': _describe(e, offset)})
    return json.dumps({'passed': all(r['ok'] for r in results), 'results': results})

def run_program(code):
    try:
        exec(compile(code, '<learner>', 'exec'), {'__name__': '__main__'})
    except BaseException:
        etype, e, tb = sys.exc_info()
        frames = [f for f in traceback.extract_tb(tb) if f.filename == '<learner>']
        print('Traceback (most recent call last):', file=sys.stderr)
        print(''.join(traceback.format_list(frames)), end='', file=sys.stderr)
        print(''.join(traceback.format_exception_only(etype, e)), end='', file=sys.stderr)
`;
