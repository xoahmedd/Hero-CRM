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
import { CUSTOMER_STATUSES } from "../lib/constants";
import { getErrorMessage } from "../lib/errors";
import { createCustomer, getCustomer, updateCustomer } from "../services/crmService";
import type { CustomerPayload } from "../types/crm";

const emptyForm: CustomerPayload = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  status: "Lead",
  notes: "",
};

export default function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customerId = id ? Number(id) : undefined;
  const [form, setForm] = useState<CustomerPayload>(emptyForm);

  const existing = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomer(customerId!),
    enabled: Boolean(customerId),
  });

  useEffect(() => {
    if (!existing.data) return;
    setForm({
      name: existing.data.name,
      email: existing.data.email ?? "",
      phone: existing.data.phone ?? "",
      company: existing.data.company ?? "",
      address: existing.data.address ?? "",
      status: existing.data.status,
      notes: existing.data.notes ?? "",
    });
  }, [existing.data]);

  const save = useMutation({
    mutationFn: async (payload: CustomerPayload) => {
      const cleaned = {
        ...payload,
        email: payload.email || undefined,
        phone: payload.phone || undefined,
        company: payload.company || undefined,
        address: payload.address || undefined,
        notes: payload.notes || undefined,
      };
      if (customerId) {
        await updateCustomer(customerId, cleaned);
        return customerId;
      }
      const created = await createCustomer(cleaned);
      return created.id;
    },
    onSuccess: (savedId) => navigate(`/customers/${savedId}`),
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate(form);
  };

  if (customerId && existing.isLoading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={customerId ? "Edit customer" : "New customer"}
        subtitle="Keep account details current"
      />

      {save.isError && <ErrorBanner message={getErrorMessage(save.error)} />}

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <Field label="Name">
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Company">
          <input
            value={form.company}
            onChange={(event) => setForm({ ...form, company: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Address">
          <input
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
            className={inputClass}
          >
            {CUSTOMER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className={`${inputClass} min-h-28`}
          />
        </Field>
        <div className="flex gap-3">
          <button type="submit" disabled={save.isPending} className={primaryButtonClass}>
            {save.isPending ? "Saving..." : "Save"}
          </button>
          <Link to={customerId ? `/customers/${customerId}` : "/customers"} className={secondaryButtonClass}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}
