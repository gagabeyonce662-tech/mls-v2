"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  text?: string;
  maxChars?: number;
}

export default function OverviewExcerpt({ text = "", maxChars = 320 }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!text)
    return (
      <p className="text-ds-body text-sm text-gray-700">
        No description available.
      </p>
    );

  const isLong = text.length > maxChars;

  return (
    <div className="relative">
      <motion.div
        animate={{ height: "auto" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative overflow-hidden"
      >
        <p
          className={`text-ds-body leading-relaxed ${!expanded && isLong ? "line-clamp-4" : ""}`}
        >
          {text}
        </p>

        {!expanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </motion.div>

      {isLong && (
        <button
          onClick={() => setExpanded((s) => !s)}
          className="mt-2 inline-flex items-center text-sm font-medium text-ds-primary hover:underline focus:outline-none"
          aria-expanded={expanded}
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}
