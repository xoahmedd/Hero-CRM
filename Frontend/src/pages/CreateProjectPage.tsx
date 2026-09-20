import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../providers/AuthProvider";
import { createProject } from "../services/projectService";
import { getDepartments } from "../services/departmentService";
import { getTeams } from "../services/teamService";
import type { Department } from "../types/department";
import type { Team } from "../types/team";

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Planning");
  const [priority, setPriority] = useState("Medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([
      getDepartments().catch(() => []),
      getTeams().catch(() => []),
    ]).then(([departmentData, teamData]) => {
      setDepartments([...departmentData].sort((a, b) => a.name.localeCompare(b.name)));
      setTeams([...teamData].sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      setError("Due date cannot be earlier than start date.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const project = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        startDate: startDate || null,
        dueDate: dueDate || null,
        customerId: customerId ? Number(customerId) : null,
        teamId: teamId ? Number(teamId) : null,
        ownerId: user.userId,
      });
      navigate(`/projects/${project.id}`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Unable to create project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button type="button" onClick={() => navigate("/projects")} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft size={17} /> Back to Projects
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Create Project</h1>
        <p className="mt-1 text-sm text-slate-500">Create the project and optionally assign it to a team.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <label className="block text-sm font-medium text-slate-700">
          Project name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Website redesign" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Describe this project..." className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="OnHold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Due date
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Department (optional)
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
              <option value="">No department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Team (optional)
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
              <option value="">No team assigned yet</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <span className="mt-1 block text-xs text-slate-400">Task assignees can later be selected from this team.</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <button type="button" onClick={() => navigate("/projects")} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"><Save size={17} />{loading ? "Creating..." : "Create Project"}</button>
        </div>
      </form>
    </div>
  );
}
