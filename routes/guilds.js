import { guilds as schemas } from '../schemas.js';
import httpErrors from 'http-errors';

export default function(fastify, opts, done) {
  fastify.get('/', async (request, reply) => {
    const docs = [...fastify.db.guilds.values()];
    return reply.send(docs.map(doc => doc.toJSON()));
  });

  fastify.post('/', { schema: schemas.post }, async (request, reply) => {
    if (!await request.access(u => u.roles.includes('observer'))) throw httpErrors.Forbidden('Only observers can add guilds');
    const doc = await fastify.db.addGuild(request.body);
    return reply.code(201).send(doc.toJSON());
  });

  fastify.get('/:guild', { schema: schemas.get }, async (request, reply) => {
    const doc = fastify.db.guilds.get(request.params.guild);
    if (!doc) throw httpErrors.NotFound('Guild not found');
    return reply.send(doc.toJSON());
  });

  fastify.patch('/:guild', { schema: schemas.patch }, async (request, reply) => {
    if (!await request.access(u => u.roles.includes('observer'))) throw httpErrors.Forbidden('Only observers can edit guilds');
    const doc = await fastify.db.editGuild(request.params.guild, request.body);
    return reply.send(doc.toJSON());
  });

  fastify.delete('/:guild', { schema: schemas.delete }, async (request, reply) => {
    if (!await request.access(u => u.roles.includes('observer'))) throw httpErrors.Forbidden('Only observers can remove guilds');
    const doc = await fastify.db.removeGuild(request.params.guild);
    return reply.send(doc.toJSON());
  });


  done();
}
