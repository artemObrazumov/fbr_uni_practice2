require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task20';

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  age: { type: Number, required: true },
  created_at: { type: Number, required: true },
  updated_at: { type: Number, required: true }
});

userSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

async function nextUserId() {
  const last = await User.findOne().sort({ id: -1 }).select('id').lean();
  return (last && last.id != null) ? (last.id + 1) : 1;
}

function parseUserId(param) {
  const n = Number(param);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const app = express();
app.use(express.json());

app.post('/api/users', async (req, res) => {
  try {
    const ts = Math.floor(Date.now() / 1000);
    const doc = {
      id: await nextUserId(),
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      age: req.body.age,
      created_at: ts,
      updated_at: ts
    };
    const user = await User.create(doc);
    res.status(201).json(user.toJSON());
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

app.get('/api/users', async (_req, res) => {
  try {
    const users = await User.find().sort({ id: 1 });
    res.json(users.map((u) => u.toJSON()));
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get('/api/users/:id', async (req, res) => {
  const id = parseUserId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user.toJSON());
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  const id = parseUserId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const patch = {};
  if (req.body.first_name !== undefined) patch.first_name = req.body.first_name;
  if (req.body.last_name !== undefined) patch.last_name = req.body.last_name;
  if (req.body.age !== undefined) patch.age = req.body.age;
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Empty body' });
  }
  patch.updated_at = Math.floor(Date.now() / 1000);
  try {
    const user = await User.findOneAndUpdate({ id }, { $set: patch }, { new: true });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user.toJSON());
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const id = parseUserId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    const user = await User.findOneAndDelete({ id });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user.toJSON());
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

const port = Number(process.env.PORT) || 3000;

mongoose
  .connect(uri)
  .then(() => {
    app.listen(port, () => {
      console.log('http://127.0.0.1:' + port);
    });
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
