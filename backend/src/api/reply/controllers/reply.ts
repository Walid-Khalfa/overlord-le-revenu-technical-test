import { factories } from '@strapi/strapi';
import { readData, validateReplyInput } from '../../../utils/validation';
import { serializeReply } from '../../../utils/serialize';

/**
 * Reply REST controller.
 *
 * - Create requires an authenticated user (401 otherwise).
 * - The author ALWAYS comes from the server-side session (no impersonation).
 * - The target discussion must exist (400 otherwise).
 * - Update/delete are restricted to the reply author (403 otherwise).
 */
export default factories.createCoreController(
  'api::reply.reply',
  ({ strapi }) => ({
    /**
     * List — single joined query (author + parent discussion), explicit
     * serialization: no user email/provider field ever leaves the API.
     * Backend pagination/sort/filters from the query are passed through.
     */
    async find(ctx: any) {
      await this.validateQuery!(ctx);
      const sanitizedQuery = await this.sanitizeQuery!(ctx);
      const service: any = strapi.service('api::reply.reply');
      const { results, pagination } = await service.find({
        ...sanitizedQuery,
        populate: { author: true, discussion: true },
      });
      return ctx.send({
        data: results.map(serializeReply),
        meta: { pagination },
      });
    },

    /** Detail — 404 when the document is unknown. */
    async findOne(ctx: any) {
      await this.validateQuery!(ctx);
      const sanitizedQuery = await this.sanitizeQuery!(ctx);
      const service: any = strapi.service('api::reply.reply');
      const entity = await service.findOne(ctx.params?.id, {
        ...sanitizedQuery,
        populate: { author: true, discussion: true },
      });
      if (!entity) {
        return ctx.notFound('Réponse introuvable.');
      }
      return ctx.send({ data: serializeReply(entity) });
    },

    async create(ctx: any) {
      const user = ctx.state?.user;
      if (!user) {
        return ctx.unauthorized('Vous devez être connecté pour répondre.');
      }

      const data = readData(ctx.request?.body);
      delete data.author; // never trust a client-supplied author

      const { values, errors } = validateReplyInput(data);
      if (values.discussionRef) {
        const discussion = await strapi
          .documents('api::discussion.discussion')
          .findFirst({ filters: { documentId: values.discussionRef } });
        if (!discussion) {
          errors.push({ field: 'discussion', message: 'Cette discussion n’existe pas.' });
        }
      }
      if (errors.length > 0) {
        return ctx.badRequest('Réponse invalide.', { errors });
      }

      const entity: any = await strapi.documents('api::reply.reply').create({
        data: {
          content: values.content,
          author: user.id,
          discussion: values.discussionRef as string,
        },
        populate: ['author', 'discussion'],
      });

      return ctx.created({ data: serializeReply({ ...entity }) });
    },

    async update(ctx: any) {
      const user = ctx.state?.user;
      if (!user) {
        return ctx.unauthorized();
      }

      const documentId = ctx.params?.id;
      const existing: any = await strapi.documents('api::reply.reply').findFirst({
        filters: { documentId },
        populate: ['author'],
      });
      if (!existing) {
        return ctx.notFound('Réponse introuvable.');
      }
      if (existing.author?.id !== user.id) {
        return ctx.forbidden('Seul l’auteur peut modifier cette réponse.');
      }

      const data = readData(ctx.request?.body);
      delete data.author;
      delete data.discussion; // a reply cannot be moved to another discussion

      if (data.content !== undefined) {
        const { errors } = validateReplyInput({
          content: data.content,
          discussion: existing.discussion?.documentId ?? 'placeholder',
        });
        if (errors.length > 0) {
          return ctx.badRequest('Réponse invalide.', { errors });
        }
      }

      const entity: any = await strapi.documents('api::reply.reply').update({
        documentId,
        data: data.content !== undefined ? { content: String(data.content).trim() } : {},
        populate: ['author', 'discussion'],
      });

      return ctx.send({ data: serializeReply(entity) });
    },

    async delete(ctx: any) {
      const user = ctx.state?.user;
      if (!user) {
        return ctx.unauthorized();
      }

      const documentId = ctx.params?.id;
      const existing: any = await strapi.documents('api::reply.reply').findFirst({
        filters: { documentId },
        populate: ['author'],
      });
      if (!existing) {
        return ctx.notFound('Réponse introuvable.');
      }
      if (existing.author?.id !== user.id) {
        return ctx.forbidden('Seul l’auteur peut supprimer cette réponse.');
      }

      const deleted: any = await strapi.documents('api::reply.reply').delete({ documentId });
      return ctx.send({ data: serializeReply(deleted) });
    },
  })
);
