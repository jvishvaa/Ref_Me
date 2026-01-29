"use client";

import { motion, AnimatePresence } from "framer-motion";

type ToastProps = {
  message: string;
  type: "success" | "error";
  show: boolean;
};

export default function Toast({ message, type, show }: ToastProps) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    error: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 10,
            scale: 0.98,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`
            fixed z-50
            bottom-4 left-1/2 -translate-x-1/2
            sm:top-5 sm:right-5 sm:left-auto sm:translate-x-0
            w-[calc(100%-2rem)] sm:w-auto
            max-w-md
            px-4 py-3
            rounded-xl
            shadow-lg
            text-sm font-medium
            ${styles[type]}
          `}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
