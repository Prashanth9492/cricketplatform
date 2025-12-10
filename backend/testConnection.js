import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('URI:', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ MongoDB connected successfully!');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📚 Available collections:');
    collections.forEach(col => console.log('  -', col.name));
    
    // Count documents in key collections
    const pointsTableCount = await mongoose.connection.db.collection('pointstables').countDocuments();
    const matchesCount = await mongoose.connection.db.collection('matches').countDocuments();
    const galleriesCount = await mongoose.connection.db.collection('galleries').countDocuments();
    const playersCount = await mongoose.connection.db.collection('players').countDocuments();
    
    console.log('\n📊 Document counts:');
    console.log('  - Points Tables:', pointsTableCount);
    console.log('  - Matches:', matchesCount);
    console.log('  - Galleries:', galleriesCount);
    console.log('  - Players:', playersCount);
    
    // Fetch sample data
    console.log('\n📋 Sample Points Table Data:');
    const pointsData = await mongoose.connection.db.collection('pointstables').find({}).limit(3).toArray();
    console.log(JSON.stringify(pointsData, null, 2));
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testConnection();
