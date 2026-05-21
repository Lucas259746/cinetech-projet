// Interface définissant l'ancienne ou l'autre structure d'un commentaire
export interface LocalComment {
  id: string;
  itemId: number;
  type: "movie" | "series";
  author: string;
  content: string;
  parentId: string | null;
  createdAt: string;
}

export const StorageService = {
  // --- FAVORIS ---

  // Méthode pour récupérer la liste des favoris depuis le localStorage
  getFavorites(): { movies: number[]; series: number[] } {
    const data = localStorage.getItem("cinetech_favs");
    // Retourne l'objet JSON ou une structure vide par défaut
    return data ? JSON.parse(data) : { movies: [], series: [] };
  },

  // Méthode pour ajouter ou supprimer un favori
  toggleFavorite(id: number, type: "movie" | "series"): void {
    const favs = this.getFavorites();
    // Sélectionne le bon tableau en fonction du type
    const list = type === "movie" ? favs.movies : favs.series;

    // Si l'ID est déjà dans la liste, cela veut dire qu'on le supprime
    if (list.includes(id)) {
      if (type === "movie") favs.movies = favs.movies.filter((i) => i !== id);
      else favs.series = favs.series.filter((i) => i !== id);
    } else {
      // Sinon on l'ajoute
      list.push(id);
    }
    // Sauvegarde la mise à jour
    localStorage.setItem("cinetech_favs", JSON.stringify(favs));
  },

  // Vérifie si un média spécifique est dans les favoris
  isFavorite(id: number, type: "movie" | "series"): boolean {
    const favs = this.getFavorites();
    return type === "movie"
      ? favs.movies.includes(id)
      : favs.series.includes(id);
  },

  // --- COMMENTAIRES (Alternative API / Legacy) ---

  // Récupère les commentaires pour un contenu précis
  getComments(itemId: number, type: "movie" | "series"): LocalComment[] {
    const data = localStorage.getItem("cinetech_comments");
    const all: LocalComment[] = data ? JSON.parse(data) : [];
    return all.filter((c) => c.itemId === itemId && c.type === type);
  },

  // Ajoute un commentaire dans cette structure
  addComment(
    itemId: number,
    type: "movie" | "series",
    author: string,
    content: string,
    parentId: string | null = null,
  ): void {
    const data = localStorage.getItem("cinetech_comments");
    const all: LocalComment[] = data ? JSON.parse(data) : [];

    const newComment: LocalComment = {
      id: crypto.randomUUID(), // Utilise l'API crypto du navigateur pour un ID unique
      itemId,
      type,
      author,
      content,
      parentId,
      // Date formatée directement en chaîne (ex: 14:30)
      createdAt: new Date().toLocaleDateString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    all.push(newComment);
    localStorage.setItem("cinetech_comments", JSON.stringify(all));
  },
};
