import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import type { Theater } from '../../types';

interface TheaterCardProps {
  theater: Theater;
  onEdit?: (theater: Theater) => void;
  onDelete?: (theater: Theater) => void;
  showActions?: boolean;
}

export default function TheaterCard({ 
  theater, 
  onEdit, 
  onDelete, 
  showActions = false 
}: TheaterCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/theaters/${theater.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(theater);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(theater);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={handleCardClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {theater.name}
            </h3>
            <div className="flex items-start text-gray-600 mb-2">
              <MapPinIcon className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm">{theater.address}</p>
                <p className="text-sm">{theater.city}, {theater.state}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center ml-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              theater.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {theater.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {theater.screens && theater.screens.length > 0 && (
          <div className="flex items-center text-gray-500 mb-4">
            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">{theater.screens.length} Screen{theater.screens.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {showActions && (
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
            <button
              onClick={handleEditClick}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteClick}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
