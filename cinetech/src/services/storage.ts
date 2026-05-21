// src/services/storage.ts

export interface LocalComment {
  id: string;
  itemId: number;
  type: "movie" | "series";
  author: string;
  content: string;
  parentId: string | null; // Pour gérer l'arborescence des réponses
  createdAt: string;
}

export const StorageService = {
  // --- FAVORIS ---
  getFavorites(): { movies: number[]; series: number[] } {
    const data = localStorage.getItem("cinetech_favs");
    return data ? JSON.parse(data) : { movies: [], series: [] };
  },

  toggleFavorite(id: number, type: "movie" | "series"): void {
    const favs = this.getFavorites();
    const list = type === "movie" ? favs.movies : favs.series;

    if (list.includes(id)) {
      if (type === "movie") favs.movies = favs.movies.filter((i) => i !== id);
      else favs.series = favs.series.filter((i) => i !== id);
    } else {
      list.push(id);
    }
    localStorage.setItem("cinetech_favs", JSON.stringify(favs));
  },

  isFavorite(id: number, type: "movie" | "series"): boolean {
    const favs = this.getFavorites();
    return type === "movie"
      ? favs.movies.includes(id)
      : favs.series.includes(id);
  },

  // --- COMMENTAIRES ---
  getComments(itemId: number, type: "movie" | "series"): LocalComment[] {
    const data = localStorage.getItem("cinetech_comments");
    const all: LocalComment[] = data ? JSON.parse(data) : [];
    return all.filter((c) => c.itemId === itemId && c.type === type);
  },

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
      id: crypto.randomUUID(),
      itemId,
      type,
      author,
      content,
      parentId,
      createdAt: new Date().toLocaleDateString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    all.push(newComment);
    localStorage.setItem("cinetech_comments", JSON.stringify(all));
  },
};
