import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('players');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop all indexes except _id
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name}`);
        } catch (error) {
          console.log(`⚠️ Could not drop ${index.name}:`, error.message);
        }
      }
    }

    // Remove pinno field from all documents
    const result = await collection.updateMany(
      {},
      { $unset: { pinno: "" } }
    );
    
    console.log(`✅ Removed pinno field from ${result.modifiedCount} players`);
    
    // Verify indexes after
    const finalIndexes = await collection.indexes();
    console.log('📋 Final indexes:', JSON.stringify(finalIndexes, null, 2));
    
    console.log('✅ Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

fixIndexes();
