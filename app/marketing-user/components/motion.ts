import type { Variants } from "framer-motion";

/**
 * Shared entrance-stagger variants for KPI-tile grids across every page.
 * Reduced-motion is handled once, globally, by the `<MotionConfig
 * reducedMotion="user">` wrapper in marketing-user.tsx — not per-variant.
 */
export const STAGGER_CONTAINER: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

export const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};
