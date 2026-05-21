// src/api/tmdb.ts
import type {
  Movie,
  Series,
  TMDBResponse,
  TMDBComment,
  CreditItem,
} from "../types/tmdb";

// Récupération sécurisée des variables d'environnement via Vite
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BEARER_TOKEN = import.meta.env.VITE_TMDB_BEARER_TOKEN;

const BASE_URL = "https://api.themoviedb.org/3";

// Une petite vérification en développement pour s'assurer que le .env est bien chargé
if (!API_KEY || !BEARER_TOKEN) {
  console.error(
    "⚠️ Attention : Les variables VITE_TMDB_API_KEY ou VITE_TMDB_BEARER_TOKEN ne sont pas définies dans votre fichier .env !",
  );
}

async function request<T>(
  endpoint: string,
  queryParams: string = "",
): Promise<T> {
  const url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=fr-FR${queryParams}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${BEARER_TOKEN}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Erreur API TMDB: ${response.status} - ${response.statusText}`,
    );
  }

  return response.json();
}

export const TMDBApi = {
  getTrendingMovies: () => request<TMDBResponse<Movie>>("/trending/movie/week"),
  getTrendingSeries: () => request<TMDBResponse<Series>>("/trending/tv/week"),
  getMovies: (page: number = 1) =>
    request<TMDBResponse<Movie>>("/movie/popular", `&page=${page}`),
  getSeries: (page: number = 1) =>
    request<TMDBResponse<Series>>("/tv/popular", `&page=${page}`),
  getMovieDetails: (id: number) => request<Movie>(`/movie/${id}`),
  getSeriesDetails: (id: number) => request<Series>(`/tv/${id}`),
  getMovieCredits: (id: number) =>
    request<{ cast: CreditItem[]; crew: CreditItem[] }>(`/movie/${id}/credits`),
  getSeriesCredits: (id: number) =>
    request<{ cast: CreditItem[]; crew: CreditItem[] }>(`/tv/${id}/credits`),
  getSimilarMovies: (id: number) =>
    request<TMDBResponse<Movie>>(`/movie/${id}/similar`),
  getSimilarSeries: (id: number) =>
    request<TMDBResponse<Series>>(`/tv/${id}/similar`),
  getMovieComments: (id: number) =>
    request<TMDBResponse<TMDBComment>>(`/movie/${id}/reviews`),
  getSeriesComments: (id: number) =>
    request<TMDBResponse<TMDBComment>>(`/tv/${id}/reviews`),
  searchMulti: (query: string) =>
    request<TMDBResponse<Movie | Series>>(
      "/search/multi",
      `&query=${encodeURIComponent(query)}`,
    ),
};
