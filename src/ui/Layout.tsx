import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import CareerBanner from '../pages/career/CareerBanner';
import { useStore } from '../engine/store';
import { levelForXp } from '../engine/xp';
import { currentStreak, dayKey } from '../engine/streak';
import { dueItems } from '../engine/review';
import { Banner } from './Banner';

const tab = ({ isActive }: { isActive: boolean }) => (isActive ? 'tab active' : 'tab');

export function Layout() {
  const p = useStore((s) => s.progress);
  const today = dayKey(new Date());
  const lv = levelForXp(p.xp);
  const due = dueItems(p.review, today).length;
  const { pathname } = useLocation();
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <header className="topbar">
        <div className="topbar-in">
          <Link to="/" className="brand" aria-label="Nalanda home">nalanda<span className="brand-dot" aria-hidden="true" /></Link>
          <nav className="tabs" aria-label="Main">
            <NavLink to="/" end className={tab}>Worlds</NavLink>
            <NavLink to="/review" className={tab}>Review pond{due > 0 ? <span className="count">{due}<span className="sr-only"> due</span></span> : null}</NavLink>
            <NavLink to="/progress" className={tab}>Progress</NavLink>
            <NavLink to="/career" className={({ isActive }) => tab({ isActive: isActive || pathname.startsWith('/projects') })}>Career</NavLink>
            <NavLink to="/playground" className={tab}>Playground</NavLink>
          </nav>
          <div className="stats" aria-label="Your stats">
            <span className="stat stat-level" title={`${lv.intoLevel} of ${lv.needed} XP toward level ${lv.level + 1}`}>
              Level {lv.level}
              <progress max={lv.needed} value={lv.intoLevel} aria-label={`XP toward level ${lv.level + 1}`} />
            </span>
            <span className="stat">{p.xp} XP</span>
            <span className="stat">Streak {currentStreak(p.streak, today)}</span>
          </div>
        </div>
      </header>
      <Banner />
      {/^\/(career|projects)/.test(pathname) ? <CareerBanner /> : null}
      <main id="main" className="page" tabIndex={-1}><Outlet /></main>
      <footer className="site-footer">
        <p>Java runs in your browser with <a href="https://cheerpj.com" rel="noopener">CheerpJ</a> by Leaning Technologies.</p>
      </footer>
    </>
  );
}
