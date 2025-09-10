import { FilmIcon } from '@heroicons/react/24/outline';
import type { Movie, Genre } from '../../types';
import MovieCard from './MovieCard';

interface MoviesListProps {
  movies: Movie[];
  genres: Genre[];
  loading: boolean;
  searchTerm: string;
  genreFilter: string;
  onSearchChange: (search: string) => void;
  onGenreChange: (genre: string) => void;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
}

export default function MoviesList({
  movies,
  genres,
  loading,
  searchTerm,
  genreFilter,
  onSearchChange,
  onGenreChange,
  onEdit,
  onDelete,
}: MoviesListProps) {
  if (loading && movies.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <select
            value={genreFilter}
            onChange={(e) => onGenreChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Movies Grid */}
      {movies.length === 0 ? (
        <div className="text-center py-12">
          <FilmIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">No movies found</p>
          <p className="text-sm text-gray-500">Create your first movie to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}
