import {
  Building2,
  CalendarClock,
  CheckSquare,
  FolderKanban,
  LoaderCircle,
  Search,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { globalSearch } from "../services/searchService";
import type { GlobalSearchResponse } from "../types/search";

export default function GlobalSearchBox({
  autoFocus = false,
  onNavigate,
  placeholder = "Search CRM workspace...",
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
  placeholder?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const trimmed = query.trim();
  const total = useMemo(() => {
    if (!results) return 0;
    return (
      results.departments.length +
      results.people.length +
      results.projects.length +
      results.tasks.length +
      results.followUps.length
    );
  }, [results]);

  useEffect(() => {
    if (location.pathname === "/search") {
      const params = new URLSearchParams(location.search);
      setQuery(params.get("q") ?? "");
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!open || !trimmed) {
      setResults(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const data = await globalSearch(trimmed);
        if (!cancelled) setResults(data);
      } catch {
        if (!cancelled) setResults(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, trimmed]);

  function go(path: string) {
    setOpen(false);
    navigate(path);
    onNavigate?.();
  }

  function goFullSearch() {
    if (!trimmed) return;
    go(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={(event) => { event.preventDefault(); goFullSearch(); }}>
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
          {loading ? <LoaderCircle size={17} className="animate-spin text-blue-500" /> : <Search size={17} className="text-slate-400" />}
          <input
            autoFocus={autoFocus}
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
            onFocus={() => trimmed && setOpen(true)}
            placeholder={placeholder}
            className="ml-2 min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </form>

      {open && trimmed && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          {loading && !results ? (
            <div className="p-5 text-sm text-slate-500">Searching...</div>
          ) : results && total === 0 ? (
            <div className="p-5 text-sm text-slate-500">No results for “{trimmed}”.</div>
          ) : results ? (
            <div className="max-h-[30rem] overflow-y-auto p-2">
              <ResultGroup title="Departments">
                {results.departments.slice(0, 3).map((item) => (
                  <ResultButton key={`d-${item.id}`} icon={Building2} title={item.name} subtitle={`${item.status} · ${item.peopleCount} people`} onClick={() => go(`/departments/${item.id}`)} />
                ))}
              </ResultGroup>

              <ResultGroup title="People">
                {results.people.slice(0, 3).map((item) => (
                  <ResultButton key={`p-${item.id}`} icon={UserRound} title={item.name} subtitle={`${item.jobTitle || "Contact"} · ${item.departmentName}`} onClick={() => go(`/people/${item.id}`)} />
                ))}
              </ResultGroup>

              <ResultGroup title="Projects">
                {results.projects.slice(0, 3).map((item) => (
                  <ResultButton key={`project-${item.id}`} icon={FolderKanban} title={item.name} subtitle={`${item.status}${item.departmentName ? ` · ${item.departmentName}` : ""}`} onClick={() => go(`/projects/${item.id}`)} />
                ))}
              </ResultGroup>

              <ResultGroup title="Tasks">
                {results.tasks.slice(0, 3).map((item) => (
                  <ResultButton key={`task-${item.id}`} icon={CheckSquare} title={item.title} subtitle={`${item.status} · ${item.projectName || "Standalone task"}`} onClick={() => go(`/tasks/${item.id}`)} />
                ))}
              </ResultGroup>

              <ResultGroup title="Follow-ups">
                {results.followUps.slice(0, 3).map((item) => (
                  <ResultButton key={`followup-${item.id}`} icon={CalendarClock} title={item.title} subtitle={`${item.type} · ${item.status}`} onClick={() => go(`/follow-ups?focus=${item.id}`)} />
                ))}
              </ResultGroup>
            </div>
          ) : null}

          <button type="button" onClick={goFullSearch} className="w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50">
            View all search results
          </button>
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const childArray = Array.isArray(children) ? children : [children];
  const hasItems = childArray.some(Boolean);
  if (!hasItems) return null;

  return (
    <div className="mb-2 last:mb-0">
      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</div>
      {children}
    </div>
  );
}

function ResultButton({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: typeof Building2;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50">
      <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Icon size={16} /></div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
        <div className="truncate text-xs text-slate-500">{subtitle}</div>
      </div>
    </button>
  );
}
