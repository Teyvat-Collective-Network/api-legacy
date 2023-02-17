import mongoose from 'mongoose';
import { transform } from './index.js';

const schema = new mongoose.Schema({
  type: Number,
  id: String,
  name: String,
  description: String,
  character: String,
  invite: String,
  owner: String,
  advisor: String,
  voter: String,
}, {
  toJSON: { transform },
});

export default schema;