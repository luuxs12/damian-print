import "./users-page.scss";

import { useState }
from "react";

import { UserHeader }
from "../components/user-header";

import { UsersTable }
from "../components/users-table";

import { UserForm }
from "../components/user-form";

import type { User }
from "../types/user.types";

export const UsersPage = () => {

  const [
    openForm,
    setOpenForm,
  ] = useState(false);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState<
    User | null
  >(null);

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const handleCreateUser =
    () => {

      setSelectedUser(
        null
      );

      setOpenForm(true);
    };

  const handleEditUser =
    (
      user: User
    ) => {

      setSelectedUser(
        user
      );

      setOpenForm(true);
    };

  const handleCloseForm =
    () => {

      setOpenForm(false);

      setSelectedUser(
        null
      );
    };

  const handleSuccess =
    () => {

      setRefreshKey(
        (prev) => prev + 1
      );

      handleCloseForm();
    };

  return (

    <div className="users-page">

      <UserHeader
        onCreateUser={
          handleCreateUser
        }
      />

      <UsersTable
        key={refreshKey}

        onEditUser={
          handleEditUser
        }
      />

      {openForm && (

        <UserForm
          mode={
            selectedUser
              ? "edit"
              : "create"
          }

          initialData={
            selectedUser ||
            undefined
          }

          onClose={
            handleCloseForm
          }

          onSuccess={
            handleSuccess
          }
        />

      )}

    </div>
  );
};