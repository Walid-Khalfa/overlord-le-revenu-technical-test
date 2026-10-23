import { factories } from '@strapi/strapi';

/**
 * Category core service — required so the default core controller
 * can resolve `strapi.service('api::category.category')`.
 */
export default factories.createCoreService('api::category.category');
