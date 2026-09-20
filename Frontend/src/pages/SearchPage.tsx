import {
  Building2,
  CheckSquare,
  FolderKanban,
  Search,
  UserRound,
  CalendarClock,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { EmptyState, ErrorState, LoadingState } from "../components/FeedbackState";
import { globalSearch } from "../services/searchService";
import type { GlobalSearchResponse } from "../types/search";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    globalSearch(query)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setError("Search could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

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

  if (!query) {
    return <EmptyState icon={Search} title="Global Search" description="Search people, departments, projects, tasks and follow-ups from the top bar." />;
  }
  if (loading) return <LoadingState label="Searching the CRM workspace..." />;
  if (error) return <ErrorState description={error} />;
  if (!results || total === 0) {
    return <EmptyState icon={Search} title="No matches found" description={`No workspace records matched “${query}”.`} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <Search size={18} /> Global Search
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Results for “{query}”</h1>
        <p className="mt-1 text-sm text-slate-500">{total} results across CRM and work management.</p>
      </div>

      <ResultSection title="Departments" icon={Building2} count={results.departments.length}>
        {results.departments.map((item) => (
          <ResultRow
            key={item.id}
            title={item.name}
            subtitle={`${item.status} · ${item.peopleCount} people${item.ownerName ? ` · owner: ${item.ownerName}` : ""}`}
            onClick={() => navigate(`/departments/${item.id}`)}
          />
        ))}
      </ResultSection>

      <ResultSection title="People" icon={UserRound} count={results.people.length}>
        {results.people.map((item) => (
          <ResultRow
            key={item.id}
            title={item.name}
            subtitle={`${item.jobTitle || "Contact"} · ${item.departmentName}${item.email ? ` · ${item.email}` : ""}`}
            onClick={() => navigate(`/people/${item.id}`)}
          />
        ))}
      </ResultSection>

      <ResultSection title="Projects" icon={FolderKanban} count={results.projects.length}>
        {results.projects.map((item) => (
          <ResultRow
            key={item.id}
            title={item.name}
            subtitle={`${item.status}${item.departmentName ? ` · ${item.departmentName}` : ""}`}
            onClick={() => navigate(`/projects/${item.id}`)}
          />
        ))}
      </ResultSection>

      <ResultSection title="Tasks" icon={CheckSquare} count={results.tasks.length}>
        {results.tasks.map((item) => (
          <ResultRow
            key={item.id}
            title={item.title}
            subtitle={`${item.status} · ${item.priority} · ${item.projectName || "Standalone task"}`}
            onClick={() => navigate(`/tasks/${item.id}`)}
          />
        ))}
      </ResultSection>

      <ResultSection title="Follow-ups" icon={CalendarClock} count={results.followUps.length}>
        {results.followUps.map((item) => {
          const target = item.contactName || item.departmentName || item.projectName || "CRM follow-up";
          return (
            <ResultRow
              key={item.id}
              title={item.title}
              subtitle={`${item.type} · ${item.status} · ${target} · ${formatDate(item.dueAt)}`}
              onClick={() => navigate(`/follow-ups?focus=${item.id}`)}
            />
          );
        })}
      </ResultSection>
    </div>
  );
}

function ResultSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: typeof Building2;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Icon size={18} className="text-blue-600" />
          {title}
        </h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{count}</span>
      </div>
      {count === 0 ? <div className="p-5 text-sm text-slate-400">No matches.</div> : <div className="divide-y divide-slate-100">{children}</div>}
    </section>
  );
}

function ResultRow({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full px-5 py-4 text-left transition hover:bg-slate-50">
      <div className="font-medium text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
    </button>
  );
}
