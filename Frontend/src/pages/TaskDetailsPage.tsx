import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  FileIcon,
  MessageCircle,
  Paperclip,
  Plus,
  Tag as TagIcon,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../providers/AuthProvider";
import {
  ErrorState,
  LoadingState,
} from "../components/FeedbackState";
import { canManageProtectedResources, canWorkAssignedResources } from "../utils/permissions";
import AdvancedTaskControls from "../components/AdvancedTaskControls";
import { getUsers } from "../services/userService";
import { getProject } from "../services/projectService";
import { getTeamMembers } from "../services/teamService";

import {
  createAttachment,
  deleteAttachment,
  getAttachmentsByTask,
} from "../services/attachmentService";

import {
  assignUserToTask,
  getTask,
  getTaskAssignees,
  removeUserFromTask,
} from "../services/taskService";

import {
  completeSubTask,
  deleteSubTask,
  getSubTasksByTask,
  uncompleteSubTask,
} from "../services/subTaskService";

import {
  assignTagToTask,
  createTag,
  getTags,
  getTaskTags,
  removeTagFromTask,
} from "../services/tagService";

import type {
  Task,
  TaskAssignee,
} from "../types/task";

import {
  createComment,
  getCommentsByTask,
} from "../services/commentService";

import type { AppUser } from "../types/auth";
import type { Attachment } from "../types/attachment";
import type { Comment } from "../types/comment";
import type { SubTask } from "../types/subTask";
import type { Tag } from "../types/tag";

