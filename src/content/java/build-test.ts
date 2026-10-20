import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const jvBuildTest: Chapter = {
  id: 'jv-build-test',
  title: 'Build and test: Maven, Gradle, JUnit, Mockito, Testcontainers',
  summary: 'The Java build and test toolchain at senior depth: the Maven lifecycle, dependency resolution and version conflicts, Gradle task graphs and caching, JUnit 5 and 6 test lifecycles, Mockito and when not to mock, and integration testing with Testcontainers within a balanced test suite. Tool versions checked as of October 2026 (JUnit 6 GA since September 2025).',
  lessons: [
    deepTopic({
      id: 'l1', key: 'jv-bt-1', title: 'The Maven lifecycle', concept: 'jv-maven',
      story: "Before Maven, every Java project's Ant build script was different: its own targets, directory layout, and copied JAR files in a `lib` folder. Jason van Zyl and colleagues at the Apache Turbine project created **Maven** (1.0 in 2004), built on **convention over configuration**: a standard directory layout (`src/main/java`, `src/test/java`), a declarative **POM**, dependencies downloaded from a central repository, and a fixed **lifecycle** of phases. Twenty years later Maven Central serves billions of downloads, and most Java developers can build an unfamiliar Maven project with one command.",
      analogy: "A production line where every station has a fixed position: if you ask for the item to be packed, it automatically passes through cutting, assembly, and inspection first.",
      timeline: [['2000', 'Apache Ant', 'Scripted builds with XML targets.'], ['2004', 'Maven 1.0', 'Convention over configuration and remote repositories.'], ['2005', 'Maven 2', 'Lifecycle, transitive dependencies, POM 4.0.0.'], ['2010', 'Maven 3', 'Long-lived major line; Maven 4 in development with release candidates.']],
      explain: "Maven's **default lifecycle** is an ordered list of phases; the main ones are `validate`, `compile`, `test`, `package`, `verify`, `install`, and `deploy`. Running a phase runs **every earlier phase first**: `mvn package` validates, compiles, runs unit tests, and builds the JAR. `install` copies the artifact to your local repository (`~/.m2/repository`); `deploy` uploads it to a remote repository. Separate lifecycles exist for `clean` and `site`, so `mvn clean verify` runs the clean lifecycle and then the default lifecycle up to `verify`. **Plugins** do the work: their **goals** are bound to phases (the compiler plugin's `compile` goal to the compile phase, Surefire's `test` goal to test, Failsafe's integration-test goals around `verify`). The **POM** declares coordinates (`groupId:artifactId:version`), dependencies with **scopes** (`compile`, `provided`, `runtime`, `test`), plugins, and a parent for shared configuration (Spring Boot's `spring-boot-starter-parent`). **Multi-module** builds use a reactor that orders modules by their dependencies.",
      diagram: "mvn package\n validate → compile → test → package\nmvn verify   (… → package → verify: integration tests via Failsafe)\nmvn install  (… → verify → install into ~/.m2)\nmvn clean verify   = clean lifecycle, then default up to verify",
      ex1: ['xml', 'dependency scopes', "<dependency>\n  <groupId>org.postgresql</groupId>\n  <artifactId>postgresql</artifactId>\n  <scope>runtime</scope>          <!-- needed to run, not to compile -->\n</dependency>\n<dependency>\n  <groupId>org.junit.jupiter</groupId>\n  <artifactId>junit-jupiter</artifactId>\n  <scope>test</scope>\n</dependency>"],
      ex2: ['text', 'useful commands', "mvn -q -DskipTests package           # build without running tests (not for CI)\nmvn dependency:tree -Dincludes=com.fasterxml.jackson.core\nmvn -pl orders-service -am verify     # build one module and what it needs\n./mvnw verify                         # Maven Wrapper pins the Maven version"],
      deepDive: {
        explain: "Reproducible builds need pinned versions: plugin versions in the POM (or the parent), dependency versions managed centrally (`dependencyManagement`, or importing a **BOM** such as Spring Boot's), and the **Maven Wrapper** (`mvnw`) so every machine uses the same Maven. Unit tests run with Surefire (`*Test` classes) during `test`; integration tests run with Failsafe (`*IT` classes) during `integration-test` and `verify`, so a failing integration test still lets Failsafe tear down resources before failing the build. Speed: parallel builds (`-T 1C`), skipping unchanged modules in CI with `-pl`/`-am`, and dependency caching in CI. Avoid `SNAPSHOT` dependencies in release builds; they change under the same version. Security: enforce allowed repositories, use checksums, and scan dependencies (for example OWASP Dependency-Check or GitHub dependency alerts).",
        example: ['js', 'phases executed for a goal phase', "function phasesRun(goal) {\n  const phases = ['validate', 'compile', 'test', 'package', 'verify', 'install', 'deploy'];\n  const i = phases.indexOf(goal);\n  return i < 0 ? [] : phases.slice(0, i + 1);   // every earlier phase runs first\n}"],
        tradeoffs: [['Choice', 'Strength', 'Weakness'], ['Maven', 'Convention, declarative, ubiquitous', 'Verbose XML; less flexible'], ['Gradle', 'Flexible, incremental, fast', 'Build logic can become code'], ['BOM imports', 'Consistent dependency versions', 'Must update the BOM'], ['Maven Wrapper', 'Same Maven everywhere', 'One more file to maintain']],
        failures: [['Build works locally, fails in CI', 'Different Maven or unpinned plugins', 'Maven Wrapper; pin plugin versions'], ['Integration tests leave containers running', 'Run with Surefire, not Failsafe', 'Failsafe and *IT naming'], ['Release changes after being built', 'SNAPSHOT dependencies', 'Release versions only'], ['Test libraries shipped in production JAR', 'Wrong scope', 'test scope for test dependencies']],
      },
      warn: "Never ship releases built with -DskipTests or SNAPSHOT dependencies. Both remove the guarantees that make a build reproducible and verified.",
      production: {
        numbers: "mvn package runs four phases (validate, compile, test, package); mvn install runs six; adding -T 1C parallelises multi-module builds across available cores.",
        observe: "Track CI build duration by phase and module, test counts and flakiness, and dependency update lag; slow builds hurt delivery more than most runtime issues.",
        security: "Pin and scan dependencies, restrict repositories, verify checksums, and review new transitive dependencies; supply-chain attacks target build systems.",
        checklist: ['Maven Wrapper committed', 'Plugin versions pinned', 'Versions managed via BOM or dependencyManagement', 'Correct scopes', 'Surefire for unit, Failsafe for integration tests', 'No SNAPSHOTs in releases', 'Dependency scanning in CI'],
        sources: ['Apache Maven: Introduction to the Build Lifecycle', 'Apache Maven: Introduction to Dependency Mechanism', 'Apache Maven Failsafe Plugin documentation'],
      },
      tip: "Run `mvn verify` locally before pushing. It is the phase CI usually runs, and it includes integration tests that `test` skips.",
      faq: [['What does mvn package run?', 'validate, compile, test, package.'], ['What does install do?', 'Copies the artifact to the local repository.'], ['test versus provided scope?', 'test: only for tests; provided: compile against it, the runtime supplies it.'], ['Which plugin runs integration tests?', 'Failsafe.'], ['Why use the Maven Wrapper?', 'To pin the Maven version for everyone.']],
      ex: { prompt: 'Write phasesRun(goal) returning the default-lifecycle phases Maven runs for goal, from ["validate", "compile", "test", "package", "verify", "install", "deploy"]: every phase up to and including goal, or [] if goal is not in the list.', fn: 'phasesRun', params: 'goal', sig: '(string goal) -> string[]', java: `class Solution {
    public String[] phasesRun(String goal) {
        List<String> p = Arrays.asList("validate", "compile", "test", "package", "verify", "install", "deploy");
        int i = p.indexOf(goal);
        return i < 0 ? new String[0] : p.subList(0, i + 1).toArray(new String[0]);
    }
}
`, cases: [{ args: ['package'], expect: ['validate', 'compile', 'test', 'package'] }, { args: ['validate'], expect: ['validate'] }, { args: ['clean'], expect: [] }, { args: ['install'], expect: ['validate', 'compile', 'test', 'package', 'verify', 'install'] }], solution: `function phasesRun(goal){const p=['validate','compile','test','package','verify','install','deploy'];const i=p.indexOf(goal);return i<0?[]:p.slice(0,i+1)}`, hint: 'Slice the ordered list up to the goal.' },
      quiz: [
        choice('jv-bt-1-q1', 'jv-maven', 'mvn install runs unit tests?', ['yes; test comes before install', 'no', 'only with -Dtest', 'only in CI'], 0, 'Lifecycle.'),
        choice('jv-bt-1-q2', 'jv-maven', 'Servlet API provided by the container at runtime. Scope?', ['provided', 'compile', 'runtime', 'test'], 0, 'Compile against it.'),
        choice('jv-bt-1-q3', 'jv-maven', 'Integration tests should run in which phase family?', ['integration-test and verify (Failsafe)', 'compile', 'validate', 'install'], 0, 'Failsafe.'),
        fill('jv-bt-1-q4', 'jv-maven', 'Maven\'s project descriptor file is the ___', ['POM', 'pom.xml', 'pom'], 'Project Object Model.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'jv-bt-2', title: 'Dependency resolution and version conflicts', concept: 'jv-dependency-resolution',
      story: "A service depends on library A, which needs Jackson 2.15, and library B, which needs Jackson 2.17. Only one Jackson can be on the class path. Maven and Gradle resolve such conflicts differently: Maven picks the version **nearest** to your project in the dependency tree, while Gradle picks the **highest** requested version. Many `NoSuchMethodError` crashes in production trace back to an unexpected resolution. The Log4Shell vulnerability (December 2021) made transitive dependency versions a board-level concern, because most affected applications pulled Log4j in indirectly.",
      analogy: "A family recipe with conflicting notes from grandparents and great-grandparents: one rule says follow the closest relative's note; another says use the newest note.",
      timeline: [['2005', 'Transitive dependencies', 'Maven 2 resolves dependencies of dependencies.'], ['2012', 'Gradle conflict resolution', 'Highest version wins by default.'], ['December 2021', 'Log4Shell', 'CVE-2021-44228 in transitive Log4j dependencies.'], ['2020s', 'SBOMs and BOMs', 'Software bills of materials and platform BOMs standardise versions.']],
      explain: "Dependencies bring their own dependencies (**transitive**), forming a tree. When the same library appears with different versions, **Maven uses nearest-wins**: the version with the shortest path from your project; for equal depth, the one declared first. **Gradle** selects the **highest** version among all requests (with options for strict versions, rich constraints, and failing on conflicts). Consequences: in Maven, a library deep in the tree can be silently downgraded below what it needs, causing `NoSuchMethodError` or `ClassNotFoundException` at runtime; in Gradle, a library can be silently upgraded to a version with breaking changes. Tools: `mvn dependency:tree`, `gradle dependencies` and `dependencyInsight`, the Maven Enforcer plugin's `dependencyConvergence` rule, and **BOMs** (Bills of Materials) that align versions of related artifacts (Spring Boot, Jackson, Netty, cloud SDKs). Declaring a version directly, or in `dependencyManagement`, makes your choice explicit.",
      diagram: "app ─ a ─ lib 1.2      (depth 2)\napp ─ lib 1.0          (depth 1)\nMaven (nearest wins) → lib 1.0   ← a may break: needs 1.2 API\nGradle (highest wins) → lib 1.2\nsemantic comparison: 1.10 > 1.9 (not string order)",
      ex1: ['xml', 'pinning a version with dependencyManagement', "<dependencyManagement>\n  <dependencies>\n    <dependency>\n      <groupId>com.fasterxml.jackson</groupId>\n      <artifactId>jackson-bom</artifactId>\n      <version>2.17.2</version>\n      <type>pom</type>\n      <scope>import</scope>\n    </dependency>\n  </dependencies>\n</dependencyManagement>"],
      ex2: ['text', 'finding who brings a library', "mvn dependency:tree -Dverbose -Dincludes=org.apache.logging.log4j\n./gradlew dependencyInsight --dependency log4j-core --configuration runtimeClasspath"],
      deepDive: {
        explain: "Policies that keep large codebases sane: import BOMs for families of libraries; fail builds on unresolved conflicts (Maven Enforcer `dependencyConvergence`, Gradle `failOnVersionConflict()`) at least in shared libraries; exclude unwanted transitive dependencies explicitly; and keep dependency count low, since every dependency is attack surface and upgrade work. Use automated update tools (Dependabot, Renovate) with good test suites, and generate SBOMs (CycloneDX, SPDX) so you can answer \"are we affected?\" within minutes of a new CVE. Version comparison must be numeric and qualifier-aware (1.10 is newer than 1.9; 2.0.0-RC1 is older than 2.0.0); both build tools implement these rules. Shading (relocating packages inside a fat JAR) is a last resort for unavoidable conflicts in libraries.",
        example: ['js', 'nearest-wins versus highest-wins resolution', "const cmpVer = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number);\n  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };\nfunction resolveVersion(paths, strategy) {        // paths like 'app>a>lib:1.2'\n  let best = null;\n  for (const p of paths) {\n    const depth = p.split('>').length - 1, v = p.slice(p.lastIndexOf(':') + 1);\n    if (!best) best = { depth, v };\n    else if (strategy === 'nearest') { if (depth < best.depth) best = { depth, v }; }   // ties: first wins\n    else if (cmpVer(v, best.v) > 0) best = { depth, v };\n  }\n  return best ? best.v : '';\n}"],
        tradeoffs: [['Strategy', 'Strength', 'Risk'], ['Maven nearest-wins', 'Your direct declarations always win', 'Silent downgrades of deep dependencies'], ['Gradle highest-wins', 'Libraries get what they asked for or newer', 'Silent upgrades with breaking changes'], ['BOM alignment', 'Consistent families', 'Must track BOM releases'], ['Fail on conflict', 'No surprises', 'More manual decisions']],
        failures: [['NoSuchMethodError at runtime', 'Library downgraded by nearest-wins', 'Pin the needed version; dependency convergence'], ['Behaviour change after unrelated upgrade', 'Highest-wins pulled a new major version', 'Strict versions or constraints'], ['Vulnerable library found weeks later', 'No SBOM or scanning', 'SBOM generation and CVE scanning in CI'], ['Two Jackson modules on different versions', 'No BOM', 'Import the Jackson BOM']],
      },
      warn: "A dependency you never declared can still run in production. Generate a dependency tree or SBOM and scan it; Log4Shell spread mostly through transitive dependencies.",
      production: {
        numbers: "With paths app>a>lib:1.2 and app>lib:1.0, Maven resolves 1.0 (depth 1 beats depth 2) while Gradle resolves 1.2; semantically 1.10 is newer than 1.9.",
        observe: "Track dependency counts, known vulnerabilities by severity, and update lag; alert on new critical CVEs in the SBOM.",
        security: "Use SBOMs, vulnerability scanning, pinned versions, restricted repositories, and signature or checksum verification to manage supply-chain risk.",
        checklist: ['BOMs for library families', 'Direct pins for critical libraries', 'Dependency convergence checks', 'Automated update PRs', 'SBOM generated per build', 'CVE scanning in CI', 'Unused dependencies removed'],
        sources: ['Apache Maven: Dependency Mediation (nearest definition)', 'Gradle User Manual: Dependency Resolution and conflict resolution', 'NIST NVD: CVE-2021-44228 (Log4Shell)'],
      },
      tip: "When a NoSuchMethodError names a library class, run dependency:tree for that library first. It is almost always two versions competing.",
      faq: [['How does Maven pick a version in conflicts?', 'Nearest definition in the tree; first declared on ties.'], ['How does Gradle pick?', 'Highest requested version by default.'], ['What is a BOM?', 'A POM that manages versions for a family of artifacts.'], ['Typical symptom of a bad downgrade?', 'NoSuchMethodError or ClassNotFoundException at runtime.'], ['What is an SBOM?', 'A software bill of materials listing all components.']],
      ex: { prompt: 'Write resolveVersion(paths, strategy). Each path is like "app>a>lib:1.2" (depth = number of ">"; version after the last ":"). For "nearest", choose the smallest depth (first one wins ties); for "highest", choose the highest version comparing numeric dot-separated parts (missing parts are 0; first wins ties). Return the chosen version, or "" for no paths.', fn: 'resolveVersion', params: 'paths, strategy', sig: '(string[] paths, string strategy) -> string', java: `class Solution {
    static int cmp(String a, String b) {
        String[] x = a.split("\\\\."), y = b.split("\\\\.");
        for (int i = 0; i < Math.max(x.length, y.length); i++) {
            int d = (i < x.length ? Integer.parseInt(x[i]) : 0) - (i < y.length ? Integer.parseInt(y[i]) : 0);
            if (d != 0) return d;
        }
        return 0;
    }
    public String resolveVersion(String[] paths, String strategy) {
        String bestV = null;
        int bestDepth = 0;
        for (String p : paths) {
            int depth = p.split(">").length - 1;
            String v = p.substring(p.lastIndexOf(':') + 1);
            if (bestV == null || (strategy.equals("nearest") ? depth < bestDepth : cmp(v, bestV) > 0)) { bestV = v; bestDepth = depth; }
        }
        return bestV == null ? "" : bestV;
    }
}
`, cases: [{ args: [['app>a>lib:1.2', 'app>lib:1.0'], 'nearest'], expect: '1.0' }, { args: [['app>a>lib:1.2', 'app>lib:1.0'], 'highest'], expect: '1.2' }, { args: [['app>a>lib:2.0', 'app>b>lib:1.9'], 'nearest'], expect: '2.0' }, { args: [['app>a>lib:1.10', 'app>b>lib:1.9'], 'highest'], expect: '1.10' }], solution: `function resolveVersion(paths,strategy){const cmp=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d}return 0};let best=null;for(const p of paths){const depth=p.split('>').length-1;const v=p.slice(p.lastIndexOf(':')+1);if(!best)best={depth,v};else if(strategy==='nearest'){if(depth<best.depth)best={depth,v}}else if(cmp(v,best.v)>0)best={depth,v}}return best?best.v:''}`, hint: 'Compute depth and version per path, then apply the strategy.' },
      quiz: [
        choice('jv-bt-2-q1', 'jv-dependency-resolution', 'Maven: app → lib 1.0 directly, app → a → lib 1.2. Resolved?', ['1.0', '1.2', 'both', 'build fails'], 0, 'Nearest.'),
        choice('jv-bt-2-q2', 'jv-dependency-resolution', 'NoSuchMethodError in a library call after adding a dependency. First check?', ['dependency tree for conflicting versions', 'JVM flags', 'GC logs', 'network'], 0, 'Conflicts.'),
        choice('jv-bt-2-q3', 'jv-dependency-resolution', 'Keep all Jackson modules on one version:', ['import the Jackson BOM', 'list each by hand at random versions', 'use SNAPSHOTs', 'shade everything'], 0, 'Alignment.'),
        fill('jv-bt-2-q4', 'jv-dependency-resolution', 'Gradle\'s default conflict strategy picks the ___ version', ['highest', 'newest'], 'Not nearest.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'jv-bt-3', title: 'Gradle: task graphs, incrementality, and caching', concept: 'jv-gradle',
      story: "Gradle (1.0 in 2012), created by Hans Dockter and Adam Murdoch, combined Maven's conventions with a programmable build model. Android adopted it as the official build system in 2013, and large organisations moved to it for speed: builds are modelled as a **directed acyclic graph of tasks** with declared inputs and outputs, so Gradle can skip up-to-date work, reuse outputs from a **build cache**, and keep a warm **daemon**. The Kotlin DSL became the default for new Gradle builds in 2023.",
      analogy: "A kitchen that remembers which dishes are already prepared and unchanged since yesterday, and only cooks what is new or what depends on something new.",
      timeline: [['2012', 'Gradle 1.0', 'Groovy DSL, task graph, Maven-compatible repositories.'], ['2013', 'Android adopts Gradle', 'Official Android build system.'], ['2017', 'Build cache', 'Local and remote reuse of task outputs.'], ['2023', 'Kotlin DSL default', 'build.gradle.kts for new builds (Gradle 8.2).']],
      explain: "A Gradle build runs in three phases: **initialisation** (which projects are in the build), **configuration** (evaluate build scripts and create tasks), and **execution** (run the tasks needed for the requested goals in dependency order). Tasks declare dependencies (`build` depends on `assemble` and `check`; `test` depends on `classes`), and Gradle computes a **topological order** in which each task runs once. Tasks with declared **inputs and outputs** are **incremental**: if nothing changed, they are `UP-TO-DATE`; with the **build cache**, outputs produced elsewhere (another branch, a CI agent) can be reused as `FROM-CACHE`. The **Gradle Wrapper** pins the Gradle version. **Version catalogs** (`libs.versions.toml`) centralise dependency coordinates. Avoid heavy logic in the configuration phase and prefer configuration avoidance APIs (`tasks.register`) so large builds configure quickly.",
      diagram: "build → assemble → jar → classes → compileJava, processResources\n      → check → test → classes (already done)\nexecution order: compileJava, processResources, classes, jar, assemble, test, check, build\nunchanged inputs → UP-TO-DATE · cached elsewhere → FROM-CACHE",
      ex1: ['kotlin', 'a modern Gradle build (Kotlin DSL)', "plugins {\n    java\n    id(\"org.springframework.boot\") version \"3.5.0\"\n}\njava { toolchain { languageVersion = JavaLanguageVersion.of(21) } }\ndependencies {\n    implementation(libs.spring.boot.starter.web)\n    testImplementation(libs.junit.jupiter)\n}\ntasks.test { useJUnitPlatform() }"],
      ex2: ['text', 'speed features', "./gradlew build --build-cache --parallel\n./gradlew test --scan          # build scan: timeline, cache hits, test details\n./gradlew :orders:test --tests '*PricingTest'"],
      deepDive: {
        explain: "Correct inputs and outputs are what make Gradle fast and correct: a custom task that reads files without declaring them as inputs will be wrongly considered up-to-date; one that writes outside its declared outputs breaks caching. **Java toolchains** let the build compile and test with a specific JDK regardless of the JDK running Gradle. `implementation` versus `api` dependencies control what leaks to consumers' compile classpaths, reducing recompilation in multi-module builds. Remote build caches shared with CI can cut build times dramatically for large repositories, but cache poisoning is a risk: only trusted CI should write to the remote cache. Build logic belongs in convention plugins (`buildSrc` or included builds), not copied between `build.gradle.kts` files.",
        example: ['js', 'task execution order (dependencies first, each once)', "function taskOrder(deps, target) {             // deps like 'build>assemble' (build depends on assemble)\n  const g = {};\n  for (const d of deps) { const [a, b] = d.split('>'); (g[a] = g[a] || []).push(b); }\n  const out = [], seen = new Set();\n  const visit = (t) => { if (seen.has(t)) return; seen.add(t); for (const n of g[t] || []) visit(n); out.push(t); };\n  visit(target);\n  return out;\n}"],
        tradeoffs: [['Feature', 'Benefit', 'Caution'], ['Up-to-date checks', 'Skip unchanged work', 'Needs correct inputs/outputs'], ['Remote build cache', 'Reuse outputs across machines', 'Restrict writers; cache poisoning'], ['Kotlin DSL', 'Type-safe, IDE support', 'Slower first configuration'], ['Convention plugins', 'Shared build logic', 'Initial setup effort']],
        failures: [['Stale outputs after changing a config file', 'Undeclared task input', 'Declare inputs and outputs'], ['Slow configuration phase', 'Eager task creation and heavy logic', 'tasks.register; move logic to plugins'], ['Different JDK in CI', 'No toolchain', 'Java toolchains'], ['Every module recompiles on small changes', 'api dependencies everywhere', 'implementation where possible']],
      },
      warn: "Only trusted CI jobs should write to a shared remote build cache. A poisoned cache entry would be reused by every developer and pipeline.",
      production: {
        numbers: "In the example graph, building runs 8 tasks once each in dependency order; on a no-change rebuild, all of them can be UP-TO-DATE in seconds.",
        observe: "Build scans show task timings, cache hit rates, and configuration time; track them in CI to catch regressions in build performance.",
        security: "Pin the Gradle Wrapper (with its checksum verification), restrict plugin repositories, and verify dependency signatures or checksums (dependency verification metadata).",
        checklist: ['Gradle Wrapper committed', 'Java toolchains', 'Version catalog', 'Declared inputs and outputs for custom tasks', 'Build cache with trusted writers', 'implementation over api', 'Convention plugins for shared logic'],
        sources: ['Gradle User Manual: Build Lifecycle, Incremental Build, Build Cache', 'Gradle 8.2 release notes: Kotlin DSL default for new builds (2023)', 'Gradle User Manual: Toolchains for JVM projects'],
      },
      tip: "Run a build twice with no changes. Anything not UP-TO-DATE the second time has missing or unstable inputs and is slowing every developer.",
      faq: [['Three phases of a Gradle build?', 'Initialisation, configuration, execution.'], ['What does UP-TO-DATE mean?', 'Inputs and outputs unchanged; task skipped.'], ['What does the build cache add?', 'Reuse of outputs produced elsewhere.'], ['implementation versus api?', 'api leaks the dependency to consumers; implementation does not.'], ['What are toolchains for?', 'Compiling and testing with a specific JDK.']],
      ex: { prompt: 'Write taskOrder(deps, target) where deps are "a>b" meaning task a depends on task b (in the given order). Return the tasks needed for target in execution order: depth-first, running each task\'s dependencies (in declared order) before the task itself, each task once.', fn: 'taskOrder', params: 'deps, target', sig: '(string[] deps, string target) -> string[]', java: `class Solution {
    Map<String, List<String>> g = new HashMap<>();
    Set<String> seen = new HashSet<>();
    List<String> out = new ArrayList<>();
    void visit(String t) {
        if (!seen.add(t)) return;
        List<String> next = g.get(t);
        if (next != null) for (String n : next) visit(n);
        out.add(t);
    }
    public String[] taskOrder(String[] deps, String target) {
        for (String d : deps) {
            String[] p = d.split(">");
            if (!g.containsKey(p[0])) g.put(p[0], new ArrayList<String>());
            g.get(p[0]).add(p[1]);
        }
        visit(target);
        return out.toArray(new String[0]);
    }
}
`, cases: [{ args: [['build>assemble', 'build>check', 'assemble>jar', 'jar>classes', 'check>test', 'test>classes', 'classes>compileJava', 'classes>processResources'], 'build'], expect: ['compileJava', 'processResources', 'classes', 'jar', 'assemble', 'test', 'check', 'build'] }, { args: [[], 'clean'], expect: ['clean'] }], solution: `function taskOrder(deps,target){const g={};for(const d of deps){const[a,b]=d.split('>');(g[a]=g[a]||[]).push(b)}const out=[],seen=new Set();const visit=t=>{if(seen.has(t))return;seen.add(t);for(const n of g[t]||[])visit(n);out.push(t)};visit(target);return out}`, hint: 'Post-order depth-first traversal.' },
      quiz: [
        choice('jv-bt-3-q1', 'jv-gradle', 'A task reads config.yaml but does not declare it. Risk?', ['stale UP-TO-DATE results', 'faster builds safely', 'compile error', 'none'], 0, 'Inputs.'),
        choice('jv-bt-3-q2', 'jv-gradle', 'Compile with JDK 21 even when Gradle runs on 17:', ['Java toolchains', 'JAVA_HOME tricks only', 'impossible', '--release flag in the wrapper'], 0, 'Toolchains.'),
        choice('jv-bt-3-q3', 'jv-gradle', 'Who should write to the remote build cache?', ['trusted CI only', 'every developer', 'nobody', 'external contributors'], 0, 'Poisoning.'),
        fill('jv-bt-3-q4', 'jv-gradle', 'Central dependency coordinates live in a version ___ (libs.versions.toml)', ['catalog'], 'Gradle 7.4+.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'jv-bt-4', title: 'JUnit 5 and 6: lifecycle and parameterised tests', concept: 'jv-junit',
      story: "Kent Beck and Erich Gamma wrote JUnit on a flight to OOPSLA in 1997, and it shaped unit testing across languages. **JUnit 5** (2017) was a rewrite: the **JUnit Platform** for launching tests, **Jupiter** for the new programming model (`@Test`, `@BeforeEach`, extensions), and **Vintage** for running JUnit 4 tests. **JUnit 6** went GA on 30 September 2025 with a Java 17 baseline and unified version numbers, keeping the Jupiter programming model, so tests written for JUnit 5 mostly carry over unchanged.",
      analogy: "A theatre performance schedule: the stage is set up once before the season, props are reset before every show, cleaned after every show, and the set is struck at the end of the season.",
      timeline: [['1997', 'JUnit', 'Beck and Gamma\'s xUnit for Java.'], ['2006', 'JUnit 4', 'Annotations such as @Test (Java 5).'], ['2017', 'JUnit 5', 'Platform, Jupiter, Vintage; extensions model.'], ['September 2025', 'JUnit 6', 'Java 17 baseline, unified versions; Jupiter API continues.']],
      explain: "Jupiter lifecycle per test class: `@BeforeAll` (once, static by default), then for **each test method** a **new instance** of the test class with `@BeforeEach`, the `@Test` method, and `@AfterEach`, and finally `@AfterAll` once. The new instance per test isolates state; `@TestInstance(PER_CLASS)` changes that when you deliberately share it. Assertions: `assertEquals`, `assertThrows` (which returns the exception for further checks), `assertAll` for grouped assertions, and `assertTimeout`; AssertJ is a popular fluent alternative. **Parameterised tests** (`@ParameterizedTest` with `@ValueSource`, `@CsvSource`, `@MethodSource`) run one test body with many inputs, each reported separately. Other tools: `@Nested` classes for grouping scenarios, `@DisplayName`, `@Tag` for filtering (for example `slow`), `@Disabled` with a reason, and **extensions** (`@ExtendWith`) that power Spring's test support and Mockito's integration.",
      diagram: "@BeforeAll\n  new instance → @BeforeEach → test1 → @AfterEach\n  new instance → @BeforeEach → test2 → @AfterEach\n@AfterAll\n@ParameterizedTest @CsvSource({\"1,1,2\", \"2,3,5\"}) → two reported invocations",
      ex1: ['java', 'a parameterised test (JUnit 5/6 Jupiter)', "@ParameterizedTest(name = \"{0} + {1} = {2}\")\n@CsvSource({ \"1, 1, 2\", \"2, 3, 5\", \"-1, 1, 0\" })\nvoid adds(int a, int b, int expected) {\n    assertEquals(expected, calculator.add(a, b));\n}"],
      ex2: ['java', 'asserting exceptions', "IllegalArgumentException e = assertThrows(IllegalArgumentException.class,\n    () -> Money.of(\"-5.00\", \"EUR\"));\nassertTrue(e.getMessage().contains(\"negative\"));"],
      deepDive: {
        explain: "Good unit tests are fast (milliseconds), isolated (no shared mutable state, no order dependence), deterministic (no real clock, randomness, or network), and readable (arrange-act-assert, one behaviour per test, descriptive names). Inject a `Clock` instead of calling `Instant.now()`; seed randomness; use `@TempDir` for files. Flaky tests usually come from timing (sleeps, async code without awaiting), shared state, test order, or real external services; quarantine and fix them rather than retrying blindly. JUnit Platform runs tests in parallel when configured (`junit.jupiter.execution.parallel.enabled=true`), which exposes hidden shared state. Migrating from JUnit 4: Vintage runs old tests (deprecated in JUnit 6), and OpenRewrite recipes automate most annotation changes. Measure coverage (JaCoCo) as a signal of untested code, not as a goal in itself; mutation testing (PIT) checks whether tests actually detect changes.",
        example: ['js', 'Jupiter lifecycle order for n tests', "function lifecycleOrder(n) {\n  const out = ['BeforeAll'];\n  for (let i = 1; i <= n; i++) out.push('BeforeEach', 'test' + i, 'AfterEach');   // fresh instance each time\n  out.push('AfterAll');\n  return out;\n}"],
        tradeoffs: [['Feature', 'Use', 'Caution'], ['@BeforeEach', 'Fresh fixtures per test', 'Slow if setup is heavy'], ['@BeforeAll', 'Expensive shared setup', 'Shared state between tests'], ['Parameterised tests', 'Many inputs, one behaviour', 'Unreadable when cases differ in meaning'], ['Parallel execution', 'Faster suites', 'Exposes shared state']],
        failures: [['Tests pass alone, fail together', 'Shared static state or order dependence', 'Fresh fixtures; no statics'], ['Flaky time-based test', 'Instant.now() in code', 'Inject Clock'], ['Huge test with many asserts fails unclearly', 'Testing many behaviours at once', 'One behaviour per test; assertAll'], ['Coverage high but bugs slip through', 'Assertions missing or weak', 'Mutation testing; review assertions']],
      },
      warn: "A test that sometimes fails is not a minor annoyance: it trains the team to ignore red builds. Quarantine flaky tests and fix the cause, usually time, shared state, or real external services.",
      production: {
        numbers: "For 2 tests, Jupiter runs BeforeAll once, BeforeEach and AfterEach twice each, and AfterAll once: 8 lifecycle steps. A healthy unit test runs in milliseconds.",
        observe: "Track suite duration, slowest tests, flaky test rate, and coverage trends in CI; tools like build scans or test reports highlight regressions.",
        security: "Test data must not contain real customer data or production secrets; use generated fixtures and test credentials.",
        checklist: ['Fast, isolated, deterministic unit tests', 'Clock and randomness injected', 'Parameterised tests for input variations', 'assertThrows for error cases', 'Tags for slow tests', 'Flaky tests quarantined and fixed', 'Coverage and mutation testing as signals'],
        sources: ['JUnit User Guide (Jupiter) and JUnit 6.0.0 release notes (September 2025)', 'InfoQ, "JUnit 6 adds Java 17 baseline" (October 2025)', 'Beck, "Test-Driven Development: By Example" (2002)'],
      },
      tip: "Name tests after behaviour (`rejectsNegativeAmounts`) rather than methods (`testCreate`). Failing test names then read like a bug report.",
      faq: [['How often does @BeforeEach run?', 'Before every test method.'], ['Does Jupiter reuse the test instance?', 'No, a new instance per test by default.'], ['How do you test many inputs?', '@ParameterizedTest with sources such as @CsvSource.'], ['How do you check an exception?', 'assertThrows.'], ['JUnit 6 baseline?', 'Java 17.']],
      ex: { prompt: 'Write lifecycleOrder(n) returning the JUnit Jupiter lifecycle callbacks for n tests: "BeforeAll", then for each test i (1-based) "BeforeEach", "test" + i, "AfterEach", and finally "AfterAll".', fn: 'lifecycleOrder', params: 'n', sig: '(int n) -> string[]', java: `class Solution {
    public String[] lifecycleOrder(int n) {
        List<String> out = new ArrayList<>();
        out.add("BeforeAll");
        for (int i = 1; i <= n; i++) { out.add("BeforeEach"); out.add("test" + i); out.add("AfterEach"); }
        out.add("AfterAll");
        return out.toArray(new String[0]);
    }
}
`, cases: [{ args: [2], expect: ['BeforeAll', 'BeforeEach', 'test1', 'AfterEach', 'BeforeEach', 'test2', 'AfterEach', 'AfterAll'] }, { args: [0], expect: ['BeforeAll', 'AfterAll'] }], solution: `function lifecycleOrder(n){const out=['BeforeAll'];for(let i=1;i<=n;i++)out.push('BeforeEach','test'+i,'AfterEach');out.push('AfterAll');return out}`, hint: 'Wrap each test with BeforeEach and AfterEach.' },
      quiz: [
        choice('jv-bt-4-q1', 'jv-junit', 'A test reads Instant.now() and fails at midnight. Fix?', ['inject a Clock', 'retry the test', 'run it at noon', 'add sleep'], 0, 'Determinism.'),
        choice('jv-bt-4-q2', 'jv-junit', 'Run one discount test for 12 input/output pairs:', ['@ParameterizedTest with @CsvSource', '12 copied methods', 'a loop with one assert', '@RepeatedTest'], 0, 'Parameterised.'),
        choice('jv-bt-4-q3', 'jv-junit', 'Tests pass individually but fail in the full suite. Likely cause?', ['shared mutable state or order dependence', 'JVM bug', 'too much memory', 'JIT'], 0, 'Isolation.'),
        fill('jv-bt-4-q4', 'jv-junit', 'JUnit 5\'s programming model module is named ___', ['Jupiter'], 'Platform, Jupiter, Vintage.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'jv-bt-5', title: 'Mockito and test doubles', concept: 'jv-mockito',
      story: "Szczepan Faber created **Mockito** in 2008 as a simpler alternative to EasyMock, with a readable `when(...).thenReturn(...)` and `verify(...)` style. It became the most used mocking library in Java. Its popularity brought a familiar problem: test suites that mock everything, pass reliably, and still miss real bugs, because they test that code calls other code rather than what the system does. Martin Fowler's \"Mocks Aren't Stubs\" (2007) and the classicist versus mockist debate remain essential reading.",
      analogy: "Rehearsing a play with stand-ins: useful for practising your lines, but a show performed entirely with stand-ins tells you little about opening night.",
      timeline: [['2004', 'Mock objects', 'jMock and EasyMock popularise mocks in Java.'], ['2007', 'Mocks Aren\'t Stubs', 'Fowler distinguishes test doubles and testing styles.'], ['2008', 'Mockito', 'Faber\'s readable mocking library.'], ['2020s', 'Inline mock maker default', 'Mockito 5 mocks final classes by default (2023).']],
      explain: "Gerard Meszaros's **test doubles**: a **dummy** fills a parameter; a **stub** returns canned answers; a **fake** is a working lightweight implementation (in-memory repository); a **mock** records interactions to verify; a **spy** wraps a real object and records calls. In Mockito: `mock(PaymentGateway.class)` creates a mock; `when(gateway.charge(any())).thenReturn(Result.ok())` stubs; `verify(gateway, times(1)).charge(order)` checks interactions; `verify(audit, never()).log(any())` checks absence; `ArgumentCaptor` captures arguments for detailed assertions; `@Mock` with `@ExtendWith(MockitoExtension.class)` wires them in JUnit, with **strict stubs** failing on unused stubbings. Guidelines: mock **boundaries you own an interface for** (gateways, clocks, message publishers), not value objects or the class under test; prefer **fakes** for repositories in unit tests and real databases in integration tests; verify interactions only when the interaction is the behaviour (sending an email, publishing an event).",
      diagram: "test double types\n  stub:  when(rates.get(\"EUR\")).thenReturn(1.08)        → state-based assertions\n  mock:  verify(mailer, times(1)).send(any())            → interaction assertions\n  fake:  InMemoryOrderRepository                         → realistic behaviour\nverify modes: times(n) · atLeast(n) · never()",
      ex1: ['java', 'stubbing and verifying with Mockito', "@ExtendWith(MockitoExtension.class)\nclass CheckoutServiceTest {\n    @Mock PaymentGateway gateway;\n    @Mock Mailer mailer;\n    @InjectMocks CheckoutService service;\n\n    @Test void sendsReceiptAfterSuccessfulCharge() {\n        when(gateway.charge(any())).thenReturn(ChargeResult.ok(\"tx-1\"));\n        service.checkout(order);\n        verify(mailer, times(1)).sendReceipt(order.email(), \"tx-1\");\n    }\n}"],
      ex2: ['java', 'capturing arguments', "ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);\nverify(publisher).publish(captor.capture());\nassertEquals(\"ORDER_PAID\", captor.getValue().type());"],
      deepDive: {
        explain: "Over-mocking makes tests **brittle** (refactoring internal calls breaks tests though behaviour is unchanged) and **blind** (mocks return what you told them, so integration mistakes, such as a wrong SQL query or a misconfigured HTTP client, never surface). Classicist style (state-based tests with real collaborators and fakes) catches more integration bugs; mockist style isolates units sharply. A pragmatic mix: test domain logic with real objects, use fakes or mocks at the edges (I/O, time, external services), and cover the edges themselves with integration tests against real infrastructure (next lesson). Mocking static methods (`mockStatic`) and constructors is possible but usually signals a design problem; inject the dependency instead. Keep stubbing minimal and strict, so tests fail when production code stops using a stub, and avoid `verifyNoMoreInteractions` everywhere, which couples tests to every call.",
        example: ['js', 'verifying call counts like verify(mock, mode)', "function verifyCalls(calls, method, mode, n) {\n  const count = calls.filter((c) => c === method).length;\n  if (mode === 'times') return count === n;\n  if (mode === 'atLeast') return count >= n;\n  if (mode === 'never') return count === 0;\n  return false;\n}"],
        tradeoffs: [['Double', 'Best for', 'Risk'], ['Stub', 'Providing inputs from collaborators', 'Unrealistic data'], ['Mock + verify', 'Side effects that are the behaviour', 'Brittle interaction coupling'], ['Fake', 'Repositories, queues in unit tests', 'Fake drifts from real behaviour'], ['Real dependency (Testcontainers)', 'Integration correctness', 'Slower tests']],
        failures: [['Refactor breaks dozens of tests, behaviour unchanged', 'Verifying internal interactions', 'Assert outcomes; verify only meaningful side effects'], ['Bug in SQL passes all tests', 'Repository mocked everywhere', 'Integration tests with a real database'], ['UnnecessaryStubbingException', 'Stale stubs (strict stubs)', 'Remove unused stubbing'], ['mockStatic everywhere', 'Hidden dependencies', 'Inject collaborators']],
      },
      warn: "A test that mocks the repository, the mapper, and the client verifies only that your code calls methods. Pair such unit tests with integration tests against real infrastructure.",
      production: {
        numbers: "Mock-based unit tests run in milliseconds; database integration tests with containers take seconds, so most suites use many fast unit tests and fewer, broader integration tests.",
        observe: "Track bugs that escaped to production by layer; escapes in data access or HTTP integration usually mean those layers were only tested with mocks.",
        security: "Mocks of authorisation components can hide security bugs; test access control with real security configuration in integration tests.",
        checklist: ['Mocks only at boundaries', 'Fakes for repositories in unit tests', 'Verify only meaningful side effects', 'Strict stubs', 'ArgumentCaptor for complex arguments', 'No static mocking as a habit', 'Integration tests for mocked boundaries'],
        sources: ['Fowler, "Mocks Aren\'t Stubs" (2007)', 'Meszaros, "xUnit Test Patterns" (2007): test doubles', 'Mockito documentation and Mockito 5 release notes (2023)'],
      },
      tip: "Before adding a mock, ask whether the test would still be meaningful if that collaborator were real. If yes, use the real one or a fake.",
      faq: [['Stub versus mock?', 'A stub provides answers; a mock is used to verify interactions.'], ['What is a fake?', 'A lightweight working implementation, such as an in-memory repository.'], ['How do you check a method was never called?', 'verify(mock, never()).method(...).'], ['Risk of over-mocking?', 'Brittle tests that miss integration bugs.'], ['What does ArgumentCaptor do?', 'Captures arguments passed to a mock for assertions.']],
      ex: { prompt: 'Write verifyCalls(calls, method, mode, n) checking a list of recorded method names like Mockito verify: mode "times" → exactly n calls to method; "atLeast" → at least n; "never" → zero calls (n ignored).', fn: 'verifyCalls', params: 'calls, method, mode, n', sig: '(string[] calls, string method, string mode, int n) -> bool', java: `class Solution {
    public boolean verifyCalls(String[] calls, String method, String mode, int n) {
        int count = 0;
        for (String c : calls) if (c.equals(method)) count++;
        if (mode.equals("times")) return count == n;
        if (mode.equals("atLeast")) return count >= n;
        if (mode.equals("never")) return count == 0;
        return false;
    }
}
`, cases: [{ args: [['save', 'find', 'save'], 'save', 'times', 2], expect: true }, { args: [['save'], 'delete', 'never', 0], expect: true }, { args: [['save'], 'save', 'atLeast', 2], expect: false }, { args: [[], 'x', 'times', 0], expect: true }], solution: `function verifyCalls(calls,method,mode,n){const c=calls.filter(x=>x===method).length;if(mode==='times')return c===n;if(mode==='atLeast')return c>=n;if(mode==='never')return c===0;return false}`, hint: 'Count matching calls, then compare by mode.' },
      quiz: [
        choice('jv-bt-5-q1', 'jv-mockito', 'Checkout must email a receipt exactly once. Assertion?', ['verify(mailer, times(1)).sendReceipt(...)', 'assertEquals on a mock field', 'no assertion', 'verifyNoMoreInteractions everywhere'], 0, 'Meaningful side effect.'),
        choice('jv-bt-5-q2', 'jv-mockito', 'Repository queries are always mocked; a wrong JPQL query reaches production. Fix?', ['integration tests with a real database', 'more mocks', 'spies', 'mockStatic'], 0, 'Real infrastructure.'),
        choice('jv-bt-5-q3', 'jv-mockito', 'In-memory implementation of a repository interface is a...', ['fake', 'mock', 'dummy', 'spy'], 0, 'Working double.'),
        fill('jv-bt-5-q4', 'jv-mockito', 'verify(mock, ___()).delete(any()) asserts no calls', ['never'], 'Absence.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'jv-bt-6', title: 'Integration tests with Testcontainers', concept: 'jv-testcontainers',
      story: "For years, Java teams tested data access against H2 or HSQLDB in-memory databases, then discovered in production that PostgreSQL behaved differently: other SQL dialects, other locking, missing extensions. Richard North started **Testcontainers** in 2015 to run real dependencies (databases, Kafka, Redis, browsers) in throwaway Docker containers from test code. Its company, AtomicJar, was acquired by Docker in December 2023, and Spring Boot 3.1 added first-class support with `@ServiceConnection`. Testing against the real thing became the default.",
      analogy: "Rehearsing on the actual stage with real lighting instead of a school hall: slower to set up, but the opening night holds far fewer surprises.",
      timeline: [['2000s', 'In-memory databases for tests', 'H2 and HSQLDB approximate production databases.'], ['2015', 'Testcontainers', 'Real dependencies in Docker for JVM tests.'], ['2023', 'Spring Boot @ServiceConnection', 'Automatic wiring of container connection details (Boot 3.1).'], ['December 2023', 'Docker acquires AtomicJar', 'Testcontainers backed by Docker.']],
      explain: "Testcontainers starts a container from JUnit (`@Testcontainers` with `@Container`), waits until it is ready, exposes dynamic ports, and removes it afterwards (a sidecar \"Ryuk\" container cleans up even if the JVM crashes). In Spring Boot, `@ServiceConnection` on a `PostgreSQLContainer` field configures the DataSource automatically. Use it for repository tests (real SQL, migrations with Flyway or Liquibase), messaging (Kafka, RabbitMQ), caches (Redis), and HTTP dependencies (WireMock or MockServer containers). Speed: reuse one container across a test class or suite (static fields or singleton containers), keep schema setup in migrations, and clean data between tests rather than restarting containers. A balanced suite follows the **test pyramid**: many fast unit tests, fewer integration tests with real infrastructure, and a small number of end-to-end tests, sized so CI gives feedback in minutes.",
      diagram: "test pyramid (counts × time each)\n   e2e:          20 × 30 s   =  600 s\n   integration: 300 ×  2 s   =  600 s\n   unit:       2000 × 0.01 s =   20 s\ntotal 1,220 s ÷ 4 parallel workers ≈ 5.1 minutes",
      ex1: ['java', 'Spring Boot with a real PostgreSQL', "@SpringBootTest\n@Testcontainers\nclass OrderRepositoryIT {\n    @Container @ServiceConnection\n    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>(\"postgres:17-alpine\");\n\n    @Autowired OrderRepository orders;\n\n    @Test void findsOrdersByCustomer() {\n        orders.save(new Order(\"c42\", new BigDecimal(\"19.99\")));\n        assertEquals(1, orders.findByCustomerId(\"c42\").size());\n    }\n}"],
      ex2: ['text', 'keeping container tests fast', "static containers shared per class (or a singleton base class)\nFlyway migrations once per container; truncate tables between tests\npin image tags (postgres:17-alpine), never 'latest'\nrun *IT tests with Failsafe in mvn verify"],
      deepDive: {
        explain: "Testcontainers needs a Docker-compatible runtime in CI (Docker, Podman with compatibility, or Testcontainers Cloud). Pin image versions to match production major versions; testing against a different PostgreSQL major version reintroduces the dialect gap you wanted to remove. Data isolation strategies: transactions rolled back after each test (fast, but hides commit-time behaviour such as deferred constraints), truncation between tests (realistic), or unique data per test (works with parallelism). For contract-level confidence between services, pair integration tests with **consumer-driven contract tests** (Pact or Spring Cloud Contract) instead of large end-to-end suites. Measure suite time: if CI takes much longer than 10–15 minutes, developers stop running tests locally and batch changes, which hurts more than the extra coverage helps.",
        example: ['js', 'suite duration in minutes with parallel workers', "function suiteMinutes(counts, secondsEach, parallelism) {\n  let total = 0;\n  for (let i = 0; i < counts.length; i++) total += counts[i] * secondsEach[i];\n  return Math.round(total / parallelism / 60 * 10) / 10;\n}"],
        tradeoffs: [['Approach', 'Strength', 'Weakness'], ['In-memory database (H2)', 'Fast, no Docker', 'Dialect and behaviour differences'], ['Testcontainers', 'Real behaviour, same versions as production', 'Docker required; seconds per test'], ['Shared test environment', 'Realistic integration', 'Flaky, shared state, slow feedback'], ['Contract tests', 'Service compatibility without full e2e', 'Discipline to maintain contracts']],
        failures: [['Query works in tests, fails in production', 'H2 instead of the real database', 'Testcontainers with the production engine'], ['Integration suite takes 40 minutes', 'New container per test', 'Shared containers; truncate data'], ['Tests break when the image updates', 'latest tag', 'Pinned image versions'], ['Order-dependent integration tests', 'Shared data between tests', 'Clean or unique data per test']],
      },
      warn: "Do not test PostgreSQL-specific code against H2. Differences in SQL dialect, locking, and constraints mean passing tests prove little about production.",
      production: {
        numbers: "2,000 unit tests at 10 ms, 300 integration tests at 2 s, and 20 end-to-end tests at 30 s take 1,220 seconds; with 4 parallel workers about 5.1 minutes.",
        observe: "Track suite duration by layer, flaky test rate, and escaped defects per layer to rebalance the pyramid over time.",
        security: "Use throwaway credentials in containers, never production data; pin and scan test images like production images.",
        checklist: ['Real engines via Testcontainers', 'Pinned image versions matching production', 'Shared containers per class or suite', 'Migrations applied in tests', 'Data cleaned between tests', 'Contract tests between services', 'CI suite under ~15 minutes'],
        sources: ['Testcontainers for Java documentation (accessed October 2026)', 'Spring Boot reference: Testcontainers and @ServiceConnection (Boot 3.1+)', 'Docker press release: acquisition of AtomicJar (December 2023)'],
      },
      tip: "Start each repository test class with a container that matches production's database version exactly. Most data-access bugs then appear on your laptop.",
      faq: [['What problem does Testcontainers solve?', 'Testing against real dependencies instead of approximations.'], ['What does @ServiceConnection do?', 'Wires Spring Boot connection properties from the container.'], ['How do you keep container tests fast?', 'Share containers and clean data between tests.'], ['Why pin image tags?', 'To match production and keep tests reproducible.'], ['What is the test pyramid?', 'Many unit tests, fewer integration tests, few end-to-end tests.']],
      ex: { prompt: 'Write suiteMinutes(counts, secondsEach, parallelism) returning the total test time (sum of counts[i] × secondsEach[i]) divided by parallelism, in minutes rounded to 1 decimal.', fn: 'suiteMinutes', params: 'counts, secondsEach, parallelism', sig: '(int[] counts, double[] secondsEach, int parallelism) -> double', java: `class Solution {
    public double suiteMinutes(int[] counts, double[] secondsEach, int parallelism) {
        double total = 0;
        for (int i = 0; i < counts.length; i++) total += counts[i] * secondsEach[i];
        return Math.round(total / parallelism / 60 * 10) / 10.0;
    }
}
`, cases: [{ args: [[2000, 300, 20], [0.01, 2, 30], 4], expect: 5.1 }, { args: [[], [], 1], expect: 0 }, { args: [[600], [1], 1], expect: 10 }], solution: `function suiteMinutes(c,s,p){let t=0;for(let i=0;i<c.length;i++)t+=c[i]*s[i];return Math.round(t/p/60*10)/10}`, hint: 'Total seconds, divide by workers, convert to minutes.' },
      quiz: [
        choice('jv-bt-6-q1', 'jv-testcontainers', 'Repository tests use H2 but production uses PostgreSQL. Risk?', ['dialect and behaviour differences hide bugs', 'none', 'faster production', 'better coverage'], 0, 'Real engine.'),
        choice('jv-bt-6-q2', 'jv-testcontainers', 'Integration suite slow: each test starts a new container. Fix?', ['share containers; clean data between tests', 'remove tests', 'use latest tags', 'more retries'], 0, 'Reuse.'),
        choice('jv-bt-6-q3', 'jv-testcontainers', 'Spring Boot feature that wires a container\'s URL and credentials:', ['@ServiceConnection', '@MockBean', '@DirtiesContext', '@Disabled'], 0, 'Boot 3.1.'),
        fill('jv-bt-6-q4', 'jv-testcontainers', 'Many unit tests, fewer integration, few e2e: the test ___', ['pyramid'], 'Shape.'),
      ],
    }),
  ],
  exam: [
    choice('jv-bt-e1', 'jv-maven', 'mvn verify runs...', ['all phases up to verify, including tests and packaging', 'only verify', 'only integration tests', 'deploy too'], 0, 'Lifecycle.'),
    choice('jv-bt-e2', 'jv-dependency-resolution', 'Maven resolves version conflicts by...', ['nearest definition', 'highest version', 'lowest version', 'random'], 0, 'Mediation.'),
    choice('jv-bt-e3', 'jv-gradle', 'UP-TO-DATE means...', ['inputs and outputs unchanged, task skipped', 'task failed', 'task ran from scratch', 'cache poisoned'], 0, 'Incremental.'),
    choice('jv-bt-e4', 'jv-junit', 'How many times does @BeforeEach run for 5 tests?', ['5', '1', '0', '10'], 0, 'Per test.'),
    choice('jv-bt-e5', 'jv-mockito', 'Best target for a mock:', ['an external payment gateway interface', 'a value object', 'the class under test', 'String'], 0, 'Boundaries.'),
    choice('jv-bt-e6', 'jv-testcontainers', 'Why test with the production database engine?', ['dialect and behaviour match production', 'it is faster than H2', 'no Docker needed', 'coverage'], 0, 'Fidelity.'),
    choice('jv-bt-e7', 'jv-dependency-resolution', 'Typical runtime symptom of a downgraded transitive dependency:', ['NoSuchMethodError', 'OutOfMemoryError', 'StackOverflowError', '404'], 0, 'Missing API.'),
    choice('jv-bt-e8', 'jv-junit', 'Fix for tests depending on the current time:', ['inject a Clock', 'retry', 'sleep', 'disable'], 0, 'Determinism.'),
    choice('jv-bt-e9', 'jv-maven', 'Pin the Maven version across machines with...', ['the Maven Wrapper', 'SNAPSHOTs', 'skipTests', 'a README'], 0, 'mvnw.'),
    order('jv-bt-e10', 'jv-maven', 'Order these Maven phases.', ['compile', 'test', 'package', 'install'], 'Lifecycle.'),
    order('jv-bt-e11', 'jv-junit', 'Order Jupiter callbacks for one test.', ['BeforeAll', 'BeforeEach', 'Test method', 'AfterEach then AfterAll'], 'Lifecycle.'),
    fill('jv-bt-e12', 'jv-testcontainers', 'Testcontainers runs dependencies in ___ containers', ['Docker'], 'Throwaway.'),
  ],
};
