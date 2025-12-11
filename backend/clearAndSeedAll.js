import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Match from './models/Match.js';
import PointsTable from './models/PointsTable.js';
import Gallery from './models/Gallery.js';

dotenv.config();

async function clearAndSeedAll() {
  try {
    console.log('🔌 Connecting to NEW MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to NEW database');

    // Clear all collections
    console.log('\n🗑️  CLEARING ALL OLD DATA...');
    
    await Match.deleteMany({});
    console.log('✅ Cleared Matches');
    
    await PointsTable.deleteMany({});
    console.log('✅ Cleared Points Table');
    
    await Gallery.deleteMany({});
    console.log('✅ Cleared Gallery');

    // Clear other collections if they exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      if (!['matches', 'pointstables', 'galleries'].includes(collection.name)) {
        await mongoose.connection.db.collection(collection.name).deleteMany({});
        console.log(`✅ Cleared ${collection.name}`);
      }
    }

    console.log('\n✨ All old data cleared successfully!');

    // Now seed fresh data
    console.log('\n📝 SEEDING FRESH DATA...');

    // 1. Seed Points Table
    const pointsTableData = [
      { team: 'Eagles United', matches: 4, wins: 3, losses: 1, points: 6, season: '2025' },
      { team: 'Royal Lions', matches: 4, wins: 3, losses: 1, points: 6, season: '2025' },
      { team: 'Thunder Kings', matches: 4, wins: 2, losses: 2, points: 4, season: '2025' },
      { team: 'Storm Riders', matches: 4, wins: 2, losses: 2, points: 4, season: '2025' },
      { team: 'Phoenix Warriors', matches: 4, wins: 1, losses: 3, points: 2, season: '2025' },
      { team: 'Dragon Force', matches: 4, wins: 1, losses: 3, points: 2, season: '2025' },
      { team: 'Titan Strikers', matches: 4, wins: 2, losses: 2, points: 4, season: '2025' },
      { team: 'Cobra Champions', matches: 4, wins: 2, losses: 2, points: 4, season: '2025' }
    ];

    await PointsTable.insertMany(pointsTableData);
    console.log('✅ Seeded Points Table (8 teams)');

    // 2. Seed Matches
    const matchesData = [
      {
        matchId: 'M001',
        title: 'Eagles United vs Royal Lions',
        team1: 'Eagles United',
        team2: 'Royal Lions',
        venue: 'College Cricket Ground',
        matchDate: new Date('2025-01-15T14:00:00'),
        status: 'scheduled',
        tournament: 'College Championship 2025'
      },
      {
        matchId: 'M002',
        title: 'Thunder Kings vs Storm Riders',
        team1: 'Thunder Kings',
        team2: 'Storm Riders',
        venue: 'Sports Arena',
        matchDate: new Date('2025-01-16T14:00:00'),
        status: 'scheduled',
        tournament: 'College Championship 2025'
      },
      {
        matchId: 'M003',
        title: 'Phoenix Warriors vs Dragon Force',
        team1: 'Phoenix Warriors',
        team2: 'Dragon Force',
        venue: 'College Cricket Ground',
        matchDate: new Date('2025-01-10T14:00:00'),
        status: 'completed',
        tournament: 'College Championship 2025',
        tossWinner: 'Phoenix Warriors',
        tossDecision: 'bat',
        result: 'Phoenix Warriors won by 25 runs'
      },
      {
        matchId: 'M004',
        title: 'Titan Strikers vs Cobra Champions',
        team1: 'Titan Strikers',
        team2: 'Cobra Champions',
        venue: 'Sports Arena',
        matchDate: new Date('2025-01-11T14:00:00'),
        status: 'completed',
        tournament: 'College Championship 2025',
        tossWinner: 'Cobra Champions',
        tossDecision: 'bowl',
        result: 'Titan Strikers won by 6 wickets'
      }
    ];

    await Match.insertMany(matchesData);
    console.log('✅ Seeded Matches (4 matches)');

    // 3. Seed Gallery
    const galleryData = [
      {
        title: 'Championship Victory',
        description: 'Eagles United celebrating their championship win',
        category: 'celebration',
        imageUrls: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800'],
        createdAt: new Date()
      },
      {
        title: 'Team Practice Session',
        description: 'Players during intensive training',
        category: 'training',
        imageUrls: ['https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800'],
        createdAt: new Date()
      },
      {
        title: 'Trophy Ceremony',
        description: 'Award ceremony at the championship finals',
        category: 'awards',
        imageUrls: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800'],
        createdAt: new Date()
      }
    ];

    await Gallery.insertMany(galleryData);
    console.log('✅ Seeded Gallery (3 images)');

    console.log('\n🎉 DATABASE MIGRATION COMPLETE!');
    console.log('✅ Old data cleared');
    console.log('✅ Fresh data seeded to NEW database');
    console.log('\n📊 Summary:');
    console.log('   - Points Table: 8 teams');
    console.log('   - Matches: 4 matches (2 upcoming, 2 completed)');
    console.log('   - Gallery: 3 images');

    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearAndSeedAll();
