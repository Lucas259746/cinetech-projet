// src/views/movies.ts
import { TMDBApi } from "../api/tmdb";

export async function renderMovies(): Promise<string> {
  // 1. Récupérer le numéro de page depuis l'URL actuelle (ex: /movies?page=3)
  const urlParams = new URLSearchParams(window.location.search);
  let currentPage = parseInt(urlParams.get("page") || "1", 10);

  // Sécurité au cas où l'utilisateur injecte une valeur farfelue
  if (isNaN(currentPage) || currentPage < 1) {
    currentPage = 1;
  }

  try {
    // 2. Appel de l'API pour récupérer les films de la page demandée
    const data = await TMDBApi.getMovies(currentPage);
    const movies = data.results;

    // TMDB limite souvent le retour à un maximum de 500 pages pour des raisons de performances
    const totalPages = Math.min(data.total_pages, 500);

    // 3. Génération du HTML pour la grille des films
    const movieCardsHTML = movies
      .map((movie) => {
        const poster = movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : "https://via.placeholder.com/500x750?text=Image+Non+Disponible";

        const year = movie.release_date
          ? movie.release_date.substring(0, 4)
          : "Date inconnue";

        return `
        <div class="media-card animate-fade-in">
          <a href="/details/movie/${movie.id}" data-link>
            <div class="poster-container">
              <img src="${poster}" alt="${movie.title}" loading="lazy">
              <span class="card-rating">⭐ ${movie.vote_average.toFixed(1)}</span>
            </div>
            <div class="media-info">
              <h3>${movie.title}</h3>
              <p class="media-year">${year}</p>
            </div>
          </a>
        </div>
      `;
      })
      .join("");

    // 4. Génération de la barre de pagination numérique
    const paginationHTML = generatePaginationControls(currentPage, totalPages);

    return `
      <div class="catalog-container">
        <header class="catalog-header">
          <h1>Tous les Films Populaires</h1>
          <p class="catalog-subtitle">Page ${currentPage} sur ${totalPages}</p>
        </header>

        <!-- Grille de films -->
        <section class="media-grid">
          ${movieCardsHTML.length > 0 ? movieCardsHTML : "<p>Aucun film trouvé.</p>"}
        </section>

        <!-- Barre de navigation des pages -->
        <nav class="pagination-container" aria-label="Navigation des pages">
          ${paginationHTML}
        </nav>
      </div>
    `;
  } catch (error) {
    console.error("Erreur lors du rendu de la liste des films :", error);
    return `
      <div class="error-container">
        <p>Décochage réseau : Impossible de charger le catalogue des films.</p>
        <button onclick="window.location.reload()" class="btn">Réessayer</button>
      </div>
    `;
  }
}

/**
 * Génère intelligemment la structure HTML des boutons de pagination
 */
function generatePaginationControls(current: number, total: number): string {
  let html = "";

  // Bouton Précédent
  if (current > 1) {
    html += `<a href="/movies?page=${current - 1}" class="pagination-btn prev" data-link>« Précédent</a>`;
  } else {
    html += `<span class="pagination-btn disabled">« Précédent</span>`;
  }

  // Définir la plage de numéros de pages à afficher (ex: [current-2] .. [current] .. [current+2])
  const maxLinks = 5;
  let startPage = Math.max(1, current - Math.floor(maxLinks / 2));
  let endPage = Math.min(total, startPage + maxLinks - 1);

  if (endPage - startPage + 1 < maxLinks) {
    startPage = Math.max(1, endPage - maxLinks + 1);
  }

  // Première page si on est loin du début
  if (startPage > 1) {
    html += `<a href="/movies?page=1" class="pagination-number" data-link>1</a>`;
    if (startPage > 2) html += `<span class="pagination-ellipsis">...</span>`;
  }

  // Boucle sur les pages intermédiaires
  for (let i = startPage; i <= endPage; i++) {
    if (i === current) {
      html += `<span class="pagination-number active" aria-current="page">${i}</span>`;
    } else {
      html += `<a href="/movies?page=${i}" class="pagination-number" data-link>${i}</a>`;
    }
  }

  // Dernière page si on est loin de la fin
  if (endPage < total) {
    if (endPage < total - 1)
      html += `<span class="pagination-ellipsis">...</span>`;
    html += `<a href="/movies?page=${total}" class="pagination-number" data-link>${total}</a>`;
  }

  // Bouton Suivant
  if (current < total) {
    html += `<a href="/movies?page=${current + 1}" class="pagination-btn next" data-link>Suivant »</a>`;
  } else {
    html += `<span class="pagination-btn disabled">Suivant »</span>`;
  }

  return html;
}
