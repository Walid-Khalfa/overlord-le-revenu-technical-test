/**
 * Fictional dataset used until Phase 4 wires the app to the Strapi API.
 *
 * - Categories / slugs / content mirror the Strapi seed of Phase 2, so the
 *   swap to real API calls is a drop-in replacement (same slugs, same titles).
 * - Presentation numbers (likes, views, colours, icons) come from the
 *   recruiter's HTML mockup.
 *
 * UI components never import this file directly: they go through
 * `lib/community.ts`, the single data-access layer to replace in Phase 4.
 */

import type { Author, Category, Discussion, Reply } from './types';

export const CATEGORIES: Category[] = [
  { slug: 'bourse', name: 'Bourse & actions', description: "Actions, ETF, PEA, compte-titres : stratégies et retours d'expérience.", icon: 'candles', color: '#007aff' },
  { slug: 'economie', name: 'Économie', description: "Conjoncture, taux, inflation, emploi : l'actualité économique en France, en Europe et dans le monde.", icon: 'globe', color: '#3d5a80' },
  { slug: 'epargne', name: 'Épargne & placements', description: 'Livrets, fonds euros, obligations, comptes à terme.', icon: 'piggy', color: '#34c759' },
  { slug: 'assurance-vie', name: 'Assurance-vie', description: 'Choisir son contrat, arbitrer, transmettre.', icon: 'umbrella', color: '#30b0c7' },
  { slug: 'immobilier', name: 'Immobilier & SCPI', description: 'Résidence principale, locatif, SCPI, crédit immobilier.', icon: 'building', color: '#ff9500' },
  { slug: 'impots', name: 'Impôts & fiscalité', description: 'Déclaration, niches fiscales, IFI : payer le juste impôt.', icon: 'receipt', color: '#5856d6' },
  { slug: 'retraite', name: 'Retraite', description: 'PER, rachat de trimestres, cumul emploi-retraite.', icon: 'armchair', color: '#ff2d55' },
  { slug: 'transmission', name: 'Famille & transmission', description: 'Donation, succession, protection du conjoint.', icon: 'family', color: '#af52de' },
  { slug: 'alternatifs', name: 'Or, cryptos & alternatifs', description: 'Or physique, cryptoactifs, forêts, private equity.', icon: 'gem', color: '#00c7be' },
  { slug: 'budget', name: 'Budget & conso', description: 'Banques, crédits, assurances, bons plans.', icon: 'wallet', color: '#8e8e93' },
  { slug: 'cafe', name: 'Le Café du Revenu', description: 'Présentations, discussions libres, idées pour la rédaction.', icon: 'coffee', color: '#a2845e' },
];

export const AUTHORS: Record<string, Author> = {
  demo_marie: { id: 'marie', username: 'demo_marie', displayName: 'Marie Durand', color: '#0a7f99' },
  demo_paul: { id: 'paul', username: 'demo_paul', displayName: 'Paul Bernard', color: '#c93400' },
  demo_sophie: { id: 'sophie', username: 'demo_sophie', displayName: 'Sophie Martin', color: '#5856d6' },
};

const reply = (
  id: string,
  author: keyof typeof AUTHORS,
  content: string,
  createdAt: string,
  likes: number
): Reply => ({ id, content, author: AUTHORS[author], createdAt, likes });

