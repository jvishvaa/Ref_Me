"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import * as React from "react";

type GradualTextProps = {
  text: string;
  highlight?: string;
};

export default function GradualText({ text, highlight }: GradualTextProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="flex space-x-1 justify-center">
      <AnimatePresence>
        {text.split("").map((char, i) => {
          const isHighlighted =
            highlight && text.slice(i, i + highlight.length) === highlight;

          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, x: -18 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`text-2xl font-semibold tracking-tight
                ${isHighlighted ? "text-red-500" : "text-black"}
              `}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
