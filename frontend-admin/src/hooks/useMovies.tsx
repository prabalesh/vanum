import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { genreApi, moviesApi } from '../services/api';
import type { Movie, Genre, Person, MovieFormData } from '../types';

export const useMovies = (limit = 10) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  // Fetch genres for dropdown
  const fetchGenres = async () => {
    try {
      const response = await genreApi.getAll();
      
      if(response.success) {
        setGenres(response.data);
      }
      
    } catch (error) {
      console.error('Failed to fetch genres', error);
    }
  };

  // Fetch persons (cast) for dropdown
  const fetchPersons = async () => {
    // try {
    //   const response = await fetch('/api/v1/persons?limit=100');
    //   const data = await response.json();
    //   if (data.success) {
    //     setPersons(data.data);
    //   }
    // } catch (error) {
    //   console.error('Failed to fetch persons', error);
    // }
  };

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

  // Load reference data once
  useEffect(() => {
    fetchGenres();
    fetchPersons();
  }, []);

  // Reload movies when filters change
  useEffect(() => {
    fetchMovies(currentPage);
  }, [currentPage, searchTerm, genreFilter]);

  // Create movie with genre_ids and cast_ids
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
    genres,        // Add genres for dropdowns
    persons,       // Add persons for cast selection
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
