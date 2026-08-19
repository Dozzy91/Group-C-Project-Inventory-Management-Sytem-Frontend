import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { session, checkingSession } = useAuth();

  // Wait for the initial /user/me check to resolve before deciding to
  // redirect - otherwise a logged-in user gets bounced to /login for a
  // split second on every page refresh while the cookie is verified.
  if (checkingSession) return <p>Loading…</p>;

  if (!session) return <Navigate to="/" replace />;
  return children;
}
