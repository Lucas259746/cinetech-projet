// src/views/home.ts
import { TMDBApi } from "../api/tmdb";

export async function renderHome(): Promise<string> {
  try {
    // Lancement des deux requêtes en parallèle pour de meilleures performances
    const [movieData, seriesData] = await Promise.all([
      TMDBApi.getTrendingMovies(),
      TMDBApi.getTrendingSeries(),
    ]);

    // On ne garde que les 8 premiers éléments pour l'accueil
    const regularMovies = movieData.results.slice(0, 8);
    const regularSeries = seriesData.results.slice(0, 8);

    // Génération des cartes de films en HTML
    const movieCardsHTML = regularMovies
      .map(
        (movie) => `
      <div class="media-card">
        <a href="/details/movie/${movie.id}" data-link>
          <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" loading="lazy">
          <div class="media-info">
            <h3>${movie.title}</h3>
            <span class="rating">⭐ ${movie.vote_average.toFixed(1)}</span>
          </div>
        </a>
      </div>
    `,
      )
      .join("");

    // Génération des cartes de séries en HTML (attention à la propriété .name)
    const seriesCardsHTML = regularSeries
      .map(
        (tv) => `
      <div class="media-card">
        <a href="/details/series/${tv.id}" data-link>
          <img src="https://image.tmdb.org/t/p/w500${tv.poster_path}" alt="${tv.name}" loading="lazy">
          <div class="media-info">
            <h3>${tv.name}</h3>
            <span class="rating">⭐ ${tv.vote_average.toFixed(1)}</span>
          </div>
        </a>
      </div>
    `,
      )
      .join("");

    return `
      <div class="home-container">
        <section class="hero-banner">
          <h1>Bienvenue sur CineTech</h1>
          <p>Découvrez, notez et organisez vos films et séries favoris.</p>
        </section>

        <section class="media-section">
          <h2>Films Tendances de la Semaine</h2>
          <div class="media-grid">${movieCardsHTML}</div>
        </section>

        <section class="media-section">
          <h2>Séries Tendances de la Semaine</h2>
          <div class="media-grid">${seriesCardsHTML}</div>
        </section>
      </div>
    `;
  } catch (error) {
    console.error("Erreur rendu accueil:", error);
    return `<div class="error-container"><p>Impossible de charger les tendances actuelles.</p></div>`;
  }
}
