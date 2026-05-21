// src/views/favorites.ts
import { TMDBApi } from "../api/tmdb";
import { StorageService } from "../services/storage";
import type { Movie, Series } from "../types/tmdb";

// On explique à TypeScript que l'objet stocké dans notre local storage contient deux listes de nombres (ID)
interface FavoriteIds {
  movies: number[];
  series: number[];
}

// On crée des types hybrides : on prend l'interface de base (Movie/Series) et on lui ajoute obligatoirement
// une propriété personnalisée 'mediaType' pour savoir si on manipule un film ou une série plus bas dans le code
type FavoriteMovie = Movie & { mediaType: "movie" };
type FavoriteSeries = Series & { mediaType: "series" };
// Un élément favori valide dans notre tableau final sera soit un film favori, soit une série favorite
type FavoriteMediaItem = FavoriteMovie | FavoriteSeries;

/* ==========================================================================
   3. FONCTION PRINCIPALE DE RENDU HTML
   ========================================================================== */
// La fonction est 'async' car elle attend des réponses réseau, et promet de renvoyer du HTML (Promise<string>)
export async function renderFavorites(): Promise<string> {
  // On récupère l'objet des favoris. Le 'as unknown as' force TypeScript à appliquer notre structure FavoriteIds
  const favorites = StorageService.getFavorites() as unknown as FavoriteIds;

  // On crée deux variables booléennes (true/false) pour vérifier si les listes contiennent au moins un élément
  const hasMovies = favorites.movies && favorites.movies.length > 0;
  const hasSeries = favorites.series && favorites.series.length > 0;

  /* ==========================================================================
     4. GESTION DU CAS : AUCUN FAVORI
     ========================================================================== */
  // Si l'utilisateur n'a ni films, ni séries dans ses favoris, la fonction s'arrête immédiatement ici
  if (!hasMovies && !hasSeries) {
    return `
      <div class="catalog-container animate-fade-in">
        <header class="catalog-header">
          <h1>Mes Favoris</h1>
        </header>
        <div class="error-container" style="text-align: center; margin-top: 3rem;">
          <p>❤️ Vous n'avez pas encore ajouté de favoris.</p>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">
            Explorez l'accueil, les films ou les séries et cliquez sur "Ajouter aux favoris".
          </p>
          <a href="/" data-link class="btn" style="margin-top: 1.5rem;">Retour à l'accueil</a>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     5. PRÉPARATION DES REQUÊTES API
     ========================================================================== */
  // Ouverture d'un bloc try/catch pour intercepter les éventuelles erreurs réseau globales
  try {
    // On crée un tableau vide qui va stocker toutes nos requêtes (promesses) en attente de réponse
    const fetchPromises: Promise<FavoriteMediaItem | null>[] = [];

    // S'il y a des FILMS, on parcourt chaque identifiant (id) du tableau avec une boucle .forEach
    if (hasMovies) {
      favorites.movies.forEach((id: number) => {
        // Pour chaque ID, on appelle l'API. Dès qu'elle répond (.then), on fusionne les données (...details)
        // avec notre propriété 'mediaType: "movie"' et on affirme le type à TypeScript (as FavoriteMovie)
        const promise = TMDBApi.getMovieDetails(id)
          .then(
            (details) => ({ ...details, mediaType: "movie" }) as FavoriteMovie,
          )
          .catch((err) => {
            // Si la requête échoue (.catch), on affiche l'erreur en console et on renvoie null
            console.error(`Impossible de charger le film favori ${id}:`, err);
            return null;
          });
        // On pousse cette action (promesse) dans notre tableau de stockage général
        fetchPromises.push(promise);
      });
    }

    // S'il y a des SÉRIES, on effectue le même traitement exact que pour les films
    if (hasSeries) {
      favorites.series.forEach((id: number) => {
        // On appelle getSeriesDetails, puis on injecte 'mediaType: "series"' et on gère l'échec potentiel
        const promise = TMDBApi.getSeriesDetails(id)
          .then(
            (details) =>
              ({ ...details, mediaType: "series" }) as FavoriteSeries,
          )
          .catch((err) => {
            console.error(
              `Impossible de charger la série favorite ${id}:`,
              err,
            );
            return null;
          });
        fetchPromises.push(promise);
      });
    }

    /* ==========================================================================
       6. ATTENTE ET FILTRAGE DES RÉSULTATS (LIGNE CLÉ POUR LES PERFORMANCES)
       ========================================================================== */
    // Promise.all lance TOUTES les requêtes en même temps (en parallèle) et attend que tout le monde ait fini
    const results = await Promise.all(fetchPromises);

    // Grâce au .filter(), on nettoie le tableau en retirant les éléments qui ont renvoyé 'null' (requêtes échouées)
    // Le code 'item is FavoriteMediaItem' certifie à TypeScript que la liste finale ne contient aucun 'null'
    const validMedias = results.filter(
      (item): item is FavoriteMediaItem => item !== null,
    );

    /* ==========================================================================
       7. GÉNÉRATION DU CODE HTML POUR CHAQUE CARTE
       ========================================================================== */
    // On utilise .map() pour transformer notre tableau d'objets de données en un tableau de texte HTML
    const cardsHTML = validMedias
      .map((media) => {
        // On crée un indicateur booléen (vrai si c'est un film, faux si c'est une série)
        const isMovie = media.mediaType === "movie";

        // UNIFICATION DES PROPRIÉTÉS : TMDB utilise '.title' pour les films et '.name' pour les séries.
        // Ce code sélectionne la bonne propriété dynamique en fonction du type réel de l'objet.
        const title = isMovie ? (media as Movie).title : (media as Series).name;
        // Même chose pour la date : 'release_date' pour un film vs 'first_air_date' pour une série
        const date = isMovie
          ? (media as Movie).release_date
          : (media as Series).first_air_date;

        // On extrait uniquement l'année (les 4 premiers caractères de la date sous forme de texte)
        const year = date ? `(${date.substring(0, 4)})` : "";
        // On récupère la note moyenne en la bloquant à un seul chiffre après la virgule (.toFixed(1))
        const rating = media.vote_average
          ? media.vote_average.toFixed(1)
          : "N/A";

        // Si l'affiche du média existe, on génère l'URL TMDB, sinon on affiche une image grise par défaut
        const poster = media.poster_path
          ? `https://image.tmdb.org/t/p/w342${media.poster_path}`
          : "https://via.placeholder.com/342x513?text=No+Image";

        // On retourne la structure HTML propre à chaque carte de film/série
        // L'attribut 'data-link' permet à notre routeur de changer de page instantanément sans recharger le site
        return `
          <div class="media-card">
            <a href="/details/${media.mediaType}/${media.id}" data-link>
              <div class="poster-container">
                <img src="${poster}" alt="${title}" loading="lazy">
                <span class="card-rating">⭐ ${rating}</span>
              </div>
              <div class="media-info">
                <h3>${title}</h3>
                <span class="media-year">${isMovie ? "Film" : "Série"} ${year}</span>
              </div>
            </a>
          </div>
        `;
      })
      // Le .join("") fusionne toutes les cartes HTML textuelles pour former une seule chaîne continue
      .join("");

    /* ==========================================================================
       8. RENDU FINAL DE LA GRILLE (TABLEAU DE FILMS)
       ========================================================================== */
    // On injecte la quantité totale de favoris (validMedias.length) et on insère la variable ${cardsHTML}
    // au milieu d'une balise <section class="media-grid"> qui force l'affichage en colonnes côte à côte
    return `
      <div class="catalog-container animate-fade-in">
        <header class="catalog-header">
          <h1>Mes Favoris (❤️ ${validMedias.length})</h1>
        </header>

        <section class="media-grid">
          ${cardsHTML}
        </section>
      </div>
    `;
  } catch (error) {
    // Si quoi que ce soit plante pendant l'exécution, le catch s'active, écrit le bug en console pour nous
    console.error("Erreur générale au chargement des favoris:", error);
    // Et affiche un message d'erreur propre et sécurisé sur l'écran de l'utilisateur
    return `<div class="error-container"><p>Erreur lors du chargement de vos favoris.</p></div>`;
  }
}
