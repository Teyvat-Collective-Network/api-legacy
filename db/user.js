import mongoose from 'mongoose';
import { transform } from './index.js';

const schema = new mongoose.Schema({
  id: String,
  guilds: [String],
  roles: [String],
}, {
  toJSON: { transform },
});

export default schema;