import "./role-header.scss";

interface Props {

  onCreateRole:
    () => void;
}

export const RoleHeader = ({
  onCreateRole,
}: Props) => {

  return (

    <div className="roles-page__header">

      <div>

        <h1>
          Gestión de perfiles
        </h1>

        <p>
          Administra perfiles, accesos y permisos del sistema.
        </p>

      </div>

      <button
        className="roles-page__create-btn"

        onClick={
          onCreateRole
        }
      >
        + Agregar perfil
      </button>

    </div>
  );
};