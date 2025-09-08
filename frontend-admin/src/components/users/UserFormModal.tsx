import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogPanel } from '@headlessui/react';
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import type { GeneralUser, CreateUserFormData, UpdateUserFormData, Role } from '../../types';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role_id: number;
  is_active: boolean;
}

interface UserFormModalProps {
  isOpen: boolean;
  editingUser: GeneralUser | null;
  roles: Role[];
  onClose: () => void;
  onCreate: (data: CreateUserFormData) => Promise<boolean>;
  onUpdate: (id: number, data: UpdateUserFormData) => Promise<boolean>;
}

export default function UserFormModal({
  isOpen,
  editingUser,
  roles,
  onClose,
  onCreate,
  onUpdate,
}: UserFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>();

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: UserFormData) => {
    let success = false;

    if (editingUser) {
      // Prepare update data - only include fields that have values
      const updateData: UpdateUserFormData = {};
      
      if (data.name.trim() !== '') updateData.name = data.name;
      if (data.email.trim() !== '') updateData.email = data.email;
      if (data.password.trim() !== '') updateData.password = data.password;
      if (data.role_id > 0) updateData.role_id = data.role_id;
      updateData.is_active = data.is_active;

      success = await onUpdate(editingUser.id, updateData);
    } else {
      // Create user - all fields required
      const createData: CreateUserFormData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role_id: data.role_id,
      };
      
      success = await onCreate(createData);
    }

    if (success) {
      handleClose();
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        reset({
          name: editingUser.name,
          email: editingUser.email,
          password: '', // Always empty for edit
          role_id: editingUser.role.ID,
          is_active: editingUser.is_active,
        });
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          role_id: 0,
          is_active: true,
        });
      }
    }
  }, [isOpen, editingUser, reset]);

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    {...register('name', {
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                      maxLength: {
                        value: 100,
                        message: 'Name must be less than 100 characters',
                      },
                    })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                    placeholder="Enter full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role_id"
                  {...register('role_id', {
                    required: 'Role is required',
                    valueAsNumber: true,
                    validate: value => value > 0 || 'Please select a role',
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                >
                  <option value={0}>Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {errors.role_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.role_id.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password {!editingUser && <span className="text-red-500">*</span>}
                  {editingUser && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  {...register('password', {
                    required: !editingUser ? 'Password is required' : false,
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                  placeholder={editingUser ? "Enter new password" : "Enter password"}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {editingUser && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    {...register('is_active')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    User is active
                  </label>
                </div>
              )}
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
                {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
