import { useForm } from 'react-hook-form';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Role, RoleFormData } from '../../types';
import { useEffect } from 'react';

interface RoleFormModalProps {
  isOpen: boolean;
  editingRole: Role | null;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => Promise<boolean>;
}

export default function RoleFormModal({ isOpen, editingRole, onClose, onSubmit }: RoleFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>();

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data: RoleFormData) => {
    const success = await onSubmit(data);
    if (success) {
      handleClose();
    }
  };

  // Reset form when modal opens with editing role
  useEffect(() => {
    if (isOpen) {
      if (editingRole) {
        reset({ name: editingRole.name });
      } else {
        reset({ name: '' });
      }
    }
  }, [isOpen, editingRole, reset]);

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', {
                    required: 'Role name is required',
                    minLength: {
                      value: 2,
                      message: 'Role name must be at least 2 characters',
                    },
                    maxLength: {
                      value: 50,
                      message: 'Role name must be less than 50 characters',
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                  placeholder="Enter role name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
