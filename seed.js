import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Journal from './models/Journal.js';

dotenv.config();

const getMongoUri = () => {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.DB;
  
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }
  
  if (!dbName) {
    return mongoUri;
  }
  
  // Parse the URI to handle database name
  try {
    const url = new URL(mongoUri);
    // Replace or set the pathname (database name)
    url.pathname = `/${dbName}`;
    return url.toString();
  } catch (error) {
    // If URL parsing fails, try simple string manipulation
    // Remove trailing slash if present
    let uri = mongoUri.endsWith('/') ? mongoUri.slice(0, -1) : mongoUri;
    // Check if URI already has a database name (after last /)
    const lastSlashIndex = uri.lastIndexOf('/');
    const afterLastSlash = uri.substring(lastSlashIndex + 1);
    
    // If the part after last slash looks like a database name (not a port or query), replace it
    if (lastSlashIndex > 0 && !afterLastSlash.includes('?') && !afterLastSlash.includes(':')) {
      uri = uri.substring(0, lastSlashIndex);
    }
    
    return `${uri}/${dbName}`;
  }
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(getMongoUri());
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Journal.deleteMany({});
    console.log('Cleared existing data');

    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();
    console.log('Created test user:', testUser.email);

    // Create sample journal entries
    const sampleEntries = [
      {
        userId: testUser._id,
        title: 'My First Entry',
        content: '<p>This is my first journal entry. I\'m excited to start this journey!</p>',
        mood: 'Happy',
        tags: ['first', 'excited']
      },
      {
        userId: testUser._id,
        title: 'A Productive Day',
        content: '<p>Today I accomplished a lot. I feel great about my progress.</p>',
        mood: 'Happy',
        tags: ['productivity', 'work']
      },
      {
        userId: testUser._id,
        title: 'Reflecting on Life',
        content: '<p>Sometimes it\'s good to take a step back and reflect on where we are in life.</p>',
        mood: 'Neutral',
        tags: ['reflection', 'life']
      }
    ];

    for (const entry of sampleEntries) {
      const journalEntry = new Journal(entry);
      await journalEntry.save();
    }
    console.log(`Created ${sampleEntries.length} sample journal entries`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('\n⚠️  Remember to change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

