import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FolderKanban,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../providers/AuthProvider";
import {
  deleteCustomer,
  getCustomer,
} from "../services/customerService";
import { getProjectsByCustomer } from "../services/projectService";
import type { Customer } from "../types/customer";
import type { Project } from "../types/project";

function statusClasses(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "inactive":
      return "bg-slate-100 text-slate-600";
    case "lead":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-violet-50 text-violet-700";
  }
}

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const customerId = Number(id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete =
    user?.roles.some((role) => role === "Admin" || role === "Manager") ??
    false;

  useEffect(() => {
    if (!Number.isFinite(customerId) || customerId <= 0) {
      setError("Invalid customer ID.");
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [customerData, projectData] = await Promise.all([
          getCustomer(customerId),
          getProjectsByCustomer(customerId),
        ]);

        setCustomer(customerData);
        setProjects(projectData);
      } catch (requestError: any) {
        setError(
          requestError?.response?.data?.message ||
            "Unable to load customer."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [customerId]);

  async function handleDelete() {
    if (!customer) return;

    const confirmed = window.confirm(
      `Delete customer \"${customer.name}\"? Projects will not be deleted; their customer reference will be cleared.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteCustomer(customer.id);
      navigate("/customers");
    } catch (requestError: any) {
      alert(
        requestError?.response?.data?.message ||
          "Unable to delete customer."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Loading customer...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/customers")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Customers
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Customer not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/customers")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={17} />
        Back to Customers
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Building2 size={26} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {customer.name}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                    customer.status
                  )}`}
                >
                  {customer.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {customer.company || "Customer account"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(`/customers/${customer.id}/edit`)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={17} />
              Edit
            </button>

            {canDelete && (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={17} />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Contact Information
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Mail size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Email
                </div>
                <div className="mt-1 break-all font-medium text-slate-700">
                  {customer.email || "No email"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Phone
                </div>
                <div className="mt-1 font-medium text-slate-700">
                  {customer.phone || "No phone"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Address
                </div>
                <div className="mt-1 font-medium leading-6 text-slate-700">
                  {customer.address || "No address"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays
                size={18}
                className="mt-0.5 shrink-0 text-slate-400"
              />
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Created
                </div>
                <div className="mt-1 font-medium text-slate-700">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Projects
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Projects currently connected to this customer.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {projects.length}
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <FolderKanban size={34} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                No projects for this customer yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">
                      {project.name}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Owner: {project.ownerName || "Unknown"}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                      {project.priority}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                      {project.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
          {customer.notes || "No notes have been added for this customer."}
        </p>
      </section>
    </div>
  );
}
