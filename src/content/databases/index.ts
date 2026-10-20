import type { World } from '../../schema';
import { dbLandscape } from './landscape';
import { dbInternals } from './internals';
import { dbDocuments } from './documents';
import { dbKeyValue } from './key-value';
import { dbAnalytics } from './analytics';
import { dbSpecialised } from './specialised';
import { dbDistributed } from './distributed';
import { dbOperations } from './operations';
import { dbMysql } from './mysql';
import { dbBoss } from './boss';

export const dbWorld: World = {
  id: 'databases',
  title: 'Databases',
  hue: '#B8862B',
  tagline: 'Beyond SQL: how data is stored, scaled, and kept safe',
  intro: [
    { t: 'text', md: "The SQL world taught you to ask a relational database questions. This world goes underneath and beyond it: how storage engines really work, when a document, key-value, wide-column, time-series, graph, search, or vector database is the better tool, how databases replicate and shard across machines, and how to operate them safely with backups, failover, and monitoring.\n\nExamples use PostgreSQL, MongoDB, Redis, DynamoDB, Cassandra, ClickHouse, Neo4j, Elasticsearch, and pgvector, and you practise by implementing the core ideas, from B-tree lookups to consistent hashing, yourself." },
  ],
  chapters: [dbLandscape, dbInternals, dbDocuments, dbKeyValue, dbAnalytics, dbSpecialised, dbDistributed, dbOperations, dbMysql],
  boss: dbBoss,
};
