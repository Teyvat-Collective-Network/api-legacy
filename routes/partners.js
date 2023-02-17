import { users as schemas } from '../schemas.js';
import httpErrors from 'http-errors';

export default function(fastify, opts, done) {
  fastify.get('/', async (request, reply) => {
    const docs = [...fastify.db.partners.values()];
    return reply.send(docs.map(doc => doc.toJSON()));
  });
  
  fastify.post('/', { schema: schemas.post }, async (request, reply) => {
    if (!await request.access(u => u.roles.includes('observer'))) throw httpErrors.Forbidden('Only observers can add partners');
    const doc = await fastify.db.addPartner(request.body);
    return reply.code(201).send(doc.toJSON());
  });

  fastify.get('/:partner', { schema: schemas.get }, async (request, reply) => {
    const doc = fastify.db.partners.get(request.params.partner);
    if (!doc) throw httpErrors.NotFound('Partner not found');
    return reply.send(doc.toJSON());
  });

  fastify.patch('/:partner', { schema: schemas.patch }, async (request, reply) => {
    if (!await request.access(u => u.roles.includes('observer'))) throw httpErrors.Forbidden('Only observers can edit partners');
    const doc = await fastify.db.editPartner(request.params.partner, request.body);
    return reply.send(doc.toJSON());
  });

  fastify.delete('/:partner', { schema: schemas.delete }, async (request, reply) => {
    if (!await request.access(u => u.roles.includes('observer'))) throw httpErrors.Forbidden('Only observers can remove partners');
    const doc = await fastify.db.removePartner(request.params.partner);
    return reply.send(doc.toJSON());
  });
  

  done();
}