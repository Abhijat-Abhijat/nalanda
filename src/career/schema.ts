import { z } from 'zod';

export const CAREER_KEY = 'nalanda.career.v1';
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ActivityKind = z.enum(['lesson', 'interview', 'deck', 'daily', 'application', 'mock']);
const Activity = z.object({ day: Day, kind: ActivityKind });
const Goals = z.object({
  lessons: z.number().int().min(0).max(100),
  interviews: z.number().int().min(0).max(50),
  applications: z.number().int().min(0).max(100),
});
const Section = z.object({
  kind: z.enum(['coding', 'concepts', 'design', 'behavioural']),
  correct: z.number().int().min(0),
  total: z.number().int().min(0),
  selfScore: z.number().int().min(0).max(4).nullable(),
});
export const RoundResult = z.object({
  id: z.string().min(1), template: z.string().min(1), seed: z.number().int(), day: Day,
  score: z.number().min(0).max(100), sections: z.array(Section),
});
export const DeckCard = z.object({ id: z.string().min(1), box: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), due: Day });
export const Stage = z.enum(['wishlist', 'applied', 'screen', 'onsite', 'offer', 'rejected', 'withdrawn']);
export const Application = z.object({
  id: z.string().min(1), company: z.string().min(1).max(120), role: z.string().max(120), stage: Stage,
  applied: Day.nullable(), next: Day.nullable(), notes: z.string().max(5000), updated: Day,
});
const ResumeBullet = z.object({ id: z.string().min(1), text: z.string().max(400), projectId: z.string().nullable() });
const Resume = z.object({
  name: z.string().max(120), headline: z.string().max(200), summary: z.string().max(1200),
  bullets: z.array(ResumeBullet).max(60), skills: z.array(z.string().max(60)).max(60),
});
export const ProjectStatus = z.enum(['idea', 'building', 'shipped']);
export const CareerSchema = z.object({
  version: z.literal(1),
  pathId: z.string().nullable(),
  goals: Goals,
  activity: z.array(Activity).max(5000),
  interviews: z.array(RoundResult).max(200),
  deck: z.array(DeckCard).max(2000),
  dailyDone: z.record(Day, z.object({ code: z.boolean(), concept: z.boolean() })),
  applications: z.array(Application).max(500),
  resume: Resume,
  projects: z.record(z.string(), ProjectStatus),
});

export type CareerData = z.infer<typeof CareerSchema>;
export type Stage = z.infer<typeof Stage>;
export type Application = z.infer<typeof Application>;
export type RoundResult = z.infer<typeof RoundResult>;
export type DeckCard = z.infer<typeof DeckCard>;
export type ProjectStatus = z.infer<typeof ProjectStatus>;
export type ActivityKind = z.infer<typeof ActivityKind>;

export const emptyCareer = (): CareerData => ({
  version: 1, pathId: null, goals: { lessons: 5, interviews: 1, applications: 0 },
  activity: [], interviews: [], deck: [], dailyDone: {}, applications: [],
  resume: { name: '', headline: '', summary: '', bullets: [], skills: [] }, projects: {},
});
