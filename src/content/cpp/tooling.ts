import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const cxTooling: Chapter = {
  id: 'cx-tooling',
  title: 'Build and tooling: CMake, compilers, sanitizers, profiling, testing, and static analysis',
  summary: 'The toolchain around C++ code: modern target-based CMake with usage requirements and package managers, compiler flags for warnings, optimisation, debug information, and hardening, sanitizers and debuggers for finding bugs, profilers for finding where time goes, testing with GoogleTest and fuzzing, and static analysis with clang-tidy and clang-format. Tool versions checked as of October 2026: CMake 4.x is current, GCC 16 (April 2026) and Clang 22 (February 2026) are the latest major compiler releases.',
  lessons: [
    deepTopic({
      id: 'l1', key: 'cx-tl-1', title: 'Modern CMake: targets and usage requirements', concept: 'cpp-cmake',
      story: "C++ has no standard build system or package manager, a gap that cost the industry decades of hand-written Makefiles and IDE project files. Kitware created CMake in 2000 for the Insight Toolkit, a medical imaging project that needed to build on many platforms. Early CMake scripts manipulated global variables (`include_directories`, `CMAKE_CXX_FLAGS`), which made large projects fragile. CMake 3.0 (2014) introduced \"modern CMake\": everything is a **target** with properties and **usage requirements** that propagate automatically to whatever links to it. CMake 4.0 (March 2025) dropped compatibility with versions older than 3.5.",
      analogy: "A target is a product with a label listing what anyone who uses it needs to know: which headers to include, which other parts to link. PUBLIC information is printed on the outside of the box; PRIVATE notes stay inside the factory.",
      timeline: [['2000', 'CMake', 'Kitware creates CMake for the Insight Toolkit.'], ['2014', 'CMake 3.0', 'Target-based usage requirements ("modern CMake").'], ['2016–2020', 'Package managers', 'Conan and vcpkg mature; FetchContent added in CMake 3.11.'], ['2025', 'CMake 4.0', 'Removes compatibility with CMake before 3.5; C++20 modules support matured in 3.28+.']],
      explain: "Declare targets with `add_executable(app main.cpp)` and `add_library(core core.cpp)`. Attach properties to targets, not globally: `target_include_directories`, `target_compile_definitions`, `target_compile_options`, `target_compile_features(core PUBLIC cxx_std_20)`, and `target_link_libraries(app PRIVATE core)`. The keyword decides **propagation**: **PRIVATE** applies only to the target itself (implementation details); **INTERFACE** applies only to consumers (header-only libraries); **PUBLIC** applies to both. So if `core` links `util` PUBLIC (because core's headers include util's headers) and `zlib` PRIVATE (used only in core's .cpp files), then `app`, linking `core`, sees core's and util's include paths but not zlib's. This keeps dependencies honest and builds fast. Configure out of source (`cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release`), build with `cmake --build build`, test with `ctest`. Get third-party code with **vcpkg** or **Conan** (both integrate through toolchain files) or `FetchContent`, and consume it with `find_package(fmt CONFIG REQUIRED)` and the imported target `fmt::fmt`. **CMakePresets.json** records configure and build settings so every developer and CI job uses the same flags.",
      diagram: "app ──PRIVATE──► core ──PUBLIC──► util\n                    └──PRIVATE──► zlib\ncompiling app sees:  app, core, util   (core's PUBLIC usage requirements)\ncompiling core sees: core, util, zlib\nINTERFACE: only consumers see it (header-only libraries)",
      ex1: ['cmake', 'a small modern CMake project', "cmake_minimum_required(VERSION 3.25)\nproject(imgserver LANGUAGES CXX)\n\nadd_library(core src/core.cpp)\ntarget_include_directories(core PUBLIC include)\ntarget_compile_features(core PUBLIC cxx_std_20)\nfind_package(fmt CONFIG REQUIRED)\nfind_package(ZLIB REQUIRED)\ntarget_link_libraries(core PUBLIC fmt::fmt PRIVATE ZLIB::ZLIB)\n\nadd_executable(server src/main.cpp)\ntarget_link_libraries(server PRIVATE core)"],
      ex2: ['text', 'configure, build, and test', "cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=RelWithDebInfo \\\n      -DCMAKE_TOOLCHAIN_FILE=$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake\ncmake --build build -j\nctest --test-dir build --output-on-failure\n# or with presets: cmake --preset release && cmake --build --preset release"],
      deepDive: {
        explain: "Usage requirements form a graph that CMake walks transitively: a PUBLIC dependency of a PUBLIC dependency propagates all the way up, while a PRIVATE edge stops propagation for compile settings (link-time dependencies of static libraries still propagate so the final link succeeds). **Generator expressions** (`$<CONFIG:Debug>`, `$<BUILD_INTERFACE:...>`, `$<INSTALL_INTERFACE:...>`) choose values at build time per configuration and distinguish in-tree builds from installed packages. Export and install targets with `install(TARGETS ... EXPORT)` and generate a `Config.cmake` so others can `find_package` your library. Build speed: Ninja is faster than Make for incremental builds; **ccache** or **sccache** cache compiled objects across builds and CI runs; **precompiled headers** (`target_precompile_headers`) and **unity builds** (`CMAKE_UNITY_BUILD`) cut header parsing; C++20 **modules** need CMake 3.28+ with Ninja and a supporting compiler. `compile_commands.json` (`CMAKE_EXPORT_COMPILE_COMMANDS=ON`) powers clangd, clang-tidy, and IDEs. Anti-patterns: global `include_directories`, `file(GLOB)` for sources (new files are not noticed reliably), and editing `CMAKE_CXX_FLAGS` instead of target options.",
        example: ['cmake', 'per-configuration options with generator expressions', "target_compile_options(core PRIVATE\n  $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall -Wextra -Wpedantic>\n  $<$<CXX_COMPILER_ID:MSVC>:/W4>\n  $<$<CONFIG:Debug>:-fsanitize=address>)\ntarget_link_options(core PRIVATE $<$<CONFIG:Debug>:-fsanitize=address>)"],
        tradeoffs: [['Keyword', 'Target itself', 'Consumers'], ['PRIVATE', 'Yes', 'No'], ['PUBLIC', 'Yes', 'Yes'], ['INTERFACE', 'No', 'Yes'], ['Global commands (include_directories)', 'Everything in the directory', 'Everything: hidden coupling']],
        failures: [['Consumers fail with missing headers', 'Dependency linked PRIVATE but used in public headers', 'Make it PUBLIC'], ['Every target recompiles after one change', 'Global flags or over-broad PUBLIC dependencies', 'PRIVATE where possible'], ['New source file not built', 'file(GLOB) without re-running CMake', 'List sources explicitly'], ['Works on one machine only', 'Dependencies found from system paths ad hoc', 'vcpkg/Conan with lock files and presets']],
      },
      warn: "Do not set include paths, definitions, or flags globally. Attach them to targets with the correct PRIVATE, PUBLIC, or INTERFACE keyword, or dependencies leak and builds become fragile.",
      production: {
        numbers: "ccache or sccache typically turns a warm rebuild of unchanged objects into cache hits in milliseconds per file; CI builds of large C++ projects commonly drop from tens of minutes to a few minutes with a shared cache.",
        observe: "Track build time per target (ninja -d stats, Clang -ftime-trace with ClangBuildAnalyzer), cache hit rates, and the include graph; fail CI on new warnings.",
        security: "Pin third-party dependency versions (vcpkg baselines, Conan lock files), verify hashes, and build from trusted registries; dependency confusion and tampered archives are real supply-chain risks.",
        checklist: ['Targets with PRIVATE/PUBLIC/INTERFACE', 'cxx_std_N via target_compile_features', 'Out-of-source builds with Ninja', 'CMakePresets.json for shared settings', 'vcpkg or Conan with pinned versions', 'compile_commands.json exported', 'ccache/sccache in CI'],
        sources: ['CMake documentation: cmake-buildsystem(7), target_link_libraries, CMakePresets', 'Scott, "Professional CMake: A Practical Guide" (latest edition)', 'Pfeifer, "Effective CMake" (C++Now 2017)', 'vcpkg and Conan official documentation'],
      },
      tip: "Ask of each dependency: do my public headers include its headers? If yes, PUBLIC; if only my .cpp files use it, PRIVATE.",
      faq: [['Difference between PRIVATE and PUBLIC?', 'PRIVATE applies only to the target; PUBLIC applies to the target and everything that links it.'], ['When use INTERFACE?', 'For requirements only consumers need, such as header-only libraries.'], ['Why avoid file(GLOB) for sources?', 'CMake does not reliably notice new files without re-running configure.'], ['What does a CMake preset store?', 'Named configure, build, and test settings shared by developers and CI.'], ['How do you consume vcpkg packages?', 'Use the vcpkg toolchain file, then find_package and link the imported target.']],
      ex: {
        prompt: 'Model CMake include propagation. links are "<a>><b>:<KEYWORD>" meaning target_link_libraries(a KEYWORD b). Each target contributes its own name as an include directory. When compiling target, it sees itself plus, for each direct dependency linked PRIVATE or PUBLIC, that dependency and everything it propagates. A dependency propagates through its PUBLIC and INTERFACE links (recursively), not through PRIVATE ones. Write compileIncludes(target, links) returning the visible names sorted.',
        fn: 'compileIncludes', params: 'target, links', sig: '(string target, string[] links) -> string[]',
        cpp: `class Solution {
    map<string, vector<pair<string, string>>> edges;
    set<string> out, seen;
    void usage(const string& d) {
        if (!seen.insert(d).second) return;
        out.insert(d);
        for (auto& e : edges[d]) if (e.second != "PRIVATE") usage(e.first);
    }
public:
    vector<string> compileIncludes(string target, vector<string>& links) {
        edges.clear(); out.clear(); seen.clear();
        for (const string& l : links) {
            size_t gt = l.find('>'), colon = l.find(':');
            edges[l.substr(0, gt)].push_back({l.substr(gt + 1, colon - gt - 1), l.substr(colon + 1)});
        }
        out.insert(target);
        for (auto& e : edges[target]) if (e.second != "INTERFACE") usage(e.first);
        return vector<string>(out.begin(), out.end());
    }
};
`,
        cases: [{ args: ['app', ['app>core:PRIVATE', 'core>util:PUBLIC', 'core>zlib:PRIVATE']], expect: ['app', 'core', 'util'] }, { args: ['core', ['app>core:PRIVATE', 'core>util:PUBLIC', 'core>zlib:PRIVATE']], expect: ['core', 'util', 'zlib'] }, { args: ['lib', ['lib>hdr:INTERFACE']], expect: ['lib'] }, { args: ['x', []], expect: ['x'] }, { args: ['a', ['a>b:PUBLIC', 'b>c:INTERFACE', 'c>d:PUBLIC']], expect: ['a', 'b', 'c', 'd'] }],
        solution: "function compileIncludes(target,links){const e={};for(const l of links){const[a,rest]=l.split('>');const[b,k]=rest.split(':');(e[a]=e[a]||[]).push([b,k])}const out=new Set([target]);const seen=new Set();const usage=d=>{if(seen.has(d))return;seen.add(d);out.add(d);for(const[x,k]of e[d]||[])if(k!=='PRIVATE')usage(x)};for(const[d,k]of e[target]||[])if(k!=='INTERFACE')usage(d);return [...out].sort()}",
        hint: 'The target uses its PRIVATE and PUBLIC dependencies; each dependency passes on only its PUBLIC and INTERFACE ones.',
      },
      quiz: [
        choice('cx-tl-1-q1', 'cpp-cmake', 'core\'s public headers include fmt headers. How should core link fmt?', ['PUBLIC', 'PRIVATE', 'INTERFACE', 'globally with include_directories'], 0, 'Consumers need it too.'),
        choice('cx-tl-1-q2', 'cpp-cmake', 'A header-only library should declare its include directory as...', ['INTERFACE', 'PRIVATE', 'PUBLIC on an executable', 'a global flag'], 0, 'No sources of its own.'),
        choice('cx-tl-1-q3', 'cpp-cmake', 'Which file shares configure and build settings across developers and CI?', ['CMakePresets.json', 'CMakeCache.txt', 'Makefile', 'compile_commands.json'], 0, 'Presets.'),
        fill('cx-tl-1-q4', 'cpp-cmake', 'Properties that propagate to consumers of a target are called ___ requirements.', ['usage'], 'Modern CMake.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'cx-tl-2', title: 'Compilers and flags: warnings, optimisation, debug info, hardening', concept: 'cpp-compiler-flags',
      story: "Three compiler families dominate C++: GCC (1987, the GNU project), Clang/LLVM (Chris Lattner's LLVM began in 2000; Clang was open-sourced by Apple in 2007), and Microsoft's MSVC. Their defaults are conservative: no optimisation, few warnings, and permissive language extensions. Teams that ship robust C++ learn that the flags are part of the code. In 2023 the Open Source Security Foundation published a \"Compiler Options Hardening Guide for C and C++\", collecting the warnings and hardening flags that catch and blunt common bugs.",
      analogy: "Compiler flags are the settings on a workshop machine: the speed dial (optimisation), the safety guards (hardening), the inspection lamp (warnings), and the label printer that records where each part came from (debug information).",
      timeline: [['1987', 'GCC', 'GNU C Compiler; C++ support follows.'], ['2007', 'Clang', 'Open-sourced; known for diagnostics and tooling.'], ['2023', 'OpenSSF guide', 'Compiler Options Hardening Guide for C and C++.'], ['2026', 'GCC 16', 'Default C++ dialect becomes GNU C++20 (released April 2026).']],
      explain: "**Optimisation**: `-O0` (no optimisation, the default; best for stepping in a debugger), `-Og` (debug-friendly optimisation), `-O1`, `-O2` (the usual release level), `-O3` (more aggressive inlining and vectorisation; not always faster), `-Os`/`-Oz` (size). If several `-O` flags appear, **the last one wins**. **Debug information**: `-g` (or `-g3` with macros) adds DWARF data without changing generated code much; `-g0` turns it off. Release builds commonly use `-O2 -g` (RelWithDebInfo) so crashes can be symbolised. `-DNDEBUG` disables `assert`. **Warnings**: `-Wall -Wextra -Wpedantic` as a baseline, plus `-Wshadow`, `-Wconversion`, `-Wsign-conversion`, `-Wnull-dereference`, `-Wold-style-cast`; `-Werror` in CI (not in shipped build scripts that others compile with newer compilers); `-Wno-xxx` disables one warning. MSVC uses `/W4` and `/WX`. **Language**: `-std=c++20` or `-std=c++23`; GCC 16 now defaults to GNU C++20. **Hardening** (GCC/Clang on Linux): `-D_FORTIFY_SOURCE=3` (checks some libc calls; needs optimisation), `-D_GLIBCXX_ASSERTIONS` (bounds checks in libstdc++), `-fstack-protector-strong`, `-fstack-clash-protection`, `-fcf-protection=full` (x86 control-flow integrity), `-fPIE -pie`, and linker flags `-Wl,-z,relro,-z,now`. **Link-time optimisation** (`-flto`) optimises across translation units.",
      diagram: "flags: -O2 -g -Wall -Wextra -O3\n  optimisation  → -O3            (last -O wins)\n  debug info    → yes (-g)\n  warnings      → -Wall -Wextra   (-Wno-* disables, -Wl,* goes to the linker)\nDebug:          -O0 or -Og, -g, sanitizers\nRelWithDebInfo: -O2 -g -DNDEBUG\nHardened:       + -D_FORTIFY_SOURCE=3 -fstack-protector-strong -fcf-protection=full -pie -Wl,-z,relro,-z,now",
      ex1: ['text', 'a sensible warning baseline (GCC/Clang)', "-Wall -Wextra -Wpedantic -Wshadow -Wconversion -Wsign-conversion\n-Wnon-virtual-dtor -Wold-style-cast -Wcast-align -Wunused\n-Woverloaded-virtual -Wnull-dereference -Wdouble-promotion -Wformat=2\n# CI: add -Werror. MSVC: /W4 /permissive- /WX"],
      ex2: ['text', 'OpenSSF-style hardening for a Linux release build', "-O2 -g -D_FORTIFY_SOURCE=3 -D_GLIBCXX_ASSERTIONS\n-fstack-protector-strong -fstack-clash-protection -fcf-protection=full\n-fPIE -pie -Wl,-z,relro -Wl,-z,now -Wl,-z,noexecstack\n-ftrivial-auto-var-init=zero   # optional: zero uninitialised locals"],
      deepDive: {
        explain: "Optimisation changes what undefined behaviour does: code with UB may \"work\" at `-O0` and break at `-O2` because the optimiser relies on UB never happening (for example deleting overflow checks or null checks after a dereference). That is a bug in the code, not the compiler. `-O3` enables more aggressive inlining and loop vectorisation, which can increase code size and instruction-cache misses; measure before adopting it. `-march=native` tunes for the build machine and may produce binaries that crash with illegal instructions on older CPUs; use an explicit baseline such as `-march=x86-64-v3` (AVX2) if you control deployment hardware. `-ffast-math` permits reassociation and assumes no NaNs or infinities, breaking IEEE semantics and `std::isnan` checks; avoid it globally. `-fno-exceptions` and `-fno-rtti` are used in games, embedded, and Google-style code to save size and time, but change which library features work. LTO plus profile-guided optimisation (PGO: `-fprofile-generate`, run representative workloads, `-fprofile-use`) commonly yields 10–20% speed-ups for large applications; Chrome and Firefox ship with PGO.",
        example: ['text', 'profile-guided optimisation workflow (Clang)', "clang++ -O2 -fprofile-instr-generate app.cpp -o app.instr\n./app.instr < representative_input.txt      # writes default.profraw\nllvm-profdata merge -o app.profdata default.profraw\nclang++ -O2 -flto -fprofile-instr-use=app.profdata app.cpp -o app"],
        tradeoffs: [['Flag', 'Benefit', 'Cost'], ['-O2', 'Good speed; standard release level', 'Harder debugging'], ['-O3', 'More inlining and vectorisation', 'Bigger code; not always faster'], ['-g', 'Symbolised crashes and profiles', 'Bigger binaries (strip or split debug info)'], ['Hardening flags', 'Blocks or detects exploits', 'Small run-time cost, usually 0–3%']],
        failures: [['Bug appears only in release builds', 'Undefined behaviour exposed by optimisation', 'UBSan, warnings, fix the UB'], ['Illegal instruction on some servers', '-march=native binary deployed elsewhere', 'Explicit -march baseline'], ['NaN checks stop working', '-ffast-math', 'Remove it or scope it carefully'], ['Unreadable crash stacks', 'No debug info in release', '-g with split or separate debug files']],
      },
      warn: "If a bug appears only with optimisation on, assume undefined behaviour in your code first, not a compiler bug. Run UBSan and ASan before blaming the optimiser.",
      production: {
        numbers: "PGO plus LTO commonly speeds up large applications by about 10–20%; typical hardening flags (FORTIFY, stack protector, CET) cost on the order of 0–3% in most workloads.",
        observe: "Treat warnings as errors in CI, track binary size per release, keep separate debug symbols (objcopy --only-keep-debug or split DWARF) for symbolising crash reports, and verify hardening with checksec.",
        security: "Apply the OpenSSF hardening options to release builds; they turn many memory-corruption bugs into crashes instead of exploits. Keep -D_FORTIFY_SOURCE with optimisation enabled, since it has no effect at -O0.",
        checklist: ['-std set explicitly', 'Warning baseline with -Werror in CI', 'RelWithDebInfo-style release builds', 'Separate debug symbols archived', 'Hardening flags on release builds', 'Explicit -march baseline', 'LTO and PGO evaluated for hot binaries'],
        sources: ['OpenSSF, "Compiler Options Hardening Guide for C and C++" (2023, updated)', 'GCC documentation: Optimize Options, Warning Options, Instrumentation Options', 'Clang documentation: Diagnostic flags; Profile Guided Optimization', 'GCC 16 release notes (April 2026): C++20 default'],
      },
      tip: "Put your flags in one CMake preset or toolchain file and review them like code: a missing -Wall or a stray -ffast-math changes program behaviour as much as a source edit.",
      faq: [['Which -O flag applies if several are given?', 'The last one.'], ['What does -g do?', 'Adds debug information so debuggers and profilers can map machine code to source.'], ['Why is -march=native risky for deployment?', 'The binary may use instructions older CPUs lack.'], ['What does -D_FORTIFY_SOURCE=3 do?', 'Adds checked versions of some libc functions; it needs optimisation enabled.'], ['What default C++ standard does GCC 16 use?', 'GNU C++20.']],
      ex: {
        prompt: 'Write flagReport(flags) summarising a GCC/Clang command line. Return [opt, "debug:yes|no", "warnings:<n>"], where opt is the last flag starting with "-O" (default "-O0"); debug is yes if a flag starting with "-g" appears and the last such flag is not "-g0"; and n counts flags starting with "-W" except those starting with "-Wno-" or "-Wl,".',
        fn: 'flagReport', params: 'flags', sig: '(string[] flags) -> string[]',
        cpp: `class Solution {
    static bool starts(const string& s, const string& p) { return s.compare(0, p.size(), p) == 0; }
public:
    vector<string> flagReport(vector<string>& flags) {
        string opt = "-O0";
        bool debug = false;
        int warnings = 0;
        for (const string& f : flags) {
            if (starts(f, "-O")) opt = f;
            else if (f == "-g0") debug = false;
            else if (starts(f, "-g")) debug = true;
            else if (starts(f, "-W") && !starts(f, "-Wno-") && !starts(f, "-Wl,")) warnings++;
        }
        return {opt, string("debug:") + (debug ? "yes" : "no"), "warnings:" + to_string(warnings)};
    }
};
`,
        cases: [{ args: [['-O2', '-g', '-Wall', '-Wextra', '-O3']], expect: ['-O3', 'debug:yes', 'warnings:2'] }, { args: [[]], expect: ['-O0', 'debug:no', 'warnings:0'] }, { args: [['-g', '-g0', '-Wno-unused', '-Werror', '-Wl,--as-needed']], expect: ['-O0', 'debug:no', 'warnings:1'] }, { args: [['-Og', '-g3']], expect: ['-Og', 'debug:yes', 'warnings:0'] }],
        solution: "function flagReport(flags){let opt='-O0',g=false,w=0;for(const f of flags){if(f.startsWith('-O'))opt=f;else if(f==='-g0')g=false;else if(f.startsWith('-g'))g=true;else if(f.startsWith('-W')&&!f.startsWith('-Wno-')&&!f.startsWith('-Wl,'))w++}return[opt,'debug:'+(g?'yes':'no'),'warnings:'+w]}",
        hint: 'Scan once; later -O and -g flags override earlier ones.',
      },
      quiz: [
        choice('cx-tl-2-q1', 'cpp-compiler-flags', 'Command line has -O3 then -O2. Which optimisation level applies?', ['-O2', '-O3', 'both', '-O0'], 0, 'Last wins.'),
        choice('cx-tl-2-q2', 'cpp-compiler-flags', 'Typical flags for a debuggable release build:', ['-O2 -g', '-O0', '-O3 -ffast-math', '-g0'], 0, 'RelWithDebInfo.'),
        choice('cx-tl-2-q3', 'cpp-compiler-flags', 'A bug appears only at -O2. The most likely cause is...', ['undefined behaviour in the code', 'a compiler bug', 'too many warnings', 'debug info'], 0, 'UB.'),
        fill('cx-tl-2-q4', 'cpp-compiler-flags', 'The flag that turns warnings into errors in GCC and Clang is -W___', ['error'], '-Werror.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'cx-tl-3', title: 'Sanitizers and debuggers in practice', concept: 'cpp-sanitizers-debugging',
      story: "Konstantin Serebryany and colleagues at Google built AddressSanitizer in 2011 because Valgrind was too slow to run Chrome's test suites. ASan's roughly 2× overhead made it practical to run every test, every fuzz target, and even some canary builds under instrumentation. ThreadSanitizer, MemorySanitizer, and UndefinedBehaviorSanitizer followed. Google's OSS-Fuzz service, launched in 2016, combines fuzzing with these sanitizers and has found well over ten thousand vulnerabilities and tens of thousands of bugs in open-source projects.",
      analogy: "Sanitizers are smoke detectors wired into the building during construction: they shriek the moment something starts smouldering, instead of you discovering the fire weeks later. A debugger is the fire investigator who walks through afterwards, room by room.",
      timeline: [['1986', 'GDB', 'GNU Debugger.'], ['2011–2012', 'ASan and TSan', 'Google\'s sanitizers land in Clang, then GCC.'], ['2016', 'OSS-Fuzz', 'Continuous fuzzing with sanitizers for open source.'], ['2020s', 'Record and replay', 'rr and time-travel debugging go mainstream for hard bugs.']],
      explain: "Build sanitizer configurations as separate CI jobs: **ASan** (`-fsanitize=address`) for out-of-bounds, use-after-free, double free, and leaks via LeakSanitizer; **UBSan** (`-fsanitize=undefined`) for signed overflow, invalid shifts, misaligned access, bad enum values, and null dereference checks; **TSan** (`-fsanitize=thread`) for data races; **MSan** (`-fsanitize=memory`, Clang only, needs all code including the standard library instrumented) for uninitialised reads. **ASan, TSan, and MSan cannot be combined** in one binary; UBSan combines with ASan or TSan. Add `-g -fno-omit-frame-pointer` and `-O1` for readable stacks at reasonable speed. Useful options: `ASAN_OPTIONS=detect_leaks=1:halt_on_error=1`, `UBSAN_OPTIONS=print_stacktrace=1:halt_on_error=1`, and `-fno-sanitize-recover=all` to make UB fatal. **Debuggers**: GDB and LLDB on Linux and macOS, Visual Studio and WinDbg on Windows. Core skills: breakpoints (including conditional), stepping, `bt` for backtraces, inspecting variables and frames, **watchpoints** (stop when memory changes, great for finding who corrupts a value), and loading **core dumps** from crashed production processes. **rr** (Linux) records an execution and replays it deterministically, including running backwards (`reverse-continue`) to the moment a bad value was written.",
      diagram: "bug class              sanitizer build                  combine with\noverflow, UAF, leaks   -fsanitize=address              undefined\nsigned overflow, shifts -fsanitize=undefined            address or thread\ndata races             -fsanitize=thread               undefined\nuninitialised reads    -fsanitize=memory (Clang)       (alone)\nASan × TSan × MSan: mutually exclusive → separate CI jobs",
      ex1: ['text', 'running the sanitizer matrix', "cmake --preset asan   # -O1 -g -fno-omit-frame-pointer -fsanitize=address,undefined\nctest --preset asan\ncmake --preset tsan   # -O1 -g -fsanitize=thread\nctest --preset tsan -L concurrency\nexport UBSAN_OPTIONS=print_stacktrace=1:halt_on_error=1"],
      ex2: ['text', 'finding who corrupts a value with a watchpoint', "$ gdb ./server core.12345      # or: gdb --args ./server --port 8080\n(gdb) bt                         # where did it crash?\n(gdb) frame 3\n(gdb) print *session\n(gdb) watch -l session->refcount # stop whenever this memory changes\n(gdb) run\n# with rr: rr record ./server; rr replay; then reverse-continue"],
      deepDive: {
        explain: "Sanitizer reports read top to bottom: the error type and address, the **stack of the bad access**, then for heap errors the **allocation stack** and the **free stack**. The first report matters most; later ones are often consequences. Shadow-memory instrumentation explains the costs: ASan about 2× time and 2–3× memory, TSan 5–15× time and 5–10× memory, MSan about 3×. Sanitizers only see executed code, so pair them with high-coverage tests and **fuzzing** (libFuzzer: `-fsanitize=fuzzer,address`; AFL++). Suppression files exist for third-party noise but should be rare and reviewed. In production, enable core dumps (`ulimit -c unlimited`, systemd-coredump) and keep separate debug symbols so crashes can be analysed later; Windows uses minidumps and symbol servers. For heisenbugs that vanish under a debugger, record-and-replay (rr on Linux, Time Travel Debugging in WinDbg) captures one failing run for unlimited replay. GWP-ASan and hardened allocators catch some memory errors in production with negligible overhead.",
        example: ['text', 'reading an ASan report', "==4242==ERROR: AddressSanitizer: heap-use-after-free on address 0x602000000010\nREAD of size 4 at 0x602000000010 thread T0\n    #0 Session::touch() session.cpp:41        ← the bad access\n    #1 handle_request() server.cpp:120\nfreed by thread T0 here:\n    #0 operator delete(void*)\n    #1 SessionCache::evict() cache.cpp:77     ← who freed it\npreviously allocated by thread T0 here:\n    #1 SessionCache::create() cache.cpp:52"],
        tradeoffs: [['Tool', 'Strength', 'Cost'], ['ASan + UBSan', 'Most memory and UB bugs', '~2× time, ~3× memory'], ['TSan', 'Data races', '5–15× time'], ['GDB / LLDB', 'Inspect any state interactively', 'Manual; changes timing'], ['rr / time-travel debugging', 'Deterministic replay, reverse execution', 'Recording overhead; Linux x86/ARM for rr']],
        failures: [['Sanitizer job finds nothing', 'Tests do not reach the buggy path', 'Coverage plus fuzzing'], ['Cannot combine ASan and TSan', 'Mutually exclusive runtimes', 'Separate builds'], ['Production crash cannot be analysed', 'No core dumps or symbols', 'Enable dumps; archive debug info'], ['Bug disappears in the debugger', 'Timing-dependent race', 'TSan, or record with rr']],
      },
      warn: "Do not ship sanitizer builds to production as a security measure; they are debugging tools with large overhead and their runtimes are not hardened. Use them in CI, fuzzing, and canaries.",
      production: {
        numbers: "Google has reported that OSS-Fuzz helped find and fix over 10,000 vulnerabilities and more than 36,000 bugs across about 1,000 open-source projects; ASan costs about 2× time, TSan about 5–15×.",
        observe: "Sanitizer CI jobs per merge, fuzzing coverage and crash counts, core-dump collection with symbolisation, and crash-free session rates from production crash reporting.",
        security: "Fuzz every parser of untrusted input under ASan and UBSan; treat sanitizer findings in parsers as security bugs and triage them before release.",
        checklist: ['ASan+UBSan CI job', 'TSan CI job for concurrent code', 'MSan where feasible (Clang)', 'Fuzz targets for parsers', 'Core dumps and debug symbols for production', 'Watchpoints and rr in the debugging playbook', 'Sanitizer options make errors fatal'],
        sources: ['Serebryany et al., "AddressSanitizer: A Fast Address Sanity Checker" (USENIX ATC 2012)', 'Clang documentation: AddressSanitizer, ThreadSanitizer, MemorySanitizer, UndefinedBehaviorSanitizer', 'Google OSS-Fuzz documentation and blog', 'rr project documentation (rr-project.org)'],
      },
      tip: "Make the sanitizer build the one developers use by default for running tests locally; bugs found on a laptop are the cheapest bugs you will ever fix.",
      faq: [['Which sanitizers cannot be combined?', 'ASan, TSan, and MSan are mutually exclusive.'], ['Which sanitizer combines with ASan?', 'UBSan.'], ['What does a watchpoint do?', 'Stops execution when a given memory location changes.'], ['What is rr?', 'A Linux record-and-replay debugger that can run backwards through a recorded execution.'], ['Why add -fno-omit-frame-pointer?', 'For reliable, fast stack traces in sanitizer reports and profilers.']],
      ex: {
        prompt: 'Plan sanitizer CI jobs. Map bug classes to sanitizers: overflow, use-after-free, double-free, and leak → address; uninitialized → memory; data-race → thread; signed-overflow and misaligned → undefined. address, thread, and memory each need their own build. If undefined is needed, add it to the first existing build in the order address, thread, memory (written as "<name>,undefined"), or give it its own "undefined" build if none exists. Write sanitizerBuilds(bugs) returning the build strings sorted.',
        fn: 'sanitizerBuilds', params: 'bugs', sig: '(string[] bugs) -> string[]',
        cpp: `class Solution {
public:
    vector<string> sanitizerBuilds(vector<string>& bugs) {
        static const map<string, string> m = {
            {"overflow", "address"}, {"use-after-free", "address"}, {"double-free", "address"}, {"leak", "address"},
            {"uninitialized", "memory"}, {"data-race", "thread"}, {"signed-overflow", "undefined"}, {"misaligned", "undefined"},
        };
        set<string> need;
        for (const string& b : bugs) need.insert(m.at(b));
        vector<string> builds;
        for (const char* s : {"address", "thread", "memory"}) if (need.count(s)) builds.push_back(s);
        if (need.count("undefined")) {
            if (!builds.empty()) builds[0] += ",undefined";
            else builds.push_back("undefined");
        }
        sort(builds.begin(), builds.end());
        return builds;
    }
};
`,
        cases: [{ args: [['overflow', 'data-race', 'signed-overflow']], expect: ['address,undefined', 'thread'] }, { args: [['leak', 'use-after-free']], expect: ['address'] }, { args: [['signed-overflow']], expect: ['undefined'] }, { args: [['uninitialized', 'data-race']], expect: ['memory', 'thread'] }, { args: [[]], expect: [] }],
        solution: "function sanitizerBuilds(bugs){const m={'overflow':'address','use-after-free':'address','double-free':'address','leak':'address','uninitialized':'memory','data-race':'thread','signed-overflow':'undefined','misaligned':'undefined'};const need=new Set(bugs.map(b=>m[b]));const builds=[];for(const s of ['address','thread','memory'])if(need.has(s))builds.push([s]);if(need.has('undefined')){if(builds.length)builds[0].push('undefined');else builds.push(['undefined'])}return builds.map(b=>b.join(',')).sort()}",
        hint: 'Collect the needed sanitizers, create one build per exclusive runtime, then attach UBSan.',
      },
      quiz: [
        choice('cx-tl-3-q1', 'cpp-sanitizers-debugging', 'You need to find a data race and a heap overflow. How many sanitizer builds?', ['2 (TSan and ASan)', '1 combined', '3', '0'], 0, 'Mutually exclusive.'),
        choice('cx-tl-3-q2', 'cpp-sanitizers-debugging', 'In an ASan heap-use-after-free report, which stack shows who released the memory?', ['the "freed by" stack', 'the first stack', 'the allocation stack', 'none'], 0, 'Three stacks.'),
        choice('cx-tl-3-q3', 'cpp-sanitizers-debugging', 'Best debugger feature to find what code overwrites a variable:', ['a watchpoint', 'a breakpoint on main', 'printing the backtrace', 'single-stepping from start'], 0, 'Stops on change.'),
        fill('cx-tl-3-q4', 'cpp-sanitizers-debugging', 'The Linux tool that records an execution and replays it, even backwards, is ___', ['rr'], 'Record and replay.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'cx-tl-4', title: 'Profiling: finding where the time goes', concept: 'cpp-profiling',
      story: "Donald Knuth's line \"premature optimization is the root of all evil\" (1974) is usually quoted without its second half: \"Yet we should not pass up our opportunities in that critical 3%.\" Finding that 3% is what profilers are for. Brendan Gregg invented **flame graphs** at Joyent in 2011 to make sampled stack traces readable at a glance, and they became the standard picture of where a program spends its time, from Linux `perf` to Chrome DevTools.",
      analogy: "A sampling profiler is a photographer taking a snapshot of the kitchen every millisecond. Count how many photos show the chef chopping onions, and you know how much of the evening went into onions, without timing every cut.",
      timeline: [['1982', 'gprof', 'Call-graph execution profiler for Unix.'], ['2009', 'Linux perf', 'perf_events tooling in the kernel tree.'], ['2011', 'Flame graphs', 'Brendan Gregg visualises sampled stacks.'], ['2020s', 'Continuous profiling', 'Always-on fleet profilers (Google-Wide Profiling, Parca, Pyroscope).']],
      explain: "**Measure before optimising**, and measure the build you ship (`-O2`, with `-g` and frame pointers or DWARF unwinding for good stacks). **Sampling profilers** interrupt the program periodically (for example 99 or 999 times per second) and record the stack: Linux **perf** (`perf record -g ./app`, `perf report`), Intel VTune, AMD uProf, Apple Instruments, Visual Studio's profiler, and Tracy for frame-based apps. Each sample's **leaf** function is where time was spent (**self time**); functions that appear anywhere on the stack get **total (inclusive) time**. A **flame graph** draws stacks with width proportional to samples: wide plateaus at the top are hot code. **Instrumenting** profilers and manual timers measure exact durations of chosen sections and suit latency work. **Hardware counters** (`perf stat -e cycles,instructions,cache-misses,branch-misses`) tell you *why* code is slow: low instructions per cycle points to memory stalls, many branch misses to unpredictable branches. **Amdahl's law** bounds the payoff: if a fraction p of run time gets s times faster, overall speed-up is 1 / ((1 − p) + p / s), so making 10% of the program infinitely fast saves at most 10%. Also profile **allocations** (heaptrack, jemalloc profiling) and **off-CPU** time (waiting on locks and I/O), which CPU samplers do not show.",
      diagram: "samples (stack → count)                 self time\nmain;parse;tokenize   40                 tokenize 45\nmain;parse            10                 blit     35\nmain;render;blit      35                 parse    10\nmain;render;tokenize   5\nflame graph: x = share of samples, y = stack depth\n┌──tokenize──┐┌──────blit──────┐\n┌──────parse──────┐┌────render────────┐\n┌─────────────────main─────────────────┐",
      ex1: ['text', 'perf and a flame graph on Linux', "perf record -F 999 -g --call-graph dwarf ./imgserver --bench\nperf report --sort symbol           # self and children percentages\nperf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg\nperf stat -e cycles,instructions,cache-misses,branch-misses ./imgserver --bench"],
      ex2: ['cpp', 'a scoped timer for targeted measurement', "struct ScopedTimer {\n  const char* name; std::chrono::steady_clock::time_point t0 = std::chrono::steady_clock::now();\n  ~ScopedTimer() {\n    auto us = std::chrono::duration_cast<std::chrono::microseconds>(std::chrono::steady_clock::now() - t0).count();\n    std::fprintf(stderr, \"%s: %lld us\\n\", name, (long long)us);\n  }\n};\nvoid resize(Image& img) { ScopedTimer t{\"resize\"}; /* ... */ }"],
      deepDive: {
        explain: "Stack quality depends on unwinding: with `-fomit-frame-pointer` (the default at `-O2` on many targets) perf needs DWARF unwinding (`--call-graph dwarf`, larger overhead) or LBR on Intel; Fedora (2023) and Ubuntu 24.04 re-enabled frame pointers in distribution packages to make whole-system profiling reliable, at a cost of roughly 1% or less in most workloads. Inlined functions are attributed to their callers unless debug info records inlining (`perf report --inline`). Sampling is statistical: 1,000 samples give roughly ±3% precision on a 50% hotspot, so profile long enough and repeat. Beware **observer effects**: instrumentation adds overhead per call and distorts tiny functions. For latency, look at **distributions** (p50, p99, p999) rather than averages, and use tracing (Perfetto, LTTng, Tracy) to see what happened during slow requests. Off-CPU analysis (`perf sched`, eBPF-based offcputime) reveals time blocked on locks, I/O, and page faults. Continuous profilers sample production fleets at low rates and let you compare releases, catching regressions that benchmarks miss.",
        example: ['text', 'Amdahl\'s law in numbers', "p = 0.6 of run time sped up s = 3×:\n  speed-up = 1 / (0.4 + 0.6 / 3) = 1 / 0.6 = 1.67×\np = 0.1 sped up infinitely:\n  speed-up = 1 / 0.9 = 1.11×   (at most 10% saved)"],
        tradeoffs: [['Profiler type', 'Shows', 'Cost'], ['Sampling (perf, VTune)', 'Where CPU time goes, whole program', 'Low overhead; statistical'], ['Instrumentation / timers', 'Exact durations of chosen code', 'Overhead per call; manual'], ['Hardware counters', 'Why code is slow (cache, branches)', 'Needs interpretation'], ['Tracing (Perfetto, Tracy)', 'Timelines and latency outliers', 'Data volume; setup']],
        failures: [['Optimised the wrong function', 'Guessing instead of profiling', 'Profile first; follow the flame graph'], ['Profile of a debug build', '-O0 hotspots differ from release', 'Profile -O2 -g'], ['Broken or truncated stacks', 'No frame pointers or DWARF unwinding', '-fno-omit-frame-pointer or --call-graph dwarf'], ['CPU profile shows nothing but latency is bad', 'Time spent blocked (off-CPU)', 'Off-CPU and lock profiling, tracing']],
      },
      warn: "Never optimise from intuition alone. Profile the release build with realistic input, find the hot path, and confirm the improvement with measurements afterwards.",
      production: {
        numbers: "Making 10% of run time infinitely fast gives at most a 1.11× speed-up (Amdahl). Frame pointers re-enabled in Fedora and Ubuntu packages cost roughly 1% or less in most measured workloads.",
        observe: "Continuous profiling in production (low-rate sampling), flame-graph diffs between releases, hardware counter summaries in benchmarks, and latency percentiles per endpoint.",
        security: "perf and eBPF profilers need privileges (perf_event_paranoid, CAP_PERFMON); grant them narrowly, and treat profiles as sensitive because stacks and symbols reveal internals.",
        checklist: ['Profile -O2 -g release builds', 'Frame pointers or DWARF unwinding', 'Realistic inputs and enough samples', 'Self versus total time understood', 'Hardware counters for why, not just where', 'Off-CPU profiling for latency', 'Before/after measurements for every optimisation'],
        sources: ['Knuth, "Structured Programming with go to Statements" (Computing Surveys, 1974)', 'Gregg, "The Flame Graph" (CACM, 2016) and brendangregg.com', 'Linux perf wiki and perf-record(1)', 'Amdahl, "Validity of the single processor approach to achieving large scale computing capabilities" (1967)'],
      },
      tip: "Look at self time to find what to optimise and at total time to find which caller to restructure; the widest top-of-stack box in a flame graph is usually the first target.",
      faq: [['What does a sampling profiler record?', 'Stack traces at regular intervals; counts approximate where time goes.'], ['Difference between self and total time?', 'Self is time in the function itself; total includes its callees.'], ['What does Amdahl\'s law say?', 'Overall speed-up is limited by the fraction of time you can speed up.'], ['Why profile a release build?', 'Optimisation changes hotspots; debug builds mislead.'], ['What does a flame graph\'s width mean?', 'The share of samples containing that stack frame.']],
      ex: {
        prompt: 'Compute self time from collapsed stacks, the format flame graph tools use. Each sample is "<frame;frame;...;leaf> <count>". Self time goes to the leaf (last) frame. Write selfTime(samples) returning "name=count" entries sorted by count descending, then name ascending.',
        fn: 'selfTime', params: 'samples', sig: '(string[] samples) -> string[]',
        cpp: `class Solution {
public:
    vector<string> selfTime(vector<string>& samples) {
        map<string, int> self;
        for (const string& s : samples) {
            size_t space = s.rfind(' ');
            string stack = s.substr(0, space);
            int n = stoi(s.substr(space + 1));
            size_t semi = stack.rfind(';');
            string leaf = semi == string::npos ? stack : stack.substr(semi + 1);
            self[leaf] += n;
        }
        vector<pair<string, int>> v(self.begin(), self.end());
        sort(v.begin(), v.end(), [](const pair<string, int>& a, const pair<string, int>& b) {
            return a.second != b.second ? a.second > b.second : a.first < b.first;
        });
        vector<string> out;
        for (auto& p : v) out.push_back(p.first + "=" + to_string(p.second));
        return out;
    }
};
`,
        cases: [{ args: [['main;parse;tokenize 40', 'main;parse 10', 'main;render;blit 35', 'main;render;tokenize 5']], expect: ['tokenize=45', 'blit=35', 'parse=10'] }, { args: [[]], expect: [] }, { args: [['main 3', 'main 4']], expect: ['main=7'] }],
        solution: "function selfTime(samples){const c={};for(const s of samples){const[stack,n]=s.split(' ');const leaf=stack.split(';').pop();c[leaf]=(c[leaf]||0)+Number(n)}return Object.keys(c).sort((a,b)=>c[b]-c[a]||(a<b?-1:1)).map(k=>k+'='+c[k])}",
        hint: 'Split off the count, take the last frame, and accumulate.',
      },
      quiz: [
        choice('cx-tl-4-q1', 'cpp-profiling', 'A function is 10% of run time. Making it 10× faster gives an overall speed-up of about...', ['1.10×', '10×', '2×', '1.01×'], 0, '1 / (0.9 + 0.01) ≈ 1.10.'),
        choice('cx-tl-4-q2', 'cpp-profiling', 'Which tool shows cache misses and instructions per cycle?', ['perf stat with hardware counters', 'gdb', 'clang-format', 'ctest'], 0, 'Counters.'),
        choice('cx-tl-4-q3', 'cpp-profiling', 'Latency is bad but CPU profiles look idle. Next step:', ['off-CPU profiling or tracing for blocking', 'add -O3', 'profile the debug build', 'remove logging'], 0, 'Waiting time.'),
        fill('cx-tl-4-q4', 'cpp-profiling', 'The visualisation of sampled stacks invented by Brendan Gregg is the ___ graph.', ['flame'], 'Flame graph.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'cx-tl-5', title: 'Testing C++: GoogleTest, fuzzing, and coverage', concept: 'cpp-testing',
      story: 'Google open-sourced GoogleTest in 2008, and it became the most widely used C++ unit testing framework, with Catch2 and doctest as lighter alternatives. Testing alone misses inputs nobody thought of, so coverage-guided fuzzing followed: libFuzzer (part of LLVM since 2015) and AFL++ generate inputs that reach new code paths, and OSS-Fuzz runs them continuously for open-source projects. Together with sanitizers, they are how serious C++ projects find bugs before users do.',
      analogy: 'Unit tests are an inspector working through a checklist; a fuzzer is a tireless child pressing every button in every order, finding the combination nobody wrote down.',
      timeline: [['2008', 'GoogleTest', 'Google open-sources its C++ testing framework.'], ['2010', 'Catch', 'Header-only framework (later Catch2).'], ['2015', 'libFuzzer', 'Coverage-guided in-process fuzzing in LLVM.'], ['2016', 'OSS-Fuzz', 'Continuous fuzzing for open-source projects.']],
      explain: '**GoogleTest** organises tests as `TEST(Suite, Name)` and fixtures as `TEST_F`. Assertions come in two kinds: **`EXPECT_*`** records a failure and continues, while **`ASSERT_*`** stops the current test (use it when continuing would crash, such as after a null check). Parameterised tests (`TEST_P`) run one test over many inputs, and **GoogleMock** creates mocks for interfaces. Register tests with CMake\'s `gtest_discover_tests` so `ctest` runs and reports each one; `--gtest_filter` runs subsets, and `--gtest_shuffle` with `--gtest_repeat` exposes order dependence and flakiness. Results are pass, fail, or skip (`GTEST_SKIP()`), and a summary lists the failing tests to fix first. **Fuzzing**: write a target `extern "C" int LLVMFuzzerTestOneInput(const uint8_t* data, size_t size)` that feeds bytes to your parser, build with `-fsanitize=fuzzer,address,undefined`, seed a **corpus** of valid inputs, and run; crashes and sanitizer reports become regression tests. **Coverage** (`-fprofile-instr-generate -fcoverage-mapping` with llvm-cov, or gcov and lcov) shows untested lines and branches; use it to find gaps, not as a target to game. Run unit tests under ASan and UBSan in CI, fuzz parsers continuously, and keep tests fast and deterministic.',
      diagram: 'results: Parser.Empty pass · Parser.Unicode FAIL · Cache.Evicts pass · Cache.Ttl skip · Auth.Expired FAIL\nsummary: passed=2 failed=2 skipped=1 → fix Auth.Expired, Parser.Unicode\nEXPECT_* → record and continue · ASSERT_* → stop this test\nfuzzer: corpus → mutate → run target under ASan/UBSan → new coverage? keep input : discard → crash? save reproducer',
      ex1: ['cpp', 'GoogleTest tests and a fixture', `#include <gtest/gtest.h>
#include "lru_cache.h"
TEST(LruCache, EvictsLeastRecentlyUsed) {
  LruCache<int, int> c(2);
  c.put(1, 10); c.put(2, 20); c.get(1); c.put(3, 30);
  EXPECT_FALSE(c.get(2).has_value());
  ASSERT_TRUE(c.get(1).has_value());   // stop here if missing: next line dereferences
  EXPECT_EQ(*c.get(1), 10);
}
class ParserTest : public ::testing::Test { protected: Parser p; };
TEST_F(ParserTest, RejectsEmpty) { EXPECT_FALSE(p.parse("").ok()); }`],
      ex2: ['cpp', 'a libFuzzer target', `#include <cstdint>
#include <string_view>
#include "config_parser.h"
extern "C" int LLVMFuzzerTestOneInput(const uint8_t* data, size_t size) {
  std::string_view input(reinterpret_cast<const char*>(data), size);
  (void)parseConfig(input);      // sanitizers report any memory error or UB
  return 0;
}
// clang++ -g -O1 -fsanitize=fuzzer,address,undefined fuzz_config.cpp config_parser.cpp -o fuzz_config
// ./fuzz_config corpus/ -max_total_time=600`],
      deepDive: {
        explain: 'Good C++ tests are deterministic: avoid real clocks, random seeds, the network, and shared global state, or inject them through interfaces (a `Clock` that tests control). Flaky tests destroy trust, so quarantine and fix them rather than retrying silently. Mock sparingly: prefer real objects and fakes for value types, and mock only at boundaries such as I/O and services. Fuzzing finds what humans miss: structure-aware fuzzing (libprotobuf-mutator, `FuzzedDataProvider`) helps when inputs have a grammar, and dictionaries of keywords speed discovery. A crash found by a fuzzer is minimised (`-minimize_crash=1`) and added to the unit tests so it never regresses. Coverage tools also report branch coverage, which matters more than line coverage for conditionals. Many teams target meaningful coverage of critical code rather than a global percentage, and track coverage changes per pull request to catch untested additions.',
        example: ['cpp', 'a parameterised test', `class RoundTrip : public ::testing::TestWithParam<std::string> {};
TEST_P(RoundTrip, EncodesAndDecodes) {
  EXPECT_EQ(decode(encode(GetParam())), GetParam());
}
INSTANTIATE_TEST_SUITE_P(Strings, RoundTrip, ::testing::Values("", "a", "héllo", std::string(1000, 'x')));`],
        tradeoffs: [['Technique', 'Finds', 'Cost'], ['Unit tests (GoogleTest)', 'Regressions in known behaviour', 'Writing and maintaining cases'], ['Parameterised tests', 'Edge cases across inputs', 'Designing input sets'], ['Fuzzing with sanitizers', 'Crashes and UB on unexpected inputs', 'CPU time; harness setup'], ['Coverage reports', 'Untested code', 'Misleading if treated as a target']],
        failures: [['Tests pass locally, fail in CI randomly', 'Order dependence or real time', 'gtest_shuffle; inject clocks'], ['Crash in a production parser', 'Never fuzzed', 'Fuzz targets run in CI'], ['Test crashes after a failed check', 'EXPECT used where ASSERT was needed', 'ASSERT before dereferencing'], ['High coverage, bugs still slip through', 'Lines executed without meaningful assertions', 'Assert behaviour; check branch coverage']],
      },
      warn: 'Do not ship C++ parsers of untrusted input without fuzzing them under AddressSanitizer and UBSan; unit tests alone rarely find the inputs attackers use.',
      production: {
        numbers: 'GoogleTest was open-sourced in 2008 and libFuzzer joined LLVM in 2015; a 10-minute fuzz run per parser in CI routinely explores hundreds of thousands to millions of inputs.',
        observe: 'Test pass rate and duration, flaky test list, coverage per pull request, fuzzer coverage growth and crash count, and time to fix sanitizer findings.',
        security: 'Fuzz every parser of external data (files, network messages, configuration), run fuzzers with sanitizers, and turn every crash into a regression test.',
        checklist: ['GoogleTest or Catch2 with ctest integration', 'ASSERT where continuing would crash', 'Deterministic tests (injected clocks and seeds)', 'Shuffle and repeat to find flakiness', 'Fuzz targets for parsers', 'Crashes minimised into regression tests', 'Coverage reviewed per change'],
        sources: ['GoogleTest documentation (google.github.io/googletest)', 'LLVM documentation: libFuzzer; Source-based code coverage', 'Google OSS-Fuzz documentation', 'Catch2 documentation'],
      },
      tip: 'Start every bug fix with a failing test; for crashes found by fuzzing, the minimised input is the test.',
      faq: [['Difference between EXPECT_ and ASSERT_?', 'EXPECT records a failure and continues; ASSERT stops the current test.'], ['What is a fuzz target?', 'A function that feeds arbitrary bytes to the code under test, run by a fuzzer.'], ['Why run fuzzers with sanitizers?', 'So memory errors and UB become immediate, reported crashes.'], ['How do you find order-dependent tests?', 'Run with --gtest_shuffle and --gtest_repeat.'], ['Is 100% line coverage the goal?', 'No; use coverage to find gaps, and assert real behaviour.']],
      ex: {
        prompt: 'Summarise test results. Each result is "<Suite.Test>:<pass|fail|skip>". Write testSummary(results) returning ["passed=N", "failed=N", "skipped=N", then the failing test names sorted].',
        fn: 'testSummary', params: 'results', sig: '(string[] results) -> string[]',
        cpp: `class Solution {
public:
    vector<string> testSummary(vector<string>& results) {
        int passed = 0, failed = 0, skipped = 0;
        vector<string> failing;
        for (const string& r : results) {
            size_t c = r.rfind(':');
            string name = r.substr(0, c), status = r.substr(c + 1);
            if (status == "pass") passed++;
            else if (status == "fail") { failed++; failing.push_back(name); }
            else skipped++;
        }
        sort(failing.begin(), failing.end());
        vector<string> out = {"passed=" + to_string(passed), "failed=" + to_string(failed), "skipped=" + to_string(skipped)};
        out.insert(out.end(), failing.begin(), failing.end());
        return out;
    }
};
`,
        cases: [{ args: [['Parser.Empty:pass', 'Parser.Unicode:fail', 'Cache.Evicts:pass', 'Cache.Ttl:skip', 'Auth.Expired:fail']], expect: ['passed=2', 'failed=2', 'skipped=1', 'Auth.Expired', 'Parser.Unicode'] }, { args: [[]], expect: ['passed=0', 'failed=0', 'skipped=0'] }, { args: [['A.B:pass']], expect: ['passed=1', 'failed=0', 'skipped=0'] }],
        solution: "function testSummary(results){let p=0,f=0,s=0;const failed=[];for(const r of results){const i=r.lastIndexOf(':');const name=r.slice(0,i),st=r.slice(i+1);if(st==='pass')p++;else if(st==='fail'){f++;failed.push(name)}else s++}return['passed='+p,'failed='+f,'skipped='+s,...failed.sort()]}",
        hint: 'Split at the last colon, count by status, and collect failing names.',
      },
      quiz: [
        choice('cx-tl-5-q1', 'cpp-testing', 'A pointer may be null and the test dereferences it next. Which assertion first?', ['ASSERT_NE(p, nullptr)', 'EXPECT_NE(p, nullptr)', 'no check', 'EXPECT_TRUE(true)'], 0, 'Stop before crashing.'),
        choice('cx-tl-5-q2', 'cpp-testing', 'Best tool to find crashes from malformed input files:', ['coverage-guided fuzzing with sanitizers', 'more unit tests only', 'code formatting', 'profiling'], 0, 'libFuzzer or AFL++.'),
        choice('cx-tl-5-q3', 'cpp-testing', 'Tests pass alone but fail in the full suite. First experiment:', ['run with --gtest_shuffle and --gtest_repeat', 'delete the tests', 'add sleeps', 'disable sanitizers'], 0, 'Order dependence.'),
        fill('cx-tl-5-q4', 'cpp-testing', 'The libFuzzer entry point is LLVMFuzzerTest___Input', ['One'], 'LLVMFuzzerTestOneInput.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'cx-tl-6', title: 'Static analysis and formatting: clang-tidy, clang-format, and review', concept: 'cpp-static-analysis',
      story: 'Code review time is precious, and arguing about brace placement or spotting NULL by eye wastes it. clang-format (2013) made C++ formatting automatic, and clang-tidy grew into a catalogue of hundreds of checks covering modernisation, bug-prone patterns, performance, and the C++ Core Guidelines. Google\'s experience with its Tricorder platform showed that static analysis is adopted when findings are precise, actionable, and shown during code review rather than in separate reports.',
      analogy: 'clang-format is a typesetter who lays out every page the same way, and clang-tidy is a proofreader who flags known mistakes, so the human reviewer can focus on whether the story makes sense.',
      timeline: [['2013', 'clang-format', 'Automatic C++ formatting in LLVM.'], ['2014', 'clang-tidy', 'Extensible linter built on the Clang AST.'], ['2015', 'C++ Core Guidelines', 'Stroustrup and Sutter publish the guidelines; checks follow.'], ['2018', 'Static analysis at Google', 'Sadowski et al. describe review-integrated analysis (CACM).']],
      explain: '**clang-format** reformats code to a style file (`.clang-format`, often based on the Google, LLVM, or Chromium styles); run it in pre-commit hooks and check it in CI so formatting never appears in review. **clang-tidy** runs checks over the AST using `compile_commands.json`; enable groups deliberately in `.clang-tidy`: **`modernize-*`** (`modernize-use-nullptr` replaces `NULL`, `modernize-make-unique`, `modernize-use-override`), **`bugprone-*`** (use after move, suspicious comparisons), **`performance-*`** (`performance-for-range-copy` flags `for (auto x : container)` copies, unnecessary value parameters), **`cppcoreguidelines-*`** (`cppcoreguidelines-owning-memory` flags raw `new` ownership), and **`readability-*`**. Many checks offer **automatic fixes** (`-fix`). Introduce checks gradually: fix or baseline existing findings, then make new findings fail CI only on changed lines (for example with clang-tidy-diff). Other analysers include the Clang Static Analyzer (path-sensitive bugs), cppcheck, compiler warnings with `-Werror`, and commercial tools. In review, humans then focus on design, correctness, tests, and readability, which tools cannot judge.',
      diagram: 'line 1  Widget* w = new Widget();            → cppcoreguidelines-owning-memory (use make_unique)\nline 2  if (p == NULL) return;               → modernize-use-nullptr\nline 3  for (auto s : names) print(s);       → performance-for-range-copy (use const auto&)\nline 4  for (const auto& s : names) …        ✓\nline 5  auto u = std::make_unique<Widget>(); ✓\npre-commit: clang-format · CI: clang-tidy on changed lines · review: design and correctness',
      ex1: ['text', 'a .clang-tidy configuration', `Checks: >
  -*,
  bugprone-*,
  modernize-use-nullptr,modernize-make-unique,modernize-use-override,
  performance-*,
  cppcoreguidelines-owning-memory,cppcoreguidelines-special-member-functions,
  readability-identifier-naming
WarningsAsErrors: 'bugprone-*,performance-*'
HeaderFilterRegex: 'src/.*'`],
      ex2: ['bash', 'running the tools', `clang-format -i $(git diff --name-only --diff-filter=AM main -- '*.cpp' '*.h')
clang-tidy -p build src/cache.cpp                  # uses compile_commands.json
run-clang-tidy -p build -fix -checks='modernize-use-nullptr' src/   # automatic fixes
git diff -U0 main | clang-tidy-diff.py -p1 -path build   # only changed lines`],
      deepDive: {
        explain: 'Adoption depends on trust: a check with many false positives gets ignored or disabled, which is why curated check sets beat enabling everything. Measure each check\'s fix rate and remove noisy ones. clang-tidy needs accurate compile commands (include paths, defines, standard version) to parse code like the compiler; mismatches cause spurious errors. Headers are analysed through the translation units that include them, so limit noise with `HeaderFilterRegex` and avoid reporting third-party code. Running clang-tidy over a large codebase is slow; run it on changed files in CI and fully on a schedule. Combine it with compiler warnings and sanitizers: static analysis finds patterns without running code, sanitizers find what actually happens at run time, and tests verify behaviour. For review culture, small pull requests, clear descriptions, and automated checks keep reviews focused; reviewers should ask about ownership, lifetimes, thread safety, error handling, and tests, the questions where C++ bugs hide.',
        example: ['text', 'a review checklist for C++ changes', `- Ownership: who owns each heap object? any raw new or delete?
- Lifetimes: references, views, or iterators that could dangle?
- Concurrency: shared state protected? lock order consistent?
- Errors: failures reported and handled? resources released through RAII?
- Performance: copies in hot loops? allocations per request?
- Tests: new behaviour tested, sanitizers green?`],
        tradeoffs: [['Tool', 'Strength', 'Limitation'], ['clang-format', 'Ends style debates', 'Needs an agreed style file'], ['clang-tidy', 'Hundreds of checks, automatic fixes', 'Needs compile commands; noisy if uncurated'], ['Clang Static Analyzer', 'Path-sensitive bug finding', 'Slower; some false positives'], ['Human review', 'Design and intent', 'Expensive; misses mechanical issues']],
        failures: [['Developers ignore tool output', 'Noisy checks', 'Curate checks; measure fix rate'], ['Spurious clang-tidy errors', 'Missing or wrong compile_commands.json', 'Export it from CMake'], ['Formatting diffs in every review', 'No automatic formatting', 'clang-format in pre-commit'], ['Legacy code floods CI with findings', 'All checks enabled at once', 'Baseline, then enforce on changed lines']],
      },
      warn: 'Do not enable every clang-tidy check at once on an existing codebase; a flood of findings teaches developers to ignore the tool. Curate checks and enforce them on changed code first.',
      production: {
        numbers: 'clang-tidy ships hundreds of checks across the modernize, bugprone, performance, readability, and cppcoreguidelines groups; running it only on changed lines keeps CI time proportional to the change.',
        observe: 'Findings per check, fix and suppression rates, CI time for analysis, and the share of review comments that are mechanical (it should trend towards zero).',
        security: 'Enable bugprone and security-relevant checks (use after move, dangling handles, unsafe functions) plus compiler hardening warnings, and treat new findings in changed code as blocking.',
        checklist: ['.clang-format committed and enforced in pre-commit', '.clang-tidy with curated checks', 'compile_commands.json exported', 'Changed-line enforcement in CI', 'Full runs on a schedule', 'Fix rate tracked per check', 'Review focused on design, ownership, and tests'],
        sources: ['Clang documentation: clang-tidy (list of checks); ClangFormat', 'C++ Core Guidelines (isocpp.github.io/CppCoreGuidelines)', 'Sadowski et al., "Lessons from Building Static Analysis Tools at Google" (CACM, 2018)', 'Clang Static Analyzer documentation'],
      },
      tip: 'Make formatting and mechanical checks fully automatic; every review comment about NULL or brace style is a sign a tool should be doing that job.',
      faq: [['What does clang-format do?', 'Automatically formats code to a configured style.'], ['What does modernize-use-nullptr fix?', 'Replaces NULL and 0 used as null pointers with nullptr.'], ['What does performance-for-range-copy flag?', 'Range-for loops that copy each element instead of using a reference.'], ['Why does clang-tidy need compile_commands.json?', 'To parse code with the same flags as the compiler.'], ['How do you introduce checks to legacy code?', 'Baseline existing findings and enforce on changed lines.']],
      ex: {
        prompt: 'Write tidyFindings(lines) acting like three clang-tidy checks on source lines (numbered from 1). Report "<line>:modernize-use-nullptr" if the line contains NULL; "<line>:cppcoreguidelines-owning-memory" if it contains "new " at the start or after a character that is not a letter, digit, or underscore; "<line>:performance-for-range-copy" if it contains "for (auto " but neither "for (auto&" nor "for (const auto&". Report in line order, with checks in that order within a line.',
        fn: 'tidyFindings', params: 'lines', sig: '(string[] lines) -> string[]',
        cpp: `class Solution {
    static bool hasNewKeyword(const string& l) {
        for (size_t i = l.find("new "); i != string::npos; i = l.find("new ", i + 1)) {
            if (i == 0) return true;
            char c = l[i - 1];
            if (!isalnum((unsigned char)c) && c != '_') return true;
        }
        return false;
    }
public:
    vector<string> tidyFindings(vector<string>& lines) {
        vector<string> out;
        for (size_t i = 0; i < lines.size(); i++) {
            const string& l = lines[i];
            string n = to_string(i + 1);
            if (l.find("NULL") != string::npos) out.push_back(n + ":modernize-use-nullptr");
            if (hasNewKeyword(l)) out.push_back(n + ":cppcoreguidelines-owning-memory");
            if (l.find("for (auto ") != string::npos && l.find("for (auto&") == string::npos && l.find("for (const auto&") == string::npos)
                out.push_back(n + ":performance-for-range-copy");
        }
        return out;
    }
};
`,
        cases: [{ args: [['Widget* w = new Widget();', 'if (p == NULL) return;', 'for (auto s : names) print(s);', 'for (const auto& s : names) print(s);', 'auto u = std::make_unique<Widget>();']], expect: ['1:cppcoreguidelines-owning-memory', '2:modernize-use-nullptr', '3:performance-for-range-copy'] }, { args: [[]], expect: [] }],
        solution: "function tidyFindings(lines){const out=[];lines.forEach((l,i)=>{const n=i+1;if(l.includes('NULL'))out.push(n+':modernize-use-nullptr');if(/(^|[^a-zA-Z0-9_])new /.test(l))out.push(n+':cppcoreguidelines-owning-memory');if(l.includes('for (auto ')&&!l.includes('for (auto&')&&!l.includes('for (const auto&'))out.push(n+':performance-for-range-copy')});return out}",
        hint: 'Check each line for the three patterns in order.',
      },
      quiz: [
        choice('cx-tl-6-q1', 'cpp-static-analysis', 'Which check rewrites NULL to nullptr?', ['modernize-use-nullptr', 'performance-for-range-copy', 'bugprone-use-after-move', 'readability-braces-around-statements'], 0, 'Modernize.'),
        choice('cx-tl-6-q2', 'cpp-static-analysis', 'Best way to stop formatting debates in review:', ['clang-format in pre-commit and CI', 'longer review guidelines', 'reviewers fix it by hand', 'ignore formatting'], 0, 'Automate.'),
        choice('cx-tl-6-q3', 'cpp-static-analysis', 'Enabling all clang-tidy checks on a legacy repository at once usually...', ['floods developers, who then ignore the tool', 'fixes everything', 'speeds up builds', 'has no effect'], 0, 'Curate.'),
        fill('cx-tl-6-q4', 'cpp-static-analysis', 'clang-tidy reads compiler flags from compile____.json', ['_commands', 'commands'], 'compile_commands.json.'),
      ],
    }),
  ],
  exam: [
    choice('cx-tl-e1', 'cpp-cmake', 'app links core PRIVATE; core links util PUBLIC. Does compiling app see util\'s headers?', ['yes', 'no', 'only in Debug', 'only with INTERFACE'], 0, 'PUBLIC propagates.'),
    choice('cx-tl-e2', 'cpp-cmake', 'Recommended way to consume a vcpkg package in CMake:', ['vcpkg toolchain file, find_package, link the imported target', 'copy headers into src', 'global include_directories', 'edit CMAKE_CXX_FLAGS'], 0, 'Imported targets.'),
    choice('cx-tl-e3', 'cpp-compiler-flags', 'Flags -O1 -O3 -O2: effective level?', ['-O2', '-O3', '-O1', 'error'], 0, 'Last wins.'),
    choice('cx-tl-e4', 'cpp-compiler-flags', 'Why can -march=native break deployments?', ['the binary may use CPU instructions other machines lack', 'it disables optimisation', 'it removes debug info', 'it is Windows-only'], 0, 'Illegal instruction.'),
    choice('cx-tl-e5', 'cpp-compiler-flags', 'Which is a hardening flag?', ['-fstack-protector-strong', '-ffast-math', '-O0', '-fno-rtti'], 0, 'Stack canaries.'),
    choice('cx-tl-e6', 'cpp-sanitizers-debugging', 'Which sanitizer finds uninitialised reads?', ['MemorySanitizer', 'ThreadSanitizer', 'LeakSanitizer', 'UBSan'], 0, 'MSan.'),
    choice('cx-tl-e7', 'cpp-sanitizers-debugging', 'Which pair can be combined in one build?', ['ASan and UBSan', 'ASan and TSan', 'TSan and MSan', 'ASan and MSan'], 0, 'UBSan combines.'),
    choice('cx-tl-e8', 'cpp-profiling', 'Self time of a function means...', ['samples where it is the leaf frame', 'samples where it appears anywhere', 'wall-clock including waits', 'number of calls'], 0, 'Exclusive.'),
    choice('cx-tl-e9', 'cpp-profiling', 'Speed up 60% of run time by 3×. Overall speed-up?', ['about 1.67×', '3×', '1.8×', '1.2×'], 0, '1 / (0.4 + 0.2).'),
    choice('cx-tl-e10', 'cpp-cmake', 'What does CMAKE_EXPORT_COMPILE_COMMANDS=ON produce?', ['compile_commands.json for clangd and clang-tidy', 'a package', 'a test report', 'a Makefile'], 0, 'Tooling database.'),
    order('cx-tl-e11', 'cpp-profiling', 'Order a disciplined optimisation loop.', ['Measure the release build with realistic input', 'Find the hotspot in the profile', 'Change one thing', 'Measure again and compare'], 'Measure, change, re-measure.'),
    fill('cx-tl-e12', 'cpp-sanitizers-debugging', 'The flag -fsanitize=___ enables AddressSanitizer.', ['address'], 'ASan.'),
    choice('cx-tl-e13', 'cpp-testing', 'Which finds crashes on unexpected inputs best?', ['coverage-guided fuzzing with sanitizers', 'formatting checks', 'unit tests of known cases only', 'profiling'], 0, 'Fuzzing.'),
    choice('cx-tl-e14', 'cpp-static-analysis', 'clang-tidy check that flags for (auto x : big_vector) copies:', ['performance-for-range-copy', 'modernize-use-nullptr', 'bugprone-use-after-move', 'readability-identifier-naming'], 0, 'Copies.'),
  ],
};
