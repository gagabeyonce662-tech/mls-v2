import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchThisAreaButtonProps {
  loading: boolean;
  onClick: () => void;
  visible?: boolean;
}

export const SearchThisAreaButton = ({
  loading,
  onClick,
  visible = true,
}: SearchThisAreaButtonProps) => {
  if (!visible) return null;
  return (
    <div className="absolute top-20 lg:top-8 left-0 right-0 lg:right-[380px] xl:left-[380px] z-[39] lg:z-[999] flex justify-center pointer-events-none">
      <Button
        onClick={onClick}
        disabled={loading}
        className="pointer-events-auto bg-white text-ds-primary shadow-2xl border border-ds-card-border hover:bg-gray-50 rounded-full px-4 py-1.5 lg:px-6 lg:py-2 flex items-center gap-2 h-auto disabled:opacity-70"
      >
        <span className="font-bold text-xs lg:text-sm">
          Properties in this area
        </span>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};
