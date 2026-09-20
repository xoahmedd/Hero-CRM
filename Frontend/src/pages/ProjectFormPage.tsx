import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ErrorBanner,
  PageHeader,
  Spinner,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../components/ui";
import { PRIORITIES, PROJECT_STATUSES } from "../lib/constants";
import { toDateInput, toIsoDate } from "../lib/dates";
import { getErrorMessage } from "../lib/errors";
import { useAuth } from "../providers/AuthProvider";
import {
  createProject,
  getCustomers,
  getProject,
  getUsers,
  updateProject,
} from "../services/crmService";
import type { ProjectPayload } from "../types/crm";

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const projectId = id ? Number(id) : undefined;

  const [form, setForm] = useState<ProjectPayload>({
    name: "",
    description: "",
    status: "Planning",
    priority: "Medium",
    startDate: undefined,
    dueDate: undefined,
    customerId: undefined,
    ownerId: user?.userId ?? 0,
  });

  const existing = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId!),
    enabled: Boolean(projectId),
  });
  const customersQuery = useQuery({ queryKey: ["customers-all"], queryFn: getCustomers });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: getUsers });

  useEffect(() => {
    if (user && !projectId) {
      setForm((current) => ({ ...current, ownerId: user.userId }));
    }
  }, [user, projectId]);

  useEffect(() => {
    if (!existing.data) return;
    setForm({
      name: existing.data.name,
      description: existing.data.description ?? "",
      status: existing.data.status,
      priority: existing.data.priority,
      startDate: existing.data.startDate ?? undefined,
      dueDate: existing.data.dueDate ?? undefined,
      customerId: existing.data.customerId ?? undefined,
      ownerId: existing.data.ownerId,
    });
  }, [existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: ProjectPayload = {
        ...form,
        description: form.description || undefined,
        startDate: form.startDate ? toIsoDate(toDateInput(form.startDate) || form.startDate) : undefined,
        dueDate: form.dueDate ? toIsoDate(toDateInput(form.dueDate) || form.dueDate) : undefined,
        customerId: form.customerId || undefined,
      };
      if (projectId) {
        await updateProject(projectId, payload);
        return projectId;
      }
      const created = await createProject(payload);
      return created.id;
    },
    onSuccess: (savedId) => navigate(`/projects/${savedId}`),
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  if (projectId && existing.isLoading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={projectId ? "Edit project" : "New project"} />
      {save.isError && <ErrorBanner message={getErrorMessage(save.error)} />}

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className={labelClass}>Name</label>
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className={`${inputClass} min-h-24`}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              className={inputClass}
            >
              {PROJECT_STATUSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
              className={inputClass}
            >
              {PRIORITIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Start date</label>
            <input
              type="date"
              value={toDateInput(form.startDate)}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Due date</label>
            <input
              type="date"
              value={toDateInput(form.dueDate)}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Customer</label>
          <select
            value={form.customerId ?? ""}
            onChange={(event) =>
              setForm({
                ...form,
                customerId: event.target.value ? Number(event.target.value) : undefined,
              })
            }
            className={inputClass}
          >
            <option value="">No customer</option>
            {customersQuery.data?.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Owner</label>
          <select
            required
            value={form.ownerId || ""}
            onChange={(event) => setForm({ ...form, ownerId: Number(event.target.value) })}
            className={inputClass}
          >
            <option value="">Select owner</option>
            {usersQuery.data?.map((item) => (
              <option key={item.userId} value={item.userId}>
                {item.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={save.isPending} className={primaryButtonClass}>
            {save.isPending ? "Saving..." : "Save"}
          </button>
          <Link to={projectId ? `/projects/${projectId}` : "/projects"} className={secondaryButtonClass}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
