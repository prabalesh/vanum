import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import type { Movie, Genre, Person, MovieFormData } from '../../types';

interface MovieFormModalProps {
  isOpen: boolean;
  editingMovie: Movie | null;
  genres: Genre[];
  persons: Person[];
  onClose: () => void;
  onCreate: (data: MovieFormData) => Promise<boolean>;
  onUpdate: (id: number, data: MovieFormData) => Promise<boolean>;
}

interface FormData {
  original_title: string;
  duration_minutes: number;
  release_date: string;
  rating: string;
  description: string;
  poster_url: string;
  genre_ids: { value: number; label: string }[];
  cast_ids: { value: number; label: string }[];
}

export default function MovieFormModal({
  isOpen,
  editingMovie,
  genres,
  persons,
  onClose,
  onCreate,
  onUpdate,
}: MovieFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    const formData: MovieFormData = {
      original_title: data.original_title,
      duration_minutes: data.duration_minutes,
      release_date: data.release_date,
      rating: data.rating,
      description: data.description,
      poster_url: data.poster_url,
      genre_ids: data.genre_ids.map(g => g.value),
      cast_ids: data.cast_ids.map(c => c.value),
    };

    let success = false;
    if (editingMovie) {
      success = await onUpdate(editingMovie.id, formData);
    } else {
      success = await onCreate(formData);
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
          release_date: editingMovie.release_date.split('T')[0],
          rating: editingMovie.rating,
          description: editingMovie.description || '',
          poster_url: editingMovie.poster_url || '',
          genre_ids: editingMovie.genres?.map(g => ({ value: g.id, label: g.name })) || [],
          cast_ids: editingMovie.cast?.map(c => ({ value: c.id, label: c.name })) || [],
        });
      } else {
        reset({
          original_title: '',
          duration_minutes: 0,
          release_date: '',
          rating: 'U',
          description: '',
          poster_url: '',
          genre_ids: [],
          cast_ids: [],
        });
      }
    }
  }, [isOpen, editingMovie, reset]);

  const genreOptions = genres.map(genre => ({
    value: genre.id,
    label: genre.name
  }));

  const personOptions = persons.map(person => ({
    value: person.id,
    label: person.name
  }));

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
              
              {/* Movie Title */}
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

              {/* Duration */}
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

              {/* Release Date */}
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

              {/* Genres Multi-Select */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genres <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="genre_ids"
                  control={control}
                  rules={{ required: 'At least one genre is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={genreOptions}
                      isMulti
                      className="text-sm"
                      classNamePrefix="select"
                      placeholder="Select genres..."
                      closeMenuOnSelect={false}
                    />
                  )}
                />
                {errors.genre_ids && (
                  <p className="mt-1 text-sm text-red-600">{errors.genre_ids.message}</p>
                )}
              </div>

              {/* Cast Multi-Select */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cast
                </label>
                <Controller
                  name="cast_ids"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={personOptions}
                      isMulti
                      className="text-sm"
                      classNamePrefix="select"
                      placeholder="Select cast members..."
                      closeMenuOnSelect={false}
                    />
                  )}
                />
              </div>

              {/* Rating */}
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <select
                  id="rating"
                  {...register('rating')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="U">U</option>
                  <option value="U/A">U/A</option>
                  <option value="A">A</option>
                  <option value="S">S</option>
                </select>
              </div>

              {/* Poster URL */}
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

              {/* Description */}
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
