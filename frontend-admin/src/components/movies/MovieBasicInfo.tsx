import type { Movie } from '../../types';

interface MovieBasicInfoProps {
  movie: Movie;
}

export default function MovieBasicInfo({ movie }: MovieBasicInfoProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
      <div className="lg:flex">
        {/* Poster */}
        <div className="lg:w-1/3">
          <img
            src={movie.poster_url || '/placeholder-poster.jpg'}
            alt={movie.original_title}
            className="w-full h-96 lg:h-full object-cover"
          />
        </div>

        {/* Movie Info */}
        <div className="lg:w-2/3 p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {movie.original_title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
              {movie.rating}
            </span>
            <span>{formatDuration(movie.duration_minutes)}</span>
            <span>{new Date(movie.release_date).getFullYear()}</span>
          </div>

          {movie.description && (
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {movie.description}
            </p>
          )}

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span key={genre.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cast */}
          {movie.cast && movie.cast.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Cast</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {movie.cast.map((person) => (
                  <div key={person.id} className="text-gray-700">
                    {person.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
