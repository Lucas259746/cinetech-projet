// Définition de la structure exacte d'un commentaire
export interface Comment {
  id: string; // Identifiant unique
  mediaId: number; // ID du film ou de la série
  mediaType: "movie" | "series"; // Pour différencier films et séries
  parentId: string | null; // ID du commentaire auquel on répond (null si c'est un commentaire principal)
  author: string; // Nom de l'utilisateur
  text: string; // Contenu du message
  timestamp: number; // Date de création en millisecondes
}

// Service gérant le stockage des commentaires dans le navigateur
export class CommentStorageService {
  // Le nom de la clé sous laquelle les données seront stockées dans le localStorage
  private static STORAGE_KEY = "cinetech_comments";

  // Méthode privée pour récupérer tous les commentaires stockés
  private static getAllComments(): Comment[] {
    // Lit la chaîne de caractères brute depuis le localStorage
    const raw = localStorage.getItem(this.STORAGE_KEY);
    // Si des données existent, on les transforme en tableau d'objets, sinon on renvoie un tableau vide
    return raw ? JSON.parse(raw) : [];
  }

  // Méthode privée pour sauvegarder le tableau de commentaires
  private static saveAllComments(comments: Comment[]): void {
    // Transforme le tableau d'objets en chaîne de caractères pour le stockage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(comments));
  }

  // Méthode publique pour récupérer uniquement les commentaires d'un média précis
  public static getCommentsForMedia(
    mediaId: number,
    mediaType: "movie" | "series",
  ): Comment[] {
    // On récupère toute la base
    const all = this.getAllComments();
    // On ne garde que ceux qui correspondent au bon média et au bon type
    return all.filter(
      (c) => c.mediaId === mediaId && c.mediaType === mediaType,
    );
  }

  // Méthode publique pour créer et sauvegarder un nouveau commentaire
  public static addComment(
    mediaId: number,
    mediaType: "movie" | "series",
    author: string,
    text: string,
    parentId: string | null = null,
  ): Comment {
    // Récupération de l'historique
    const all = this.getAllComments();

    // Création du nouvel objet commentaire
    const newComment: Comment = {
      // Génération d'un ID unique basé sur la date et des caractères aléatoires
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mediaId,
      mediaType,
      parentId,
      author: author.trim() || "Anonyme", // Fallback sur "Anonyme" si le champ est vide
      text: text.trim(), // Supprime les espaces inutiles autour du texte
      timestamp: Date.now(), // Date actuelle
    };

    // On ajoute le nouveau commentaire à la liste existante
    all.push(newComment);
    // On sauvegarde la nouvelle liste dans le navigateur
    this.saveAllComments(all);

    // On retourne le commentaire nouvellement créé
    return newComment;
  }
}
