import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAll,
  getOne,
  create,
  update,
  remove
} from '../controllers/journalController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;

