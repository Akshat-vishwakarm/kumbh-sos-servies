import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Report } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ReportStatusCardProps {
  report: Report;
}

export function ReportStatusCard({ report }: ReportStatusCardProps) {
  const isExpired = report.status === "expired";
  const isResolved = report.status === "resolved";

  return (
    <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/50">
      <div className="flex items-center gap-4 mb-6">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          isResolved ? "bg-green-100 text-green-600" :
          isExpired ? "bg-gray-100 text-gray-600" :
          "bg-blue-100 text-blue-600 animate-pulse"
        )}>
          {isResolved ? <CheckCircle2 className="w-6 h-6" /> :
           isExpired ? <Clock className="w-6 h-6" /> :
           <AlertCircle className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="text-lg font-bold">Report #{report.id}</h3>
          <p className="text-muted-foreground text-sm capitalize">{report.status}</p>
        </div>
      </div>

      <div className="space-y-4">
        {report.photoUrl && (
          <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
            <img 
              src={report.photoUrl} 
              alt="Report subject"
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-muted/50 p-3 rounded-xl">
            <span className="block text-muted-foreground text-xs mb-1">Type</span>
            <span className="font-semibold capitalize">{report.type.replace('_', ' ')}</span>
          </div>
          <div className="bg-muted/50 p-3 rounded-xl">
            <span className="block text-muted-foreground text-xs mb-1">Time</span>
            <span className="font-semibold">
              {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
