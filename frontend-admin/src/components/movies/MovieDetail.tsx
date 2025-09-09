import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { languagesApi, moviesApi } from '../../services/api';
import type { Movie, Language } from '../../types';
import MovieBasicInfo from './MovieBasicInfo';
import LanguageManagement from './LanguageManagement';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [movieResponse, languagesResponse] = await Promise.all([
          moviesApi.getById(parseInt(id)),
          languagesApi.getAll()
        ]);

        if (movieResponse.success) {
          setMovie(movieResponse.data);
        } else {
          setError('Movie not found');
        }

        if (languagesResponse.success) {
          setAllLanguages(languagesResponse.data);
        }
      } catch (err) {
        setError('Failed to load movie details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {error || 'Movie not found'}
          </h2>
          <button
            onClick={() => navigate('/movies')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Movies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Movies
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <MovieBasicInfo movie={movie} />
        <LanguageManagement 
          movie={movie} 
          allLanguages={allLanguages} 
          setMovie={setMovie} 
        />
      </div>
    </div>
  );
}
