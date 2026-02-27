import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchThisAreaButtonProps {
  loading: boolean;
  onClick: () => void;
}

export const SearchThisAreaButton = ({
  loading,
  onClick,
}: SearchThisAreaButtonProps) => {
  return (
    <div
      className="absolute top-8 left-0 right-0 lg:right-[380px] xl:left-[380px] z-[1000] flex justify-center pointer-events-none"
    >
      <Button
        onClick={onClick}
        disabled={loading}
        className="pointer-events-auto bg-white text-ds-primary shadow-2xl border border-ds-card-border hover:bg-gray-50 rounded-full px-6 py-2 flex items-center gap-2 h-auto disabled:opacity-70"
      >
        <span className="font-bold text-sm">Properties in this area</span>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};
