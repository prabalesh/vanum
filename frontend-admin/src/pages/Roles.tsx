import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useRoles } from '../hooks/useRoles';
import RoleList from '../components/roles/RoleList';
import RoleFormModal from '../components/roles/RoleFormModal';
import ConfirmDeleteModal from '../components/roles/ConfirmDeleteModal';
import type { Role, RoleFormData } from '../types';

export default function Roles() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);

  const {
    roles,
    loading,
    currentPage,
    totalPages,
    totalRoles,
    startIndex,
    endIndex,
    createRole,
    updateRole,
    deleteRole,
    handlePageChange,
  } = useRoles(10);

  // Modal handlers
  const handleOpenModal = (role?: Role) => {
    setEditingRole(role || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleSubmit = async (data: RoleFormData): Promise<boolean> => {
    if (editingRole) {
      return await updateRole(editingRole.id, data);
    } else {
      return await createRole(data);
    }
  };

  const handleDeleteRole = async (role: Role): Promise<boolean> => {
    return await deleteRole(role.id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage user roles and permissions for your application.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Role
          </button>
        </div>
      </div>

      {/* Role List */}
      <RoleList
        roles={roles}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalRoles={totalRoles}
        onEdit={handleOpenModal}
        onDelete={setDeleteConfirm}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      <RoleFormModal
        isOpen={isModalOpen}
        editingRole={editingRole}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteConfirm}
        role={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteRole}
      />
    </div>
  );
}
