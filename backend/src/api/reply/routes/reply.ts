import { factories } from '@strapi/strapi';

/**
 * Reply routes — core REST (find/findOne/create/update/delete).
 * Authorization is enforced by permissions (bootstrap) + controller overrides.
 */
export default factories.createCoreRouter('api::reply.reply');
