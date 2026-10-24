'use client';

import { useActionState, useState, type FormEvent } from 'react';
import { Icon } from './icons';
import { createReplyAction, type ReplyFormState } from '@/app/actions/community';

const initialActionState: ReplyFormState = {};

/**
 * Reply form of the discussion detail page — now wired to the real Strapi
 * API through the `createReply` server action (Phase 4).
 *
 * Validation mirrors the Strapi rule (required content, ≥ 2 characters once
 * trimmed) for instant feedback; the backend stays authoritative and the
 * author ALWAYS comes from the session cookie, so a member can never publish
 * on behalf of someone else. A new reply is added to the rendered list as
 * soon as the action resolves.
 */
export function ReplyForm({
  discussionAuthorName,
  discussionType,
  discussionId,
}: {
  discussionAuthorName: string;
  discussionType: 'question' | 'discussion';
  /** Strapi documentId the reply is attached to. */
  discussionId: string;
}) {
  const [state, submitAction, pending] = useActionState(createReplyAction, initialActionState);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const message = error ?? state.formError ?? null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const trimmed = content.trim();
    if (!trimmed) {
      event.preventDefault();
      setError('Écrivez une réponse avant de publier.');
      document.getElementById('reply-body')?.focus();
      return;
    }
    if (trimmed.length < 2) {
      event.preventDefault();
      setError('Votre réponse doit contenir au moins 2 caractères.');
      document.getElementById('reply-body')?.focus();
      return;
    }
    setError(null);
    // Optimistic clear while the server action persists the reply.
    setContent('');
  };

  const handleChange = (value: string) => {
    setContent(value);
    if (error) setError(null);
  };

  return (
    <form className="post reply-box" action={submitAction} onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="discussionId" value={discussionId} />

      <label htmlFor="reply-body" className="sr-only">
        Votre réponse
      </label>
      <textarea
        id="reply-body"
        name="content"
        className={message ? 'err' : undefined}
        style={message ? { borderColor: 'var(--alert)' } : undefined}
        placeholder={
          discussionType === 'question'
            ? `Partagez votre expérience pour aider ${discussionAuthorName}…`
            : 'Votre avis sur la question…'
        }
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? 'reply-err' : 'reply-hint'}
      />
      {message ? (
        <span className="err-msg" id="reply-err" role="alert">
          {message}
        </span>
      ) : (
        <span className="hint" id="reply-hint">
          Réponses vérifiées par le serveur — pas de conseil personnalisé.
        </span>
      )}

      <div className="reply-foot">
        <span className="hint">{pending ? 'Envoi…' : 'Votre réponse sera publiée sous votre pseudo membre.'}</span>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? 'Envoi…' : 'Publier ma réponse'}
        </button>
      </div>

      {state.ok ? (
        <div className="notice fade-in" role="status">
          <Icon name="check" />
          <span>
            <b>Réponse publiée.</b> Elle apparaît ci-dessus avec votre nom de membre.
          </span>
        </div>
      ) : null}
    </form>
  );
}
