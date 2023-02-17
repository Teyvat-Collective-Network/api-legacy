import crypto from 'crypto';

function b64encode(data, encoding = 'utf8') {
  return Buffer.from(JSON.stringify(data), encoding).toString('base64url');
}

function b64decode(str, encoding = 'utf8') {
  return JSON.parse(Buffer.from(str, 'base64url').toString(encoding));
}


export default class JWT {
  constructor(secret) {
    this.key = crypto.createSecretKey(secret, 'base64url');
    this.header = b64encode({
      alg: 'HS256',
      typ: 'JWT',
    });
  }

  verify(jwt) {
    if (!jwt) return false;
    const [ header, payload, hash, extra ] = jwt.split('.');
    if (!header || !payload || !hash || extra) return false;
    const verify = crypto.timingSafeEqual(
      Buffer.from(crypto
        .createHmac('sha256', this.key)
        .update(`${header}.${payload}`, 'utf8')
        .digest('base64url'), 'utf8'),
      Buffer.from(hash, 'utf8'));
    return verify && b64decode(payload);
  }

  sign(payload) {
    const jwt = `${this.header}.${b64encode(payload)}`;
    const hash = crypto
      .createHmac('sha256', this.key)
      .update(jwt, 'utf8')
      .digest('base64url');
    return `${jwt}.${hash}`;
  }

  static secret() {
    return crypto.generateKeySync('hmac', { length: 256 }).export().toString('base64url');
  }
}