// src/types/tmdb.ts

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
}

export interface Series {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBComment {
  author: string;
  content: string;
  created_at: string;
  id: string;
}

export interface CreditItem {
  id: number;
  name: string;
  character?: string;
  job?: string;
  profile_path: string | null;
}
