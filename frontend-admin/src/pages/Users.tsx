// pages/Users.tsx
import { useState } from 'react';
import { PlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useUsers } from '../hooks/useUsers';
import UserList from '../components/users/UserList';
import UserFormModal from '../components/users/UserFormModal';
import type { GeneralUser } from '../types';
import ConfirmDeleteModal from '../components/shared/ConfirmDeleteModal';

export default function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<GeneralUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<GeneralUser | null>(null);

  const {
    users,
    roles,
    loading,
    currentPage,
    totalPages,
    totalUsers,
    startIndex,
    endIndex,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    handlePageChange,
  } = useUsers(10);

  // Modal handlers
  const handleOpenModal = (user?: GeneralUser) => {
    setEditingUser(user || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (user: GeneralUser): Promise<boolean> => {
    return await deleteUser(user.id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="flex items-center">
          <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage user accounts and their assigned roles.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* User List */}
      <UserList
        users={users}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalUsers={totalUsers}
        onEdit={handleOpenModal}
        onDelete={setDeleteConfirm}
        onToggleStatus={toggleUserStatus}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      <UserFormModal
        isOpen={isModalOpen}
        editingUser={editingUser}
        roles={roles}
        onClose={handleCloseModal}
        onCreate={createUser}
        onUpdate={updateUser}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteConfirm}
        item={deleteConfirm}
        itemName={deleteConfirm?.name || ''}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
