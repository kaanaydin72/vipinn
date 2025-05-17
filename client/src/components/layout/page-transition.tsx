import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  location: string;
}

export default function PageTransition({ children, location }: PageTransitionProps) {
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    if (transitionStage === 'fadeOut') {
      setTransitionStage('fadeIn');
      setDisplayLocation(location);
    }
  };

  return (
    <div
      className={`transition-wrapper ${transitionStage}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={displayLocation}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function withPageTransition<T extends object>(Component: React.ComponentType<T>) {
  return function WithPageTransition(props: T) {
    const [location] = useLocation();
    
    return (
      <PageTransition location={location}>
        <Component {...props} />
      </PageTransition>
    );
  };
}