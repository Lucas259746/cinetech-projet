// src/utils/comments.ts
import { CommentStorageService } from "../services/commentStorage";
import type { Comment as LocalComment } from "../services/commentStorage";

export function initCommentsSection(
  mediaId: number,
  mediaType: "movie" | "series",
) {
  const container = document.getElementById("comments-container-root");
  if (!container) return;

  // Fonction de rendu principal de la zone
  const render = () => {
    const allMediaComments = CommentStorageService.getCommentsForMedia(
      mediaId,
      mediaType,
    );

    // Séparation des commentaires racines (sans parents) et des réponses
    const rootComments = allMediaComments.filter((c) => c.parentId === null);

    container.innerHTML = `
      <form id="main-comment-form" class="comment-form">
        <h3>Laisser un commentaire</h3>
        <div class="form-group">
          <input type="text" id="comment-author" placeholder="Votre pseudo..." required>
        </div>
        <div class="form-group">
          <textarea id="comment-text" rows="3" placeholder="Qu'avez-vous pensé de cette œuvre ?" required></textarea>
        </div>
        <button type="submit" class="btn">Envoyer</button>
      </form>

      <div class="comments-tree">
        ${
          rootComments.length === 0
            ? '<p class="no-comments">Aucun commentaire pour le moment. Soyez le premier !</p>'
            : rootComments
                .map((rc) => buildCommentHTML(rc, allMediaComments))
                .join("")
        }
      </div>
    `;

    // Attacher les événements sur le formulaire principal
    const mainForm = document.getElementById(
      "main-comment-form",
    ) as HTMLFormElement;
    mainForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const authorInput = document.getElementById(
        "comment-author",
      ) as HTMLInputElement;
      const textInput = document.getElementById(
        "comment-text",
      ) as HTMLTextAreaElement;

      CommentStorageService.addComment(
        mediaId,
        mediaType,
        authorInput.value,
        textInput.value,
        null,
      );
      render(); // Re-rendu immédiat local
    });

    // Attacher les événements "Répondre" sur les boutons
    attachReplyEvents(allMediaComments, render);
  };

  render();
}

/**
 * Fonction récursive pour construire l'arbre HTML
 */
function buildCommentHTML(
  comment: LocalComment,
  allComments: LocalComment[],
): string {
  // On cherche si ce commentaire a des enfants (des réponses)
  const replies = allComments.filter((c) => c.parentId === comment.id);
  const dateFormatted = new Date(comment.timestamp).toLocaleDateString(
    "fr-FR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return `
    <div class="comment-node" id="node-${comment.id}">
      <div class="comment-body">
        <div class="comment-meta">
          <span class="comment-author">👤 ${comment.author}</span>
          <span class="comment-date">le ${dateFormatted}</span>
        </div>
        <p class="comment-text">${comment.text}</p>
        <button class="btn-reply-trigger" data-id="${comment.id}">💬 Répondre</button>
        
        <div id="reply-form-container-${comment.id}"></div>
      </div>

      ${
        replies.length > 0
          ? `<div class="comment-replies-container">
            ${replies.map((reply) => buildCommentHTML(reply, allComments)).join("")}
           </div>`
          : ""
      }
    </div>
  `;
}

/**
 * Ajoute la logique d'ouverture des formulaires de réponses imbriqués
 */
function attachReplyEvents(allComments: LocalComment[], onRefresh: () => void) {
  const replyBtns = document.querySelectorAll(".btn-reply-trigger");

  replyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const parentId = btn.getAttribute("data-id");
      if (!parentId) return;

      const formContainer = document.getElementById(
        `reply-form-container-${parentId}`,
      );
      if (!formContainer) return;

      // Si le formulaire est déjà ouvert, on le ferme au clic
      if (formContainer.innerHTML !== "") {
        formContainer.innerHTML = "";
        return;
      }

      // Fermer tous les autres formulaires de réponse ouverts pour éviter la confusion
      document
        .querySelectorAll('[id^="reply-form-container-"]')
        .forEach((el) => (el.innerHTML = ""));

      // Injecter le sous-formulaire
      formContainer.innerHTML = `
        <form class="comment-form reply-form">
          <div class="form-group">
            <input type="text" id="reply-author-${parentId}" placeholder="Votre pseudo..." required>
          </div>
          <div class="form-group">
            <textarea id="reply-text-${parentId}" rows="2" placeholder="Écrire votre réponse..." required></textarea>
          </div>
          <div class="reply-actions">
            <button type="submit" class="btn btn-small">Répondre</button>
            <button type="button" class="btn btn-small btn-secondary" id="cancel-${parentId}">Annuler</button>
          </div>
        </form>
      `;

      const subForm = formContainer.querySelector("form") as HTMLFormElement;
      subForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const author = (
          document.getElementById(
            `reply-author-${parentId}`,
          ) as HTMLInputElement
        ).value;
        const text = (
          document.getElementById(
            `reply-text-${parentId}`,
          ) as HTMLTextAreaElement
        ).value;

        // Récupération des infos du parent pour lier la réponse au même film/série
        const parentComment = allComments.find((c) => c.id === parentId);
        if (parentComment) {
          CommentStorageService.addComment(
            parentComment.mediaId,
            parentComment.mediaType,
            author,
            text,
            parentId,
          );
          onRefresh(); // Rafraîchir l'arbre complet
        }
      });

      // Bouton annuler
      document
        .getElementById(`cancel-${parentId}`)
        ?.addEventListener("click", () => {
          formContainer.innerHTML = "";
        });
    });
  });
}
