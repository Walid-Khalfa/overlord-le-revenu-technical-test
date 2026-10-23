import { factories } from '@strapi/strapi';

/**
 * Category routes — read-only core routes (find / findOne).
 * Creation/deletion is reserved to the admin panel.
 */
export default factories.createCoreRouter('api::category.category');
