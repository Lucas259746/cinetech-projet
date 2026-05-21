// src/views/series.ts
import { TMDBApi } from "../api/tmdb";

export async function renderSeries(): Promise<string> {
  // 1. Récupération du numéro de page depuis l'URL (ex: /series?page=2)
  const urlParams = new URLSearchParams(window.location.search);
  let currentPage = parseInt(urlParams.get("page") || "1", 10);

  if (isNaN(currentPage) || currentPage < 1) {
    currentPage = 1;
  }

  try {
    // 2. Récupération des données séries via l'API
    const data = await TMDBApi.getSeries(currentPage);
    const seriesList = data.results;

    // TMDB bride les résultats à la page 500 maximum en mode public
    const totalPages = Math.min(data.total_pages, 500);

    // 3. Génération des cartes HTML pour la grille
    const seriesCardsHTML = seriesList
      .map((series) => {
        const poster = series.poster_path
          ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
          : "https://via.placeholder.com/500x750?text=Image+Non+Disponible";

        const year = series.first_air_date
          ? series.first_air_date.substring(0, 4)
          : "Date inconnue";

        return `
        <div class="media-card animate-fade-in">
          <a href="/details/series/${series.id}" data-link>
            <div class="poster-container">
              <img src="${poster}" alt="${series.name}" loading="lazy">
              <span class="card-rating">⭐ ${series.vote_average.toFixed(1)}</span>
            </div>
            <div class="media-info">
              <h3>${series.name}</h3>
              <p class="media-year">${year}</p>
            </div>
          </a>
        </div>
      `;
      })
      .join("");

    // 4. Génération de la pagination
    const paginationHTML = generateSeriesPagination(currentPage, totalPages);

    return `
      <div class="catalog-container">
        <header class="catalog-header">
          <h1>Toutes les Séries Populaires</h1>
          <p class="catalog-subtitle">Page ${currentPage} sur ${totalPages}</p>
        </header>

        <!-- Grille des séries -->
        <section class="media-grid">
          ${seriesCardsHTML.length > 0 ? seriesCardsHTML : "<p>Aucune série trouvée.</p>"}
        </section>

        <!-- Navigation -->
        <nav class="pagination-container" aria-label="Navigation des pages de séries">
          ${paginationHTML}
        </nav>
      </div>
    `;
  } catch (error) {
    console.error("Erreur de chargement des séries :", error);
    return `
      <div class="error-container">
        <p>Erreur réseau : Impossible de récupérer le catalogue des séries.</p>
        <button onclick="window.location.reload()" class="btn">Réessayer</button>
      </div>
    `;
  }
}

/**
 * Génère le système de boutons numériques de la pagination
 */
function generateSeriesPagination(current: number, total: number): string {
  let html = "";

  // Bouton Précédent
  if (current > 1) {
    html += `<a href="/series?page=${current - 1}" class="pagination-btn prev" data-link>« Précédent</a>`;
  } else {
    html += `<span class="pagination-btn disabled">« Précédent</span>`;
  }

  const maxLinks = 5;
  let startPage = Math.max(1, current - Math.floor(maxLinks / 2));
  let endPage = Math.min(total, startPage + maxLinks - 1);

  if (endPage - startPage + 1 < maxLinks) {
    startPage = Math.max(1, endPage - maxLinks + 1);
  }

  // Lien vers la première page si décalage
  if (startPage > 1) {
    html += `<a href="/series?page=1" class="pagination-number" data-link>1</a>`;
    if (startPage > 2) html += `<span class="pagination-ellipsis">...</span>`;
  }

  // Liens numériques centraux
  for (let i = startPage; i <= endPage; i++) {
    if (i === current) {
      html += `<span class="pagination-number active" aria-current="page">${i}</span>`;
    } else {
      html += `<a href="/series?page=${i}" class="pagination-number" data-link>${i}</a>`;
    }
  }

  // Lien vers la dernière page si décalage
  if (endPage < total) {
    if (endPage < total - 1)
      html += `<span class="pagination-ellipsis">...</span>`;
    html += `<a href="/series?page=${total}" class="pagination-number" data-link>${total}</a>`;
  }

  // Bouton Suivant
  if (current < total) {
    html += `<a href="/series?page=${current + 1}" class="pagination-btn next" data-link>Suivant »</a>`;
  } else {
    html += `<span class="pagination-btn disabled">Suivant »</span>`;
  }

  return html;
}
