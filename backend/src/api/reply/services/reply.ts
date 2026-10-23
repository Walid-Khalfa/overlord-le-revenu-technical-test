import { factories } from '@strapi/strapi';

/**
 * Reply core service — required so the default core controller
 * can resolve `strapi.service('api::reply.reply')`.
 */
export default factories.createCoreService('api::reply.reply');
