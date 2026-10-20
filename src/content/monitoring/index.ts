import type { World } from '../../schema';
import { msFoundations } from './foundations';
import { msPrometheus } from './prometheus';
import { msLogsTraces } from './logs-traces';
import { msSlos } from './slos';
import { msIncidents } from './incidents';
import { msCapacity } from './capacity';
import { msScalingServices } from './scaling-services';
import { msScalingData } from './scaling-data';
import { msSplunk } from './splunk';
import { msBoss } from './boss';

export const msWorld: World = {
  id: 'monitoring',
  title: 'Monitoring and Scaling',
  hue: '#2E8B7A',
  tagline: 'See what production is doing, keep promises to users, and grow without falling over',
  intro: [
    { t: 'text', md: "Shipping code is the start; keeping it fast and available as traffic grows is the job that follows. This world covers both halves. The first half is about seeing: metrics, logs, and traces, the golden signals, Prometheus and PromQL, structured logging and distributed tracing, service level objectives and error budgets, alerting that wakes people only when it matters, and running incidents and blameless postmortems.\n\nThe second half is about growing: load testing, queueing and capacity planning, horizontal and vertical scaling, load balancing and autoscaling, caching, replication and sharding, rate limiting, and the patterns that keep one slow dependency from taking everything down. The exercises have you implement the calculations behind these tools yourself." },
  ],
  chapters: [msFoundations, msPrometheus, msLogsTraces, msSlos, msIncidents, msCapacity, msScalingServices, msScalingData, msSplunk],
  boss: msBoss,
};
