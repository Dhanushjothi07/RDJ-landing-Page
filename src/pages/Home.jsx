import { Suspense, lazy, useEffect } from 'react';
const Hero = lazy(() => import('../components/Hero').then(module => ({ default: module.Hero })));
const Benefits = lazy(() => import('../components/Benefits').then(module => ({ default: module.Benefits })));
const Projects = lazy(() => import('../components/Projects').then(module => ({ default: module.Projects })));
const Testimonials = lazy(() => import('../components/Testimonials').then(module => ({ default: module.Testimonials })));
const Contact = lazy(() => import('../components/Contact').then(module => ({ default: module.Contact })));
import { useLocation } from 'react-router-dom';
import { smoothScrollTo } from '../utils/smoothScroll';

export const Home = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.state?.scrollTo) {
            // Short delay to ensure page is loaded
            setTimeout(() => {
                smoothScrollTo(location.state.scrollTo, 1200);
            }, 100);
        }
    }, [location]);

    // Common section loader
    const SectionLoader = () => (
        <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <>
            <Suspense fallback={<div className="min-h-screen bg-dark" />}>
                <Hero />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <Benefits />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <Projects />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <Testimonials />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <Contact />
            </Suspense>
        </>
    );
};
