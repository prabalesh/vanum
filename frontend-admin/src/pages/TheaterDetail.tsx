import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  MapPinIcon, 
  BuildingOfficeIcon, 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { theatersApi, screensApi } from '../services/api';
import TheaterFormModal from '../components/theaters/TheaterFormModal';
import ScreenFormModal from '../components/screens/ScreenFormModal';
import ConfirmDeleteModal from '../components/shared/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import type { Theater, Screen } from '../types';

export default function TheaterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Theater state
  const [theater, setTheater] = useState<Theater | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [deleteScreen, setDeleteScreen] = useState<Screen | null>(null);

  // Check if user is admin (implement based on your auth system)
  const isAdmin = true; // Replace with actual admin check

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch theater details
        const theaterResponse = await theatersApi.getById(parseInt(id));
        if (theaterResponse.success) {
          setTheater(theaterResponse.data);
          
          // Fetch screens for this theater
          const screensResponse = await screensApi.getByTheater(parseInt(id));
          if (screensResponse.success) {
            setScreens(screensResponse.data);
          }
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

    fetchData();
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

  // Screen management handlers
  const fetchScreens = async () => {
    if (theater) {
      try {
        const response = await screensApi.getByTheater(theater.id);
        if (response.success) {
          setScreens(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch screens:', error);
      }
    }
  };

  const handleScreenFormSuccess = () => {
    fetchScreens();
  };

  const handleEditScreen = (screen: Screen) => {
    setEditingScreen(screen);
    setIsScreenModalOpen(true);
  };

  const handleDeleteScreen = async (screen: Screen): Promise<boolean> => {
    try {
      await screensApi.delete(screen.id);
      toast.success('Screen deleted successfully');
      fetchScreens();
      return true;
    } catch (error) {
      toast.error('Failed to delete screen');
      console.error('Error deleting screen:', error);
      return false;
    }
  };

  const handleViewScreenLayout = (screen: Screen) => {
    navigate(`/screens/${screen.id}`);
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
      {/* Header */}
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
        {/* Theater Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
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
        </div>

        {/* Screens Management */}
        {isAdmin && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-6 w-6 mr-2 text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Screens ({screens.length})
                </h2>
              </div>
              <button
                onClick={() => {
                  setEditingScreen(null);
                  setIsScreenModalOpen(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Screen
              </button>
            </div>

            {screens.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {screens.map((screen) => (
                  <div key={screen.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {screen.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Capacity: {screen.capacity} seats
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          screen.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {screen.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1 ml-4">
                        <button
                          onClick={() => handleViewScreenLayout(screen)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="View seat layout"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditScreen(screen)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit screen"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteScreen(screen)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete screen"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No screens added yet</p>
                <p className="text-sm">Click "Add Screen" to create your first screen with seat layout.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TheaterFormModal
        isOpen={isEditModalOpen}
        editingTheater={theater}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />

      <ScreenFormModal
        isOpen={isScreenModalOpen}
        theaterId={theater?.id || 0}
        editingScreen={editingScreen}
        onClose={() => {
          setIsScreenModalOpen(false);
          setEditingScreen(null);
        }}
        onSuccess={handleScreenFormSuccess}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        item={theater}
        itemName={theater.name}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTheater}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteScreen}
        item={deleteScreen}
        itemName={deleteScreen?.name || ''}
        onClose={() => setDeleteScreen(null)}
        onConfirm={handleDeleteScreen}
      />
    </div>
  );
}
