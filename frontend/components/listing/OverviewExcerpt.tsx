// components/listing/OverviewExcerpt.tsx
"use client";

import React, { useState } from "react";

interface Props {
  text?: string;
  maxChars?: number;
}

export default function OverviewExcerpt({ text = "", maxChars = 320 }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return <p className="text-ds-body text-sm text-gray-700">No description available.</p>;

  const isLong = text.length > maxChars;
  const shown = expanded || !isLong ? text : text.slice(0, maxChars).trimEnd() + "...";

  return (
    <div>
      <p className="text-ds-body leading-relaxed">{shown}</p>
      {isLong && (
        <button
          onClick={() => setExpanded((s) => !s)}
          className="mt-2 inline-flex items-center text-sm font-medium text-ds-primary hover:underline"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}
