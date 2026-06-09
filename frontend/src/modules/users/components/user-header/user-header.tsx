import "./user-header.scss";

import {
  Plus,
} from "lucide-react";

interface Props {
  onCreateUser: () => void;
}

export const UserHeader = ({
  onCreateUser,
}: Props) => {

  return (

    <div className="users-page__header">

      <div>

        <h1>
          Gestión de usuarios
        </h1>

        <p>
          Administra usuarios,
          accesos y permisos
          del sistema.
        </p>

      </div>

      <button
        className="users-page__create-btn"
        onClick={onCreateUser}
      >
        <Plus size={18} />

        Agregar usuario
      </button>

    </div>
  );
};