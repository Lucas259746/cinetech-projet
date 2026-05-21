// src/services/router.ts

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

  // 🛠️ CONFIGURATION : On indique au routeur qu'il s'exécute dans un sous-dossier
  private basePath = "";

  constructor() {
    this.appContainer = document.getElementById("app");

    window.addEventListener("popstate", () => this.handleRoute());

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest("[data-link]");

      if (link) {
        e.preventDefault();

        const href = link.getAttribute("href"); // Récupère par exemple "/" ou "/movies"
        if (href) {
          // 🚀 CORRECTION : On force l'arborescence à rester dans le sous-dossier CineTech
          window.history.pushState(null, "", this.basePath + href);
          this.handleRoute();
        }
      }
    });
  }

  public addRoute(path: string, component: PageComponent): void {
    this.routes.push({ path, component });
  }

  public navigateTo(url: string): void {
    window.history.pushState(null, "", this.basePath + url);
    this.handleRoute();
  }

  public async handleRoute(): Promise<void> {
    if (!this.appContainer) return;

    // Récupère l'URL complète actuelle (ex: /cinetech/dist/movies)
    let currentPath = window.location.pathname;

    // 🛠️ CORRECTION : On nettoie l'URL en retirant le "basePath" pour que la correspondance des routes fonctionne
    if (currentPath.startsWith(this.basePath)) {
      currentPath = currentPath.substring(this.basePath.length);
    }

    // Sécurité : si le nettoyage laisse une chaîne vide, on se remet sur l'accueil
    if (currentPath === "") {
      currentPath = "/";
    }

    let matchedRoute = this.routes.find((route) => route.path === currentPath);
    let params: Record<string, string> = {};

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

    this.appContainer.innerHTML =
      '<div class="page-loader"><div class="spinner"></div></div>';

    try {
      if (matchedRoute) {
        const htmlContent = await matchedRoute.component(params);
        this.appContainer.innerHTML = htmlContent;

        window.dispatchEvent(
          new CustomEvent("page-rendered", {
            detail: { path: currentPath, params },
          }),
        );
      } else {
        this.appContainer.innerHTML = `
          <div class="error-container">
            <h1>404 - Page Introuvable</h1>
            <p>Le film ou la page que vous cherchez a dû s'égarer...</p>
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
