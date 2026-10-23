import { factories } from '@strapi/strapi';
import { serializeCategory } from '../../../utils/serialize';

/**
 * Category core controller — read-only (find / findOne).
 * Creation/management stays in the admin panel: public and authenticated
 * roles never receive create/update/delete on categories.
 *
 * Responses are explicitly serialized (documentId, name, slug, description)
 * while passing Strapi's built-in pagination, sorting and filtering through
 * to the Document Service (backend-side tri/pagination per the PDF).
 */
export default factories.createCoreController(
  'api::category.category',
  ({ strapi }) => ({
    async find(ctx: any) {
      await this.validateQuery!(ctx);
      const sanitizedQuery = await this.sanitizeQuery!(ctx);
      const service: any = strapi.service('api::category.category');
      const { results, pagination } = await service.find(sanitizedQuery);
      return ctx.send({
        data: results.map(serializeCategory),
        meta: { pagination },
      });
    },

    async findOne(ctx: any) {
      await this.validateQuery!(ctx);
      const sanitizedQuery = await this.sanitizeQuery!(ctx);
      const service: any = strapi.service('api::category.category');
      const entity = await service.findOne(ctx.params?.id, sanitizedQuery);
      if (!entity) {
        return ctx.notFound('Catégorie introuvable.');
      }
      return ctx.send({ data: serializeCategory(entity) });
    },
  })
);
