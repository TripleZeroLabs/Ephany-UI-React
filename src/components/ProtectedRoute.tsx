import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Header } from "./Header";
import { Footer } from "./Footer";

type Props = { version?: string };

export function ProtectedLayout({ version }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-theme(spacing.16)-theme(spacing.12))]">
        <Outlet />
      </main>
      <Footer version={version} />
    </>
  );
}
