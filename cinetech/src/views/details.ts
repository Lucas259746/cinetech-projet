// src/views/details.ts
import { TMDBApi } from "../api/tmdb";
import { StorageService } from "../services/storage";
import type { Movie, Series, CreditItem } from "../types/tmdb";

export async function renderDetails(
  params?: Record<string, string>,
): Promise<string> {
  if (!params || !params.id || !params.type) {
    return `<div class="error-container"><p>Paramètres de contenu invalides.</p></div>`;
  }

  const id = parseInt(params.id, 10);
  const type = params.type as "movie" | "series";

  try {
    // 1. Lancement de toutes les requêtes en parallèle pour charger la page le plus vite possible
    const isMovie = type === "movie";

    const [mediaDetails, creditsData, similarData] = await Promise.all([
      isMovie ? TMDBApi.getMovieDetails(id) : TMDBApi.getSeriesDetails(id),
      isMovie ? TMDBApi.getMovieCredits(id) : TMDBApi.getSeriesCredits(id),
      isMovie ? TMDBApi.getSimilarMovies(id) : TMDBApi.getSimilarSeries(id),
    ]);

    // 2. Unification des données (TMDB utilise des propriétés différentes selon le type)
    const title = isMovie
      ? (mediaDetails as Movie).title
      : (mediaDetails as Series).name;
    const date = isMovie
      ? (mediaDetails as Movie).release_date
      : (mediaDetails as Series).first_air_date;
    const year = date ? date.substring(0, 4) : "Inconnu";

    const poster = mediaDetails.poster_path
      ? `https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`
      : "https://via.placeholder.com/500x750?text=No+Poster";

    const backdrop = mediaDetails.backdrop_path
      ? `https://image.tmdb.org/t/p/original${mediaDetails.backdrop_path}`
      : "";

    // 3. Extraction de l'équipe (Réalisateur / Créateur)
    let directoresHTML = "Inconnu";
    if (isMovie) {
      const directors = creditsData.crew.filter(
        (member: CreditItem) => member.job === "Director",
      );
      if (directors.length > 0) {
        directoresHTML = directors.map((d: CreditItem) => d.name).join(", ");
      }
    } else {
      directoresHTML = "Créateurs de contenu télévisuel";
    }

    // 4. Extraction des 5 premiers Acteurs principaux
    const castHTML = creditsData.cast
      .slice(0, 5)
      .map(
        (actor: CreditItem) => `
      <div class="actor-badge">
        <strong>${actor.name}</strong>
        <span>${actor.character ? `dans le rôle de ${actor.character}` : ""}</span>
      </div>
    `,
      )
      .join("");

    // 5. Extraction des 4 premières suggestions similaires avec la BONNE STRUCTURE DE GRILLE
    const suggestionsHTML = similarData.results
      .slice(0, 4)
      .map((item) => {
        const sTitle = "title" in item ? item.title : item.name;
        const sDate =
          "release_date" in item ? item.release_date : item.first_air_date;
        const sYear = sDate ? `(${sDate.substring(0, 4)})` : "";
        const sPoster = item.poster_path
          ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
          : "https://via.placeholder.com/342x513?text=No+Image";

        return `
        <div class="media-card">
          <a href="/details/${type}/${item.id}" data-link>
            <div class="poster-container">
              <img src="${sPoster}" alt="${sTitle}" loading="lazy">
              <span class="card-rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : "N/A"}</span>
            </div>
            <div class="media-info">
              <h3>${sTitle}</h3>
              <span class="media-year">${sYear}</span>
            </div>
          </a>
        </div>
      `;
      })
      .join("");

    // 6. Vérification de l'état du favori local
    const isFav = StorageService.isFavorite(id, type);
    const favButtonText = isFav
      ? "❤️ Retirer des favoris"
      : "🤍 Ajouter aux favoris";

    // 7. Rendu HTML Global
    return `
      <div class="details-page animate-fade-in" style="--backdrop-url: url('${backdrop}')">
        <div class="details-hero">
          <div class="details-container">
            
            <div class="details-poster">
              <img src="${poster}" alt="${title}">
            </div>

            <div class="details-main-info">
              <h1>${title} <span class="year">(${year})</span></h1>
              <div class="meta-row">
                <span class="badge-rating">⭐ ${mediaDetails.vote_average.toFixed(1)}</span>
                <span class="media-type-tag">${isMovie ? "Film" : "Série TV"}</span>
              </div>

              <button id="btn-favorite" class="btn btn-fav ${isFav ? "is-fav" : ""}" data-id="${id}" data-type="${type}">
                ${favButtonText}
              </button>

              <div class="synopsis-block">
                <h3>Synopsis</h3>
                <p>${mediaDetails.overview || "Aucun résumé en français disponible pour cette œuvre."}</p>
              </div>

              <div class="crew-block">
                <p><strong>Réalisation / Création :</strong> ${directoresHTML}</p>
              </div>

              <div class="cast-block">
                <h3>Acteurs Principaux</h3>
                <div class="cast-grid">${castHTML || "<p>Informations sur les acteurs indisponibles.</p>"}</div>
              </div>

            </div>

          </div>
        </div>

        <section class="suggestions-section">
          <div class="container-inner">
            <h2>Titres similaires suggérés</h2>
            <div class="media-grid grid-4">
              ${suggestionsHTML || "<p>Aucune suggestion disponible.</p>"}
            </div>
          </div>
        </section>

        <section class="comments-section">
          <div class="container-inner">
            <h2>Espace Commentaires</h2>
            <div id="comments-container-root">
               </div>
          </div>
        </section>

      </div>
    `;
  } catch (error) {
    console.error("Erreur de chargement des détails :", error);
    return `
      <div class="error-container">
        <h1>Oups ! Données introuvables</h1>
        <p>Impossible de joindre les serveurs TMDB pour cet identifiant.</p>
        <a href="/" data-link class="btn">Retour à l'accueil</a>
      </div>
    `;
  }
}
