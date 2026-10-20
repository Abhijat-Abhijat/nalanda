import { lazy, Suspense, type ReactNode } from 'react';
import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { Layout } from './ui/Layout';
import Home from './pages/Home';
import WorldMap from './pages/WorldMap';
import LessonPage from './pages/LessonPage';
import ExamPage from './pages/ExamPage';
import BossPage from './pages/BossPage';
import ReviewPage from './pages/ReviewPage';
import ProgressPage from './pages/ProgressPage';
import ProjectsPage from './pages/ProjectsPage';

const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage'));
const CareerHub = lazy(() => import('./pages/career/CareerHub'));
const CareerDataPage = lazy(() => import('./pages/career/CareerDataPage'));
const PathsPage = lazy(() => import('./pages/career/PathsPage'));
const PathDetailPage = lazy(() => import('./pages/career/PathDetailPage'));
const InterviewPage = lazy(() => import('./pages/career/InterviewPage'));
const InterviewRun = lazy(() => import('./pages/career/InterviewRun'));
const PortfolioPage = lazy(() => import('./pages/career/PortfolioPage'));
const DeckPage = lazy(() => import('./pages/career/DeckPage'));
const DailyPage = lazy(() => import('./pages/career/DailyPage'));
const GoalsPage = lazy(() => import('./pages/career/GoalsPage'));
const ApplicationsPage = lazy(() => import('./pages/career/ApplicationsPage'));
const ResumePage = lazy(() => import('./pages/career/ResumePage'));
const MatchPage = lazy(() => import('./pages/career/MatchPage'));
const MockInterviewPage = lazy(() => import('./pages/career/MockInterviewPage'));

const lazyPage = (el: ReactNode) => <Suspense fallback={<p>Loading…</p>}>{el}</Suspense>;

function NotFound() {
  return (
    <section className="empty">
      <h1>This page wandered off.</h1>
      <p className="muted">The address does not match any world, lesson, or page in Nalanda.</p>
      <Link className="btn primary" to="/">Back to all worlds</Link>
    </section>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/w/:worldId" element={<WorldMap />} />
          <Route path="/w/:worldId/boss" element={<BossPage />} />
          <Route path="/w/:worldId/:chapterId/exam" element={<ExamPage />} />
          <Route path="/w/:worldId/:chapterId/:lessonId" element={<LessonPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/playground" element={<Suspense fallback={<p>Loading the playground...</p>}><PlaygroundPage /></Suspense>} />
          <Route path="/career" element={lazyPage(<CareerHub />)} />
          <Route path="/career/data" element={lazyPage(<CareerDataPage />)} />
          <Route path="/career/paths" element={lazyPage(<PathsPage />)} />
          <Route path="/career/paths/:pathId" element={lazyPage(<PathDetailPage />)} />
          <Route path="/career/interview" element={lazyPage(<InterviewPage />)} />
          <Route path="/career/interview/:templateId/:seed" element={lazyPage(<InterviewRun />)} />
          <Route path="/career/portfolio" element={lazyPage(<PortfolioPage />)} />
          <Route path="/career/deck" element={lazyPage(<DeckPage />)} />
          <Route path="/career/daily" element={lazyPage(<DailyPage />)} />
          <Route path="/career/goals" element={lazyPage(<GoalsPage />)} />
          <Route path="/career/applications" element={lazyPage(<ApplicationsPage />)} />
          <Route path="/career/resume" element={lazyPage(<ResumePage />)} />
          <Route path="/career/match" element={lazyPage(<MatchPage />)} />
          <Route path="/career/mock" element={lazyPage(<MockInterviewPage />)} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
