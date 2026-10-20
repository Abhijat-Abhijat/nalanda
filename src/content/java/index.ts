import type { World } from '../../schema';
import { jvLanguage } from './language';
import { jvObjects } from './objects';
import { jvGenerics } from './generics';
import { jvCollections } from './collections';
import { jvStreams } from './streams';
import { jvExceptionsIo } from './exceptions-io';
import { jvConcurrency } from './concurrency';
import { jvVirtualThreads } from './virtual-threads';
import { jvJvm } from './jvm';
import { jvBuildTest } from './build-test';
import { sbCore } from './spring-core';
import { sbWebData } from './spring-web-data';
import { sbSecurityOps } from './spring-security-ops';
import { jvBoss } from './boss';

export const jvWorld: World = {
  id: 'java',
  title: 'Java and Spring Boot',
  hue: '#B0632C',
  tagline: 'Modern Java, the JVM, concurrency, and Spring Boot at senior depth',
  intro: [
    { t: 'text', md: "This world is for developers who already program professionally and want the depth expected of a senior Java engineer: the modern language (records, sealed types, pattern matching, virtual threads), object-oriented design and generics, collections and streams internals, concurrency and the Java memory model, the JVM and garbage collectors, build and test tooling, and Spring Boot from the container to production operations.\n\nEvery lesson has three layers: a mental model, a deep dive into internals, trade-offs, and failure modes, and a production layer with numbers, what to observe, security notes, a checklist, interview questions, and primary sources.\n\nExercises can be solved in Java or JavaScript. The in-browser Java runner compiles at the Java 8 language level, so runnable exercise code uses Java 8 syntax; newer features (records, sealed classes, switch patterns, text blocks, virtual threads) are taught with examples that target Java 21 and 25, the current long-term-support releases. Facts are checked as of October 2026, when JDK 27 was the latest release." },
  ],
  chapters: [jvLanguage, jvObjects, jvGenerics, jvCollections, jvStreams, jvExceptionsIo, jvConcurrency, jvVirtualThreads, jvJvm, jvBuildTest, sbCore, sbWebData, sbSecurityOps],
  boss: jvBoss,
};
