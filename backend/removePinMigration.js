import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from './models/Player.js';

dotenv.config();

async function removePin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Drop the unique index on pinno field
    try {
      await Player.collection.dropIndex('pinno_1');
      console.log('✅ Dropped pinno unique index');
    } catch (error) {
      console.log('⚠️ Index may not exist:', error.message);
    }

    // Remove pinno field from all existing documents
    const result = await Player.updateMany(
      { pinno: { $exists: true } },
      { $unset: { pinno: "" } }
    );
    
    console.log(`✅ Removed pinno field from ${result.modifiedCount} players`);
    
    // Verify
    const count = await Player.countDocuments({ pinno: { $exists: true } });
    console.log(`📊 Players still with pinno field: ${count}`);
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

removePin();
