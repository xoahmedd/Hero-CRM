import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  EmptyState,
  PageHeader,
  Spinner,
  secondaryButtonClass,
} from "../components/ui";
import { formatDate, formatDateTime } from "../lib/dates";
import {
  getCustomer,
  getEntityActivities,
  getProjectsByCustomer,
} from "../services/crmService";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = Number(id);

  const customerQuery = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomer(customerId),
    enabled: Number.isFinite(customerId),
  });
  const projectsQuery = useQuery({
    queryKey: ["projects", "customer", customerId],
    queryFn: () => getProjectsByCustomer(customerId),
    enabled: Number.isFinite(customerId),
  });
  const activityQuery = useQuery({
    queryKey: ["activities", "Customer", customerId],
    queryFn: () => getEntityActivities("Customer", customerId),
    enabled: Number.isFinite(customerId),
  });

  if (customerQuery.isLoading) return <Spinner />;
  if (!customerQuery.data) return <EmptyState title="Customer not found" />;

  const customer = customerQuery.data;

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={customer.company ?? "Customer account"}
        actions={
          <Link to={`/customers/${customer.id}/edit`} className={secondaryButtonClass}>
            Edit
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Details</h2>
            <Badge value={customer.status} />
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Email" value={customer.email} />
            <Row label="Phone" value={customer.phone} />
            <Row label="Address" value={customer.address} />
            <Row label="Created" value={formatDate(customer.createdAt)} />
          </dl>
          {customer.notes && (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              {customer.notes}
            </p>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold">Projects</h2>
            {(projectsQuery.data ?? []).length === 0 ? (
              <EmptyState title="No projects for this customer" />
            ) : (
              <div className="space-y-2">
                {projectsQuery.data?.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50"
                  >
                    <span>{project.name}</span>
                    <Badge value={project.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold">Activity</h2>
            {(activityQuery.data ?? []).length === 0 ? (
              <EmptyState title="No activity yet" />
            ) : (
              <div className="space-y-3">
                {activityQuery.data?.map((item) => (
                  <div key={item.id} className="border-b border-slate-100 pb-3 last:border-0">
                    <p className="text-sm font-medium">
                      {item.userName} · {item.action}
                    </p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}
