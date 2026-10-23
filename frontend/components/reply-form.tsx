'use client';

import { useState, type FormEvent } from 'react';
import { Icon } from './icons';
import type { DiscussionType } from '@/lib/types';

/**
 * Reply form of the discussion detail page.
 *
 * Validation mirrors the Strapi rule (required content, ≥ 2 characters once
 * trimmed). A valid submission does not simulate persistence: it reports that
 * the reply is ready — the real POST arrives in Phase 4.
 */
export function ReplyForm({
  discussionAuthorName,
  discussionType,
}: {
  discussionAuthorName: string;
  discussionType: DiscussionType;
}) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Écrivez une réponse avant de publier.');
      setReady(false);
      document.getElementById('reply-body')?.focus();
      return;
    }
    if (trimmed.length < 2) {
      setError('Votre réponse doit contenir au moins 2 caractères.');
      setReady(false);
      document.getElementById('reply-body')?.focus();
      return;
    }
    setError(null);
    // Payload valid — no simulated persistence (Phase 4 connects Strapi).
    setReady(true);
  };

  const handleChange = (value: string) => {
    setContent(value);
    if (error) setError(null);
    if (ready) setReady(false);
  };

  return (
    <form className="post reply-box" onSubmit={handleSubmit} noValidate>
      <label htmlFor="reply-body" className="sr-only">
        Votre réponse
      </label>
      <textarea
        id="reply-body"
        name="content"
        className={error ? 'err' : undefined}
        style={error ? { borderColor: 'var(--alert)' } : undefined}
        placeholder={
          discussionType === 'question'
            ? `Partagez votre expérience pour aider ${discussionAuthorName}…`
            : 'Votre avis sur la question…'
        }
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'reply-err' : 'reply-hint'}
      />
      {error ? (
        <span className="err-msg" id="reply-err" role="alert">
          {error}
        </span>
      ) : null}
      <div className="reply-foot">
        <span className="hint" id="reply-hint">
          Réponses vérifiées par le serveur — pas de conseil personnalisé.
        </span>
        <button className="btn btn-primary" type="submit">
          Publier ma réponse
        </button>
      </div>
      {ready ? (
        <div className="notice fade-in" role="status">
          <Icon name="check" />
          <span>
            <b>Réponse valide.</b> Son enregistrement sera connecté à l&apos;API Strapi en
            phase&nbsp;4 : rien n&apos;a encore été publié.
          </span>
        </div>
      ) : null}
    </form>
  );
}
