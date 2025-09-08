import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Movie, MovieFormData } from '../../types';

interface MovieFormModalProps {
  isOpen: boolean;
  editingMovie: Movie | null;
  onClose: () => void;
  onCreate: (data: MovieFormData) => Promise<boolean>;
  onUpdate: (id: number, data: MovieFormData) => Promise<boolean>;
}

export default function MovieFormModal({
  isOpen,
  editingMovie,
  onClose,
  onCreate,
  onUpdate,
}: MovieFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovieFormData>();

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: MovieFormData) => {
    let success = false;

    if (editingMovie) {
      success = await onUpdate(editingMovie.id, data);
    } else {
      success = await onCreate(data);
    }

    if (success) {
      handleClose();
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingMovie) {
        reset({
          original_title: editingMovie.original_title,
          duration_minutes: editingMovie.duration_minutes,
          release_date: editingMovie.release_date.split('T')[0], // Convert to YYYY-MM-DD
          genre: editingMovie.genre,
          rating: editingMovie.rating,
          description: editingMovie.description,
          poster_url: editingMovie.poster_url,
          director: editingMovie.director,
          cast: editingMovie.cast,
        });
      } else {
        reset();
      }
    }
  }, [isOpen, editingMovie, reset]);

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingMovie ? 'Edit Movie' : 'Create New Movie'}
            </h3>
            <button
              onClick={handleClose}
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
                onClick={handleClose}
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
  );
}
