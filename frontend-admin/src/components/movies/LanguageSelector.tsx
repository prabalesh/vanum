import type { Language } from '../../types';

interface LanguageSelectorProps {
  languages: Language[];
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
}

export default function LanguageSelector({ 
  languages, 
  selectedLanguage, 
  onLanguageChange 
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">Language:</label>
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.native_name} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
}
