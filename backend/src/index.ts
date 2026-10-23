import type { Core } from '@strapi/strapi';
import seedDemoData from './utils/seed';

/**
 * Idempotently enable permission actions for a users-permissions role.
 * Rows are created if missing, enabled if disabled. Never disables anything.
 */
const enablePermissions = async (
  strapi: Core.Strapi,
  roleType: 'public' | 'authenticated',
  actions: string[]
): Promise<void> => {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: roleType } });
  if (!role) {
    strapi.log.warn(`[permissions] Role "${roleType}" not found, skipping.`);
    return;
  }

  for (const action of actions) {
    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { role: role.id, action } });
    if (existing) {
      if (!existing.enabled) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .update({ where: { id: existing.id }, data: { enabled: true } });
      }
    } else {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .create({ data: { action, role: role.id, enabled: true } });
    }
  }
  strapi.log.info(`[permissions] ${roleType}: enabled ${actions.length} action(s).`);
};

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Public role: read-only access to published content (find / findOne).
    // No create/update/delete is ever granted to anonymous users.
    await enablePermissions(strapi, 'public', [
      'api::category.category.find',
      'api::category.category.findOne',
      'api::discussion.discussion.find',
      'api::discussion.discussion.findOne',
      'api::reply.reply.find',
      'api::reply.reply.findOne',
    ]);

    // Authenticated role: read access + create for discussions and replies.
    // Update/delete stay admin-only: owner checks in controllers are
    // defense-in-depth on top of this.
    await enablePermissions(strapi, 'authenticated', [
      'api::category.category.find',
      'api::category.category.findOne',
      'api::discussion.discussion.find',
      'api::discussion.discussion.findOne',
      'api::discussion.discussion.create',
      'api::reply.reply.find',
      'api::reply.reply.findOne',
      'api::reply.reply.create',
    ]);

    // Opt-in demo seed (idempotent): SEED_DEMO_DATA=true npm run develop
    if (process.env.SEED_DEMO_DATA === 'true') {
      await seedDemoData(strapi);
    }
  },
};
