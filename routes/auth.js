import oauth from '../lib/oauth.js';
import httpErrors from 'http-errors';
import crypto from 'crypto';

export default function(fastify, opts, done) {
  fastify.get('/', async (request, reply) => {
    if (!request.query.code) {
      request.session.state = crypto.randomBytes(32).toString('hex');
      request.session.redirect = request.query.redirect;
      return reply.redirect(`https://discord.com/oauth2/authorize?${new URLSearchParams({
        response_type: 'code',
        client_id: process.env.DISCORD_ID,
        scope: 'identify',
        redirect_uri: process.env.DISCORD_REDIRECT,
        state: request.session.state,
      })}`);
    }

    const state = request.session.state;
    const redirect = request.session.redirect;
    await request.session.destroy();
    
    if (!state || state !== request.query.state) throw httpErrors.Unauthorized('Invalid state');

    const tokens = await oauth.token({
      client_id: process.env.DISCORD_ID,
      client_secret: process.env.DISCORD_SECRET,
      code: request.query.code,
      redirect_uri: process.env.DISCORD_REDIRECT,
    }).catch(console.error);
    if (!tokens) throw httpErrors.Unauthorized('Invalid code');
    
    const user = await oauth.user(tokens).catch(console.error);
    if (!user) throw httpErrors.Unauthorized('Invalid token received');

    const jwt = fastify.jwt.sign({ id: user.id });

    reply.setCookie('token', jwt, { sameSite: 'lax', domain: process.env.COOKIE_DOMAIN, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    return reply.redirect(redirect || '/');
  });

  fastify.get('/token', async (request, reply) => {
    const user = await request.auth();
    if (!user) throw httpErrors.Unauthorized('Invalid token');
    return reply.send({ id: user.id, token: request.headers.authorization || request.cookies.token });
  });

  fastify.get('/user', async (request, reply) => {
    const user = await request.auth();
    if (!user) throw httpErrors.Unauthorized('Invalid token');
    return reply.send(user);
  });

  fastify.get('/logout', async (request, reply) => {
    reply.clearCookie('token', { sameSite: 'lax', domain: process.env.COOKIE_DOMAIN });
    return reply.redirect(request.query.redirect || '/');
  });

  done();
}