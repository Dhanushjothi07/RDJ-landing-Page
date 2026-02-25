import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Header } from './components/ui/Header';
import ScrollToTop from './components/ScrollToTop';

// Lazy load page components
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const PowerBIProjects = lazy(() => import('./pages/PowerBIProjects').then(module => ({ default: module.PowerBIProjects })));
const FigmaProjects = lazy(() => import('./pages/FigmaProjects').then(module => ({ default: module.FigmaProjects })));
const AIProjects = lazy(() => import('./pages/AIProjects').then(module => ({ default: module.AIProjects })));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-dark">
    <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen font-sans selection:bg-secondary/30 selection:text-white bg-dark">
        <Header />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/power-bi-projects" element={<PowerBIProjects />} />
            <Route path="/figma-projects" element={<FigmaProjects />} />
            <Route path="/ai-projects" element={<AIProjects />} />
          </Routes>
        </Suspense>

        <footer className="py-8 text-center text-gray-500 text-sm border-t border-white/5">
          <p>&copy; {new Date().getFullYear()} RDJ. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
