// src/services/commentStorage.ts

export interface Comment {
  id: string;
  mediaId: number;
  mediaType: "movie" | "series";
  parentId: string | null; // Id du commentaire parent si c'est une réponse
  author: string;
  text: string;
  timestamp: number;
}

export class CommentStorageService {
  private static STORAGE_KEY = "cinetech_comments";

  // Récupérer TOUS les commentaires bruts du localStorage
  private static getAllComments(): Comment[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  // Enregistrer la liste complète
  private static saveAllComments(comments: Comment[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(comments));
  }

  // Récupérer les commentaires d'un film/série spécifique sous forme d'arbre
  public static getCommentsForMedia(
    mediaId: number,
    mediaType: "movie" | "series",
  ): Comment[] {
    const all = this.getAllComments();
    // On filtre d'abord pour ce contenu précis
    return all.filter(
      (c) => c.mediaId === mediaId && c.mediaType === mediaType,
    );
  }

  // Ajouter un nouveau commentaire ou une réponse
  public static addComment(
    mediaId: number,
    mediaType: "movie" | "series",
    author: string,
    text: string,
    parentId: string | null = null,
  ): Comment {
    const all = this.getAllComments();

    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mediaId,
      mediaType,
      parentId,
      author: author.trim() || "Anonyme",
      text: text.trim(),
      timestamp: Date.now(),
    };

    all.push(newComment);
    this.saveAllComments(all);
    return newComment;
  }
}
