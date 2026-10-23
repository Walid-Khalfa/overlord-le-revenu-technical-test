import { factories } from '@strapi/strapi';
import {
  asRelationRef,
  FieldError,
  readData,
  validateDiscussionInput,
} from '../../../utils/validation';
import { serializeDiscussion } from '../../../utils/serialize';

/**
 * Discussion REST controller.
 *
 * - Create requires an authenticated user (401 otherwise).
 * - The author is ALWAYS taken from the server-side session: a client-supplied
 *   `author` value is ignored (impersonation is impossible).
 * - Update/delete are restricted to the author (403 otherwise).
 * - Validation (title length, content, type enum, existing category) is done
 *   server-side and returns coherent HTTP errors (400/401/403/404).
 *
 * Permissions (bootstrap) never grant update/delete to non-admin roles, so the
 * owner checks here are defense-in-depth on top of the permission layer.
 */
export default factories.createCoreController(
  'api::discussion.discussion',
  ({ strapi }) => ({
    /**
     * List — one joined query populates author, category and replies (no N+1).
     * Populate is set server-side (not via `?populate=`) because the public
     * role lacks the `plugin::users-permissions.user.find` scope, which would
     * strip the author relation from query-param populates. Output goes
     * through explicit serializers: only id + username ever leave the API.
     * Backend pagination/sort/filters from the query are passed through.
     */
    async find(ctx: any) {
      await this.validateQuery!(ctx);
      const sanitizedQuery = await this.sanitizeQuery!(ctx);
      const service: any = strapi.service('api::discussion.discussion');
      const { results, pagination } = await service.find({
        ...sanitizedQuery,
        populate: {
          author: true,
          category: true,
          replies: { populate: { author: true } },
        },
      });
      return ctx.send({
        data: results.map(serializeDiscussion),
        meta: { pagination },
      });
    },

    /** Detail — same guarantees as the list, 404 when the document is unknown. */
    async findOne(ctx: any) {
      await this.validateQuery!(ctx);
      const sanitizedQuery = await this.sanitizeQuery!(ctx);
      const service: any = strapi.service('api::discussion.discussion');
      const entity = await service.findOne(ctx.params?.id, {
        ...sanitizedQuery,
        populate: {
          author: true,
          category: true,
          replies: { populate: { author: true } },
        },
      });
      if (!entity) {
        return ctx.notFound('Discussion introuvable.');
      }
      return ctx.send({ data: serializeDiscussion(entity) });
    },

    async create(ctx: any) {
      const user = ctx.state?.user;
      if (!user) {
        return ctx.unauthorized('Vous devez être connecté pour publier une discussion.');
      }

      const data = readData(ctx.request?.body);
      // Never trust a client-supplied author: it is dropped here and forced below.
      delete data.author;

      const { values, errors } = validateDiscussionInput(data);
      if (values.categoryRef) {
        const category = await strapi
          .documents('api::category.category')
          .findFirst({ filters: { documentId: values.categoryRef } });
        if (!category) {
          errors.push({ field: 'category', message: 'Cette catégorie n’existe pas.' });
        }
      }
      if (errors.length > 0) {
        return ctx.badRequest('Discussion invalide.', { errors });
      }

      const entity: any = await strapi.documents('api::discussion.discussion').create({
        data: {
          title: values.title,
          content: values.content,
          type: values.type,
          author: user.id,
          category: values.categoryRef as string,
        },
        populate: ['author', 'category'],
      });

      return ctx.created({ data: serializeDiscussion(entity) });
    },

    async update(ctx: any) {
      const user = ctx.state?.user;
      if (!user) {
        return ctx.unauthorized();
      }

      const documentId = ctx.params?.id;
      const existing: any = await strapi.documents('api::discussion.discussion').findFirst({
        filters: { documentId },
        populate: ['author', 'category'],
      });
      if (!existing) {
        return ctx.notFound('Discussion introuvable.');
      }
      if (existing.author?.id !== user.id) {
        return ctx.forbidden('Seul l’auteur peut modifier cette discussion.');
      }

      const data = readData(ctx.request?.body);
      delete data.author; // author cannot be reassigned
      delete data.category; // category changes are out of scope for members

      const { values, errors } = validateDiscussionInput({
        title: data.title === undefined ? existing.title : data.title,
        content: data.content === undefined ? existing.content : data.content,
        type: data.type === undefined ? existing.type : data.type,
        category: existing.category?.documentId ?? null,
      });
      if (errors.length > 0) {
        return ctx.badRequest('Discussion invalide.', { errors });
      }

      const entity: any = await strapi.documents('api::discussion.discussion').update({
        documentId,
        data: {
          ...(data.title !== undefined ? { title: values.title } : {}),
          ...(data.content !== undefined ? { content: values.content } : {}),
          ...(data.type !== undefined ? { type: values.type } : {}),
        },
        populate: ['author', 'category'],
      });

      return ctx.send({ data: serializeDiscussion(entity) });
    },

    async delete(ctx: any) {
      const user = ctx.state?.user;
      if (!user) {
        return ctx.unauthorized();
      }

      const documentId = ctx.params?.id;
      const existing: any = await strapi.documents('api::discussion.discussion').findFirst({
        filters: { documentId },
        populate: ['author'],
      });
      if (!existing) {
        return ctx.notFound('Discussion introuvable.');
      }
      if (existing.author?.id !== user.id) {
        return ctx.forbidden('Seul l’auteur peut supprimer cette discussion.');
      }

      const deleted: any = await strapi.documents('api::discussion.discussion').delete({
        documentId,
      });
      return ctx.send({ data: serializeDiscussion(deleted) });
    },
  })
);
