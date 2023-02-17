export const guilds = {
  get: {
    params: {
      type: 'object',
      properties: {
        guild: { type: 'string', pattern: '^\\d+$' },
      },
    },
  },

  post: {
    body: {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: '^\\d+$' },
        name: { type: 'string' },
        character: { type: 'string' },
        invite: { type: 'string' },
        owner: { type: 'string', pattern: '^\\d+$' },
        advisor: { type: ['string', 'null'], pattern: '^\\d*$' },
        voter: { type: ['string', 'null'], pattern: '^\\d*$' },
      },
      required: ['id', 'character', 'invite', 'owner'],
      additionalProperties: false,
    },
  },

  patch: {
    params: {
      type: 'object',
      properties: {
        guild: { type: 'string', pattern: '^\\d+$' },
      },
    },
    body: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        character: { type: 'string' },
        invite: { type: 'string' },
        owner: { type: 'string', pattern: '^\\d+$' },
        advisor: { type: ['string', 'null'], pattern: '^\\d*$' },
        voter: { type: ['string', 'null'], pattern: '^\\d*$' },
      },
      additionalProperties: false,
    },
  },

  delete: {
    params: {
      type: 'object',
      properties: {
        guild: { type: 'string', pattern: '^\\d+$' },
      },
    },
  },
};


export const users = {
  get: {
    params: {
      type: 'object',
      properties: {
        user: { type: 'string', pattern: '^\\d+$' },
      },
    },
  },

  post: {
    body: {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: '^\\d+$' },
        guilds: {
          type: 'array',
          items: { type: 'string', pattern: '^\\d+$' },
        },
        roles: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['id', 'guilds', 'roles'],
      additionalProperties: false,
    },
  },

  patch: {
    params: {
      type: 'object',
      properties: {
        user: { type: 'string', pattern: '^\\d+$' },
      },
    },
    body: {
      type: 'object',
      properties: {
        guilds: {
          type: 'array',
          items: { type: 'string', pattern: '^\\d+$' },
        },
        roles: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      additionalProperties: false,
    },
  },

  delete: {
    params: {
      type: 'object',
      properties: {
        user: { type: 'string', pattern: '^\\d+$' },
      },
    },
  },

  guilds: {
    put: {
      params: {
        type: 'object',
        properties: {
          user: { type: 'string', pattern: '^\\d+$' },
        },
      },
      body: {
        type: 'object',
        properties: {
          guild: { type: 'string', pattern: '^\\d+$' },
        },
      },
    },

    delete: {
      params: {
        type: 'object',
        properties: {
          user: { type: 'string', pattern: '^\\d+$' },
        },
      },
    },
  },

  roles: {
    put: {
      params: {
        type: 'object',
        properties: {
          user: { type: 'string', pattern: '^\\d+$' },
        },
      },
      body: {
        type: 'object',
        properties: {
          role: { type: 'string' },
        },
      },
    },

    delete: {
      params: {
        type: 'object',
        properties: {
          user: { type: 'string', pattern: '^\\d+$' },
        },
      },
    },
  },
};
