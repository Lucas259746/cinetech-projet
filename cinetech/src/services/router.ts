// Type décrivant une fonction qui retourne du HTML (sous forme de chaîne) pour une page donnée
type PageComponent = (
  params?: Record<string, string>,
) => Promise<string> | string;

// Interface décrivant une route : une URL (path) reliée à un composant (component)
interface Route {
  path: string;
  component: PageComponent;
}

// Classe gérant le routage de l'application
class Router {
  private routes: Route[] = []; // Tableau contenant toutes nos routes déclarées
  private appContainer: HTMLElement | null = null; // Élément HTML où le contenu sera injecté

  constructor() {
    // On cible la balise <div id="app"> dans le fichier index.html principal
    this.appContainer = document.getElementById("app");

    // Écoute les actions "Page précédente / suivante" du navigateur
    // Déclenche une nouvelle analyse de l'URL lorsqu'elles surviennent
    window.addEventListener("popstate", () => this.handleRoute());

    // Écoute tous les clics n'importe où sur la page
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      // Cherche si l'élément cliqué (ou son parent) possède l'attribut data-link
      const link = target.closest("[data-link]");

      if (link) {
        // Annule le comportement par défaut (qui consisterait à recharger totalement la page)
        e.preventDefault();

        // Récupère l'URL cible
        const href = link.getAttribute("href");
        if (href) {
          // Met à jour l'URL visible dans le navigateur sans faire de requête au serveur
          window.history.pushState(null, "", href);

          // Force l'application à charger la vue correspondante à cette nouvelle URL
          this.handleRoute();
        }
      }
    });
  }

  // Méthode pour lier une URL à une fonction d'affichage
  public addRoute(path: string, component: PageComponent): void {
    this.routes.push({ path, component });
  }

  // Permet de forcer la navigation depuis le code (ex: après une action de l'utilisateur)
  public navigateTo(url: string): void {
    window.history.pushState(null, "", url);
    this.handleRoute();
  }

  // Méthode principale qui analyse l'URL et affiche le bon contenu
  public async handleRoute(): Promise<void> {
    if (!this.appContainer) return; // Sécurité si l'élément #app n'existe pas

    // Récupère le chemin actuel (ex: /details/movie/123)
    const currentPath = window.location.pathname;

    // 1. Cherche d'abord une correspondance exacte (ex: /movies)
    let matchedRoute = this.routes.find((route) => route.path === currentPath);
    let params: Record<string, string> = {}; // Objet qui contiendra les paramètres dynamiques

    // 2. Si aucune route statique n'est trouvée, on cherche une route dynamique (ex: /details/:type/:id)
    if (!matchedRoute) {
      for (const route of this.routes) {
        // On découpe la route déclarée et la route actuelle en morceaux
        const routeParts = route.path.split("/");
        const pathParts = currentPath.split("/");

        // S'ils ont le même nombre de segments (ex: 3 segments dans /details/movie/123)
        if (routeParts.length === pathParts.length) {
          // On vérifie segment par segment
          const isMatch = routeParts.every((part, index) => {
            // Soit le segment commence par ":" (c'est une variable, donc ça passe)
            // Soit il doit être strictement identique (ex: "details" === "details")
            return part.startsWith(":") || part === pathParts[index];
          });

          if (isMatch) {
            matchedRoute = route; // On a trouvé la bonne route
            // On extrait les valeurs dynamiques de l'URL pour les mettre dans params
            routeParts.forEach((part, index) => {
              if (part.startsWith(":")) {
                const paramName = part.substring(1); // Enlève le ":"
                params[paramName] = pathParts[index]; // Assigne la valeur (ex: id = 123)
              }
            });
            break; // On arrête de chercher
          }
        }
      }
    }

    // Affiche une icône de chargement en attendant que les données API arrivent
    this.appContainer.innerHTML =
      '<div class="page-loader"><div class="spinner"></div></div>';

    try {
      if (matchedRoute) {
        // Exécute la fonction associée à la route (ex: renderDetails(params)) et attend le HTML
        const htmlContent = await matchedRoute.component(params);
        // Injecte le HTML final dans la page
        this.appContainer.innerHTML = htmlContent;

        // Déclenche un événement global pour dire "La page est affichée"
        // Très utile pour attacher des événements JavaScript (boutons, formulaires) *après* que le HTML soit dans le DOM
        window.dispatchEvent(
          new CustomEvent("page-rendered", {
            detail: { path: currentPath, params },
          }),
        );
      } else {
        // Si aucune route ne correspond, on affiche une erreur 404
        this.appContainer.innerHTML = `
          <div class="error-container">
            <h1>404 - Page Introuvable</h1>
            <p>Le film ou la page que vous cherchez a dû s'égarer dans les fichiers du cinéma...</p>
            <a href="/" data-link class="btn">Retourner à l'accueil</a>
          </div>
        `;
      }
    } catch (error) {
      // Gestion des erreurs fatales lors du rendu
      console.error("Erreur de rendu de la page :", error);
      this.appContainer.innerHTML = `<div class="error-container"><p>Une erreur est survenue lors du chargement des données.</p></div>`;
    }
  }
}

// On exporte une instance unique (Singleton) pour que toute l'application utilise le même routeur
export const router = new Router();
