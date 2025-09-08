// components/Movies.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  FilmIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Dialog, DialogPanel } from '@headlessui/react';
import type { Movie, MovieFormData } from '../types';
import { moviesApi } from '../services/api';

export default function Movies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovieFormData>();

  const limit = 10;

  // Fetch movies
  const fetchMovies = async (page = 1) => {
    try {
      setLoading(true);
      const response = await moviesApi.getAll(page, limit, searchTerm || undefined, genreFilter || undefined);
      if (response.success) {
        setMovies(response.data);
        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.total_pages);
        setTotalMovies(response.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to fetch movies');
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(currentPage);
  }, [currentPage, searchTerm, genreFilter]);

  // Handle form submission
  // In your Movies component
const onSubmit = async (data: MovieFormData) => {
  try {
    // Convert date string to ISO format before sending
    const preparedData = {
      ...data,
      release_date: new Date(data.release_date).toISOString(), // "2025-09-05T00:00:00.000Z"
    };

    if (editingMovie) {
      const response = await moviesApi.update(editingMovie.id, preparedData);
      if (response.success) {
        toast.success('Movie updated successfully');
        fetchMovies(currentPage);
      }
    } else {
      const response = await moviesApi.create(preparedData);
      if (response.success) {
        toast.success('Movie created successfully');
        fetchMovies(currentPage);
      }
    }
    handleCloseModal();
  } catch (error) {
    toast.error(editingMovie ? 'Failed to update movie' : 'Failed to create movie');
    console.error('Error submitting form:', error);
  }
};


  // Handle delete
  const handleDelete = async (movie: Movie) => {
    try {
      const response = await moviesApi.delete(movie.id);
      if (response.success) {
        toast.success('Movie deleted successfully');
        fetchMovies(currentPage);
        setDeleteConfirm(null);
      }
    } catch (error) {
      toast.error('Failed to delete movie');
      console.error('Error deleting movie:', error);
    }
  };

  // Modal handlers
  const handleOpenModal = (movie?: Movie) => {
    setEditingMovie(movie || null);
    setIsModalOpen(true);
    if (movie) {
      reset({
        original_title: movie.original_title,
        duration_minutes: movie.duration_minutes,
        release_date: movie.release_date.split('T')[0], // Convert to YYYY-MM-DD
        genre: movie.genre,
        rating: movie.rating,
        description: movie.description,
        poster_url: movie.poster_url,
        director: movie.director,
        cast: movie.cast,
      });
    } else {
      reset();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMovie(null);
    reset();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading && movies.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Genres</option>
            <option value="Action">Action</option>
            <option value="Comedy">Comedy</option>
            <option value="Drama">Drama</option>
            <option value="Horror">Horror</option>
            <option value="Romance">Romance</option>
            <option value="Thriller">Thriller</option>
          </select>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
        {movies.map((movie) => (
          <div key={movie.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {movie.genre}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenModal(movie)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                    title="Edit movie"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(movie)}
                    className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                    title="Delete movie"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMovie ? 'Edit Movie' : 'Create New Movie'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="original_title" className="block text-sm font-medium text-gray-700 mb-1">
                    Movie Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="original_title"
                    {...register('original_title', {
                      required: 'Movie title is required',
                      minLength: { value: 1, message: 'Title must be at least 1 character' },
                      maxLength: { value: 255, message: 'Title must be less than 255 characters' },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter movie title"
                  />
                  {errors.original_title && (
                    <p className="mt-1 text-sm text-red-600">{errors.original_title.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="duration_minutes"
                    {...register('duration_minutes', {
                      required: 'Duration is required',
                      min: { value: 1, message: 'Duration must be at least 1 minute' },
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="120"
                  />
                  {errors.duration_minutes && (
                    <p className="mt-1 text-sm text-red-600">{errors.duration_minutes.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="release_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Release Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="release_date"
                    {...register('release_date', {
                      required: 'Release date is required',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.release_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.release_date.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">
                    Genre
                  </label>
                  <select
                    id="genre"
                    {...register('genre')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Genre</option>
                    <option value="Action">Action</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Drama">Drama</option>
                    <option value="Horror">Horror</option>
                    <option value="Romance">Romance</option>
                    <option value="Thriller">Thriller</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                    Rating
                  </label>
                  <select
                    id="rating"
                    {...register('rating')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Rating</option>
                    <option value="U">U</option>
                    <option value="U/A">U/A</option>
                    <option value="A">A</option>
                    <option value="S">S</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="director" className="block text-sm font-medium text-gray-700 mb-1">
                    Director
                  </label>
                  <input
                    type="text"
                    id="director"
                    {...register('director', {
                      maxLength: { value: 255, message: 'Director name must be less than 255 characters' },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Director name"
                  />
                  {errors.director && (
                    <p className="mt-1 text-sm text-red-600">{errors.director.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="cast" className="block text-sm font-medium text-gray-700 mb-1">
                    Cast
                  </label>
                  <input
                    type="text"
                    id="cast"
                    {...register('cast')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Main cast members"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="poster_url" className="block text-sm font-medium text-gray-700 mb-1">
                    Poster URL
                  </label>
                  <input
                    type="url"
                    id="poster_url"
                    {...register('poster_url', {
                      maxLength: { value: 500, message: 'URL must be less than 500 characters' },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/poster.jpg"
                  />
                  {errors.poster_url && (
                    <p className="mt-1 text-sm text-red-600">{errors.poster_url.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    {...register('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Movie description"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : editingMovie ? 'Update Movie' : 'Create Movie'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} className="relative z-50">
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
                  <h3 className="text-lg font-medium text-gray-900">Delete Movie</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Are you sure you want to delete "{deleteConfirm?.original_title}"? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Delete Movie
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
