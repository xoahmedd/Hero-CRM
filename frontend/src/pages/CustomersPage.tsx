import { useState, useEffect } from "react";
import type { Customer } from "../data/mock";
import { MOCK_CUSTOMERS, MOCK_PROJECTS } from "../data/mock";
import { customersApi, projectsApi } from "../api/services";
import { Badge, Button, Card, EmptyState, Input, Modal, Select, Table } from "../components/ui";

const STATUSES: Customer["status"][] = ["Lead", "Active", "Inactive", "Archived"];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [projectsList, setProjectsList] = useState(MOCK_PROJECTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [drawerCustomer, setDrawerCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>({ status: "Lead" });

  useEffect(() => {
    customersApi.getCustomers()
      .then((data) => { if (data && data.length > 0) setCustomers(data); })
      .catch(() => {});
    projectsApi.getProjects()
      .then((data) => { if (data && data.length > 0) setProjectsList(data); })
      .catch(() => {});
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openEdit(customer: Customer) {
    setEditCustomer(customer);
    setForm({ ...customer });
  }

  async function handleSave() {
    if (editCustomer) {
      try {
        await customersApi.updateCustomer(editCustomer.id, form);
        const updated = await customersApi.getCustomers();
        setCustomers(updated);
      } catch {
        setCustomers((prev) => prev.map((c) => (c.id === editCustomer.id ? { ...c, ...form } as Customer : c)));
      }
      setEditCustomer(null);
    } else {
      try {
        await customersApi.createCustomer({
          name: form.name ?? "",
          company: form.company ?? "",
          email: form.email ?? "",
          phone: form.phone ?? "",
          address: form.address ?? "",
          status: (form.status as Customer["status"]) ?? "Lead",
          notes: form.notes ?? "",
        });
        const updated = await customersApi.getCustomers();
        setCustomers(updated);
      } catch {
        const newCustomer: Customer = {
          id: customers.length + 1,
          name: form.name ?? "",
          company: form.company ?? "",
          email: form.email ?? "",
          phone: form.phone ?? "",
          address: form.address ?? "",
          status: (form.status as Customer["status"]) ?? "Lead",
          notes: form.notes ?? "",
        };
        setCustomers((prev) => [...prev, newCustomer]);
      }
      setShowCreate(false);
    }
    setForm({ status: "Lead" });
  }

  async function handleDelete(id: number) {
    try {
      await customersApi.deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  }

  const drawerProjects = drawerCustomer ? projectsList.filter((p) => p.customerId === drawerCustomer.id) : [];


  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-3 flex-wrap flex-1">
          <div style={{ flex: "1 1 200px" }}>
            <Input placeholder="Search customers or company…" value={search} onChange={setSearch} />
          </div>
          <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: "All", label: "All Statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
        </div>
        <Button onClick={() => { setShowCreate(true); setForm({ status: "Lead" }); }}>+ Add Customer</Button>
      </div>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState message="No customers match your search." />
        ) : (
          <Table
            columns={["Name / Company", "Contact", "Address", "Status", "Actions"]}
            rows={filtered.map((c) => [
              <div>
                <div className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>{c.name}</div>
                <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{c.company}</div>
              </div>,
              <div>
                <div className="text-sm">{c.email}</div>
                <div className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>{c.phone}</div>
              </div>,
              <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{c.address}</span>,
              <Badge label={c.status} />,
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setDrawerCustomer(c)}>Projects</Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>Delete</Button>
              </div>,
            ])}
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      {(showCreate || editCustomer) && (
        <Modal title={editCustomer ? `Edit: ${editCustomer.name}` : "Add Customer"} onClose={() => { setShowCreate(false); setEditCustomer(null); }} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Full Name</label>
                <Input value={form.name ?? ""} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Company</label>
                <Input value={form.company ?? ""} onChange={(v) => setForm((f) => ({ ...f, company: v }))} placeholder="Company name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Email</label>
                <Input type="email" value={form.email ?? ""} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="email@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Phone</label>
                <Input value={form.phone ?? ""} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+1 555-0000" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Address</label>
                <Input value={form.address ?? ""} onChange={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="Street, City, State" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Status</label>
                <Select value={form.status ?? "Lead"} onChange={(v) => setForm((f) => ({ ...f, status: v as Customer["status"] }))} options={STATUSES.map((s) => ({ value: s, label: s }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: "var(--font-display)" }}>Notes</label>
                <textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", resize: "vertical" }} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setShowCreate(false); setEditCustomer(null); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name}>{editCustomer ? "Save Changes" : "Add Customer"}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Projects Drawer */}
      {drawerCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(15,23,42,0.4)" }} onClick={() => setDrawerCustomer(null)}>
          <div className="w-full max-w-md h-full overflow-y-auto p-8" style={{ background: "white" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{drawerCustomer.name}</h2>
                <div className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{drawerCustomer.company}</div>
              </div>
              <button onClick={() => setDrawerCustomer(null)} style={{ fontSize: 22, color: "var(--color-muted-foreground)" }}>×</button>
            </div>
            <div className="mb-6 p-4 rounded-xl" style={{ background: "#f8fafc", border: "1px solid var(--color-border)" }}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Email</div>{drawerCustomer.email}</div>
                <div><div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Phone</div>{drawerCustomer.phone}</div>
                <div className="col-span-2"><div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Address</div>{drawerCustomer.address}</div>
                {drawerCustomer.notes && <div className="col-span-2"><div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Notes</div><span style={{ fontStyle: "italic" }}>{drawerCustomer.notes}</span></div>}
              </div>
            </div>
            <h3 className="font-semibold mb-3" style={{ fontFamily: "var(--font-display)" }}>Associated Projects ({drawerProjects.length})</h3>
            {drawerProjects.length === 0 ? (
              <div className="text-sm text-center py-8" style={{ color: "var(--color-muted-foreground)" }}>No projects for this customer.</div>
            ) : (
              <div className="space-y-3">
                {drawerProjects.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl" style={{ border: "1px solid var(--color-border)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{p.name}</span>
                      <Badge label={p.status} />
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Owner: {p.ownerName || "—"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
