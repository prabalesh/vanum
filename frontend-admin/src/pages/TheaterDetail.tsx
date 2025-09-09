import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, MapPinIcon, BuildingOfficeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { theatersApi } from '../services/api';
import TheaterFormModal from '../components/theaters/TheaterFormModal';
import ConfirmDeleteModal from '../components/shared/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import type { Theater } from '../types';

export default function TheaterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [theater, setTheater] = useState<Theater | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if user is admin (implement based on your auth system)
  const isAdmin = true; // Replace with actual admin check

  useEffect(() => {
    if (!id) return;

    const fetchTheater = async () => {
      try {
        setLoading(true);
        const response = await theatersApi.getById(parseInt(id));
        if (response.success) {
          setTheater(response.data);
        } else {
          toast.error('Theater not found');
          navigate('/theaters');
        }
      } catch (error) {
        toast.error('Failed to load theater details');
        navigate('/theaters');
      } finally {
        setLoading(false);
      }
    };

    fetchTheater();
  }, [id, navigate]);

  const handleEditSuccess = () => {
    if (theater) {
      // Refresh theater data
      theatersApi.getById(theater.id).then(response => {
        if (response.success) {
          setTheater(response.data);
        }
      });
    }
  };

  const handleDeleteTheater = async (theater: Theater): Promise<boolean> => {
    try {
      await theatersApi.delete(theater.id);
      toast.success('Theater deleted successfully');
      navigate('/theaters');
      return true;
    } catch (error) {
      toast.error('Failed to delete theater');
      console.error('Error deleting theater:', error);
      return false;
    }
  };

  const handleToggleStatus = async () => {
    if (!theater) return;

    try {
      const response = await theatersApi.toggleStatus(theater.id);
      if (response.success) {
        setTheater(response.data);
        const status = response.data.is_active ? 'activated' : 'deactivated';
        toast.success(`Theater ${status} successfully`);
      }
    } catch (error) {
      toast.error('Failed to update theater status');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!theater) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/theaters')}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Theaters
            </button>
            
            {isAdmin && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={handleToggleStatus}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    theater.is_active
                      ? 'text-red-600 border border-red-600 hover:bg-red-50'
                      : 'text-green-600 border border-green-600 hover:bg-green-50'
                  }`}
                >
                  {theater.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {theater.name}
              </h1>
              <div className="flex items-start text-gray-600 mb-4">
                <MapPinIcon className="h-6 w-6 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-lg">{theater.address}</p>
                  <p className="text-lg">{theater.city}, {theater.state}</p>
                </div>
              </div>
            </div>
            
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              theater.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {theater.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {theater.screens && theater.screens.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center mb-4">
                <BuildingOfficeIcon className="h-6 w-6 mr-2 text-gray-600" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Screens ({theater.screens.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {theater.screens.map((screen) => (
                  <div key={screen.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{screen.name}</h3>
                    {screen.capacity && (
                      <p className="text-sm text-gray-600 mt-1">
                        Capacity: {screen.capacity} seats
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TheaterFormModal
        isOpen={isEditModalOpen}
        editingTheater={theater}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        item={theater}
        itemName={theater.name}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTheater}
      />
    </div>
  );
}
