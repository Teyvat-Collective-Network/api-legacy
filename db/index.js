import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import httpErrors from 'http-errors';

import guild from './guild.js';
import user from './user.js';
import partner from './partner.js';


export function addToSet(arr, item) {
  if (arr.includes(item)) return false;
  arr.push(item);
  return true;
}

export function pull(arr, item) {
  const index = arr.indexOf(item);
  if (index < 0) return false;
  arr.splice(index, 1);
  return true;
}


export function transform(_, ret) {
  delete ret._id;
  delete ret.__v;
  return ret;
};



export const events = {
  Init: 'INIT',
  GuildAdd: 'GUILD_ADD',
  GuildEdit: 'GUILD_EDIT',
  GuildRemove: 'GUILD_REMOVE',

  UserAdd: 'USER_ADD',
  UserEdit: 'USER_EDIT',
  UserRemove: 'USER_REMOVE',
  UserRoleAdd: 'USER_ROLE_ADD',
  UserRoleRemove: 'USER_ROLE_REMOVE',
  UserGuildAdd: 'USER_GUILD_ADD',
  UserGuildRemove: 'USER_GUILD_REMOVE',

  PartnerAdd: 'PARTNER_ADD',
  PartnerEdit: 'PARTNER_EDIT',
  PartnerRemove: 'PARTNER_REMOVE',
}



export class Mongo {
  constructor(uri) {
    this.uri = uri;
    this.guilds = mongoose.model('Guild', guild);
    this.users = mongoose.model('User', user);
    this.partners = mongoose.model('Partner', partner);
  }

  connect(uri = this.uri) {
    return mongoose.connect(uri);
  }
}



export class Database extends EventEmitter {
  constructor(uri) {
    super();
    this.mongo = new Mongo(uri);
    this.guilds = new Map();
    this.users = new Map();
    this.partners = new Map();
  }


  async connect(uri) {
    await this.mongo.connect(uri);
    await this.loadGuilds();
    await this.loadUsers();
    await this.loadPartners();
  }

  loadGuilds() {
    return this.mongo.guilds.find().then((docs) => {
      this.guilds.clear();
      for (const doc of docs) {
        this.guilds.set(doc.id, doc);
      }
    });
  }

  loadUsers() {
    return this.mongo.users.find().then((docs) => {
      this.users.clear();
      for (const doc of docs) {
        this.users.set(doc.id, doc);
      }
    });
  }

  loadPartners() {
    return this.mongo.partners.find().then((docs) => {
      this.partners.clear();
      for (const doc of docs) {
        this.partners.set(doc.id, doc);
      }
    });
  }


  async addGuild(guild) {
    if (this.guilds.has(guild.id)) throw httpErrors.Conflict('Guild already exists');
    const doc = await this.mongo.guilds.create(guild);
    this.guilds.set(guild.id, doc);
    this.emit(events.GuildAdd, doc);
    
    for (const role of ['owner', 'advisor', 'voter']) {
      if (guild[role]) {
        const user = this.users.get(guild[role]);
        if (!user) {
          await this.addUser({ id: guild[role], guilds: [guild.id], roles: [role] });
        }
        else if (addToSet(user.guilds, guild.id) || addToSet(user.roles, role)) {
          await user.save();
          this.emit(events.UserEdit, user);
        }
      }
    }
    
    return doc;
  }

  async editGuild(id, data = {}) {
    const guild = this.guilds.get(id);
    if (!guild) throw httpErrors.NotFound('Guild not found');
    const old = guild.toObject();
    Object.assign(guild, data);
    if (!guild.isModified()) return guild;

    for (const role of ['owner', 'advisor', 'voter']) {
      if (guild.isModified(role)) {
        const user = this.users.get(guild[role]);
        if (guild[role]) {
          if (!user) {
            await this.addUser({ id: guild[role], guilds: [guild.id], roles: [role] });
          }
          else if (addToSet(user.guilds, guild.id) || addToSet(user.roles, role)) {
            await user.save();
            this.emit(events.UserEdit, user);
          }
        }

        const oldUser = this.users.get(old[role]);
        if (oldUser) {
          if ([...this.guilds.values()].some((g) => g[role] === oldUser.id)) continue;
          if (!pull(oldUser.roles, role)) continue;
          await oldUser.save();
          this.emit(events.UserEdit, oldUser);
        }
      }
    }

    await guild.save();
    this.emit(events.GuildEdit, guild);
    return guild;
  }

