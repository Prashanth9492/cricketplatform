import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: { 
    type: String,
    required: true 
  },
  matches: { type: Number, default: 0 },
  innings: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  highest_score: { type: Number, default: 0 },
  hundreds: { type: Number, default: 0 },
  fifties: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  balls_faced: { type: Number, default: 0 },
  outs: { type: Number, default: 0 },
  
  // Additional fields for display
  age: String,
  position: String,
  battingStyle: String,
  bowlingStyle: String,
  description: String,
  photoUrl: String
}, {
  timestamps: true
});

// Add virtual fields for calculations
PlayerSchema.virtual('average').get(function() {
  return this.outs > 0 ? (this.runs / this.outs).toFixed(2) : this.runs;
});

PlayerSchema.virtual('strike_rate').get(function() {
  return this.balls_faced > 0 ? ((this.runs / this.balls_faced) * 100).toFixed(2) : 0;
});

PlayerSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Player', PlayerSchema);
