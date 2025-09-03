import { useUser } from "../context/UserContext";
import AppLayout from "./AppLayout";

export default function ProtectedLayout() {
  const { usuario } = useUser();

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Você precisa estar logado.</p>
      </div>
    );
  }

  return <AppLayout />;
}