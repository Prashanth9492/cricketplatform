import mongoose from 'mongoose';
import Match from './models/Match.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleMatches = [
  {
    matchId: 'M001',
    title: 'Team A vs Team B - College Championship',
    team1: 'Team A',
    team2: 'Team B',
    venue: 'Main Stadium',
    matchDate: new Date('2025-01-15'),
    status: 'completed',
    result: 'Team A won by 45 runs',
    tossWinner: 'Team A',
    tossDecision: 'bat'
  },
  {
    matchId: 'M002',
    title: 'Team C vs Team D - College Championship',
    team1: 'Team C',
    team2: 'Team D',
    venue: 'Ground 2',
    matchDate: new Date('2025-01-16'),
    status: 'completed',
    result: 'Team C won by 6 wickets',
    tossWinner: 'Team D',
    tossDecision: 'bat'
  },
  {
    matchId: 'M003',
    title: 'Team A vs Team C - Semi Final',
    team1: 'Team A',
    team2: 'Team C',
    venue: 'Main Stadium',
    matchDate: new Date('2025-02-01'),
    status: 'scheduled'
  },
  {
    matchId: 'M004',
    title: 'Team B vs Team D - Semi Final',
    team1: 'Team B',
    team2: 'Team D',
    venue: 'Ground 2',
    matchDate: new Date('2025-02-05'),
    status: 'scheduled'
  }
];

async function seedMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('🔄 Clearing existing matches...');
    await Match.deleteMany({});
    
    console.log('📝 Inserting sample matches...');
    await Match.insertMany(sampleMatches);
    
    console.log('✅ Sample matches seeded successfully!');
    console.log(`   Added ${sampleMatches.length} matches`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding matches:', error);
    process.exit(1);
  }
}

seedMatches();
