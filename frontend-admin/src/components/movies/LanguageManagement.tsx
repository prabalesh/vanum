import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { moviesApi } from '../../services/api';
import type { Movie, Language, MovieLanguage } from '../../types';
import LanguageForm from './LanguageForm';
import LanguageList from './LanguageList';

interface LanguageManagementProps {
  movie: Movie;
  allLanguages: Language[];
  setMovie: React.Dispatch<React.SetStateAction<Movie | null>>;
}

export default function LanguageManagement({ movie, allLanguages, setMovie }: LanguageManagementProps) {
  const [showLanguageForm, setShowLanguageForm] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<MovieLanguage | null>(null);

  const refreshMovie = async () => {
    const updatedMovie = await moviesApi.getById(movie.id);
    if (updatedMovie.success) {
      setMovie(updatedMovie.data);
    }
  };

  const handleFormClose = () => {
    setShowLanguageForm(false);
    setEditingLanguage(null);
  };

  const handleEditLanguage = (movieLanguage: MovieLanguage) => {
    setEditingLanguage(movieLanguage);
    setShowLanguageForm(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Available Languages</h2>
        <button
          onClick={() => setShowLanguageForm(!showLanguageForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Language
        </button>
      </div>

      {showLanguageForm && (
        <LanguageForm
          movie={movie}
          allLanguages={allLanguages}
          editingLanguage={editingLanguage}
          onClose={handleFormClose}
          onSuccess={refreshMovie}
        />
      )}

      <LanguageList
        movie={movie}
        onEdit={handleEditLanguage}
        onSuccess={refreshMovie}
      />
    </div>
  );
}
