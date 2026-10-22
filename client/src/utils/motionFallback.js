/**
 * motionFallback - Fallback components and helpers for smooth animations
 * Provides lightweight fallback transitions and animation props.
 */

export const transitions = {
  spring: { type: "spring", stiffness: 300, damping: 25 },
  smooth: { duration: 0.25, ease: "easeInOut" },
  bounce: { type: "spring", stiffness: 400, damping: 15 }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const scaleUp = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: transitions.spring
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: transitions.spring
};

const motionFallback = {
  transitions,
  fadeIn,
  scaleUp,
  slideUp
};

export default motionFallback;
