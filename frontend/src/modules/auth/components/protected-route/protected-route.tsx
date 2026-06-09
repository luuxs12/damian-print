import {
  Navigate,
} from "react-router-dom";

import {
  authStore,
} from "../../store/auth-store";

interface Props {
  children: React.ReactNode;
}

export const ProtectedRoute = ({
  children,
}: Props) => {
  const isAuthenticated =
    authStore.isAuthenticated();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};