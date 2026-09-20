import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  CircleAlert,
  Info,
  LoaderCircle,
  MailPlus,
  RefreshCw,
  Send,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { getErrorMessage } from "../lib/errors";
import { useAuth } from "../providers/AuthProvider";
import {
  createNotification,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import { getUsers } from "../services/userService";
import type { AppUser } from "../types/auth";
import type { CrmNotification } from "../types/notification";

type NotificationFilter =
  | "all"
  | "unread"
  | "read";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTypeClasses(type: string) {
  switch (type.trim().toLowerCase()) {
    case "task":
      return "bg-blue-50 text-blue-700 ring-blue-100";
    case "project":
      return "bg-violet-50 text-violet-700 ring-violet-100";
    case "reminder":
    case "followup":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "system":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
}

function NotificationIcon({ type }: { type: string }) {
  const normalized = type.trim().toLowerCase();

  if (normalized === "reminder" || normalized === "followup") {
    return <CircleAlert size={18} />;
  }

  if (normalized === "system") {
    return <Info size={18} />;
  }

  return <BellRing size={18} />;
}

export default function NotificationsPage() {
  const { user } = useAuth();

  const [notifications, setNotifications] =
    useState<CrmNotification[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filter, setFilter] =
    useState<NotificationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [markingId, setMarkingId] =
    useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("General");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState("");

  const canSendNotifications =
    user?.roles.some(
      (role) => role === "Admin"
    ) ?? false;

  async function loadNotifications(showRefresh = false) {
    if (!user) {
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getUserNotifications();
      setNotifications(data);
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          "Unable to load notifications."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        const notificationData =
          await getUserNotifications();

        setNotifications(notificationData);

        if (canSendNotifications) {
          const userData = await getUsers();
          setUsers(userData);
        }
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
            "Unable to load notifications."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [user, canSendNotifications]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.isRead
      ).length,
    [notifications]
  );

  const readCount = notifications.length - unreadCount;

  const visibleNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter(
        (notification) => !notification.isRead
      );
    }

    if (filter === "read") {
      return notifications.filter(
        (notification) => notification.isRead
      );
    }

    return notifications;
  }, [filter, notifications]);

  async function handleMarkRead(notificationId: number) {
    try {
      setMarkingId(notificationId);
      setActionError("");

      await markNotificationAsRead(notificationId);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (markError) {
      setActionError(
        getErrorMessage(
          markError,
          "Unable to mark this notification as read."
        )
      );
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllRead() {
    if (!user || unreadCount === 0) {
      return;
    }

    try {
      setMarkingAll(true);
      setActionError("");

      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (markError) {
      setActionError(
        getErrorMessage(
          markError,
          "Unable to mark all notifications as read."
        )
      );
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleSendNotification(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const userId = Number(recipientId);

    if (!Number.isFinite(userId) || userId <= 0) {
      setActionError("Choose a recipient.");
      return;
    }

    if (!title.trim()) {
      setActionError("Enter a notification title.");
      return;
    }

    if (!message.trim()) {
      setActionError("Enter a notification message.");
      return;
    }

    try {
      setSending(true);
      setActionError("");
      setSendSuccess("");

      const created = await createNotification({
        userId,
        title: title.trim(),
        message: message.trim(),
        type,
      });

      if (created.userId === user?.userId) {
        setNotifications((current) => [created, ...current]);
      }

      setRecipientId("");
      setTitle("");
      setMessage("");
      setType("General");
      setSendSuccess("Notification sent successfully.");
    } catch (sendError) {
      setActionError(
        getErrorMessage(
          sendError,
          "Unable to send the notification."
        )
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="animate-spin" size={18} />
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Bell size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Review updates and messages sent to your account.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadNotifications(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={17} />
            {markingAll ? "Marking..." : "Mark all read"}
          </button>

          {canSendNotifications && (
            <button
              type="button"
              onClick={() => {
                setComposeOpen((current) => !current);
                setActionError("");
                setSendSuccess("");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {composeOpen ? <X size={17} /> : <MailPlus size={17} />}
              {composeOpen ? "Close" : "Send notification"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {sendSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {sendSuccess}
        </div>
      )}

      {composeOpen && canSendNotifications && (
        <form
          onSubmit={handleSendNotification}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <Send size={18} className="text-blue-600" />
            <h2 className="font-semibold text-slate-950">
              Send notification
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Recipient
              </span>
              <select
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                <option value="">Choose a user</option>
                {users.map((candidate) => (
                  <option
                    key={candidate.userId}
                    value={candidate.userId}
                  >
                    {candidate.fullName} — {candidate.email}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Type
              </span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                <option value="General">General</option>
                <option value="Task">Task</option>
                <option value="Project">Project</option>
                <option value="Reminder">Reminder</option>
                <option value="System">System</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Title
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              placeholder="Notification title"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Message
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Write the notification message..."
              className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
              {sending ? "Sending..." : "Send notification"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Total
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {notifications.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Unread
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700">
            {unreadCount}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Read
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {readCount}
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">
              Your notifications
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Newest notifications are shown first.
            </p>
          </div>

          <div className="inline-flex self-start rounded-xl bg-slate-100 p-1">
            {(
              ["all", "unread", "read"] as NotificationFilter[]
            ).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={[
                  "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition",
                  filter === value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {visibleNotifications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Bell size={21} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              No notifications here
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {filter === "all"
                ? "You do not have any notifications yet."
                : `You do not have any ${filter} notifications.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleNotifications.map((notification) => (
              <article
                key={notification.id}
                className={[
                  "flex gap-4 px-5 py-5 transition",
                  notification.isRead
                    ? "bg-white"
                    : "bg-blue-50/40",
                ].join(" ")}
              >
                <div
                  className={[
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                    getTypeClasses(notification.type),
                  ].join(" ")}
                >
                  <NotificationIcon type={notification.type} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">
                          {notification.title}
                        </h3>

                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                        )}

                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                            getTypeClasses(notification.type),
                          ].join(" ")}
                        >
                          {notification.type || "General"}
                        </span>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>

                      <div className="mt-3 text-xs text-slate-400">
                        {formatDate(notification.createdAt)}
                      </div>
                    </div>

                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notification.id)}
                        disabled={markingId === notification.id}
                        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {markingId === notification.id ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
