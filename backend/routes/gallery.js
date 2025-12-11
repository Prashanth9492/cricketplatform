import express from 'express';

import multer from 'multer';
import Gallery from '../models/Gallery.js';
import path from 'path';

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// GET all gallery items
router.get('/', async (req, res) => {
  try {
    const gallery = await Gallery.find();
    res.json(gallery);
  } catch (err) {
    console.error('Gallery fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create gallery item (multiple images)
router.post('/', upload.array('images'), async (req, res) => {
  try {
    const { title, description, category } = req.body;
  const imageUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    const gallery = new Gallery({ title, description, category, imageUrls });
    await gallery.save();
    res.status(201).json(gallery);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
