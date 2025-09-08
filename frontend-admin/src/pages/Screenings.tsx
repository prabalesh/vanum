// components/Screenings.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  FilmIcon,
  LanguageIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';
import { Dialog, DialogPanel } from '@headlessui/react';
import type { Screening, ScreeningFormData, Movie, Language, Screen } from '../types';
import { screeningsApi, moviesApi, languagesApi } from '../services/api';

export default function Screenings() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalScreenings, setTotalScreenings] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScreening, setEditingScreening] = useState<Screening | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Screening | null>(null);

  // Filters
  const [selectedMovie, setSelectedMovie] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScreeningFormData>();

  const limit = 10;

  // Fetch data
  const fetchScreenings = async (page = 1) => {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedMovie > 0) filters.movie_id = selectedMovie;
      if (selectedLanguage > 0) filters.language_id = selectedLanguage;
      if (selectedDate) filters.date = selectedDate;

      const response = await screeningsApi.getAll(page, limit, filters);
      if (response.success) {
        setScreenings(response.data);
        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.total_pages);
        setTotalScreenings(response.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to fetch screenings');
      console.error('Error fetching screenings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const response = await moviesApi.getAll(1, 100);
      if (response.success) {
        setMovies(response.data);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  const fetchLanguages = async () => {
    try {
      const response = await languagesApi.getAll();
      if (response.success) {
        setLanguages(response.data);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  useEffect(() => {
    fetchScreenings(currentPage);
  }, [currentPage, selectedMovie, selectedLanguage, selectedDate]);

  useEffect(() => {
    fetchMovies();
    fetchLanguages();
    // Fetch screens from API (you'll need to implement this)
  }, []);

  // Handle form submission
  const onSubmit = async (data: ScreeningFormData) => {
    try {
      // Convert date and time strings to proper format
      const screeningData = {
        ...data,
        show_date: data.show_date + 'T00:00:00Z',
        show_time: '2000-01-01T' + data.show_time + ':00Z',
        end_time: '2000-01-01T' + data.end_time + ':00Z',
      };

      if (editingScreening) {
        const response = await screeningsApi.update(editingScreening.id, screeningData);
        if (response.success) {
          toast.success('Screening updated successfully');
          fetchScreenings(currentPage);
        }
      } else {
        const response = await screeningsApi.create(screeningData);
        if (response.success) {
          toast.success('Screening created successfully');
          fetchScreenings(currentPage);
        }
      }
      handleCloseModal();
    } catch (error) {
      toast.error(editingScreening ? 'Failed to update screening' : 'Failed to create screening');
      console.error('Error submitting form:', error);
    }
  };

  // Handle delete
  const handleDelete = async (screening: Screening) => {
    try {
      const response = await screeningsApi.delete(screening.id);
      if (response.success) {
        toast.success('Screening deleted successfully');
        fetchScreenings(currentPage);
        setDeleteConfirm(null);
      }
    } catch (error) {
      toast.error('Failed to delete screening');
      console.error('Error deleting screening:', error);
    }
  };

  // Modal handlers
  const handleOpenModal = (screening?: Screening) => {
    setEditingScreening(screening || null);
    setIsModalOpen(true);
    if (screening) {
      reset({
        movie_id: screening.movie_id,
        screen_id: screening.screen_id,
        language_id: screening.language_id,
        subtitle_language_id: screening.subtitle_language_id,
        show_date: screening.show_date.split('T')[0],
        show_time: screening.show_time.substring(11, 16),
        end_time: screening.end_time.substring(11, 16),
        base_price: screening.base_price,
        premium_price: screening.premium_price,
        available_seats: screening.available_seats,
        audio_format: screening.audio_format,
        video_format: screening.video_format,
      });
    } else {
      reset();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingScreening(null);
    reset();
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(11, 16);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Group screenings by movie and date for better display
  const groupScreenings = () => {
    const grouped: { [key: string]: { [key: string]: Screening[] } } = {};
    
    screenings.forEach(screening => {
      const movieKey = `${screening.movie.id}-${screening.movie.original_title}`;
      const dateKey = screening.show_date.split('T')[0];
      
      if (!grouped[movieKey]) {
        grouped[movieKey] = {};
      }
      if (!grouped[movieKey][dateKey]) {
        grouped[movieKey][dateKey] = [];
      }
      grouped[movieKey][dateKey].push(screening);
    });
    
    return grouped;
  };

  if (loading && screenings.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const groupedScreenings = groupScreenings();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="flex items-center">
          <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Screenings</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage movie screenings across different languages and showtimes.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Screening
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Movie</label>
          <select
            value={selectedMovie}
            onChange={(e) => setSelectedMovie(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={0}>All Movies</option>
            {movies.map(movie => (
              <option key={movie.id} value={movie.id}>{movie.original_title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={0}>All Languages</option>
            {languages.map(language => (
              <option key={language.id} value={language.id}>{language.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedMovie(0);
              setSelectedLanguage(0);
              setSelectedDate('');
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Screenings Display */}
      <div className="space-y-6">
        {Object.entries(groupedScreenings).length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">No screenings found</p>
            <p className="text-sm text-gray-500">Create your first screening to get started.</p>
          </div>
        ) : (
          Object.entries(groupedScreenings).map(([movieKey, dates]) => {
            const movieTitle = movieKey.split('-').slice(1).join('-');
            return (
              <div key={movieKey} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FilmIcon className="h-5 w-5 mr-2 text-blue-600" />
                    {movieTitle}
                  </h3>
                </div>
                <div className="p-6">
                  {Object.entries(dates).map(([date, dateScreenings]) => (
                    <div key={date} className="mb-6 last:mb-0">
                      <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {formatDate(date)}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dateScreenings.map(screening => (
                          <div key={screening.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <LanguageIcon className="h-4 w-4 mr-1 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                  {screening.language.name}
                                </span>
                                {screening.subtitle_language && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    (Sub: {screening.subtitle_language.name})
                                  </span>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleOpenModal(screening)}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                                  title="Edit screening"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(screening)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                                  title="Delete screening"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <ClockIcon className="h-4 w-4 mr-2" />
                                {formatTime(screening.show_time)} - {formatTime(screening.end_time)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <CurrencyRupeeIcon className="h-4 w-4 mr-2" />
                                ₹{screening.base_price}
                                {screening.premium_price && ` - ₹${screening.premium_price}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                Screen: {screening.screen.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                Available: {screening.available_seats} seats
                              </div>
                              <div className="flex space-x-2">
                                {screening.video_format && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {screening.video_format}
                                  </span>
                                )}
                                {screening.audio_format && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    {screening.audio_format}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingScreening ? 'Edit Screening' : 'Create New Screening'}
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
                <div>
                  <label htmlFor="movie_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Movie <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="movie_id"
                    {...register('movie_id', {
                      required: 'Movie is required',
                      valueAsNumber: true,
                      validate: value => value > 0 || 'Please select a movie',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>Select Movie</option>
                    {movies.map(movie => (
                      <option key={movie.id} value={movie.id}>{movie.original_title}</option>
                    ))}
                  </select>
                  {errors.movie_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.movie_id.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="language_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="language_id"
                    {...register('language_id', {
                      required: 'Language is required',
                      valueAsNumber: true,
                      validate: value => value > 0 || 'Please select a language',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>Select Language</option>
                    {languages.map(language => (
                      <option key={language.id} value={language.id}>{language.name}</option>
                    ))}
                  </select>
                  {errors.language_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.language_id.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="subtitle_language_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle Language
                  </label>
                  <select
                    id="subtitle_language_id"
                    {...register('subtitle_language_id', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Subtitles</option>
                    {languages.map(language => (
                      <option key={language.id} value={language.id}>{language.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="screen_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Screen <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="screen_id"
                    {...register('screen_id', {
                      required: 'Screen is required',
                      valueAsNumber: true,
                      validate: value => value > 0 || 'Please select a screen',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>Select Screen</option>
                    {/* You'll need to populate screens from API */}
                    <option value={1}>Screen 1</option>
                    <option value={2}>Screen 2</option>
                  </select>
                  {errors.screen_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.screen_id.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="show_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Show Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="show_date"
                    {...register('show_date', {
                      required: 'Show date is required',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.show_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.show_date.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="show_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Show Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="show_time"
                    {...register('show_time', {
                      required: 'Show time is required',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.show_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.show_time.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="end_time"
                    {...register('end_time', {
                      required: 'End time is required',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.end_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="base_price"
                    {...register('base_price', {
                      required: 'Base price is required',
                      min: { value: 0, message: 'Price must be at least 0' },
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="150.00"
                  />
                  {errors.base_price && (
                    <p className="mt-1 text-sm text-red-600">{errors.base_price.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="premium_price" className="block text-sm font-medium text-gray-700 mb-1">
                    Premium Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="premium_price"
                    {...register('premium_price', {
                      min: { value: 0, message: 'Price must be at least 0' },
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="200.00"
                  />
                  {errors.premium_price && (
                    <p className="mt-1 text-sm text-red-600">{errors.premium_price.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="available_seats" className="block text-sm font-medium text-gray-700 mb-1">
                    Available Seats <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="available_seats"
                    {...register('available_seats', {
                      required: 'Available seats is required',
                      min: { value: 1, message: 'Must have at least 1 seat' },
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="200"
                  />
                  {errors.available_seats && (
                    <p className="mt-1 text-sm text-red-600">{errors.available_seats.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="video_format" className="block text-sm font-medium text-gray-700 mb-1">
                    Video Format
                  </label>
                  <select
                    id="video_format"
                    {...register('video_format')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Format</option>
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                    <option value="IMAX">IMAX</option>
                    <option value="4DX">4DX</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="audio_format" className="block text-sm font-medium text-gray-700 mb-1">
                    Audio Format
                  </label>
                  <select
                    id="audio_format"
                    {...register('audio_format')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Format</option>
                    <option value="Stereo">Stereo</option>
                    <option value="Dolby Atmos">Dolby Atmos</option>
                    <option value="7.1 Surround">7.1 Surround</option>
                    <option value="DTS">DTS</option>
                  </select>
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
                  {isSubmitting ? 'Saving...' : editingScreening ? 'Update Screening' : 'Create Screening'}
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
                  <h3 className="text-lg font-medium text-gray-900">Delete Screening</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Are you sure you want to delete this screening? This action cannot be undone.
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
                  Delete Screening
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
