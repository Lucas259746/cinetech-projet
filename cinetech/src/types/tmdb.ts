// src/types/tmdb.ts

/* ==========================================================================
   INTERFACES DE DONNÉES (CONTRATS TYPESCRIPT POUR L'API TMDB)
   ========================================================================== */

// 1. Structure de base pour un Film renvoyé par l'API
export interface Movie {
  id: number; // Identifiant unique numérique du film
  title: string; // Titre officiel du film
  overview: string; // Résumé / Synopsis du film
  poster_path: string; // Chemin partiel de l'image de l'affiche
  backdrop_path: string; // Chemin partiel de l'image de fond (bannière)
  release_date: string; // Date de sortie au format texte (AAAA-MM-JJ)
  vote_average: number; // Note moyenne attribuée par les utilisateurs
}

// 2. Structure de base pour une Série TV renvoyée par l'API
export interface Series {
  id: number; // Identifiant unique numérique de la série
  name: string; // Nom officiel de la série (TMDB utilise 'name' au lieu de 'title')
  overview: string; // Résumé / Synopsis de la série
  poster_path: string; // Chemin partiel de l'image de l'affiche
  backdrop_path: string; // Chemin partiel de l'image de fond
  first_air_date: string; // Date de première diffusion (TMDB utilise 'first_air_date' au lieu de 'release_date')
  vote_average: number; // Note moyenne attribuée par les utilisateurs
}

// 3. Structure générique pour les réponses de listes TMDB (ex: tendances, recherches)
// Le <T> (Generics) permet de réutiliser cette structure aussi bien pour un tableau de films que de séries
export interface TMDBResponse<T> {
  page: number; // Numéro de la page actuelle chargée
  results: T[]; // Tableau de résultats de type T (ex: Movie[] ou Series[])
  total_pages: number; // Nombre total de pages disponibles sur les serveurs
  total_results: number; // Nombre total d'éléments existants dans leur base de données
}

// 4. Structure modélisant un commentaire utilisateur pour l'espace commentaires locaux
export interface TMDBComment {
  author: string; // Pseudo ou nom de l'auteur du commentaire
  content: string; // Message textuel rédigé
  created_at: string; // Date et heure de création de l'avis
  id: string; // Identifiant unique du commentaire (souvent un UUID généré)
}

// 5. Structure modélisant un membre de l'équipe ou du casting (Acteurs / Réalisateurs)
export interface CreditItem {
  id: number; // ID unique de la personne
  name: string; // Nom complet (Prénom Nom)
  character?: string; // Propriété conditionnelle (?) : Nom du personnage (uniquement pour les acteurs)
  job?: string; // Propriété conditionnelle (?) : Métier (ex: 'Director', uniquement pour l'équipe technique)
  profile_path: string | null; // Chemin vers la photo de profil (ou null si aucune image disponible)
}