  async removeGuild(id) {
    const guild = this.guilds.get(id);
    if (!guild) throw httpErrors.NotFound('Guild not found');
    await this.mongo.guilds.deleteOne({ id });
    this.guilds.delete(id);
    this.emit(events.GuildRemove, guild);
    
    for (const role of ['owner', 'advisor', 'voter']) {
      const user = this.users.get(guild[role]);
      if (!user) continue;
      if ([...this.guilds.values()].some((g) => g[role] === user.id)) continue;
      if (!pull(user.roles, role)) continue;
      await user.save();
      this.emit(events.UserEdit, user);
    }
    
    return guild;
  }


  async addUser(user) {
    if (this.users.has(user.id)) throw httpErrors.Conflict('User already exists');
    const doc = await this.mongo.users.create(user);
    this.users.set(user.id, doc);
    this.emit(events.UserAdd, doc);
    return doc;
  }

  async editUser(id, data = {}) {
    const user = this.users.get(id);
    if (!user) throw httpErrors.NotFound('User not found');
    Object.assign(user, data);
    if (!user.isModified()) return user;
    
    if (data.roles && user.isModified('roles')) {
      for (const role of ['owner', 'advisor', 'voter']) {
        if (data.roles.includes(role) ^ user.roles.includes(role)) throw httpErrors.BadRequest(`Cannot edit role ${role} on this endpoint`);
      }
    }

    if (data.guilds && user.isModified('guilds')) {
      for (const guild of data.guilds) {
        const guildDoc = this.guilds.get(guild);
        if (!guildDoc) throw httpErrors.BadRequest(`Guild ${guild} not found`);
        for (const role of ['owner', 'advisor', 'voter']) {
          if (guildDoc[role] === id) throw httpErrors.Conflict(`User is ${role} of guild ${guild}`);
        }
      }
    }

    await user.save();
    this.emit(events.UserEdit, user);
    return user;
  }

  async removeUser(id) {
    const user = this.users.get(id);
    if (!user) throw httpErrors.NotFound('User not found');
    await this.mongo.users.deleteOne({ id });
    this.users.delete(id);
    this.emit(events.UserRemove, user);
    return user;
  }

  async addUserRole(id, role) {
    if (['owner', 'advisor', 'voter'].includes(role)) throw httpErrors.BadRequest(`Cannot edit role ${role} on this endpoint`);
    const user = this.users.get(id);
    if (!user) await this.addUser({ id, roles: [role] });
    else if (addToSet(user.roles, role)) {
      await user.save();
      this.emit(events.UserRoleAdd, { user: user.id, role });
    }
    return user;
  }

  async removeUserRole(id, role) {
    if (['owner', 'advisor', 'voter'].includes(role)) throw httpErrors.BadRequest(`Cannot edit role ${role} on this endpoint`);
    const user = this.users.get(id);
    if (!user) return;
    if (pull(user.roles, role)) {
      await user.save();
      this.emit(events.UserRoleRemove, { user: user.id, role });
    }
    return user;
  }

  async addUserGuild(id, guild) {
    const user = this.users.get(id);
    if (!this.guilds.has(guild)) throw httpErrors.BadRequest('Guild not found');
    if (!user) await this.addUser({ id, guilds: [guild] });
    else if (addToSet(user.guilds, guild)) {
      await user.save();
      this.emit(events.UserGuildAdd, { user: user.id, guild });
    }
    return user;
  }

  async removeUserGuild(id, guild) {
    const user = this.users.get(id);
    if (!user) return;
    const guildDoc = this.guilds.get(guild);
    if (!guildDoc) throw httpErrors.BadRequest('Guild not found');
    for (const role of ['owner', 'advisor', 'voter']) {
      if (guildDoc[role] === id) throw httpErrors.Conflict(`User is ${role} of guild ${guild}`);
    }
    if (pull(user.guilds, guild)) {
      await user.save();
      this.emit(events.UserGuildRemove, { user: user.id, guild });
    }
    return user;
  }


  async addPartner(partner) {
    if (this.partners.has(partner.id)) throw httpErrors.Conflict('Partner already exists');
    const doc = await this.mongo.partners.create(partner);
    this.partners.set(partner.id, doc);
    this.emit(events.PartnerAdd, doc);
    return doc;
  }

  async editPartner(id, data = {}) {
    const partner = this.partners.get(id);
    if (!partner) throw new httpErrors.NotFound('Partner not found');
    Object.assign(partner, data);
    if (!partner.isModified()) return partner;
    await partner.save();
    this.emit(events.PartnerEdit, partner);
    return partner;
  }

  async removePartner(id) {
    const partner = this.partners.get(id);
    if (!partner) throw httpErrors.NotFound('Partner not found');
    await this.mongo.partners.deleteOne({ id });
    this.partners.delete(id);
    this.emit(events.PartnerRemove, partner);
    return partner;
  }
}