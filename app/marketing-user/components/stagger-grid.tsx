"use client";

import { Children, isValidElement } from "react";
import { motion } from "framer-motion";

import { STAGGER_CONTAINER, STAGGER_ITEM } from "./motion";

/**
 * Wraps a KPI-tile grid with a subtle staggered entrance — each direct
 * child fades/rises in sequence instead of appearing all at once. Used by
 * every page's top KPI row; reduced-motion is handled once, globally, by
 * `<MotionConfig reducedMotion="user">` in marketing-user.tsx.
 */
export function StaggerGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div variants={STAGGER_CONTAINER} initial="hidden" animate="show" className={className}>
      {Children.map(children, (child) =>
        isValidElement(child) ? <motion.div variants={STAGGER_ITEM}>{child}</motion.div> : child
      )}
    </motion.div>
  );
}
