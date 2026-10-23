import type { Core } from '@strapi/strapi';

/**
 * Idempotent demo-data seed for the Le Revenu community.
 *
 * Run once with:  SEED_DEMO_DATA=true npm run develop   (from backend/)
 * Safe to rerun: every insert is guarded by a lookup (slug / username / title),
 * so no uncontrolled duplicates are created.
 */

const CATEGORIES: Array<{ name: string; slug: string; description: string }> = [
  { name: 'Bourse & actions', slug: 'bourse', description: "Actions, ETF, PEA, compte-titres : stratégies et retours d'expérience." },
  { name: 'Économie', slug: 'economie', description: 'Conjoncture, taux, inflation, emploi : l’actualité économique en France et en Europe.' },
  { name: 'Épargne & placements', slug: 'epargne', description: 'Livrets, fonds euros, obligations, comptes à terme.' },
  { name: 'Assurance-vie', slug: 'assurance-vie', description: 'Choisir son contrat, arbitrer, transmettre.' },
  { name: 'Immobilier & SCPI', slug: 'immobilier', description: 'Résidence principale, locatif, SCPI, crédit immobilier.' },
  { name: 'Impôts & fiscalité', slug: 'impots', description: 'Déclaration, niches fiscales, IFI : payer le juste impôt.' },
  { name: 'Retraite', slug: 'retraite', description: 'PER, rachat de trimestres, cumul emploi-retraite.' },
  { name: 'Famille & transmission', slug: 'transmission', description: 'Donation, succession, protection du conjoint.' },
  { name: 'Or, cryptos & alternatifs', slug: 'alternatifs', description: 'Or physique, cryptoactifs, forêts, private equity.' },
  { name: 'Budget & conso', slug: 'budget', description: 'Banques, crédits, assurances, bons plans.' },
  { name: 'Le Café du Revenu', slug: 'cafe', description: 'Présentations, discussions libres, idées pour la rédaction.' },
];

interface DemoUser {
  username: string;
  email: string;
  password: string;
  display_name: string;
}

