import { useRoute, useLocation } from "wouter";
import { useReport } from "@/hooks/use-reports";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Map from "@/components/Map";
import { Button } from "@/components/ui/button";

export default function Tracking() {
  const [match, params] = useRoute("/tracking/:id");
  const [_, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id) : null;
  const { data: report, isLoading, error } = useReport(id);

  if (!match) {
    setLocation("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Report Not Found</h2>
        <Button onClick={() => setLocation("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-4 border-b bg-white sticky top-0 z-10 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-lg">Tracking Help</h1>
          <p className="text-xs text-muted-foreground">ID: #{report.id}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-[40vh] w-full relative">
          <Map 
            reports={[report]} 
            center={[report.lat, report.lng]} 
            zoom={16}
            interactive={false}
          />
          {/* Pulse Effect Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-32 h-32 bg-primary/20 rounded-full animate-pulse-ring absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="flex-1 bg-white p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] -mt-6 relative z-10">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-green-600 mb-4 shadow-lg shadow-green-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Help is active</h2>
            <p className="text-muted-foreground">
              Your location has been shared with our emergency response team. Stay where you are.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
              <span className="text-muted-foreground text-sm">Status</span>
              <span className="font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                {report.status}
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Type</p>
                <p className="font-medium text-lg capitalize">{report.type.replace('_', ' ')}</p>
              </div>
              
              {report.description && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Details</p>
                  <p className="text-sm text-foreground/80">{report.description}</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            This tracking link will remain active for 1 hour.
          </p>
        </div>
      </div>
    </div>
  );
}
