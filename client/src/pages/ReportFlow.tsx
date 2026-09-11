import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useCreateReport } from "@/hooks/use-reports";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Loader2, MapPin, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { REPORT_TYPES } from "@shared/schema";

export default function ReportFlow() {
  const [match, params] = useRoute("/report/:type");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { location: geo, loading: geoLoading, error: geoError } = useGeolocation();
  const { mutate: createReport, isPending } = useCreateReport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    age: "",
    description: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("");
  const uploadedPhotoUrlRef = useRef<string>("");
  const [photoUploading, setPhotoUploading] = useState(false);

  const type = params?.type as typeof REPORT_TYPES[number];
  const validType = match && REPORT_TYPES.includes(type);

  useEffect(() => {
    if (match && !REPORT_TYPES.includes(type)) {
      setLocation("/");
    }
  }, [match, type, setLocation]);

  if (!validType) return null;

  const isLostPerson = type === "lost_other";

  const photoLabels: Record<string, string> = {
    medical: "Photo of patient (optional)",
    lost_self: "Your photo (optional)",
    lost_other: "Photo of missing person",
    volunteer: "Photo for reference (optional)",
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous photo
    uploadedPhotoUrlRef.current = "";
    setUploadedPhotoUrl("");

    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setPhotoUploading(true);

    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url: string = data.url;
      // Store in both ref (always current) and state (for UI)
      uploadedPhotoUrlRef.current = url;
      setUploadedPhotoUrl(url);
      console.log("[ReportFlow] Photo uploaded:", url);
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "Could not upload photo. Try again." });
      setPhotoPreview("");
      uploadedPhotoUrlRef.current = "";
    } finally {
      setPhotoUploading(false);
    }
  };

  const clearPhoto = () => {
    setPhotoPreview("");
    setUploadedPhotoUrl("");
    uploadedPhotoUrlRef.current = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (geoError) {
      toast({ variant: "destructive", title: "Location Required", description: "Please enable location services to submit a report." });
      return;
    }
    if (!geo) {
      toast({ variant: "destructive", title: "Waiting for Location", description: "Still detecting your location. Please wait..." });
      return;
    }
    if (photoUploading) {
      toast({ variant: "destructive", title: "Photo uploading", description: "Please wait for the photo to finish uploading." });
      return;
    }

    createReport(
      {
        type,
        lat: geo.lat,
        lng: geo.lng,
        name: formData.name || undefined,
        mobile: formData.mobile || undefined,
        description: formData.description || undefined,
        photoUrl: uploadedPhotoUrlRef.current || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
      },
      {
        onSuccess: (data) => setLocation(`/tracking/${data.id}`),
        onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message }),
      }
    );
  };

  const titles: Record<string, string> = {
    medical: "Medical Help",
    lost_self: "I am Lost",
    lost_other: "Report Missing Person",
    volunteer: "Request Volunteer",
  };

  const accentColor = {
    medical: "bg-red-500 hover:bg-red-600 shadow-red-500/25",
    lost_self: "bg-purple-500 hover:bg-purple-600 shadow-purple-500/25",
    lost_other: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25",
    volunteer: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25",
  }[type];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 flex items-center gap-4 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-display font-bold text-xl">{titles[type]}</h1>
      </div>

      <div className="flex-1 p-6 max-w-lg mx-auto w-full">
        {/* Location Status */}
        <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-xl flex items-center gap-3 border border-blue-100">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            {geoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
          </div>
          <div className="text-sm">
            <p className="font-semibold">
              {geoLoading ? "Detecting location..." : geoError ? "Location failed" : "Location detected"}
            </p>
            <p className="text-blue-600/80">
              {geoLoading ? "Please wait" : geoError ? geoError : "Help will come to this spot"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo Upload — all types */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {photoLabels[type]}
              {!isLostPerson && <span className="text-muted-foreground ml-1">(optional)</span>}
            </label>
            <div
              onClick={() => !photoUploading && fileInputRef.current?.click()}
              className={`aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 overflow-hidden relative transition-colors ${
                photoPreview ? "border-transparent" : "bg-muted border-muted-foreground/20 hover:bg-muted/70 cursor-pointer"
              }`}
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
                  {photoUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                  {!photoUploading && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearPhoto(); }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">Tap to take / upload photo</span>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoSelect}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{isLostPerson ? "Missing person's name" : "Your Name"} <span className="text-muted-foreground">(optional)</span></label>
              <Input
                placeholder="Enter name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="h-12 rounded-xl"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mobile Number</label>
              <Input
                type="tel"
                placeholder="10-digit number"
                value={formData.mobile}
                onChange={e => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                className="h-12 rounded-xl"
                data-testid="input-mobile"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Age <span className="text-muted-foreground">(optional)</span></label>
              <Input
                type="number"
                placeholder="Approximate age"
                value={formData.age}
                onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
                className="h-12 rounded-xl"
                data-testid="input-age"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Details</label>
              <Textarea
                placeholder={isLostPerson ? "Clothes description, last seen location, any marks..." : "Describe the emergency..."}
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px] rounded-xl resize-none"
                data-testid="input-description"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending || geoLoading || !!geoError || photoUploading}
            className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg mt-2 ${accentColor}`}
            data-testid="button-submit"
          >
            {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Request Help Now"}
          </Button>
        </form>
      </div>
    </div>
  );
}
