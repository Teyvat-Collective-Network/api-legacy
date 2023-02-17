import { users as schemas } from '../schemas.js';
import httpErrors from 'http-errors';

export default function(fastify, opts, done) {
  fastify.get('/', async (request, reply) => {
    const docs = [...fastify.db.users.values()];
    return reply.send(docs.map(doc => doc.toJSON()));
  });

  fastify.post('/', { schema: schemas.post }, async (request, reply) => {
    if (!await request.access(u => u.roles.includes('observer'))) throw httpErrors.Forbidden('Only observers can add users');
    const doc = await fastify.db.addUser(request.body);
    return reply.send(doc.toJSON());
  });

  fastify.get('/:user', { schema: schemas.get }, async (request, reply) => {
    const doc = fastify.db.users.get(request.params.user);
    if (!doc) throw httpErrors.NotFound('User not found');
    return reply.send(doc.toJSON());
  });

  fastify.patch('/:user', { schema: schemas.patch }, async (request, reply) => {
    if (!await request.access(u => u.roles.includes('observer'))) throw httpErrors.Forbidden('Only observers can edit users on this endpoint, owners can use the /:user/guilds endpoints to add or remove staff');
    const doc = await fastify.db.editUser(request.params.user, request.body);
    return reply.send(doc.toJSON());
  });

  fastify.delete('/:user', { schema: schemas.delete }, async (request, reply) => {
    if (!await request.access(u => u.roles.includes('observer'))) throw httpErrors.Forbidden('Only observers can remove users');
    const doc = await fastify.db.removeUser(request.params.user);
    return reply.send(doc.toJSON());
  });


  fastify.put('/:user/guilds', { schema: schemas.guilds.put }, async (request, reply) => {
    if (!await request.access(async u => 
      u.roles.includes('observer') 
      || fastify.db.guilds.get(request.body.guild)?.owner === u.id
    )) throw httpErrors.Forbidden('Only observers and guild owners can add guilds to a user');
    const doc = await fastify.db.addUserGuild(request.params.user, request.body.guild);
    return reply.send(doc.toJSON());
  });

  fastify.delete('/:user/guilds', { schema: schemas.guilds.delete }, async (request, reply) => {
    if (!await request.access(async u => 
      u.roles.includes('observer')
      || fastify.db.guilds.get(request.body.guild)?.owner === u.id
    )) throw httpErrors.Forbidden('Only observers and guild owners can remove guilds from a user');
    const doc = await fastify.db.removeUserGuild(request.params.user, request.body.guild);
    return reply.send(doc.toJSON());
  });


  fastify.put('/:user/roles', { schema: schemas.roles.put }, async (request, reply) => {
    if (!await request.access(u => u.roles.includes('observer'))) throw httpErrors.Forbidden('Only observers can add roles to a user');
    const doc = await fastify.db.addUserRole(request.params.user, request.body.role);
    return reply.send(doc.toJSON());
  });

  fastify.delete('/:user/roles', { schema: schemas.roles.delete }, async (request, reply) => {
    if (!await request.access(u => u.roles.includes('observer'))) return reply.code(403).send();
    const doc = await fastify.db.removeUserRole(request.params.user, request.body.role);
    return reply.send(doc.toJSON());
  });

  
  done();
}
