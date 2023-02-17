import mongoose from 'mongoose';
import { transform } from './index.js';

const schema = new mongoose.Schema({
  name: String,
}, {
  toJSON: { transform },
});

export default schema;