export const DISCUSSIONS: Discussion[] = [
  {
    id: 'd1',
    slug: 'ouvrir-un-pea-avec-5000-euros',
    title: 'Ouvrir un PEA avec 5 000 € : par où commencer ?',
    content:
      "Bonjour, je viens d'ouvrir un PEA en ligne et j'ai 5 000 € à y placer. Je ne connais pas grand-chose aux actions.\n\nVaut-il mieux tout investir d'un coup ou étaler ? Et sur quoi : des ETF, quelques actions ?",
    type: 'question',
    categorySlug: 'bourse',
    author: AUTHORS.demo_paul,
    createdAt: '2026-10-21T10:00:00.000Z',
    likes: 19,
    views: 1210,
    replies: [
      reply(
        'r1',
        'demo_marie',
        "Première chose : avez-vous une épargne de précaution à côté ? Le PEA, c'est de l'argent qu'on oublie au moins cinq ans.\n\nPour débuter, un ETF éligible au PEA qui réplique un indice mondial fait très bien le travail : une seule ligne, des frais faibles, une large diversification.",
        '2026-10-21T12:00:00.000Z',
        14
      ),
      reply(
        'r2',
        'demo_sophie',
        "Je recommande aussi d'investir une partie maintenant puis de programmer un versement mensuel : on lisse son point d'entrée et on prend l'habitude de la régularité.",
        '2026-10-21T17:45:00.000Z',
        47
      ),
    ],
  },
  {
    id: 'd2',
    slug: 'jai-25-ans-et-10-000-euros-de-cote',
    title: 'J’ai 25 ans et 10 000 € de côté : je fais quoi ?',
    content:
      "Premier CDI depuis un an, j'ai réussi à mettre 10 000 € de côté sur un livret. Pas de projet immobilier avant quatre ou cinq ans.\n\nJe me sens un peu perdu entre PEA, assurance-vie, PER… Comment auriez-vous réparti à mon âge ?",
    type: 'question',
    categorySlug: 'epargne',
    author: AUTHORS.demo_sophie,
    createdAt: '2026-10-22T19:30:00.000Z',
    likes: 33,
    views: 1890,
    replies: [
      reply(
        'r3',
        'demo_paul',
        "À 25 ans, ouvrir un PEA et une assurance-vie tôt, même avec peu, c'est surtout prendre date pour la fiscalité. L'antériorité compte énormément sur le long terme.",
        '2026-10-22T21:00:00.000Z',
        26
      ),
    ],
  },
  {
    id: 'd3',
    slug: 'scpi-avez-vous-renforce-ou-attendez',
    title: 'SCPI : vous avez renforcé ces derniers mois ou vous attendez ?',
    content:
      "Après les baisses de prix de parts de certaines SCPI, je vois deux écoles autour de moi : ceux qui en profitent pour renforcer et ceux qui ne veulent plus en entendre parler.\n\nEt vous, comment avez-vous réagi ?",
    type: 'discussion',
    categorySlug: 'immobilier',
    author: AUTHORS.demo_marie,
    createdAt: '2026-10-20T14:00:00.000Z',
    likes: 15,
    views: 760,
    replies: [
      reply(
        'r4',
        'demo_paul',
        "J'ai renforcé, mais uniquement sur des SCPI récentes, sans immobilier de bureaux acheté au plus haut. Je regarde de près le taux d'occupation et la diversification géographique.",
        '2026-10-20T16:30:00.000Z',
        13
      ),
    ],
  },
  {
    id: 'd4',
    slug: 'frais-reels-ou-abattement-10-pourcent',
    title: 'Frais réels ou abattement de 10 % : comment choisir ?',
    content:
      "Je fais 35 km aller-retour par jour en voiture pour aller travailler. Est-ce que je devrais passer aux frais réels pour ma prochaine déclaration ?",
    type: 'question',
    categorySlug: 'impots',
    author: AUTHORS.demo_paul,
    createdAt: '2026-10-18T08:30:00.000Z',
    likes: 12,
    views: 910,
    replies: [
      reply(
        'r5',
        'demo_marie',
        "Faites le calcul simplement : additionnez vos frais (barème kilométrique, repas, etc.) et comparez avec 10 % de votre salaire. Si vos frais dépassent, les frais réels sont gagnants. Attention à garder les justificatifs.",
        '2026-10-18T10:15:00.000Z',
        22
      ),
    ],
  },
  {
    id: 'd5',
    slug: 'per-retours-experience-apres-quelques-annees',
    title: 'PER : vos retours d’expérience après quelques années ?',
    content:
      "J'ai ouvert un PER il y a trois ans pour la déduction fiscale. Je m'interroge sur les frais et sur la sortie. Vos retours d'expérience ?",
    type: 'discussion',
    categorySlug: 'retraite',
    author: AUTHORS.demo_sophie,
    createdAt: '2026-10-17T18:00:00.000Z',
    likes: 9,
    views: 540,
    replies: [],
  },
  {
    id: 'd6',
    slug: 'quel-sujet-aimeriez-vous-voir-par-la-redaction',
    title: 'Quel sujet aimeriez-vous voir traité par la rédaction ?',
    content:
      "La rédaction lit ce forum, profitons-en ! Moi j'aimerais un dossier complet sur la succession dans les familles recomposées. Et vous ?",
    type: 'discussion',
    categorySlug: 'cafe',
    author: AUTHORS.demo_marie,
    createdAt: '2026-10-15T09:00:00.000Z',
    likes: 64,
    views: 2140,
    replies: [],
  },
];
