import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { PowerBIProjects } from './pages/PowerBIProjects';
import { FigmaProjects } from './pages/FigmaProjects';
import { AIProjects } from './pages/AIProjects';
import { Header } from './components/ui/Header';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen font-sans selection:bg-secondary/30 selection:text-white bg-dark">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/power-bi-projects" element={<PowerBIProjects />} />
          <Route path="/figma-projects" element={<FigmaProjects />} />
          <Route path="/ai-projects" element={<AIProjects />} />
        </Routes>

        <footer className="py-8 text-center text-gray-500 text-sm border-t border-white/5">
          <p>&copy; {new Date().getFullYear()} RDJ. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
