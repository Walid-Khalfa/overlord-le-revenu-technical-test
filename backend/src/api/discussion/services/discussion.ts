import { factories } from '@strapi/strapi';

/**
 * Discussion core service — required so the default core controller
 * can resolve `strapi.service('api::discussion.discussion')`.
 */
export default factories.createCoreService('api::discussion.discussion');
