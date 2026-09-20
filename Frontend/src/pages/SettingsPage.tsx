import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { getErrorMessage } from "../lib/errors";
import { useAuth } from "../providers/AuthProvider";

function getInitials(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function SettingsPage() {
  const {
    user,
    updateProfile,
    changePassword,
  } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setFullName(user.fullName);
    setEmail(user.email);
    setProfileImage(user.profileImage ?? "");
    setImageFailed(false);
  }, [user]);

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim();
    const normalizedImage = profileImage.trim();

    if (!normalizedName) {
      setProfileError("Full name is required.");
      return;
    }

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setProfileError("Enter a valid email address.");
      return;
    }

    try {
      setSavingProfile(true);
      setProfileError("");
      setProfileSuccess("");

      await updateProfile({
        fullName: normalizedName,
        email: normalizedEmail,
        profileImage: normalizedImage || null,
      });

      setProfileSuccess("Profile updated successfully.");
    } catch (error) {
      setProfileError(
        getErrorMessage(error, "Unable to update your profile.")
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError("");
      setPasswordSuccess("");

      await changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password changed successfully.");
    } catch (error) {
      setPasswordError(
        getErrorMessage(error, "Unable to change your password.")
      );
    } finally {
      setChangingPassword(false);
    }
  }

  if (!user) {
    return null;
  }

  const hasProfileImage =
    Boolean(profileImage.trim()) && !imageFailed;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account profile and security.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <form
          onSubmit={handleProfileSubmit}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Profile
                </h2>
                <p className="text-sm text-slate-500">
                  Update the information shown across your CRM account.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-100 text-xl font-bold text-blue-700 ring-1 ring-blue-200">
                {hasProfileImage ? (
                  <img
                    src={profileImage.trim()}
                    alt={fullName || "Profile"}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  getInitials(fullName)
                )}
              </div>

              <div className="min-w-0 flex-1">
                <label
                  htmlFor="profileImage"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  <Camera size={16} />
                  Profile image URL
                </label>
                <input
                  id="profileImage"
                  type="url"
                  value={profileImage}
                  onChange={(event) => {
                    setProfileImage(event.target.value);
                    setImageFailed(false);
                  }}
                  placeholder="https://example.com/avatar.jpg"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Your backend stores an image URL only. Binary avatar uploads are not implemented yet.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="fullName"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  <UserRound size={16} />
                  Full name
                </label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  autoComplete="name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  <Mail size={16} />
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  autoComplete="email"
                />
              </div>
            </div>

            {profileError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 size={17} />
                {profileSuccess}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}
                {savingProfile ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <BadgeCheck size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                Account
              </h2>
              <p className="text-sm text-slate-500">
                Your current CRM identity.
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <dt className="text-slate-500">User ID</dt>
              <dd className="font-semibold text-slate-900">
                #{user.userId}
              </dd>
            </div>

            <div className="border-b border-slate-100 pb-4">
              <dt className="text-slate-500">Roles</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100"
                  >
                    <ShieldCheck size={13} />
                    {role}
                  </span>
                ))}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Session</dt>
              <dd className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Authenticated
              </dd>
            </div>
          </dl>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            Saving profile changes refreshes your JWT automatically so your name and email claims stay current without signing out.
          </div>
        </section>
      </div>

      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                Password & security
              </h2>
              <p className="text-sm text-slate-500">
                Confirm your current password before choosing a new one.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label
                htmlFor="currentPassword"
                className="flex items-center gap-2 text-sm font-medium text-slate-700"
              >
                <LockKeyhole size={16} />
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="text-sm font-medium text-slate-700"
              >
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Minimum 6 characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          {passwordError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={17} />
              {passwordSuccess}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <KeyRound size={17} />
              )}
              {changingPassword
                ? "Changing..."
                : "Change password"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
