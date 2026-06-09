/* eslint-disable react-hooks/set-state-in-effect */
import "./users-table.scss";

import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast }
from "sonner";

import type { User }
from "../../types/user.types";

import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { useAuthStore } from "@/modules/auth/store/auth-store";
import { generatePageNumbers } from "@/shared/utils/pagination";

import {
  usersService,
} from "../../services/users-service";

interface Props {

  onEditUser: (
    user: User
  ) => void;
}

export const UsersTable = ({
  onEditUser,
}: Props) => {

  const [
    users,
    setUsers,
  ] = useState<User[]>([]);

  const [
    selectedId,
    setSelectedId,
  ] = useState<
    number | null
  >(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const session = useAuthStore((state) => state.session);

  const itemsPerPage = 5;

  const loadUsers =
    async () => {

      try {

        const response =
          await usersService
            .getUsers();

        setUsers(response);

      } catch {

        toast.error(
          "Error cargando usuarios"
        );
      }
    };

  useEffect(() => {

    loadUsers();

  }, []);

  const filteredUsers =
    useMemo(() => {

      return users.filter(
        (user: User) => {

          const value =
            search.toLowerCase();

          return (

            user.username
              .toLowerCase()
              .includes(value) ||

            user.email
              .toLowerCase()
              .includes(value) ||

            user.role
              .toLowerCase()
              .includes(value)
          );
        }
      );

    }, [
      users,
      search,
    ]);

  const totalPages =
    Math.ceil(
      filteredUsers.length /
      itemsPerPage
    );

  const paginatedUsers =
    filteredUsers.slice(

      (currentPage - 1) *
        itemsPerPage,

      currentPage *
        itemsPerPage
    );

  const handleDelete =
    async () => {

      if (!selectedId) {
        return;
      }

      try {

        await usersService
          .deleteUser(
            selectedId
          );

        setUsers(
          (prev) =>

            prev.filter(
              (user) =>
                user.id !==
                selectedId
            )
        );

        toast.success(
          "Usuario eliminado"
        );

        setSelectedId(
          null
        );

      } catch {

        toast.error(
          "Error eliminando usuario"
        );
      }
    };

  return (

    <div className="users-card">

      <div className="users-card__top">
        <h2>Lista de usuarios</h2>
        <input
          type="text"
          placeholder="Buscar usuario..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="users-table-wrapper">

        <table className="users-table">

          <thead>

            <tr>

              <th>
                Usuario
              </th>

              <th>
                Correo
              </th>

              <th>
                Teléfono
              </th>

              <th>
                Rol
              </th>

              <th>
                Estado
              </th>

              <th>
                Fecha
              </th>

              <th>
                Acciones
              </th>

            </tr>

          </thead>

          <tbody>

            {paginatedUsers.map(
              (user: User) => (

                <tr
                  key={user.id}
                >

                  <td>
                    {user.username}
                  </td>

                  <td>
                    {user.email}
                  </td>

                  <td>
                    {user.phone}
                  </td>

                  <td>

                    <span className="role-badge">
                      {user.role}
                    </span>

                  </td>

                  <td>
                    <span
                      className={`status-badge ${user.status.toLowerCase() === "active" ? "active" : "inactive"}`}
                    >
                      {user.status.toLowerCase() === "active" ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td>
                    {user.createdAt}
                  </td>

                  <td>

                    <div className="actions">

                      <button
                        className="edit-btn"

                        onClick={() =>
                          onEditUser(
                            user
                          )
                        }
                      >

                        <Pencil
                          size={18}
                        />

                      </button>

                    <button
                        className="delete-btn"
                        onClick={() => setSelectedId(user.id)}
                      >
                        <Trash2
                          size={18}
                        />
                      </button>

                    </div>

                  </td>

                </tr>
              )
            )}

            {filteredUsers.length === 0 && (

              <tr>

                <td
                  colSpan={7}

                  style={{

                    textAlign:
                      "center",

                    padding:
                      "40px",

                    opacity:
                      0.7,
                  }}
                >

                  No se encontraron usuarios.

                </td>

              </tr>
            )}

          </tbody>

        </table>

      </div>

      <div className="shared-pagination">

        <button
          onClick={() =>
            setCurrentPage(
              (prev) =>
                Math.max(
                  prev - 1,
                  1
                )
            )
          }

          disabled={
            currentPage === 1
          }
          title="Anterior"
        >

          <ChevronLeft size={18} />

        </button>

        {generatePageNumbers(currentPage, totalPages).map((page, idx) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                ...
              </span>
            );
          }
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(Number(page))}
              className={currentPage === page ? "active" : ""}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() =>
            setCurrentPage(
              (prev) =>
                Math.min(
                  prev + 1,
                  totalPages
                )
            )
          }

          disabled={
            currentPage === totalPages ||
            totalPages === 0
          }
          title="Siguiente"
        >

          <ChevronRight size={18} />

        </button>

      </div>

      {selectedId && (
        session?.user?.id === selectedId ? (
          <ConfirmModal
            title="Acción no permitida"
            description="No puedes eliminar tu propio usuario activo del sistema por razones de seguridad."
            confirmLabel="Entendido"
            onClose={() => setSelectedId(null)}
            onConfirm={() => setSelectedId(null)}
            icon="warning"
            showCancel={false}
          />
        ) : (
          <ConfirmModal
            title="¿Eliminar usuario?"
            description="Esta acción eliminará el usuario permanentemente."
            onClose={() => setSelectedId(null)}
            onConfirm={handleDelete}
          />
        )
      )}

    </div>
  );
};