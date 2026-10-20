// Prepended to every Java program: imports, a small JSON reader/writer, and converters from parsed JSON.
export const JAVA_PRELUDE = String.raw`import java.util.*;
import java.util.function.*;

final class Json {
  private final String s; private int i;
  private Json(String s) { this.s = s; }
  static Object parse(String s) { return new Json(s).value(); }
  private void ws() { while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++; }
  private Object value() {
    ws(); char c = s.charAt(i);
    if (c == '{') { i++; Map<String, Object> m = new LinkedHashMap<>(); ws(); if (s.charAt(i) == '}') { i++; return m; }
      while (true) { ws(); String k = str(); ws(); i++; m.put(k, value()); ws(); if (s.charAt(i++) == '}') return m; } }
    if (c == '[') { i++; List<Object> a = new ArrayList<>(); ws(); if (s.charAt(i) == ']') { i++; return a; }
      while (true) { a.add(value()); ws(); if (s.charAt(i++) == ']') return a; } }
    if (c == '"') return str();
    if (s.startsWith("true", i)) { i += 4; return Boolean.TRUE; }
    if (s.startsWith("false", i)) { i += 5; return Boolean.FALSE; }
    if (s.startsWith("null", i)) { i += 4; return null; }
    int st = i; while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) i++;
    String n = s.substring(st, i);
    if (n.indexOf('.') >= 0 || n.indexOf('e') >= 0 || n.indexOf('E') >= 0) return Double.parseDouble(n);
    return Long.parseLong(n);
  }
  private String str() {
    StringBuilder b = new StringBuilder(); i++;
    while (true) {
      char c = s.charAt(i++);
      if (c == '"') return b.toString();
      if (c != '\\') { b.append(c); continue; }
      char e = s.charAt(i++);
      switch (e) {
        case 'n': b.append('\n'); break; case 't': b.append('\t'); break; case 'r': b.append('\r'); break;
        case 'b': b.append('\b'); break; case 'f': b.append('\f'); break;
        case 'u': b.append((char) Integer.parseInt(s.substring(i, i + 4), 16)); i += 4; break;
        default: b.append(e);
      }
    }
  }
  static String write(Object v) { StringBuilder b = new StringBuilder(); write(b, v); return b.toString(); }
  private static void write(StringBuilder b, Object v) {
    if (v == null) { b.append("null"); return; }
    if (v instanceof Boolean) { b.append(v.toString()); return; }
    if (v instanceof Double || v instanceof Float) {
      double d = ((Number) v).doubleValue();
      if (Double.isNaN(d) || Double.isInfinite(d)) b.append("null");
      else if (d == Math.rint(d) && Math.abs(d) < 9007199254740992.0) b.append((long) d);
      else b.append(Double.toString(d));
      return;
    }
    if (v instanceof Number) { b.append(((Number) v).longValue()); return; }
    if (v instanceof Character || v instanceof CharSequence) { writeStr(b, v.toString()); return; }
    if (v instanceof Map) { b.append('{'); boolean first = true; for (Map.Entry<?, ?> e : ((Map<?, ?>) v).entrySet()) { if (!first) b.append(','); first = false; writeStr(b, String.valueOf(e.getKey())); b.append(':'); write(b, e.getValue()); } b.append('}'); return; }
    if (v instanceof Iterable) { b.append('['); boolean first = true; for (Object e : (Iterable<?>) v) { if (!first) b.append(','); first = false; write(b, e); } b.append(']'); return; }
    if (v.getClass().isArray()) { b.append('['); int n = java.lang.reflect.Array.getLength(v); for (int k = 0; k < n; k++) { if (k > 0) b.append(','); write(b, java.lang.reflect.Array.get(v, k)); } b.append(']'); return; }
    writeStr(b, v.toString());
  }
  private static void writeStr(StringBuilder b, String s) {
    b.append('"');
    for (int k = 0; k < s.length(); k++) {
      char c = s.charAt(k);
      if (c == '"') b.append("\\\""); else if (c == '\\') b.append("\\\\"); else if (c == '\n') b.append("\\n");
      else if (c == '\r') b.append("\\r"); else if (c == '\t') b.append("\\t");
      else if (c < 0x20) b.append(String.format("\\u%04x", (int) c)); else b.append(c);
    }
    b.append('"');
  }
}

final class J {
  @SuppressWarnings("unchecked") static List<Object> list(Object o) { return (List<Object>) o; }
  static int i(Object o) { return ((Number) o).intValue(); }
  static long l(Object o) { return ((Number) o).longValue(); }
  static double d(Object o) { return ((Number) o).doubleValue(); }
  static boolean b(Object o) { return (Boolean) o; }
  static String s(Object o) { return (String) o; }
  static Integer oi(Object o) { return o == null ? null : ((Number) o).intValue(); }
  static Long ol(Object o) { return o == null ? null : ((Number) o).longValue(); }
  static Double od(Object o) { return o == null ? null : ((Number) o).doubleValue(); }
  static Boolean ob(Object o) { return (Boolean) o; }
  static String os(Object o) { return (String) o; }
  static int[] ia(Object o) { List<Object> x = list(o); int[] r = new int[x.size()]; for (int k = 0; k < r.length; k++) r[k] = i(x.get(k)); return r; }
  static long[] la(Object o) { List<Object> x = list(o); long[] r = new long[x.size()]; for (int k = 0; k < r.length; k++) r[k] = l(x.get(k)); return r; }
  static double[] da(Object o) { List<Object> x = list(o); double[] r = new double[x.size()]; for (int k = 0; k < r.length; k++) r[k] = d(x.get(k)); return r; }
  static boolean[] ba(Object o) { List<Object> x = list(o); boolean[] r = new boolean[x.size()]; for (int k = 0; k < r.length; k++) r[k] = b(x.get(k)); return r; }
  @SuppressWarnings("unchecked") static <T> Map<String, T> map(Object o, Function<Object, T> f) { Map<String, Object> m = (Map<String, Object>) o; Map<String, T> r = new LinkedHashMap<>(); for (Map.Entry<String, Object> e : m.entrySet()) r.put(e.getKey(), f.apply(e.getValue())); return r; }
}
`;
