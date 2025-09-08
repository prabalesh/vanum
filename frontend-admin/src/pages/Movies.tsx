import { useState } from 'react';
import { PlusIcon, FilmIcon } from '@heroicons/react/24/outline';
import { useMovies } from '../hooks/useMovies';
import MovieFormModal from '../components/movies/MovieFormModal';
import ConfirmDeleteModal from '../components/shared/ConfirmDeleteModal';
import type { Movie } from '../types';
import MoviesList from '../components/movies/MoviesList';

export default function Movies() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Movie | null>(null);

  const {
    movies,
    loading,
    searchTerm,
    genreFilter,
    setSearchTerm,
    setGenreFilter,
    createMovie,
    updateMovie,
    deleteMovie,
  } = useMovies(10);

  // Modal handlers
  const handleOpenModal = (movie?: Movie) => {
    setEditingMovie(movie || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMovie(null);
  };

  const handleDeleteMovie = async (movie: Movie): Promise<boolean> => {
    return await deleteMovie(movie.id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="flex items-center">
          <FilmIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Movies</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage movie catalog and information.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Movie
          </button>
        </div>
      </div>

      {/* Movies List */}
      <MoviesList
        movies={movies}
        loading={loading}
        searchTerm={searchTerm}
        genreFilter={genreFilter}
        onSearchChange={setSearchTerm}
        onGenreChange={setGenreFilter}
        onEdit={handleOpenModal}
        onDelete={setDeleteConfirm}
      />

      {/* Modals */}
      <MovieFormModal
        isOpen={isModalOpen}
        editingMovie={editingMovie}
        onClose={handleCloseModal}
        onCreate={createMovie}
        onUpdate={updateMovie}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteConfirm}
        item={deleteConfirm}
        itemName={deleteConfirm?.original_title || ''}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteMovie}
      />
    </div>
  );
}
