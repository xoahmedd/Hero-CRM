import {
  Building2,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../providers/AuthProvider";
import {
  deleteCustomer,
  getCustomersPaged,
} from "../services/customerService";
import type { Customer } from "../types/customer";

const CUSTOMER_STATUSES = ["Lead", "Active", "Inactive"];

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

export default function CustomersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canDelete =
    user?.roles.some((role) => role === "Admin" || role === "Manager") ??
    false;

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCustomersPaged({
          page,
          pageSize: 10,
          search: search.trim() || undefined,
          status: status || undefined,
        });

        setCustomers(data.items);
        setTotalItems(data.totalItems);
        setTotalPages(data.totalPages);
      } catch {
        setError("Unable to load customers.");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [page, search, status]);

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(
      `Delete customer \"${customer.name}\"? Projects linked to this customer will remain, but their customer will be cleared.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(customer.id);
      await deleteCustomer(customer.id);

      setCustomers((current) =>
        current.filter((item) => item.id !== customer.id)
      );
      setTotalItems((current) => Math.max(0, current - 1));
    } catch (requestError: any) {
      if (requestError?.response?.status === 403) {
        alert("You don't have permission to delete customers.");
      } else {
        alert(
          requestError?.response?.data?.message ||
            "Unable to delete customer."
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Customers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage leads, customers and the projects connected to them.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/customers/new")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          New Customer
        </button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_190px_auto]">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, phone or company..."
            className="ml-2 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="">All statuses</option>
          {CUSTOMER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600">
          {totalItems} customer{totalItems === 1 ? "" : "s"}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading customers...
        </div>
      )}

      {!loading && customers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <UserRound size={42} className="mx-auto text-slate-300" />
          <h2 className="mt-4 font-semibold text-slate-900">
            No customers found
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Try another filter or create your first customer.
          </p>
        </div>
      )}

      {!loading && customers.length > 0 && (
        <div className="space-y-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <Building2 size={21} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold text-slate-900 hover:text-blue-600">
                          {customer.name}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                            customer.status
                          )}`}
                        >
                          {customer.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {customer.company || "No company"}
                      </p>
                    </div>
                  </div>
                </button>

                <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2 lg:min-w-[460px]">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="shrink-0 text-slate-400" />
                    <span className="truncate">
                      {customer.email || "No email"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="shrink-0 text-slate-400" />
                    <span>{customer.phone || "No phone"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/customers/${customer.id}/edit`)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Edit
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      disabled={deletingId === customer.id}
                      onClick={() => handleDelete(customer)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {deletingId === customer.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
