import type { Application, Stage } from './schema';

export const STAGES: Stage[] = ['wishlist', 'applied', 'screen', 'onsite', 'offer', 'rejected', 'withdrawn'];
export const STAGE_LABEL: Record<Stage, string> = {
  wishlist: 'Wishlist', applied: 'Applied', screen: 'Recruiter or phone screen', onsite: 'Onsite or final loop',
  offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn',
};
const RANK: Record<Stage, number> = { wishlist: 0, applied: 1, rejected: 1, withdrawn: 1, screen: 2, onsite: 3, offer: 4 };

export function funnel(apps: Application[]) {
  const reached = (r: number) => apps.filter((a) => RANK[a.stage] >= r).length;
  const applied = reached(1), screen = reached(2);
  return { applied, screen, onsite: reached(3), offer: reached(4), responseRate: applied ? Math.round((screen / applied) * 100) : 0 };
}

export const upcoming = (apps: Application[], today: string): Application[] =>
  apps.filter((a) => a.next !== null && a.next >= today).sort((a, b) => a.next!.localeCompare(b.next!));
