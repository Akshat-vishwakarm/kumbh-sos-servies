import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ReportInput, type ReportUpdateInput } from "@shared/routes";
import { z } from "zod";

// ============================================
// REPORT HOOKS
// ============================================

export function useReports(filters?: { status?: "active" | "resolved" | "expired"; type?: string }) {
  const queryKey = [api.reports.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      let url = api.reports.list.path;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.status) params.append("status", filters.status);
        if (filters.type) params.append("type", filters.type);
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch reports');
      return api.reports.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Poll every 5s for dashboard updates
  });
}

export function useReport(id: number | null) {
  return useQuery({
    queryKey: [api.reports.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.reports.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch report');
      return api.reports.get.responses[200].parse(await res.json());
    },
    refetchInterval: (query) => {
      // Poll active reports frequently for location updates
      const data = query.state.data;
      if (data && data.status === 'active') return 5000;
      return false;
    }
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ReportInput) => {
      // Validate with schema first
      const validated = api.reports.create.input.parse(data);
      
      const res = await fetch(api.reports.create.path, {
        method: api.reports.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Try to parse error schema
        try {
          const parsedError = api.reports.create.responses[400].parse(errorData);
          throw new Error(parsedError.message);
        } catch (e) {
          throw new Error('Failed to create report');
        }
      }
      return api.reports.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.reports.list.path] }),
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & ReportUpdateInput) => {
      const validated = api.reports.update.input.parse(updates);
      const url = buildUrl(api.reports.update.path, { id });
      
      const res = await fetch(url, {
        method: api.reports.update.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error('Report not found');
        throw new Error('Failed to update report');
      }
      return api.reports.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.reports.get.path, variables.id] });
    },
  });
}
