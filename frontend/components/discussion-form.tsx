'use client';

import { useState, type FormEvent } from 'react';
import { Icon } from './icons';
import type { Category, DiscussionType } from '@/lib/types';

/**
 * Discussion creation form (mockup composer, as a page per the assessment).
 *
 * Client validation mirrors the Strapi rules of Phase 2 (title ≥ 10 and
 * ≤ 150 chars, required content, required category, type question|discussion)
 * so users get instant feedback while the backend stays authoritative.
 *
 * No persistence is simulated: a valid submission only reports that the
 * payload is ready — the real POST lands in Phase 4.
 */

type FieldKey = 'title' | 'content' | 'category';
type FieldErrors = Partial<Record<FieldKey, string>>;

const TYPE_OPTIONS: {
  value: DiscussionType;
  icon: 'help' | 'msg';
  label: string;
  description: string;
}[] = [
  {
    value: 'question',
    icon: 'help',
    label: 'Poser une question',
    description: "Obtenez l'aide des membres et de la rédaction",
  },
  {
    value: 'discussion',
    icon: 'msg',
    label: 'Lancer une discussion',
    description: 'Partagez une expérience, un avis, une actualité',
  },
];

const placeholderFor = (t: DiscussionType) =>
  t === 'question'
    ? 'Ex. : Faut-il ouvrir un PER à 45 ans ?'
    : "Ex. : Mon retour d'expérience sur la renégociation de mon crédit";

export function DiscussionForm({
  categories,
  initialType = 'question',
}: {
  categories: Category[];
  initialType?: DiscussionType;
}) {
  const [type, setType] = useState<DiscussionType>(initialType);
  const [title, setTitle] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [ready, setReady] = useState(false);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 10) {
      next.title = 'Le titre doit contenir au moins 10 caractères.';
    } else if (trimmedTitle.length > 150) {
      next.title = 'Le titre ne doit pas dépasser 150 caractères.';
    }
    if (!content.trim()) {
      next.content = 'Le contenu est obligatoire.';
    }
    if (!categorySlug) {
      next.category = 'Choisissez un espace.';
    }
    return next;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setReady(false);
      const firstKey = (['title', 'category', 'content'] as FieldKey[]).find((k) => found[k]);
      if (firstKey) {
        document.getElementById(`c-${firstKey === 'category' ? 'cat' : firstKey}`)?.focus();
      }
      return;
    }
    // Payload valid — no simulated persistence (Phase 4 connects Strapi).
    setReady(true);
  };

  /** Any edit invalidates the previous validation result. */
  const touch = () => {
    if (Object.keys(errors).length > 0) setErrors({});
    if (ready) setReady(false);
  };

  return (
    <form className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit} noValidate>
      <fieldset className="types" style={{ border: 0, padding: 0, margin: 0 }} role="radiogroup" aria-label="Type de publication">
        <legend className="sr-only">Type de publication</legend>
        {TYPE_OPTIONS.map((opt) => (
          <label className="type" key={opt.value}>
            <input
              type="radio"
              name="type"
              value={opt.value}
              checked={type === opt.value}
              onChange={() => {
                setType(opt.value);
                touch();
              }}
            />
            <Icon name={opt.icon} />
            <b>{opt.label}</b>
            <small>{opt.description}</small>
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label htmlFor="c-title">Titre</label>
        <input
          className={`input${errors.title ? ' err' : ''}`}
          id="c-title"
          name="title"
          type="text"
          maxLength={150}
          autoComplete="off"
          placeholder={placeholderFor(type)}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            touch();
          }}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'c-title-err' : 'c-title-hint'}
        />
        {errors.title ? (
          <span className="err-msg" id="c-title-err" role="alert">
            {errors.title}
          </span>
        ) : (
          <span className="hint" id="c-title-hint">
            Un titre clair, formulé comme une question, obtient plus vite des réponses.
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="c-category">Espace</label>
        <select
          className={`input${errors.category ? ' err' : ''}`}
          id="c-category"
          name="category"
          value={categorySlug}
          onChange={(e) => {
            setCategorySlug(e.target.value);
            touch();
          }}
          aria-invalid={errors.category ? true : undefined}
          aria-describedby={errors.category ? 'c-category-err' : undefined}
        >
          <option value="">Choisissez un espace…</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.category ? (
          <span className="err-msg" id="c-category-err" role="alert">
            {errors.category}
          </span>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="c-content">
          Contenu <span className="muted" style={{ fontWeight: 400 }}>(obligatoire)</span>
        </label>
        <textarea
          className={`input${errors.content ? ' err' : ''}`}
          id="c-content"
          name="content"
          rows={6}
          placeholder="Votre situation, ce que vous avez déjà envisagé… Plus le contexte est précis, meilleures sont les réponses."
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            touch();
          }}
          aria-invalid={errors.content ? true : undefined}
          aria-describedby={errors.content ? 'c-content-err' : 'c-content-hint'}
        />
        {errors.content ? (
          <span className="err-msg" id="c-content-err" role="alert">
            {errors.content}
          </span>
        ) : (
          <span className="hint" id="c-content-hint">
            Décrivez votre situation en quelques phrases. Restez dans le partage d&apos;expérience.
          </span>
        )}
      </div>

      <p className="compliance">
        <Icon name="shield" />
        <span>
          Partagez votre expérience : pas de conseil personnalisé ni de sollicitation.
          Les validations sont également appliquées côté Strapi.
        </span>
      </p>

      <div className="reply-foot">
        <span className="hint">Les champs sont validés ici puis de nouveau par le serveur.</span>
        <button className="btn btn-primary" type="submit">
          Publier la discussion
        </button>
      </div>

      {ready ? (
        <div className="notice fade-in" role="status">
          <Icon name="check" />
          <span>
            <b>Formulaire valide.</b> La publication sera connectée à l&apos;API Strapi en
            phase&nbsp;4 : aucune donnée n&apos;a encore été enregistrée.
          </span>
        </div>
      ) : null}
    </form>
  );
}
