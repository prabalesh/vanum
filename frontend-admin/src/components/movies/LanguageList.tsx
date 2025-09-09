// components/movies/LanguageList.tsx
import { useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { languagesApi } from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal';
import type { Movie, MovieLanguage } from '../../types';

interface LanguageListProps {
  movie: Movie;
  onEdit: (movieLanguage: MovieLanguage) => void;
  onSuccess: () => void;
}

export default function LanguageList({ movie, onEdit, onSuccess }: LanguageListProps) {
  const [deleteLanguage, setDeleteLanguage] = useState<MovieLanguage | null>(null);

  const handleDeleteLanguage = async (movieLanguage: MovieLanguage): Promise<boolean> => {
    try {
      await languagesApi.delete(movie.id, movieLanguage.language_id);
      toast.success('Language removed successfully');
      onSuccess();
      return true;
    } catch (error) {
      toast.error('Failed to remove language');
      console.error('Error:', error);
      return false;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {movie.movie_languages && movie.movie_languages.length > 0 ? (
          movie.movie_languages.map((ml) => (
            <div key={ml.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-gray-900">
                    {ml.language.native_name}
                    <span className="text-gray-500 ml-2">({ml.language.name})</span>
                  </h4>
                  <p className="text-gray-700 mt-1">{ml.title}</p>
                  {ml.description && (
                    <p className="text-gray-600 mt-2 text-sm">{ml.description}</p>
                  )}
                  <div className="flex gap-3 mt-3">
                    {ml.has_audio && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        🎵 Audio {ml.audio_format && `(${ml.audio_format})`}
                      </span>
                    )}
                    {ml.has_subtitles && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        📝 Subtitles {ml.subtitle_format && `(${ml.subtitle_format})`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => onEdit(ml)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit language"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteLanguage(ml)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Remove language"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No languages added yet. Click "Add Language" to get started.</p>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteLanguage}
        item={deleteLanguage}
        itemName={deleteLanguage ? `${deleteLanguage.language.native_name} language` : ''}
        onClose={() => setDeleteLanguage(null)}
        onConfirm={handleDeleteLanguage}
      />
    </>
  );
}
