// Prepended to every C++ program: standard headers, a small JSON value type, and JSON <-> C++ converters.
export const CPP_PRELUDE = String.raw`#include <algorithm>
#include <climits>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <deque>
#include <functional>
#include <iostream>
#include <list>
#include <map>
#include <numeric>
#include <optional>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;

struct Json {
  enum Kind { Null, Bool, Num, Str, Arr, Obj } kind = Null;
  bool b = false; double num = 0; string str; vector<Json> arr; vector<pair<string, Json>> obj;
  Json() {}
  Json(bool v) : kind(Bool), b(v) {}
  Json(int v) : kind(Num), num(v) {}
  Json(long long v) : kind(Num), num((double)v) {}
  Json(double v) : kind(Num), num(v) {}
  Json(const char* v) : kind(Str), str(v) {}
  Json(const string& v) : kind(Str), str(v) {}
  static Json array() { Json j; j.kind = Arr; return j; }
  static Json object() { Json j; j.kind = Obj; return j; }
  bool isNull() const { return kind == Null; }
  size_t size() const { return kind == Arr ? arr.size() : obj.size(); }
  const Json& operator[](size_t i) const { return arr[i]; }
  const Json& get(const string& k) const { static Json none; for (auto& p : obj) if (p.first == k) return p.second; return none; }
  void set(const string& k, Json v) { for (auto& p : obj) if (p.first == k) { p.second = v; return; } obj.emplace_back(k, v); }
  void push(Json v) { arr.push_back(v); }
  long long asInt() const { return (long long)num; }
  double asDouble() const { return num; }
  const string& asString() const { return str; }
  bool asBool() const { return b; }
};

static void appendUtf8(string& o, unsigned cp) {
  if (cp < 0x80) o += (char)cp;
  else if (cp < 0x800) { o += (char)(0xC0 | (cp >> 6)); o += (char)(0x80 | (cp & 0x3F)); }
  else if (cp < 0x10000) { o += (char)(0xE0 | (cp >> 12)); o += (char)(0x80 | ((cp >> 6) & 0x3F)); o += (char)(0x80 | (cp & 0x3F)); }
  else { o += (char)(0xF0 | (cp >> 18)); o += (char)(0x80 | ((cp >> 12) & 0x3F)); o += (char)(0x80 | ((cp >> 6) & 0x3F)); o += (char)(0x80 | (cp & 0x3F)); }
}

struct JsonParser {
  const string& s; size_t i = 0;
  explicit JsonParser(const string& src) : s(src) {}
  void ws() { while (i < s.size() && isspace((unsigned char)s[i])) i++; }
  string parseString() {
    string out; i++;
    while (s[i] != '"') {
      char c = s[i++];
      if (c != '\\') { out += c; continue; }
      char e = s[i++];
      if (e == 'n') out += '\n'; else if (e == 't') out += '\t'; else if (e == 'r') out += '\r';
      else if (e == 'b') out += '\b'; else if (e == 'f') out += '\f';
      else if (e == 'u') {
        unsigned cp = (unsigned)strtoul(s.substr(i, 4).c_str(), nullptr, 16); i += 4;
        if (cp >= 0xD800 && cp <= 0xDBFF && s[i] == '\\' && s[i + 1] == 'u') {
          unsigned lo = (unsigned)strtoul(s.substr(i + 2, 4).c_str(), nullptr, 16); i += 6;
          cp = 0x10000 + ((cp - 0xD800) << 10) + (lo - 0xDC00);
        }
        appendUtf8(out, cp);
      } else out += e;
    }
    i++;
    return out;
  }
  Json parse() {
    ws();
    char c = s[i];
    if (c == '{') {
      i++; Json o = Json::object(); ws();
      if (s[i] == '}') { i++; return o; }
      for (;;) { ws(); string k = parseString(); ws(); i++; Json v = parse(); o.obj.emplace_back(k, v); ws(); if (s[i++] == '}') return o; }
    }
    if (c == '[') {
      i++; Json a = Json::array(); ws();
      if (s[i] == ']') { i++; return a; }
      for (;;) { a.arr.push_back(parse()); ws(); if (s[i++] == ']') return a; }
    }
    if (c == '"') return Json(parseString());
    if (s.compare(i, 4, "true") == 0) { i += 4; return Json(true); }
    if (s.compare(i, 5, "false") == 0) { i += 5; return Json(false); }
    if (s.compare(i, 4, "null") == 0) { i += 4; return Json(); }
    size_t st = i;
    while (i < s.size() && (isdigit((unsigned char)s[i]) || strchr("+-.eE", s[i]))) i++;
    return Json(strtod(s.substr(st, i - st).c_str(), nullptr));
  }
};

static void dumpString(string& o, const string& s) {
  o += '"';
  for (unsigned char c : s) {
    if (c == '"') o += "\\\""; else if (c == '\\') o += "\\\\"; else if (c == '\n') o += "\\n";
    else if (c == '\r') o += "\\r"; else if (c == '\t') o += "\\t";
    else if (c < 0x20) { char b[8]; snprintf(b, sizeof b, "\\u%04x", c); o += b; }
    else o += (char)c;
  }
  o += '"';
}

static void dump(string& o, const Json& j) {
  switch (j.kind) {
    case Json::Null: o += "null"; break;
    case Json::Bool: o += j.b ? "true" : "false"; break;
    case Json::Num: {
      char b[40];
      if (!std::isfinite(j.num)) snprintf(b, sizeof b, "null");
      else if (j.num == std::floor(j.num) && std::fabs(j.num) < 9007199254740992.0) snprintf(b, sizeof b, "%lld", (long long)j.num);
      else snprintf(b, sizeof b, "%.17g", j.num);
      o += b; break;
    }
    case Json::Str: dumpString(o, j.str); break;
    case Json::Arr: o += '['; for (size_t k = 0; k < j.arr.size(); k++) { if (k) o += ','; dump(o, j.arr[k]); } o += ']'; break;
    case Json::Obj: o += '{'; for (size_t k = 0; k < j.obj.size(); k++) { if (k) o += ','; dumpString(o, j.obj[k].first); o += ':'; dump(o, j.obj[k].second); } o += '}'; break;
  }
}
static string toJsonText(const Json& j) { string o; dump(o, j); return o; }

template <class T> struct Conv;
template <> struct Conv<int> { static int from(const Json& j) { return (int)j.num; } static Json to(int v) { return Json(v); } };
template <> struct Conv<long long> { static long long from(const Json& j) { return (long long)j.num; } static Json to(long long v) { return Json(v); } };
template <> struct Conv<double> { static double from(const Json& j) { return j.num; } static Json to(double v) { return Json(v); } };
template <> struct Conv<bool> { static bool from(const Json& j) { return j.b; } static Json to(bool v) { return Json(v); } };
template <> struct Conv<string> { static string from(const Json& j) { return j.str; } static Json to(const string& v) { return Json(v); } };
template <> struct Conv<Json> { static Json from(const Json& j) { return j; } static Json to(const Json& v) { return v; } };
template <class T> struct Conv<vector<T>> {
  static vector<T> from(const Json& j) { vector<T> v; for (auto& e : j.arr) v.push_back(Conv<T>::from(e)); return v; }
  static Json to(const vector<T>& v) { Json a = Json::array(); for (const auto& e : v) a.push(Conv<T>::to(e)); return a; }
};
template <class T> struct Conv<optional<T>> {
  static optional<T> from(const Json& j) { if (j.isNull()) return nullopt; return Conv<T>::from(j); }
  static Json to(const optional<T>& v) { return v ? Conv<T>::to(*v) : Json(); }
};
template <class T> struct Conv<map<string, T>> {
  static map<string, T> from(const Json& j) { map<string, T> m; for (auto& p : j.obj) m[p.first] = Conv<T>::from(p.second); return m; }
  static Json to(const map<string, T>& m) { Json o = Json::object(); for (auto& p : m) o.set(p.first, Conv<T>::to(p.second)); return o; }
};
`;
