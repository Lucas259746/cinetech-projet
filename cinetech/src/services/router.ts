// src/services/router.ts

// Définition du type pour nos composants de page
type PageComponent = (
  params?: Record<string, string>,
) => Promise<string> | string;

interface Route {
  path: string;
  component: PageComponent;
}

class Router {
  private routes: Route[] = [];
  private appContainer: HTMLElement | null = null;

  constructor() {
    this.appContainer = document.getElementById("app");

    // Écouter les boutons "Précédent / Suivant" de l'historique du navigateur
    window.addEventListener("popstate", () => this.handleRoute());

    // Intercepter globalement tous les clics sur l'application
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest("[data-link]");

      if (link) {
        e.preventDefault(); // Empêche le navigateur de recharger toute la page HTML

        const href = link.getAttribute("href");
        if (href) {
          // On change l'URL dans la barre d'adresse sans recharger
          window.history.pushState(null, "", href);

          // On force le routeur à analyser la nouvelle URL et charger la vue
          this.handleRoute();
        }
      }
    });
  }

  // Permet d'enregistrer une route
  public addRoute(path: string, component: PageComponent): void {
    this.routes.push({ path, component });
  }

  // Naviguer vers une nouvelle page de manière logicielle
  public navigateTo(url: string): void {
    window.history.pushState(null, "", url);
    this.handleRoute();
  }

  // Analyse l'URL actuelle et affiche la bonne page
  public async handleRoute(): Promise<void> {
    if (!this.appContainer) return;

    const currentPath = window.location.pathname;

    // Gestion des routes statiques ou exactes
    let matchedRoute = this.routes.find((route) => route.path === currentPath);
    let params: Record<string, string> = {};

    // Si pas de correspondance exacte, on cherche une route dynamique (ex: /details/:type/:id)
    if (!matchedRoute) {
      for (const route of this.routes) {
        const routeParts = route.path.split("/");
        const pathParts = currentPath.split("/");

        if (routeParts.length === pathParts.length) {
          const isMatch = routeParts.every((part, index) => {
            return part.startsWith(":") || part === pathParts[index];
          });

          if (isMatch) {
            matchedRoute = route;
            routeParts.forEach((part, index) => {
              if (part.startsWith(":")) {
                const paramName = part.substring(1);
                params[paramName] = pathParts[index];
              }
            });
            break;
          }
        }
      }
    }

    // Affichage d'un loader pendant le chargement des données de la page
    this.appContainer.innerHTML =
      '<div class="page-loader"><div class="spinner"></div></div>';

    try {
      if (matchedRoute) {
        const htmlContent = await matchedRoute.component(params);
        this.appContainer.innerHTML = htmlContent;

        // Déclencher un événement personnalisé si la page a besoin d'exécuter du JS après son rendu
        window.dispatchEvent(
          new CustomEvent("page-rendered", {
            detail: { path: currentPath, params },
          }),
        );
      } else {
        // Page 404 par défaut
        this.appContainer.innerHTML = `
          <div class="error-container">
            <h1>404 - Page Introuvable</h1>
            <p>Le film ou la page que vous cherchez a dû s'égarer dans les fichiers du cinéma...</p>
            <a href="/" data-link class="btn">Retourner à l'accueil</a>
          </div>
        `;
      }
    } catch (error) {
      console.error("Erreur de rendu de la page :", error);
      this.appContainer.innerHTML = `<div class="error-container"><p>Une erreur est survenue lors du chargement des données.</p></div>`;
    }
  }
}

export const router = new Router();
