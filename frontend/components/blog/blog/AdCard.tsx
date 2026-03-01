import React from "react";
import { ExternalLink } from "lucide-react";

interface AdCardProps {
  title: string;
  description: string;
  buttonText: string;
  image?: string;
  color: string;
}

const AdCard: React.FC<AdCardProps> = ({
  title,
  description,
  buttonText,
  image,
  color,
}) => {
  return (
    <div
      className={`${color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300`}
    >
      {image && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img src={image} alt={title} className="w-full h-32 object-cover" />
        </div>
      )}

      <div className="text-xs uppercase tracking-wider mb-2 opacity-80">
        Sponsored
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      <p className="text-sm mb-4 opacity-90 leading-relaxed">{description}</p>

      <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2">
        <span>{buttonText}</span>
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AdCard;
