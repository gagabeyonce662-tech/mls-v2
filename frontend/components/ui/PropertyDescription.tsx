"use client";

interface PropertyDescriptionProps {
  description: string;
}

export function PropertyDescription({ description }: PropertyDescriptionProps) {
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
        {description}
      </p>
    </div>
  );
}

