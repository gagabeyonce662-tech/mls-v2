import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchThisAreaButtonProps {
  show: boolean;
  loading: boolean;
  onClick: () => void;
}

export const SearchThisAreaButton = ({
  show,
  loading,
  onClick,
}: SearchThisAreaButtonProps) => {
  return (
    <AnimatePresence>
      {show && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          className="fixed justify-center top-24 left-1/2 z-[1000]"
        >
          <Button
            onClick={onClick}
            className="bg-white text-ds-primary shadow-2xl border border-ds-card-border hover:bg-gray-50 rounded-full px-6 py-2 flex items-center gap-2 h-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="font-bold text-sm">Search this area</span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
