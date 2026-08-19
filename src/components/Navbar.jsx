import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">SR</span>
        Stockroom
      </div>
      <nav>
        {session ? (
          <>
            <NavLink to="/stores" className={({ isActive }) => (isActive ? "active" : "")}>
              Stores
            </NavLink>
            <NavLink to="/account" className={({ isActive }) => (isActive ? "active" : "")}>
              Account
            </NavLink>
            <span className="who">{session.userName}</span>
            <button onClick={handleLogout}>Sign out</button>
          </>
        ) : (
          <NavLink to="/login" className={({ isActive }) => (isActive ? "active" : "")}>
            Sign in
          </NavLink>
        )}
      </nav>
    </header>
  );
}