const seedDemoData = async (strapi: Core.Strapi): Promise<void> => {
  strapi.log.info('[seed] Starting demo data initialization...');

  const usersService = strapi.service('plugin::users-permissions.user') as {
    add: (data: Record<string, unknown>) => Promise<{ id: number; username: string }>;
  };
  const authenticatedRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });

  const password = process.env.SEED_USER_PASSWORD || 'Demo!LeRevenu2026';
  const demoUsers: DemoUser[] = [
    { username: 'demo_marie', email: 'marie.durand@exemple.fr', password, display_name: 'Marie Durand' },
    { username: 'demo_paul', email: 'paul.bernard@exemple.fr', password, display_name: 'Paul Bernard' },
    { username: 'demo_sophie', email: 'sophie.martin@exemple.fr', password, display_name: 'Sophie Martin' },
  ];

  const userIds: Record<string, number> = {};
  for (const u of demoUsers) {
    const existing = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({ where: { username: u.username } });
    if (existing) {
      userIds[u.username] = existing.id;
      continue;
    }
    const created = await usersService.add({
      username: u.username,
      email: u.email,
      password: u.password,
      provider: 'local',
      confirmed: true,
      role: authenticatedRole?.id,
    });
    userIds[u.username] = created.id;
  }
  strapi.log.info(`[seed] Users ready: ${Object.keys(userIds).join(', ')}`);

  const categoryIds: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const existing = await strapi.documents('api::category.category').findFirst({
      filters: { slug: c.slug },
    });
    if (existing) {
      categoryIds[c.slug] = existing.documentId;
      continue;
    }
    const created = await strapi.documents('api::category.category').create({
      data: { name: c.name, slug: c.slug, description: c.description },
    });
    categoryIds[c.slug] = created.documentId;
  }
  strapi.log.info(`[seed] Categories ready: ${CATEGORIES.length}`);

  interface SeedDiscussion {
    title: string;
    content: string;
    type: 'question' | 'discussion';
    category: string;
    author: string;
    replies: Array<{ author: string; content: string }>;
  }

  const discussions: SeedDiscussion[] = [
    {
      title: 'Ouvrir un PEA avec 5 000 € : par où commencer ?',
      content:
        "Bonjour, je viens d'ouvrir un PEA en ligne et j'ai 5 000 € à y placer. Je ne connais pas grand-chose aux actions.\n\nVaut-il mieux tout investir d'un coup ou étaler ? Et sur quoi : des ETF, quelques actions ?",
      type: 'question',
      category: 'bourse',
      author: 'demo_paul',
      replies: [
        {
          author: 'demo_marie',
          content:
            "Première chose : avez-vous une épargne de précaution à côté ? Le PEA, c'est de l'argent qu'on oublie au moins cinq ans.\n\nPour débuter, un ETF éligible au PEA qui réplique un indice mondial fait très bien le travail : une seule ligne, des frais faibles, une large diversification.",
        },
        {
          author: 'demo_sophie',
          content:
            "Je recommande aussi d'investir une partie maintenant puis de programmer un versement mensuel : on lisse son point d'entrée et on prend l'habitude de la régularité.",
        },
      ],
    },
    {
      title: 'J’ai 25 ans et 10 000 € de côté : je fais quoi ?',
      content:
        "Premier CDI depuis un an, j'ai réussi à mettre 10 000 € de côté sur un livret. Pas de projet immobilier avant quatre ou cinq ans.\n\nJe me sens un peu perdu entre PEA, assurance-vie, PER… Comment auriez-vous réparti à mon âge ?",
      type: 'question',
      category: 'epargne',
      author: 'demo_sophie',
      replies: [
        {
          author: 'demo_paul',
          content:
            "À 25 ans, ouvrir un PEA et une assurance-vie tôt, même avec peu, c'est surtout prendre date pour la fiscalité. L'antériorité compte énormément sur le long terme.",
        },
      ],
    },
    {
      title: 'SCPI : vous avez renforcé ces derniers mois ou vous attendez ?',
      content:
        "Après les baisses de prix de parts de certaines SCPI, je vois deux écoles autour de moi : ceux qui en profitent pour renforcer et ceux qui ne veulent plus en entendre parler.\n\nEt vous, comment avez-vous réagi ?",
      type: 'discussion',
      category: 'immobilier',
      author: 'demo_marie',
      replies: [
        {
          author: 'demo_paul',
          content:
            "J'ai renforcé, mais uniquement sur des SCPI récentes, sans immobilier de bureaux acheté au plus haut. Je regarde de près le taux d'occupation et la diversification géographique.",
        },
      ],
    },
    {
      title: 'Frais réels ou abattement de 10 % : comment choisir ?',
      content:
        "Je fais 35 km aller-retour par jour en voiture pour aller travailler. Est-ce que je devrais passer aux frais réels pour ma prochaine déclaration ?",
      type: 'question',
      category: 'impots',
      author: 'demo_paul',
      replies: [
        {
          author: 'demo_marie',
          content:
            "Faites le calcul simplement : additionnez vos frais (barème kilométrique, repas, etc.) et comparez avec 10 % de votre salaire. Si vos frais dépassent, les frais réels sont gagnants. Attention à garder les justificatifs.",
        },
      ],
    },
    {
      title: 'PER : vos retours d’expérience après quelques années ?',
      content:
        "J'ai ouvert un PER il y a trois ans pour la déduction fiscale. Je m'interroge sur les frais et sur la sortie. Vos retours d'expérience ?",
      type: 'discussion',
      category: 'retraite',
      author: 'demo_sophie',
      replies: [],
    },
    {
      title: 'Quel sujet aimeriez-vous voir traité par la rédaction ?',
      content:
        "La rédaction lit ce forum, profitons-en ! Moi j'aimerais un dossier complet sur la succession dans les familles recomposées. Et vous ?",
      type: 'discussion',
      category: 'cafe',
      author: 'demo_marie',
      replies: [],
    },
  ];

  let createdCount = 0;
  for (const d of discussions) {
    const existing = await strapi.documents('api::discussion.discussion').findFirst({
      filters: { title: d.title },
    });
    if (existing) continue;

    const authorId = userIds[d.author];
    const categoryDocId = categoryIds[d.category];
    if (!authorId || !categoryDocId) {
      strapi.log.warn(`[seed] Skipping discussion "${d.title}": missing author or category.`);
      continue;
    }

    const discussion = await strapi.documents('api::discussion.discussion').create({
      data: {
        title: d.title,
        content: d.content,
        type: d.type,
        author: authorId,
        category: categoryDocId,
      },
    });

    for (const r of d.replies) {
      const replyAuthorId = userIds[r.author];
      if (!replyAuthorId) continue;
      await strapi.documents('api::reply.reply').create({
        data: {
          content: r.content,
          author: replyAuthorId,
          discussion: discussion.documentId,
        },
      });
    }
    createdCount += 1;
  }

  strapi.log.info(`[seed] Done. Discussions created this run: ${createdCount}.`);
};

export default seedDemoData;
