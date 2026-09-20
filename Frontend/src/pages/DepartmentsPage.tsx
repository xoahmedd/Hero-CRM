import {
  Building2,
  Mail,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState, ErrorState, LoadingState } from "../components/FeedbackState";
import { deleteDepartment, getDepartmentsPaged } from "../services/departmentService";
import type { Department } from "../types/department";

const STATUSES = ["Active", "Inactive"];

function statusClasses(status: string) {
  return status.toLowerCase() === "active"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-slate-100 text-slate-600";
}

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDepartmentsPaged({
          page,
          pageSize: 10,
          search: search.trim() || undefined,
          status: status || undefined,
        });
        setDepartments(data.items);
        setTotalItems(data.totalItems);
        setTotalPages(data.totalPages);
      } catch {
        setError("Unable to load departments.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [page, search, status, reloadKey]);

  async function handleDelete(department: Department) {
    if (!window.confirm(`Delete department "${department.name}"? Linked projects will keep working but the department link will be cleared.`)) {
      return;
    }

    try {
      setDeletingId(department.id);
      await deleteDepartment(department.id);
      setReloadKey((value) => value + 1);
    } catch (requestError: any) {
      alert(requestError?.response?.data?.message || "Unable to delete department.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Departments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Departments connected to your people, projects and ongoing work.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/departments/new")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} /> New Department
        </button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(240px,1fr)_170px_auto]">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search department or contact..."
            className="ml-2 w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <div className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600">
          {totalItems} department{totalItems === 1 ? "" : "s"}
        </div>
      </div>

      {error && <ErrorState description={error} onRetry={() => setReloadKey((value) => value + 1)} />}

      {loading ? (
        <LoadingState label="Loading departments..." />
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="Create the first internal department, or change the current filters."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {departments.map((department) => (
            <article key={department.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <button type="button" onClick={() => navigate(`/departments/${department.id}`)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Building2 size={21} /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold text-slate-900 hover:text-blue-600">{department.name}</h2>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(department.status)}`}>
                          {department.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">Owner: {department.ownerName || "Unassigned"}</p>
                    </div>
                  </div>
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => navigate(`/departments/${department.id}/edit`)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Edit</button>
                  <button
                    type="button"
                    disabled={deletingId === department.id}
                    onClick={() => void handleDelete(department)}
                    className="rounded-xl border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    aria-label={`Delete ${department.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
                <div className="flex items-center gap-2"><Mail size={16} className="text-slate-400" /><span className="truncate">{department.email || "No department email"}</span></div>
                <div className="flex items-center gap-2"><UsersRound size={16} className="text-slate-400" />{department.peopleCount} contact{department.peopleCount === 1 ? "" : "s"}</div>
                <div className="flex items-center gap-2"><Building2 size={16} className="text-slate-400" />{department.projectCount} linked project{department.projectCount === 1 ? "" : "s"}</div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 px-3 py-2 font-medium disabled:opacity-40">Previous</button>
          <span className="text-slate-500">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 px-3 py-2 font-medium disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
