import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  subLabel?: string;
  onClick: () => void;
  colorClass: string; // e.g., "bg-primary"
  delay?: number;
}

export function ActionButton({ 
  icon: Icon, 
  label, 
  subLabel, 
  onClick, 
  colorClass,
  delay = 0 
}: ActionButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full p-6 rounded-3xl shadow-lg border-b-4 border-black/10 flex flex-col items-center justify-center text-center gap-3 transition-all",
        colorClass
      )}
    >
      <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
        <Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-white font-display tracking-tight leading-tight">
          {label}
        </h3>
        {subLabel && (
          <p className="text-sm font-medium text-white/80">
            {subLabel}
          </p>
        )}
      </div>
    </motion.button>
  );
}
