import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    default: ''
  },
  mood: {
    type: String,
    enum: ['Happy', 'Sad', 'Neutral', 'Stressed', 'Angry'],
    default: 'Neutral',
    index: true
  },
  tags: {
    type: [String],
    default: [],
    index: true
  },
  imageUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
journalSchema.index({ userId: 1, createdAt: -1 });
journalSchema.index({ userId: 1, mood: 1 });
journalSchema.index({ userId: 1, tags: 1 });

// Text index for search
journalSchema.index({ title: 'text', content: 'text' });

const Journal = mongoose.model('Journal', journalSchema);

export default Journal;