export default function TaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageRestrictedActions = canManageProtectedResources(user);
  const canWorkTask = canWorkAssignedResources(user);
  const canAddAttachment = !!user;

  const [task, setTask] = useState<Task | null>(null);
  const [assignees, setAssignees] = useState<TaskAssignee[]>(
    []
  );
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | "">("");
  const [assigneeActionLoading, setAssigneeActionLoading] = useState(false);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(
  null
  );
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showTagControls, setShowTagControls] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<number | "">("");
  const [tagActionLoading, setTagActionLoading] = useState(false);
  const [removingTagId, setRemovingTagId] = useState<number | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#2563eb");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingSubTaskId, setUpdatingSubTaskId] = useState<
    number | null
  >(null);

  const [deletingSubTaskId, setDeletingSubTaskId] = useState<number | null>(null);

  useEffect(() => {
    const loadTaskDetails = async () => {
      try {
        setLoading(true);
        setError("");

        if (!id) {
          setError("Task ID is missing.");
          return;
        }

        const taskId = Number(id);

        if (Number.isNaN(taskId)) {
          setError("Invalid task ID.");
          return;
        }

        const [
          taskData,
          assigneeData,
          subTaskData,
          commentData,
          attachmentData,
          tagData,
          allTagData,
          userData,
        ] = await Promise.all([
          getTask(taskId),
          getTaskAssignees(taskId),
          getSubTasksByTask(taskId),
          getCommentsByTask(taskId),
          getAttachmentsByTask(taskId),
          getTaskTags(taskId),
          canManageRestrictedActions ? getTags() : Promise.resolve([]),
          canManageRestrictedActions ? getUsers() : Promise.resolve([]),
        ]);

        let assignmentUsers = userData;
        if (canManageRestrictedActions && taskData.projectId) {
          try {
            const project = await getProject(taskData.projectId);
            if (project.teamId) {
              const teamMembers = await getTeamMembers(project.teamId);
              const memberIds = new Set(teamMembers.map((member) => member.userId));
              assignmentUsers = userData.filter((candidate) => memberIds.has(candidate.userId));
            }
          } catch {
            assignmentUsers = [];
          }
        }

        setTask(taskData);
        setAssignees(assigneeData);
        setSubTasks(subTaskData);
        setComments(commentData);
        setAttachments(attachmentData);
        setTags(tagData);
        setAllTags(allTagData);
        setAllUsers(assignmentUsers);
      } catch (err) {
        console.error(err);
        setError("Failed to load task details.");
      } finally {
        setLoading(false);
      }
    };

    loadTaskDetails();
  }, [id, canManageRestrictedActions]);

  const canManageTags = canManageRestrictedActions;

  const unassignedTags = allTags.filter(
    (availableTag) =>
      !tags.some((taskTag) => taskTag.id === availableTag.id)
  );

  const availableAssignees = allUsers.filter(
    (candidate) =>
      !assignees.some((assignee) => assignee.userId === candidate.userId)
  );

  const handleAssignTag = async () => {
    if (!id || !canManageTags || selectedTagId === "") {
      return;
    }

    const taskId = Number(id);

    if (Number.isNaN(taskId)) {
      return;
    }

    const tagToAssign = allTags.find(
      (tag) => tag.id === selectedTagId
    );

    if (!tagToAssign) {
      return;
    }

    try {
      setTagActionLoading(true);

      await assignTagToTask({
        taskItemId: taskId,
        tagId: tagToAssign.id,
      });

      setTags((currentTags) =>
        [...currentTags, tagToAssign].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setSelectedTagId("");
    } catch (err) {
      console.error(err);
      alert("Failed to assign tag.");
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!id || !canManageTags) {
      return;
    }

    const taskId = Number(id);

    if (Number.isNaN(taskId)) {
      return;
    }

    try {
      setRemovingTagId(tagId);

      await removeTagFromTask(taskId, tagId);

      setTags((currentTags) =>
        currentTags.filter((tag) => tag.id !== tagId)
      );
    } catch (err) {
      console.error(err);
      alert("Failed to remove tag from task.");
    } finally {
      setRemovingTagId(null);
    }
  };

  const handleCreateAndAssignTag = async () => {
    if (!id || !canManageTags) {
      return;
    }

    const name = newTagName.trim();

    if (!name) {
      return;
    }

    const taskId = Number(id);

    if (Number.isNaN(taskId)) {
      return;
    }

    try {
      setTagActionLoading(true);

      const createdTag = await createTag({
        name,
        color: newTagColor || null,
      });

      await assignTagToTask({
        taskItemId: taskId,
        tagId: createdTag.id,
      });

      setAllTags((currentTags) =>
        [...currentTags, createdTag].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setTags((currentTags) =>
        [...currentTags, createdTag].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setNewTagName("");
      setNewTagColor("#2563eb");
    } catch (err) {
      console.error(err);
      alert("Failed to create and assign tag.");
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleAssignUser = async () => {
    if (!id || !canManageRestrictedActions || selectedAssigneeId === "") {
      return;
    }

    const taskId = Number(id);
    const candidate = allUsers.find(
      (item) => item.userId === selectedAssigneeId
    );

    if (Number.isNaN(taskId) || !candidate) {
      return;
    }

    try {
      setAssigneeActionLoading(true);
      await assignUserToTask(taskId, candidate.userId);
      const refreshedAssignees = await getTaskAssignees(taskId);
      setAssignees(refreshedAssignees);
      setSelectedAssigneeId("");
    } catch (err) {
      console.error(err);
      alert("Failed to assign user to task.");
    } finally {
      setAssigneeActionLoading(false);
    }
  };

  const handleRemoveAssignee = async (userId: number) => {
    if (!id || !canManageRestrictedActions) {
      return;
    }

    const taskId = Number(id);
    if (Number.isNaN(taskId)) {
      return;
    }

    try {
      setAssigneeActionLoading(true);
      await removeUserFromTask(taskId, userId);
      setAssignees((current) =>
        current.filter((assignee) => assignee.userId !== userId)
      );
    } catch (err) {
      console.error(err);
      alert("Failed to remove user from task.");
    } finally {
      setAssigneeActionLoading(false);
    }
  };

  const handleSubTaskToggle = async (
    subTask: SubTask
  ) => {
    if (!canWorkTask) {
      return;
    }

    try {
      setUpdatingSubTaskId(subTask.id);

      if (subTask.isCompleted) {
        await uncompleteSubTask(subTask.id);
      } else {
        await completeSubTask(subTask.id);
      }

      setSubTasks((currentSubTasks) =>
        currentSubTasks.map((item) =>
          item.id === subTask.id
            ? {
                ...item,
                isCompleted: !item.isCompleted,
              }
            : item
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update subtask.");
    } finally {
      setUpdatingSubTaskId(null);
    }
  };

  const handleDeleteSubTask = async (subTaskId: number) => {
    if (!canWorkTask) {
      return;
    }

    const confirmed = window.confirm("Delete this subtask?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingSubTaskId(subTaskId);
      await deleteSubTask(subTaskId);
      setSubTasks((current) =>
        current.filter((subTask) => subTask.id !== subTaskId)
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete subtask.");
    } finally {
      setDeletingSubTaskId(null);
    }
  };

  const handleAddComment = async () => {
  const content = newComment.trim();

  if (!content) {
    return;
  }

  if (!id) {
    return;
  }

  try {
    setCommentLoading(true);

    const taskId = Number(id);

    if (Number.isNaN(taskId)) {
      return;
    }

    const createdComment = await createComment({
      taskItemId: taskId,
      content,
    });

    setComments((currentComments) => [
      ...currentComments,
      createdComment,
    ]);

    setNewComment("");
  } catch (err) {
    console.error(err);
    alert("Failed to add comment.");
  } finally {
    setCommentLoading(false);
  }
};


    const handleAttachmentFileChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0] ?? null;

      setAttachmentFile(file);

      if (file) {
        setAttachmentUrl("");
      }
    };




    const handleAddAttachment = async () => {
  if (!id) {
    return;
  }

  const taskId = Number(id);

  if (Number.isNaN(taskId)) {
    return;
  }

  if (!attachmentFile && !attachmentUrl.trim()) {
    alert("Select a file or enter a file URL.");
    return;
  }

  try {
    setAttachmentLoading(true);

    const fileName =
      attachmentFile?.name ||
      attachmentUrl.trim().split("/").pop() ||
      "Attachment";

    const contentType =
      attachmentFile?.type ||
      "application/octet-stream";

    const fileSize = attachmentFile?.size || 0;

    const fileUrl = attachmentUrl.trim();

    if (!fileUrl) {
      alert(
        "The current backend requires a File URL. Select a file and enter its URL."
      );
      return;
    }

    const createdAttachment = await createAttachment({
      taskItemId: taskId,
      fileName,
      fileUrl,
      contentType,
      fileSize,
    });

    setAttachments((currentAttachments) => [
      ...currentAttachments,
      createdAttachment,
    ]);

    setAttachmentFile(null);
    setAttachmentUrl("");

    const fileInput = document.getElementById(
      "attachment-file"
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  } catch (err) {
    console.error(err);
    alert("Failed to add attachment.");
  } finally {
    setAttachmentLoading(false);
  }
};



    const handleDeleteAttachment = async (
  attachmentId: number
) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this attachment?"
  );

  if (!confirmed) {
    return;
  }

  try {
    await deleteAttachment(attachmentId);

    setAttachments((currentAttachments) =>
      currentAttachments.filter(
        (attachment) => attachment.id !== attachmentId
      )
    );
  } catch (err) {
    console.error(err);
    alert("Failed to delete attachment.");
  }
};

  if (loading) {
    return <LoadingState label="Loading task details..." />;
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Back
        </button>

        <ErrorState
          title="Task unavailable"
          description={error || "Task not found."}
        />
      </div>
    );
  }

  const completedSubTasks = subTasks.filter(
    (subTask) => subTask.isCompleted
  ).length;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Main Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              {task.status}
            </span>

            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600">
              {task.priority}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {task.title}
          </h1>

          {task.projectName && task.projectId ? (
            <button
              type="button"
              onClick={() => navigate(`/projects/${task.projectId}`)}
              className="mt-2 text-sm font-medium text-gray-500 hover:text-blue-600"
            >
              Project: {task.projectName}
            </button>
          ) : (
            <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Standalone task
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-8 p-5 sm:p-6">
          {canWorkTask && (
            <AdvancedTaskControls
              task={task}
              onTaskUpdated={setTask}
              onSubTaskCreated={(subTask) =>
                setSubTasks((current) => [...current, subTask])
              }
            />
          )}

          {/* Description */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Description
            </h2>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="whitespace-pre-wrap leading-7 text-gray-600">
                {task.description ||
                  "No description provided."}
              </p>
            </div>
          </section>

          {/* Task Information */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Task Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Created By */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                  <User size={17} />
                  Created By
                </div>

                <p className="font-medium text-gray-900">
                  {task.createdByName ||
                    `User #${task.createdById}`}
                </p>
              </div>

              {/* Due Date */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays size={17} />
                  Due Date
                </div>

                <p className="font-medium text-gray-900">
                  {task.dueDate
                    ? new Date(
                        task.dueDate
                      ).toLocaleDateString()
                    : "No due date"}
                </p>
              </div>
            </div>
          </section>

          {/* Assignees */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Assignees
                </h2>
              </div>

              {canManageRestrictedActions && (
                <div className="flex w-full gap-2 sm:w-auto">
                  <select
                    value={selectedAssigneeId}
                    onChange={(event) =>
                      setSelectedAssigneeId(
                        event.target.value ? Number(event.target.value) : ""
                      )
                    }
                    disabled={
                      assigneeActionLoading || availableAssignees.length === 0
                    }
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:min-w-56"
                  >
                    <option value="">
                      {availableAssignees.length === 0
                        ? "No eligible team users available"
                        : "Select team user"}
                    </option>
                    {availableAssignees.map((candidate) => (
                      <option key={candidate.userId} value={candidate.userId}>
                        {candidate.fullName} — {candidate.email}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => void handleAssignUser()}
                    disabled={
                      assigneeActionLoading || selectedAssigneeId === ""
                    }
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              {assignees.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No users assigned to this task.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {assignees.map((assignee) => (
                    <div
                      key={assignee.userId}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
                    >
                      {assignee.profileImage ? (
                        <img
                          src={assignee.profileImage}
                          alt={assignee.fullName}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {assignee.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {assignee.fullName}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {assignee.email}
                        </p>
                      </div>

                      {canManageRestrictedActions && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleRemoveAssignee(assignee.userId)
                          }
                          disabled={assigneeActionLoading}
                          className="ml-1 rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Remove assignee"
                          aria-label={`Remove ${assignee.fullName} from task`}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Subtasks */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Subtasks
              </h2>

              <span className="text-sm text-gray-500">
                {completedSubTasks} / {subTasks.length}{" "}
                completed
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {subTasks.length === 0 ? (
                <div className="p-5 text-sm text-gray-500">
                  No subtasks for this task.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {subTasks.map((subTask) => {
                    const isUpdating =
                      updatingSubTaskId === subTask.id;

                    return (
                      <div
                        key={subTask.id}
                        className={`flex w-full items-center gap-3 p-4 transition ${
                          isUpdating || deletingSubTaskId === subTask.id
                            ? "opacity-60"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            canWorkTask && handleSubTaskToggle(subTask)
                          }
                          disabled={isUpdating || !canWorkTask}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                        >
                          {subTask.isCompleted ? (
                            <CheckCircle2
                              size={21}
                              className="shrink-0 text-green-600"
                            />
                          ) : (
                            <Circle
                              size={21}
                              className="shrink-0 text-gray-400"
                            />
                          )}

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium ${
                                subTask.isCompleted
                                  ? "text-gray-400 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {subTask.title}
                            </p>

                            {subTask.dueDate && (
                              <p className="mt-1 text-xs text-gray-500">
                                Due {new Date(subTask.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </button>

                        {isUpdating && (
                          <span className="text-xs text-gray-400">Updating...</span>
                        )}

                        {canWorkTask && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteSubTask(subTask.id)}
                            disabled={deletingSubTaskId === subTask.id}
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Delete subtask"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {!canManageRestrictedActions && (
              <p className="mt-2 text-xs text-gray-500">
                Subtasks are read-only for your role. Update your own task status from My Tasks and use comments for blockers or replies.
              </p>
            )}
          </section>

          {/* Comments */}
<section>
  <div className="mb-3 flex items-center gap-2">
    <MessageCircle
      size={20}
      className="text-gray-600"
    />

    <h2 className="text-lg font-semibold text-gray-900">
      Comments
    </h2>
  </div>

  <div className="space-y-4">
    {comments.length === 0 ? (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
        No comments yet.
      </div>
    ) : (
      comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {comment.userName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {comment.userName}
                </p>

                <p className="text-xs text-gray-400">
                  {new Date(
                    comment.createdAt
                  ).toLocaleString()}
                </p>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {comment.content}
              </p>
            </div>
          </div>
        </div>
      ))
    )}

    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <textarea
        value={newComment}
        onChange={(event) =>
          setNewComment(event.target.value)
        }
        placeholder="Write a comment..."
        rows={3}
        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleAddComment}
          disabled={
            commentLoading || !newComment.trim()
          }
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {commentLoading
            ? "Adding..."
            : "Add Comment"}
        </button>
      </div>
    </div>
  </div>
</section>

          {/* Attachments */}
<section>
  <div className="mb-3 flex items-center gap-2">
    <Paperclip
      size={20}
      className="text-gray-600"
    />

    <h2 className="text-lg font-semibold text-gray-900">
      Attachments
    </h2>
  </div>

  <div className="space-y-4">
    {/* Existing attachments */}
    {attachments.length === 0 ? (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
        No attachments yet.
      </div>
    ) : (
      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <FileIcon
                  size={20}
                  className="text-gray-600"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {attachment.fileName}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {attachment.contentType || "File"}
                  {attachment.fileSize > 0 &&
                    ` • ${(
                      attachment.fileSize / 1024
                    ).toFixed(1)} KB`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Open
              </a>

              {canWorkTask && (
                <button
                  type="button"
                  onClick={() =>
                    void handleDeleteAttachment(attachment.id)
                  }
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                  title="Delete attachment"
                  aria-label={`Delete ${attachment.fileName}`}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {canAddAttachment && (
      <>
    {/* Add attachment */}
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="attachment-file"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Select file
          </label>

          <input
            id="attachment-file"
            type="file"
            onChange={handleAttachmentFileChange}
            className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600"
          />
        </div>

        <div>
          <label
            htmlFor="attachment-url"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            File URL
          </label>

          <input
            id="attachment-url"
            type="url"
            value={attachmentUrl}
            onChange={(event) =>
              setAttachmentUrl(event.target.value)
            }
            placeholder="https://example.com/file.pdf"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {attachmentFile && (
        <div className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-600">
          Selected:{" "}
          <span className="font-medium text-gray-900">
            {attachmentFile.name}
          </span>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleAddAttachment}
          disabled={attachmentLoading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {attachmentLoading
            ? "Adding..."
            : "Add Attachment"}
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Your current API stores the attachment URL and
        metadata. The selected file does not get uploaded to
        the server by this endpoint.
      </p>
    </div>

      </>
    )}
  </div>
</section>

          {/* Tags */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TagIcon
                  size={20}
                  className="text-gray-600"
                />

                <h2 className="text-lg font-semibold text-gray-900">
                  Tags
                </h2>
              </div>

              {canManageTags && (
                <button
                  type="button"
                  onClick={() =>
                    setShowTagControls((current) => !current)
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <Plus size={16} />
                  Add Tag
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                {tags.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No tags assigned to this task.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isRemoving =
                        removingTagId === tag.id;

                      return (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                tag.color || "#9ca3af",
                            }}
                          />

                          {tag.name}

                          {canManageTags && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveTag(tag.id)
                              }
                              disabled={isRemoving}
                              className="rounded-full p-0.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-50"
                              title="Remove tag from task"
                              aria-label={`Remove ${tag.name} tag`}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {canManageTags && showTagControls && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Assign existing tag
                    </p>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <select
                        value={selectedTagId}
                        onChange={(event) =>
                          setSelectedTagId(
                            event.target.value
                              ? Number(event.target.value)
                              : ""
                          )
                        }
                        disabled={
                          tagActionLoading ||
                          unassignedTags.length === 0
                        }
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">
                          {unassignedTags.length === 0
                            ? "All available tags are assigned"
                            : "Select a tag"}
                        </option>

                        {unassignedTags.map((tag) => (
                          <option key={tag.id} value={tag.id}>
                            {tag.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleAssignTag}
                        disabled={
                          tagActionLoading ||
                          selectedTagId === ""
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {tagActionLoading
                          ? "Working..."
                          : "Assign Tag"}
                      </button>
                    </div>
                  </div>

                  {canManageTags && (
                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <p className="text-sm font-semibold text-gray-900">
                        Create a new tag
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                        <input
                          type="text"
                          value={newTagName}
                          onChange={(event) =>
                            setNewTagName(event.target.value)
                          }
                          maxLength={50}
                          placeholder="Tag name"
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />

                        <input
                          type="color"
                          value={newTagColor}
                          onChange={(event) =>
                            setNewTagColor(event.target.value)
                          }
                          className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 sm:w-14"
                          title="Tag color"
                          aria-label="Tag color"
                        />

                        <button
                          type="button"
                          onClick={handleCreateAndAssignTag}
                          disabled={
                            tagActionLoading ||
                            !newTagName.trim()
                          }
                          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Create & Assign
                        </button>
                      </div>
                    </div>
                  )}


                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}