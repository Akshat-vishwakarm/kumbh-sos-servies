import { useState } from "react";
import { useReports, useUpdateReport } from "@/hooks/use-reports";
import { useLogout } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Map from "@/components/Map";
import { Button } from "@/components/ui/button";
import { LogOut, Filter, RefreshCw, Download, FileText, Sheet, CheckCircle2, Loader2, Phone, User, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Report } from "@shared/schema";

function downloadAllCSV(reports: Report[]) {
  const headers = ["ID", "Type", "Name", "Mobile", "Age", "Description", "Latitude", "Longitude", "Status", "Reported At"];
  const rows = reports.map(r => [
    r.id,
    r.type.replace("_", " ").toUpperCase(),
    r.name || "-",
    r.mobile || "-",
    r.age ?? "-",
    (r.description || "-").replace(/,/g, ";"),
    r.lat,
    r.lng,
    r.status.toUpperCase(),
    new Date(r.createdAt).toLocaleString(),
  ]);
  const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kumbh-mela-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildPDFHtml(reports: Report[], title: string) {
  const typeColors: Record<string, string> = {
    medical: "#ef4444", lost_self: "#a855f7", lost_other: "#f59e0b", volunteer: "#10b981",
  };
  const rows = reports.map(r => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 8px;font-weight:600;color:#6b7280;">#${r.id}</td>
      <td style="padding:10px 8px;">
        <span style="background:${typeColors[r.type]}22;color:${typeColors[r.type]};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.05em;">
          ${r.type.replace("_", " ").toUpperCase()}
        </span>
      </td>
      <td style="padding:10px 8px;">${r.name || "-"}</td>
      <td style="padding:10px 8px;">${r.mobile || "-"}</td>
      <td style="padding:10px 8px;">${r.age ?? "-"}</td>
      <td style="padding:10px 8px;font-size:12px;color:#6b7280;max-width:180px;">${r.description || "-"}</td>
      <td style="padding:10px 8px;font-family:monospace;font-size:11px;">${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}</td>
      <td style="padding:10px 8px;font-size:12px;color:#6b7280;">${new Date(r.createdAt).toLocaleString()}</td>
    </tr>
  `).join("");

  const counts = { medical: 0, lost_self: 0, lost_other: 0, volunteer: 0 };
  reports.forEach(r => { if (r.type in counts) counts[r.type as keyof typeof counts]++; });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>${title}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;color:#111827;padding:32px;}@media print{body{padding:16px;}}</style>
    </head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e5e7eb;">
      <div>
        <h1 style="font-size:22px;font-weight:800;">${title}</h1>
        <p style="color:#6b7280;margin-top:4px;font-size:13px;">Generated: ${new Date().toLocaleString()}</p>
      </div>
      <div style="text-align:right;">
        <div style="font-size:28px;font-weight:800;color:#ef4444;">${reports.length}</div>
        <div style="font-size:12px;color:#6b7280;font-weight:600;">TOTAL ALERTS</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;">
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#ef4444;">${counts.medical}</div>
        <div style="font-size:11px;color:#ef4444;font-weight:700;">MEDICAL</div>
      </div>
      <div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#a855f7;">${counts.lost_self}</div>
        <div style="font-size:11px;color:#a855f7;font-weight:700;">LOST SELF</div>
      </div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#f59e0b;">${counts.lost_other}</div>
        <div style="font-size:11px;color:#f59e0b;font-weight:700;">LOST OTHER</div>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#10b981;">${counts.volunteer}</div>
        <div style="font-size:11px;color:#10b981;font-weight:700;">VOLUNTEER</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:#f9fafb;">
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">ID</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Type</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Name</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Mobile</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Age</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Description</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Location</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Reported At</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;">
      Kumbh Mela Unified Emergency &amp; Volunteer Assistance System &mdash; Confidential
    </div>
  </body></html>`;
}

function downloadAllPDF(reports: Report[]) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(buildPDFHtml(reports, "Kumbh Mela — Active Alerts Report"));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

function downloadSinglePDF(report: Report) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(buildPDFHtml([report], `Alert #${report.id} — ${report.type.replace("_", " ").toUpperCase()}`));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

const TYPE_STYLES: Record<string, { label: string; badge: string; border: string; solveBtn: string; photoBorder: string }> = {
  medical:    { label: "Medical",    badge: "bg-red-100 text-red-700",        border: "border-red-200",    solveBtn: "bg-red-500 hover:bg-red-600 text-white",     photoBorder: "ring-red-300" },
  lost_self:  { label: "Lost Self",  badge: "bg-purple-100 text-purple-700",  border: "border-purple-200", solveBtn: "bg-purple-500 hover:bg-purple-600 text-white", photoBorder: "ring-purple-300" },
  lost_other: { label: "Lost Other", badge: "bg-amber-100 text-amber-700",    border: "border-amber-200",  solveBtn: "bg-amber-500 hover:bg-amber-600 text-white",   photoBorder: "ring-amber-300" },
  volunteer:  { label: "Volunteer",  badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-200", solveBtn: "bg-emerald-500 hover:bg-emerald-600 text-white", photoBorder: "ring-emerald-300" },
};

function AlertCard({ report, onResolve, resolving }: { report: Report; onResolve: (id: number) => void; resolving: boolean }) {
  const style = TYPE_STYLES[report.type] ?? TYPE_STYLES.medical;
  const hasPhoto = !!report.photoUrl;

  return (
    <div className={`rounded-xl border-2 bg-white shadow-sm overflow-hidden ${style.border}`} data-testid={`card-report-${report.id}`}>
      {/* Photo banner — full width if photo exists */}
      {hasPhoto && (
        <div className="w-full h-36 overflow-hidden bg-gray-100 relative">
          <img
            src={report.photoUrl!}
            alt={`Photo for report #${report.id}`}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${style.badge}`}>
              {style.label}
            </span>
          </div>
        </div>
      )}

      {/* Card Header (no photo) */}
      {!hasPhoto && (
        <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${style.badge}`}>
            {style.label}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}

      {/* Card Body */}
      <div className="px-4 py-2 space-y-1.5">
        {hasPhoto && (
          <span className="text-[11px] text-muted-foreground">
            {new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}

        {/* Name */}
        {report.name && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm font-semibold text-gray-800">{report.name}</p>
          </div>
        )}

        {/* Age */}
        {report.age != null && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm text-gray-600">Age: <span className="font-medium">{report.age}</span></p>
          </div>
        )}

        {/* Mobile */}
        {report.mobile && (
          <a
            href={`tel:${report.mobile}`}
            className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline w-fit"
            data-testid={`link-call-${report.id}`}
          >
            <Phone className="w-3.5 h-3.5 shrink-0" />
            {report.mobile}
          </a>
        )}

        {/* Description */}
        {report.description && (
          <p className="text-sm text-gray-500 line-clamp-3 pt-0.5">{report.description}</p>
        )}

        {/* Coordinates */}
        <p className="text-[11px] font-mono text-muted-foreground pt-0.5">
          #{report.id} · {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="px-3 pb-3 pt-1 flex items-center gap-2">
        <Button
          size="sm"
          className={`flex-1 h-8 text-xs font-bold rounded-lg ${style.solveBtn}`}
          onClick={() => onResolve(report.id)}
          disabled={resolving}
          data-testid={`button-resolve-${report.id}`}
        >
          {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
          Mark Solved
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 rounded-lg shrink-0"
          onClick={() => downloadSinglePDF(report)}
          title="Download as PDF"
          data-testid={`button-download-single-${report.id}`}
        >
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [resolvingIds, setResolvingIds] = useState<Set<number>>(new Set());
  const { data: reports, isLoading, refetch } = useReports({ status: "active", type: filter });
  const { mutate: updateReport } = useUpdateReport();
  const { mutate: logout } = useLogout();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => logout(undefined, { onSuccess: () => setLocation("/") });

  const handleResolve = (id: number) => {
    setResolvingIds(prev => new Set(prev).add(id));
    updateReport(
      { id, status: "resolved" },
      {
        onSuccess: () => {
          toast({ title: "Alert Resolved ✓", description: `Report #${id} marked as solved.` });
          setResolvingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed", description: "Could not resolve report." });
          setResolvingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
        },
      }
    );
  };

  const activeReports = reports || [];

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-white border-b px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
          <h1 className="font-display font-bold text-lg">Response Console</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="hidden sm:flex" data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline" size="sm"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                data-testid="button-download-report"
                disabled={isLoading || activeReports.length === 0}
              >
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Download Report</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {activeReports.length} active alert{activeReports.length !== 1 ? "s" : ""}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => downloadAllCSV(activeReports)} className="cursor-pointer" data-testid="button-download-csv">
                <Sheet className="w-4 h-4 mr-2 text-emerald-600" /> Download as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadAllPDF(activeReports)} className="cursor-pointer" data-testid="button-download-pdf">
                <FileText className="w-4 h-4 mr-2 text-red-500" /> Download as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-filter">
                <Filter className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{filter ? filter.replace("_", " ") : "All Types"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter(undefined)}>All Types</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("medical")}>Medical</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("lost_self")}>Lost Self</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("lost_other")}>Lost Other</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("volunteer")}>Volunteer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive" data-testid="button-logout">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-white border-r hidden md:flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Active Alerts</h2>
            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{activeReports.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : activeReports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-medium">All clear!</p>
                <p className="text-xs">No active alerts right now.</p>
              </div>
            ) : (
              activeReports.map(report => (
                <AlertCard key={report.id} report={report} onResolve={handleResolve} resolving={resolvingIds.has(report.id)} />
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 relative">
          <Map reports={activeReports} interactive={true} />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow-lg border md:hidden">
            <span className="text-xs font-bold">{activeReports.length} Active Alerts</span>
          </div>
        </main>
      </div>
    </div>
  );
}
