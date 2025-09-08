import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { moviesApi } from '../services/api';
import type { Movie, MovieFormData } from '../types';

export const useMovies = (limit = 10) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

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

  // Create movie
  const createMovie = async (data: MovieFormData) => {
    try {
      const preparedData = {
        ...data,
        release_date: new Date(data.release_date).toISOString(),
      };

      const response = await moviesApi.create(preparedData);
      if (response.success) {
        toast.success('Movie created successfully');
        fetchMovies(currentPage);
        return true;
      }
    } catch (error) {
      toast.error('Failed to create movie');
      console.error('Error creating movie:', error);
    }
    return false;
  };

  // Update movie
  const updateMovie = async (id: number, data: MovieFormData) => {
    try {
      const preparedData = {
        ...data,
        release_date: new Date(data.release_date).toISOString(),
      };

      const response = await moviesApi.update(id, preparedData);
      if (response.success) {
        toast.success('Movie updated successfully');
        fetchMovies(currentPage);
        return true;
      }
    } catch (error) {
      toast.error('Failed to update movie');
      console.error('Error updating movie:', error);
    }
    return false;
  };

  // Delete movie
  const deleteMovie = async (id: number) => {
    try {
      const response = await moviesApi.delete(id);
      if (response.success) {
        toast.success('Movie deleted successfully');
        fetchMovies(currentPage);
        return true;
      }
    } catch (error) {
      toast.error('Failed to delete movie');
      console.error('Error deleting movie:', error);
    }
    return false;
  };

  return {
    movies,
    loading,
    currentPage,
    totalPages,
    totalMovies,
    searchTerm,
    genreFilter,
    setSearchTerm,
    setGenreFilter,
    createMovie,
    updateMovie,
    deleteMovie,
    fetchMovies,
  };
};
