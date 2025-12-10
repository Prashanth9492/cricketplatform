import mongoose from 'mongoose';

const BallSchema = new mongoose.Schema({
  ballNumber: { type: Number, required: true }, // Ball number in the over (1-6)
  runs: { type: Number, default: 0 },
  isWicket: { type: Boolean, default: false },
  isWide: { type: Boolean, default: false },
  isNoBall: { type: Boolean, default: false },
  isBye: { type: Boolean, default: false },
  isLegBye: { type: Boolean, default: false },
  batsmanRuns: { type: Number, default: 0 },
  extras: { type: Number, default: 0 },
  striker: { type: String }, // Player name
  nonStriker: { type: String }, // Player name
  bowler: { type: String, required: true },
  wicketType: { 
    type: String, 
    enum: ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired'],
    required: false
  },
  fielder: { type: String }, // For catches, run outs, etc.
  timestamp: { type: Date, default: Date.now }
});

const OverSchema = new mongoose.Schema({
  overNumber: { type: Number, required: true },
  bowler: { type: String, required: true },
  balls: [BallSchema],
  runsInOver: { type: Number, default: 0 },
  wicketsInOver: { type: Number, default: 0 },
  maidenOver: { type: Boolean, default: false }
});

const InningsSchema = new mongoose.Schema({
  inningsNumber: { type: Number, required: true }, // 1 or 2
  battingTeam: { 
    type: String,
    required: true 
  },
  bowlingTeam: { 
    type: String,
    required: true 
  },
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  overs: [OverSchema],
  currentOver: { type: Number, default: 0 },
  currentBall: { type: Number, default: 0 },
  striker: { type: String }, // Current batsman
  nonStriker: { type: String }, // Non-striker batsman
  bowler: { type: String }, // Current bowler
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 }
  },
  isCompleted: { type: Boolean, default: false }
});

const BatsmanStatsSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  runs: { type: Number, default: 0 },
  ballsFaced: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  isOut: { type: Boolean, default: false },
  dismissalType: { 
    type: String, 
    enum: ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired'],
    required: false
  },
  bowlerName: { type: String }, // Who got the wicket
  fielderName: { type: String } // For catches, run outs, etc.
});

const BowlerStatsSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  overs: { type: Number, default: 0 },
  maidens: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  wides: { type: Number, default: 0 },
  noBalls: { type: Number, default: 0 },
  economy: { type: Number, default: 0 }
});

const MatchSchema = new mongoose.Schema({
  matchId: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  team1: { 
    type: String,
    required: true 
  },
  team2: { 
    type: String,
    required: true 
  },
  venue: { type: String, required: true },
  matchDate: { type: Date, required: true },
  matchType: { 
    type: String, 
    enum: ['T20', 'ODI', '10-Over', '15-Over'], 
    default: 'T20' 
  },
  totalOvers: { type: Number, default: 20 },
  tossWinner: { 
    type: String
  },
  tossDecision: { 
    type: String, 
    enum: ['bat', 'bowl'] 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'live', 'completed', 'abandoned'], 
    default: 'scheduled' 
  },
  currentInnings: { type: Number, default: 1 },
  innings: [InningsSchema],
  batsmanStats: [BatsmanStatsSchema],
  bowlerStats: [BowlerStatsSchema],
  result: {
    winner: { 
      type: String
    },
    winBy: { type: String }, // "10 runs", "6 wickets", etc.
    playerOfMatch: { type: String }
  },
  commentary: [{
    ballNumber: { type: String }, // "1.1", "1.2", etc.
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  isLive: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Virtual fields for easy access
MatchSchema.virtual('currentScore').get(function() {
  if (this.innings && this.innings.length > 0) {
    const currentInnings = this.innings[this.currentInnings - 1];
    return {
      runs: currentInnings.runs,
      wickets: currentInnings.wickets,
      overs: currentInnings.currentOver,
      balls: currentInnings.currentBall
    };
  }
  return { runs: 0, wickets: 0, overs: 0, balls: 0 };
});

MatchSchema.virtual('currentRunRate').get(function() {
  if (this.innings && this.innings.length > 0) {
    const currentInnings = this.innings[this.currentInnings - 1];
    const totalBalls = (currentInnings.currentOver * 6) + currentInnings.currentBall;
    if (totalBalls > 0) {
      const overs = totalBalls / 6;
      return (currentInnings.runs / overs).toFixed(2);
    }
  }
  return "0.00";
});

MatchSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Match', MatchSchema);
