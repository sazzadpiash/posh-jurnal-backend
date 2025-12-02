import Journal from '../models/Journal.js';

export const getAll = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      search,
      mood,
      tag,
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = { userId };

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Mood filter
    if (mood) {
      query.mood = mood;
    }

    // Tag filter
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const entries = await Journal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Journal.countDocuments(query);

    res.json({
      entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all entries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOne = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const entry = await Journal.findOne({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const create = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, content, mood, tags } = req.body;

    // Process tags (split if string, ensure array)
    let tagsArray = [];
    if (tags) {
      if (typeof tags === 'string') {
        tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      }
    }

    const entry = new Journal({
      userId,
      title,
      content,
      mood: mood || 'Neutral',
      tags: tagsArray
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const update = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { title, content, mood, tags } = req.body;

    // Find entry
    const entry = await Journal.findOne({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    // Update fields
    if (title !== undefined) entry.title = title;
    if (content !== undefined) entry.content = content;
    if (mood !== undefined) entry.mood = mood;
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        entry.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(tags)) {
        entry.tags = tags;
      }
    }

    await entry.save();
    res.json(entry);
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const remove = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const entry = await Journal.findOneAndDelete({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

