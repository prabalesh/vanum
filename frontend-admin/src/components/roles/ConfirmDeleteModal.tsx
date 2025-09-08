import { Dialog, DialogPanel } from '@headlessui/react';
import { TrashIcon } from '@heroicons/react/24/outline';
import type { Role } from '../../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  role: Role | null;
  onClose: () => void;
  onConfirm: (role: Role) => Promise<boolean>;
}

export default function ConfirmDeleteModal({ isOpen, role, onClose, onConfirm }: ConfirmDeleteModalProps) {
  const handleConfirm = async () => {
    if (role) {
      const success = await onConfirm(role);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-xl">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Role</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Are you sure you want to delete the role "{role?.name}"? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete Role
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
