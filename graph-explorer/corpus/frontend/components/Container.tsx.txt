import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable container component for consistent page-width and padding.
 * Replaces repeated `max-w-[1320px] mx-auto px-4 lg:px-6 xl:px-8` wrappers.
 */
export default function Container({
  children,
  className = "",
}: ContainerProps) {
  return (
    <div
      className={`max-w-[1320px] mx-auto px-4 lg:px-6 xl:px-8 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
