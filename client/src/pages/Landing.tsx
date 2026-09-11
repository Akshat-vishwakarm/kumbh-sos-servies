import { useLocation } from "wouter";
import { ActionButton } from "@/components/ui/action-button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { HeartPulse, User, Users, HandHeart, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-warning/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <header className="px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
             <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl leading-none">Kumbh Mela</h1>
            <p className="text-xs text-muted-foreground font-medium">Emergency Response</p>
          </div>
        </div>
        <LanguageSelector />
      </header>

      {/* Main Actions */}
      <main className="flex-1 px-6 pb-8 flex flex-col z-10">
        <div className="my-8">
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">
            What is your <br /> emergency?
          </h2>
          <p className="text-muted-foreground">Tap the button that matches your situation.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          <ActionButton
            icon={HeartPulse}
            label="Medical Emergency"
            subLabel="Ambulance & First Aid"
            colorClass="bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/25"
            onClick={() => setLocation("/report/medical")}
            delay={0.1}
          />
          
          <ActionButton
            icon={User}
            label="I am Lost"
            subLabel="Help me find my group"
            colorClass="bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/25"
            onClick={() => setLocation("/report/lost_self")}
            delay={0.2}
          />

          <ActionButton
            icon={Users}
            label="Lost Someone"
            subLabel="Find a missing person"
            colorClass="bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/25 text-amber-950"
            onClick={() => setLocation("/report/lost_other")}
            delay={0.3}
          />

          <ActionButton
            icon={HandHeart}
            label="Need a Volunteer"
            subLabel="General assistance"
            colorClass="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25"
            onClick={() => setLocation("/report/volunteer")}
            delay={0.4}
          />
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setLocation("/login")}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors underline decoration-2 decoration-transparent hover:decoration-primary/30 underline-offset-4"
          >
            Volunteer / Staff Login
          </button>
        </div>
      </main>
    </div>
  );
}
