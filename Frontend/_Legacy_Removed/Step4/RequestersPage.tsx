import { Building2, Mail, Phone, Search, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState, ErrorState, LoadingState } from "../components/FeedbackState";
import { getRequesters } from "../services/departmentService";
import type { Requester } from "../types/department";

export default function RequestersPage() {
  const navigate = useNavigate();
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        setRequesters(await getRequesters({ search: search.trim() || undefined }));
      } catch {
        setError("Unable to load requesters.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, reloadKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Requesters</h1>
        <p className="mt-1 text-sm text-slate-500">
          People inside Hero departments who request IT work, report issues, or sponsor projects.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search requester, job title, email, phone or department..."
            className="ml-2 w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {error && <ErrorState description={error} onRetry={() => setReloadKey((value) => value + 1)} />}

      {loading ? (
        <LoadingState label="Loading requesters..." />
      ) : requesters.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No requesters found"
          description="Requesters are added from a Department page so each person stays connected to the correct internal department."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {requesters.map((requester) => (
              <button
                key={requester.id}
                type="button"
                onClick={() => navigate(`/departments/${requester.departmentId}`)}
                className="grid w-full gap-3 px-5 py-4 text-left hover:bg-slate-50 md:grid-cols-[minmax(220px,1fr)_minmax(200px,1fr)_minmax(180px,1fr)] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><UserRound size={18} /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-slate-900">{requester.name}</span>
                      {requester.isPrimary && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Primary</span>}
                    </div>
                    <div className="truncate text-sm text-slate-500">{requester.jobTitle || "Requester"}</div>
                  </div>
                </div>

                <div className="min-w-0 space-y-1 text-sm text-slate-500">
                  {requester.email && <div className="flex items-center gap-2"><Mail size={14} /><span className="truncate">{requester.email}</span></div>}
                  {requester.phone && <div className="flex items-center gap-2"><Phone size={14} />{requester.phone}</div>}
                  {!requester.email && !requester.phone && <span className="text-slate-400">No contact details</span>}
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Building2 size={16} className="text-slate-400" />
                  <span className="truncate">{requester.departmentName}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
