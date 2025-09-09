// components/movies/MovieCard.tsx
import { useNavigate } from 'react-router-dom';
import {
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { Movie } from '../../types';

interface MovieCardProps {
  movie: Movie;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
}

export default function MovieCard({ movie, onEdit, onDelete }: MovieCardProps) {
  const navigate = useNavigate();
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Handle card click to navigate to details
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if user clicked on edit/delete buttons
    if (e.target instanceof Element && 
        (e.target.closest('button') || e.target.tagName === 'BUTTON')) {
      return;
    }
    navigate(`/movies/${movie.id}`);
  };

  // Handle button clicks to prevent event bubbling
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(movie);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(movie);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="aspect-w-2 aspect-h-3">
        <img
          src={movie.poster_url || '/placeholder-poster.jpg'}
          alt={movie.original_title}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{movie.original_title}</h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <ClockIcon className="h-4 w-4 mr-1" />
          {formatDuration(movie.duration_minutes)}
        </div>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <CalendarIcon className="h-4 w-4 mr-1" />
          {new Date(movie.release_date).getFullYear()}
        </div>

        {/* Display multiple genres */}
        <div className="mb-2">
          <div className="flex flex-wrap gap-1">
            {movie.genres && movie.genres.length > 0 ? (
              <>
                {movie.genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {genre.name}
                  </span>
                ))}
                {movie.genres.length > 2 && (
                  <span className="text-xs text-gray-500">+{movie.genres.length - 2} more</span>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-500 italic">No genres available</span>
            )}
          </div>
        </div>

        {/* Display cast */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-gray-600">
              Cast: {movie.cast.slice(0, 2).map(person => person.name).join(', ')}
              {movie.cast.length > 2 && '...'}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {movie.rating}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={handleEditClick}
              className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
              title="Edit movie"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
              title="Delete movie"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
