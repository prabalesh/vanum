// components/movies/LanguageForm.tsx
import { useState, useEffect } from 'react';
import { languagesApi } from '../../services/api';
import toast from 'react-hot-toast';
import type { Movie, Language, MovieLanguage, LanguageFormData } from '../../types';

interface LanguageFormProps {
  movie: Movie;
  allLanguages: Language[];
  editingLanguage: MovieLanguage | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LanguageForm({ movie, allLanguages, editingLanguage, onClose, onSuccess }: LanguageFormProps) {
  const [languageForm, setLanguageForm] = useState<LanguageFormData>({
    language_id: 0,
    title: '',
    description: '',
    has_audio: false,
    has_subtitles: false,
    audio_format: '',
    subtitle_format: ''
  });

  useEffect(() => {
    if (editingLanguage) {
      setLanguageForm({
        language_id: editingLanguage.language_id,
        title: editingLanguage.title,
        description: editingLanguage.description || '',
        has_audio: editingLanguage.has_audio || false,
        has_subtitles: editingLanguage.has_subtitles || false,
        audio_format: editingLanguage.audio_format || '',
        subtitle_format: editingLanguage.subtitle_format || ''
      });
    }
  }, [editingLanguage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (languageForm.language_id === 0) {
      toast.error('Please select a language');
      return;
    }

    try {
      if (editingLanguage) {
        await languagesApi.update(movie.id, editingLanguage.language_id, languageForm);
        toast.success('Language updated successfully');
      } else {
        await languagesApi.create(movie.id, languageForm);
        toast.success('Language added successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to save language');
      console.error('Error:', error);
    }
  };

  const availableLanguages = allLanguages.filter(lang => 
    !movie.movie_languages?.some(ml => ml.language_id === lang.id) || 
    editingLanguage?.language_id === lang.id
  );

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {editingLanguage ? 'Edit Language' : 'Add New Language'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language *
            </label>
            <select
              value={languageForm.language_id}
              onChange={(e) => setLanguageForm(prev => ({ ...prev, language_id: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!!editingLanguage}
            >
              <option value={0}>Select Language</option>
              {availableLanguages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.native_name} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title in this language *
            </label>
            <input
              type="text"
              value={languageForm.title}
              onChange={(e) => setLanguageForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description in this language
          </label>
          <textarea
            value={languageForm.description}
            onChange={(e) => setLanguageForm(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={languageForm.has_audio}
                onChange={(e) => setLanguageForm(prev => ({ ...prev, has_audio: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Audio available</span>
            </label>
            {languageForm.has_audio && (
              <input
                type="text"
                value={languageForm.audio_format}
                onChange={(e) => setLanguageForm(prev => ({ ...prev, audio_format: e.target.value }))}
                placeholder="Audio format (e.g., Dolby Atmos)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={languageForm.has_subtitles}
                onChange={(e) => setLanguageForm(prev => ({ ...prev, has_subtitles: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Subtitles available</span>
            </label>
            {languageForm.has_subtitles && (
              <input
                type="text"
                value={languageForm.subtitle_format}
                onChange={(e) => setLanguageForm(prev => ({ ...prev, subtitle_format: e.target.value }))}
                placeholder="Subtitle format (e.g., SRT)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {editingLanguage ? 'Update Language' : 'Add Language'}
          </button>
        </div>
      </form>
    </div>
  );
}
