// src/main.ts
import "./style.css"; // 🔥 Importation du CSS pour l'application des styles globaux et de la grille

import { router } from "./services/router";
import { TMDBApi } from "./api/tmdb";
import { renderHome } from "./views/home";
import { renderMovies } from "./views/movies";
import { renderSeries } from "./views/series";
import { renderDetails } from "./views/details";
import { StorageService } from "./services/storage";
import { initCommentsSection } from "./utils/comments";

const renderFavorites = async () =>
  "<h1>Mes Favoris</h1><p>Vos sauvegardes locales.</p>";

// --- Déclaration des routes ---
router.addRoute("/", renderHome);
router.addRoute("/movies", renderMovies);
router.addRoute("/series", renderSeries);
router.addRoute("/details/:type/:id", renderDetails); // Route dynamique universelle
router.addRoute("/favorites", renderFavorites);

// --- Lancement du routeur ---
document.addEventListener("DOMContentLoaded", () => {
  router.handleRoute();
  initSearchAutoComplete();
});

// --- Écouteur réactif pour l'interaction des pages (Favoris & Commentaires) ---
window.addEventListener("page-rendered", (e: Event) => {
  const customEvent = e as CustomEvent;
  const { path, params } = customEvent.detail;

  // Si l'utilisateur est sur une page de détails, on initialise les scripts interactifs
  if (path.startsWith("/details/") && params) {
    const id = parseInt(params.id, 10);
    const type = params.type as "movie" | "series";

    if (!isNaN(id) && type) {
      initFavoriteButton(id, type);
      initCommentsSection(id, type);
    }
  }
});

// --- Logique du Bouton Favoris ---
function initFavoriteButton(id: number, type: "movie" | "series") {
  const favBtn = document.getElementById(
    "btn-favorite",
  ) as HTMLButtonElement | null;
  if (!favBtn) return;

  favBtn.addEventListener("click", () => {
    // Inversion de l'état dans le localStorage
    StorageService.toggleFavorite(id, type);

    // Mise à jour visuelle du bouton
    const isNowFav = StorageService.isFavorite(id, type);
    if (isNowFav) {
      favBtn.innerText = "❤️ Retirer des favoris";
      favBtn.classList.add("is-fav");
    } else {
      favBtn.innerText = "🤍 Ajouter aux favoris";
      favBtn.classList.remove("is-fav");
    }
  });
}

// --- Logique globale de l'Autocomplétion (Header) ---
function initSearchAutoComplete() {
  const searchInput = document.getElementById(
    "search-input",
  ) as HTMLInputElement | null;
  const resultsContainer = document.getElementById(
    "autocomplete-results",
  ) as HTMLDivElement | null;
  let debounceTimeout: number;

  if (!searchInput || !resultsContainer) return;

  searchInput.addEventListener("input", (e) => {
    const query = (e.target as HTMLInputElement).value.trim();
    clearTimeout(debounceTimeout);

    if (query.length < 3) {
      resultsContainer.classList.add("hidden");
      return;
    }

    // Debounce de 300ms pour économiser les requêtes API
    debounceTimeout = setTimeout(async () => {
      try {
        const response = await TMDBApi.searchMulti(query);
        // On ne garde que les 6 premiers résultats pertinents
        const items = response.results.slice(0, 6);

        if (items.length === 0) {
          resultsContainer.innerHTML =
            '<div class="no-result">Aucun résultat trouvé</div>';
          resultsContainer.classList.remove("hidden");
          return;
        }

        resultsContainer.innerHTML = items
          .map((item) => {
            // Gérer la différence clé Film (title) et Série (name)
            const title = "title" in item ? item.title : item.name;
            const type = "title" in item ? "movie" : "series";
            const date =
              "release_date" in item ? item.release_date : item.first_air_date;
            const year = date ? `(${date.substring(0, 4)})` : "";
            const poster = item.poster_path
              ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
              : "https://via.placeholder.com/45x68?text=No+Image";

            return `
            <a href="/details/${type}/${item.id}" class="autocomplete-item" data-link>
              <img src="${poster}" alt="${title}">
              <div class="autocomplete-info">
                <span class="autocomplete-title">${title}</span>
                <span class="autocomplete-type">${type === "movie" ? "Film" : "Série"} ${year}</span>
              </div>
            </a>
          `;
          })
          .join("");

        resultsContainer.classList.remove("hidden");
      } catch (err) {
        console.error("Erreur autocomplétion", err);
      }
    }, 300);
  });

  // Fermer la liste de suggestion si on clique ailleurs sur l'écran
  document.addEventListener("click", (e) => {
    if (
      !searchInput.contains(e.target as Node) &&
      !resultsContainer.contains(e.target as Node)
    ) {
      resultsContainer.classList.add("hidden");
    }
  });
}
