import { useState, useEffect } from 'react';
import { PlusIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { theatersApi } from '../services/api';
import TheaterList from '../components/theaters/TheaterList';
import TheaterFilters from '../components/theaters/TheaterFilters';
import TheaterFormModal from '../components/theaters/TheaterFormModal';
import ConfirmDeleteModal from '../components/shared/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import type { Theater } from '../types';

export default function Theaters() {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTheater, setEditingTheater] = useState<Theater | null>(null);
  const [deleteTheater, setDeleteTheater] = useState<Theater | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTheaters, setTotalTheaters] = useState(0);

  // Check if user is admin (implement based on your auth system)
  const isAdmin = true; // Replace with actual admin check

  const fetchTheaters = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 12
      };

      if (cityFilter) params.city = cityFilter;
      if (stateFilter) params.state = stateFilter;
      if (statusFilter) params.is_active = statusFilter === 'active';

      const response = await theatersApi.getAll(params);
      
      if (response.success) {
        let filteredTheaters = response.data.data;
        
        // Client-side search filter
        if (searchTerm) {
          filteredTheaters = filteredTheaters.filter((theater: Theater) =>
            theater.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setTheaters(filteredTheaters);
        setCurrentPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.total_pages);
        setTotalTheaters(response.data.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to fetch theaters');
      console.error('Error fetching theaters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheaters(currentPage);
  }, [currentPage, cityFilter, stateFilter, statusFilter]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchTheaters(1);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  // Modal handlers
  const handleOpenFormModal = (theater?: Theater) => {
    setEditingTheater(theater || null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingTheater(null);
  };

  const handleFormSuccess = () => {
    fetchTheaters(currentPage);
  };

  // Delete handler
  const handleDeleteTheater = async (theater: Theater): Promise<boolean> => {
    try {
      await theatersApi.delete(theater.id);
      toast.success('Theater deleted successfully');
      fetchTheaters(currentPage);
      return true;
    } catch (error) {
      toast.error('Failed to delete theater');
      console.error('Error deleting theater:', error);
      return false;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="flex items-center">
          <BuildingOffice2Icon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Theaters</h1>
            <p className="mt-2 text-sm text-gray-700">
              {isAdmin ? 'Manage movie theaters' : 'Browse movie theaters near you'}
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <p className="text-sm text-gray-500">
            {totalTheaters} theater{totalTheaters !== 1 ? 's' : ''} found
          </p>
          {isAdmin && (
            <button
              onClick={() => handleOpenFormModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Theater
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <TheaterFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        cityFilter={cityFilter}
        onCityChange={setCityFilter}
        stateFilter={stateFilter}
        onStateChange={setStateFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Theater List */}
      <TheaterList 
        theaters={theaters} 
        loading={loading}
        onEdit={isAdmin ? handleOpenFormModal : undefined}
        onDelete={isAdmin ? setDeleteTheater : undefined}
        showActions={isAdmin}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      <TheaterFormModal
        isOpen={isFormModalOpen}
        editingTheater={editingTheater}
        onClose={handleCloseFormModal}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTheater}
        item={deleteTheater}
        itemName={deleteTheater?.name || ''}
        onClose={() => setDeleteTheater(null)}
        onConfirm={handleDeleteTheater}
      />
    </div>
  );
}
