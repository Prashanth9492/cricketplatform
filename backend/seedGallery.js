import mongoose from 'mongoose';
import Gallery from './models/Gallery.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleGallery = [
  {
    title: 'Championship Finals 2024',
    description: 'Exciting moments from the championship finals',
    category: 'Match Highlights',
    imageUrls: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800'],
    createdAt: new Date('2024-12-01')
  },
  {
    title: 'Team Celebrations',
    description: 'Victory celebration moments',
    category: 'Events',
    imageUrls: ['https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800'],
    createdAt: new Date('2024-12-05')
  },
  {
    title: 'Practice Session',
    description: 'Team training and practice',
    category: 'Training',
    imageUrls: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800'],
    createdAt: new Date('2024-12-08')
  }
];

async function seedGallery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('🔄 Clearing existing gallery items...');
    await Gallery.deleteMany({});
    
    console.log('📝 Inserting sample gallery items...');
    await Gallery.insertMany(sampleGallery);
    
    console.log('✅ Sample gallery seeded successfully!');
    console.log(`   Added ${sampleGallery.length} gallery items`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding gallery:', error);
    process.exit(1);
  }
}

seedGallery();
