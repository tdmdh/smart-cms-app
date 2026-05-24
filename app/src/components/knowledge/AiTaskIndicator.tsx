'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { AiTask } from '@/src/hooks/useAiTaskTracker';

interface AiTaskIndicatorProps {
  tasks: AiTask[];
}

const ENTER = { opacity: 0, y: -6, scale: 0.97 };
const ANIMATE = { opacity: 1, y: 0, scale: 1 };
const EXIT = { opacity: 0, y: -4, scale: 0.97 };
const TRANSITION = { duration: 0.2, ease: 'easeOut' } as const;

export default function AiTaskIndicator({ tasks }: AiTaskIndicatorProps) {
  const current = tasks[tasks.length - 1] ?? null;

  return (
    <AnimatePresence mode="wait">
      {current ? (
        <motion.div
          key={current.id}
          className="ai-task-indicator"
          initial={ENTER}
          animate={ANIMATE}
          exit={EXIT}
          transition={TRANSITION}
        >
          <Loader2 size={12} className="animate-spin ai-task-indicator__icon" />
          <span className="ai-task-indicator__label">{current.label}</span>
        </motion.div>
      ) : (
        <motion.div
          key="idle"
          className="ai-task-indicator ai-task-indicator--idle"
          initial={ENTER}
          animate={ANIMATE}
          exit={EXIT}
          transition={TRANSITION}
        >
          <span className="ai-task-indicator__dot" aria-hidden />
          { /*<span className="ai-task-indicator__label">Idle</span>*/}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
