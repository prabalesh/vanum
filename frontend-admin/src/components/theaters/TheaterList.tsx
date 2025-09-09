import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import TheaterCard from './TheaterCard';
import type { Theater } from '../../types';

interface TheaterListProps {
  theaters: Theater[];
  loading: boolean;
  onEdit?: (theater: Theater) => void;
  onDelete?: (theater: Theater) => void;
  showActions?: boolean;
}

export default function TheaterList({ 
  theaters, 
  loading, 
  onEdit, 
  onDelete, 
  showActions = false 
}: TheaterListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (theaters.length === 0) {
    return (
      <div className="text-center py-12">
        <BuildingOffice2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900">No theaters found</p>
        <p className="text-sm text-gray-500">Try adjusting your search filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {theaters.map((theater) => (
        <TheaterCard
          key={theater.id}
          theater={theater}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
