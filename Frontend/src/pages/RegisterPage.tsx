import { Navigate } from "react-router-dom";

// Self-registration has been removed. Accounts are created by an Admin.
export default function RegisterPage() {
  return <Navigate to="/login" replace />;
}
