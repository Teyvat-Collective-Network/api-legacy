import { Database, events } from './db/index.js';
import JWT from './lib/jwt.js';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import session from '@fastify/session';
import websocket from '@fastify/websocket';
import 'dotenv/config';

import auth from './routes/auth.js';
import guilds from './routes/guilds.js';
import users from './routes/users.js';
import partners from './routes/partners.js';
import TimedStore from './lib/timedStore.js';


const fastify = Fastify({
  ajv: { customOptions: {
    removeAdditional: true,
    coerceTypes: false,
  } },
});


await fastify.register(websocket);
fastify.register(cookie);
fastify.register(cors);
fastify.register(session, {
  secret: process.env.SESSION_SECRET,
  store: new TimedStore(5 * 60 * 1000),
  cookie: { secure: !!process.env.PRODUCTION },
  saveUninitialized: false,
});

fastify.register(auth, { prefix: '/auth' });
fastify.register(guilds, { prefix: '/guilds' });
fastify.register(users, { prefix: '/users' });
fastify.register(partners, { prefix: '/partners' });


fastify.decorate('db', new Database(process.env.DATABASE_URI));
fastify.decorate('jwt', new JWT(process.env.JWT_SECRET));

fastify.decorate('broadcast', function (event, data) {
  this.websocketServer.clients.forEach(client => {
    if (client.readyState === client.OPEN) client.send(JSON.stringify({ event, data }));
  });
});

fastify.decorateRequest('auth', async function () {
  const payload = fastify.jwt.verify(this.headers.authorization || this.cookies.token);
  if (!payload) return;
  const user = fastify.db.users.get(payload.id);
  return user?.toJSON() || payload;
});

fastify.decorateRequest('access', async function (f) {
  const user = await this.auth();
  return user && await f(user);
});


fastify.addHook('onError', async (request, reply, error) => {
  if(!error.statusCode || error.statusCode >= 500) console.log(error);
});


for (const event of Object.values(events)) {
  fastify.db.on(event, (data) => {
    fastify.broadcast(event, data?.toJSON?.() || data);
  });
}


fastify.get('/', async (request, reply) => {
  return reply.send('online');
});

fastify.get('/socket', { websocket: true }, async (connection, request) => {
  connection.socket.send(JSON.stringify({
    event: 'INIT',
    data: {
      users: [...fastify.db.users.values()].map(u => u.toJSON()),
      guilds: [...fastify.db.guilds.values()].map(g => g.toJSON()),
      partners: [...fastify.db.partners.values()].map(p => p.toJSON()),
    },
  }));
});

fastify.db.connect()
  .then(() => fastify.listen({ port: process.env.PORT }))
  .then(() => console.log('ready!'));