import express from 'express';
import Match from '../models/Match.js';
import { io } from '../server.js'; // Socket.IO instance

const router = express.Router();

// Get all matches
router.get('/', async (req, res) => {
  try {
    const matches = await Match.find().sort({ matchDate: -1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get live matches
router.get('/live', async (req, res) => {
  try {
    const liveMatches = await Match.find({ status: 'live' }).sort({ matchDate: -1 });
    res.json(liveMatches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get match by ID
router.get('/:matchId', async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new match
router.post('/', async (req, res) => {
  try {
    const { team1, team2, ...rest } = req.body;
    const match = new Match({
      ...rest,
      team1,
      team2,
      title: `${team1} vs ${team2}`, // Auto-generate title
      matchId: `M${Date.now()}` // Generate unique match ID
    });
    await match.save();
    res.status(201).json(match);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Start a match
router.post('/:matchId/start', async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (!match.tossWinner || !match.tossDecision) {
      return res.status(400).json({ 
        message: 'Cannot start match: Toss winner and decision must be set. Please update match details first.' 
      });
    }

    match.status = 'live';
    match.isLive = true;
    
    // Initialize first innings
    match.innings.push({
      inningsNumber: 1,
      battingTeam: match.tossWinner === match.team1 && match.tossDecision === 'bat' ? match.team1 : match.team2,
      bowlingTeam: match.tossWinner === match.team1 && match.tossDecision === 'bat' ? match.team2 : match.team1,
      runs: 0,
      wickets: 0,
      overs: [],
      currentOver: 0,
      currentBall: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 }
    });
    
    match.currentInnings = 1;

    await match.save();
    
    console.log('✅ Match started successfully:', {
      matchId: match.matchId,
      battingTeam: match.innings[0].battingTeam,
      bowlingTeam: match.innings[0].bowlingTeam
    });
    
    // Emit to all connected clients
    if (io) {
      io.emit('matchStarted', match);
    }
    
    res.json(match);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// End current innings
router.post('/:matchId/end-innings', async (req, res) => {
  console.log('🔔 End innings endpoint hit! Match ID:', req.params.matchId);
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) {
      console.log('❌ Match not found:', req.params.matchId);
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.status !== 'live') {
      return res.status(400).json({ message: 'Match is not live' });
    }

    const currentInnings = match.innings[match.currentInnings - 1];
    if (!currentInnings) {
      return res.status(400).json({ message: 'No current innings found' });
    }

    // Mark current innings as completed
    currentInnings.isCompleted = true;

    if (match.currentInnings === 1) {
      // Start second innings
      match.currentInnings = 2;
      match.innings.push({
        inningsNumber: 2,
        battingTeam: currentInnings.bowlingTeam,
        bowlingTeam: currentInnings.battingTeam,
        runs: 0,
        wickets: 0,
        overs: [],
        currentOver: 0,
        currentBall: 0,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 }
      });

      await match.save();

      console.log('✅ Innings ended, second innings started:', {
        matchId: match.matchId,
        newBattingTeam: match.innings[1].battingTeam,
        target: currentInnings.runs + 1
      });

      // Emit innings change event
      if (io) {
        io.emit('inningsChanged', {
          matchId: match.matchId,
          match: match,
          newInnings: 2,
          battingTeam: match.innings[1].battingTeam
        });
      }

      res.json(match);
    } else {
      // Match completed
      match.status = 'completed';
      match.isLive = false;

      // Initialize result object if it doesn't exist
      if (!match.result) {
        match.result = {};
      }

      // Determine winner
      const firstInnings = match.innings[0];
      const secondInnings = match.innings[1];

      if (secondInnings.runs > firstInnings.runs) {
        match.result.winner = secondInnings.battingTeam;
        match.result.winBy = `${10 - secondInnings.wickets} wickets`;
      } else if (firstInnings.runs > secondInnings.runs) {
        match.result.winner = firstInnings.battingTeam;
        match.result.winBy = `${firstInnings.runs - secondInnings.runs} runs`;
      } else {
        match.result.winner = 'tie';
        match.result.winBy = 'Match tied';
      }

      await match.save();

      console.log('🏆 Match completed:', {
        matchId: match.matchId,
        winner: match.result.winner,
        winBy: match.result.winBy
      });

      // Emit match ended event
      if (io) {
        io.emit('matchEnded', {
          matchId: match.matchId,
          match: match,
          winner: match.result.winner,
          winBy: match.result.winBy
        });
      }

      res.json(match);
    }
  } catch (error) {
    console.error('❌ Error ending innings:', error);
    res.status(400).json({ message: error.message });
  }
});

// Add ball to match
router.post('/:matchId/ball', async (req, res) => {
  try {
    const { runs, isWicket, isWide, isNoBall, isBye, isLegBye, striker, nonStriker, bowler, wicketType, fielder } = req.body;
    
    console.log('📥 Received ball data:', { runs, isWicket, isWide, isNoBall, isBye, isLegBye, striker, nonStriker, bowler, wicketType, fielder });
    
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) {
      console.error('❌ Match not found:', req.params.matchId);
      return res.status(404).json({ message: 'Match not found' });
    }
    
    if (match.status !== 'live') {
      console.error('❌ Match not live:', match.status);
      return res.status(400).json({ message: 'Match is not live. Please start the match first.' });
    }
    
    if (!match.innings || match.innings.length === 0) {
      console.error('❌ No innings found. Match innings:', match.innings);
      console.error('❌ Match status:', match.status, 'currentInnings:', match.currentInnings);
      return res.status(400).json({ message: 'No innings found. Match may not be properly started.' });
    }

    const currentInnings = match.innings[match.currentInnings - 1];
    if (!currentInnings) {
      return res.status(400).json({ message: 'Current innings not found.' });
    }
    
    const currentOverIndex = currentInnings.overs.length - 1;
    
    // Create new over if needed
    if (currentOverIndex === -1 || currentInnings.overs[currentOverIndex].balls.length === 6) {
      currentInnings.overs.push({
        overNumber: currentInnings.currentOver + 1,
        bowler: bowler,
        balls: [],
        runsInOver: 0,
        wicketsInOver: 0,
        maidenOver: false
      });
      currentInnings.currentOver += 1;
      currentInnings.currentBall = 0;
    }

    const currentOver = currentInnings.overs[currentInnings.overs.length - 1];
    
    // Update current batsmen in innings
    currentInnings.striker = striker;
    currentInnings.nonStriker = nonStriker;
    currentInnings.bowler = bowler;
    
    // Create ball
    const ball = {
      ballNumber: currentOver.balls.length + 1,
      runs: runs || 0,
      isWicket: isWicket || false,
      isWide: isWide || false,
      isNoBall: isNoBall || false,
      isBye: isBye || false,
      isLegBye: isLegBye || false,
      batsmanRuns: (isBye || isLegBye) ? 0 : (runs || 0),
      extras: (isWide || isNoBall) ? 1 + (runs || 0) : ((isBye || isLegBye) ? (runs || 0) : 0),
      striker: striker,
      nonStriker: nonStriker,
      bowler: bowler,
      fielder: fielder
    };

    // Only add wicketType if it's a wicket and has a valid value
    if (isWicket && wicketType && wicketType.trim() !== '') {
      ball.wicketType = wicketType;
    }

    // Only increment ball count if it's not a wide or no-ball
    if (!isWide && !isNoBall) {
      currentInnings.currentBall += 1;
      if (currentInnings.currentBall === 6) {
        currentInnings.currentBall = 0;
      }
    }

    currentOver.balls.push(ball);
    currentOver.runsInOver += runs || 0;
    
    // Update innings totals
    currentInnings.runs += (runs || 0) + ball.extras;
    if (isWicket) {
      currentInnings.wickets += 1;
      currentOver.wicketsInOver += 1;
    }

    // Update extras
    if (isWide) currentInnings.extras.wides += 1;
    if (isNoBall) currentInnings.extras.noBalls += 1;
    if (isBye) currentInnings.extras.byes += runs || 0;
    if (isLegBye) currentInnings.extras.legByes += runs || 0;

    // Update batsman stats
    let batsmanStat = match.batsmanStats.find(b => b.playerName === striker);
    if (!batsmanStat) {
      batsmanStat = {
        playerName: striker,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        isOut: false
      };
      match.batsmanStats.push(batsmanStat);
    }
    
    if (!isWide && !isNoBall) {
      batsmanStat.ballsFaced += 1;
    }
    if (!isBye && !isLegBye) {
      batsmanStat.runs += runs || 0;
      if (runs === 4) batsmanStat.fours += 1;
      if (runs === 6) batsmanStat.sixes += 1;
    }
    if (isWicket && wicketType && wicketType.trim() !== '' && wicketType !== 'run_out') {
      batsmanStat.isOut = true;
      batsmanStat.dismissalType = wicketType;
      batsmanStat.bowlerName = bowler;
      if (fielder && fielder.trim() !== '') {
        batsmanStat.fielderName = fielder;
      }
    }

    // Update bowler stats
    let bowlerStat = match.bowlerStats.find(b => b.playerName === bowler);
    if (!bowlerStat) {
      bowlerStat = {
        playerName: bowler,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        economy: 0
      };
      match.bowlerStats.push(bowlerStat);
    }
    
    bowlerStat.runs += (runs || 0) + ball.extras;
    if (isWicket && wicketType && wicketType.trim() !== '' && wicketType !== 'run_out') {
      bowlerStat.wickets += 1;
    }
    if (isWide) bowlerStat.wides += 1;
    if (isNoBall) bowlerStat.noBalls += 1;

    // Check if over is complete
    if (currentOver.balls.length === 6) {
      const validBalls = currentOver.balls.filter(b => !b.isWide && !b.isNoBall);
      if (validBalls.length === 6) {
        bowlerStat.overs += 1;
        if (currentOver.runsInOver === 0) {
          currentOver.maidenOver = true;
          bowlerStat.maidens += 1;
        }
      }
    }

    // Calculate economy rate
    if (bowlerStat.overs > 0) {
      bowlerStat.economy = (bowlerStat.runs / bowlerStat.overs).toFixed(2);
    }

    // Add commentary
    let commentaryText = `${currentInnings.currentOver}.${currentOver.balls.length} ${bowler} to ${striker}`;
    if (isWicket) {
      commentaryText += ` - WICKET! ${striker} is ${wicketType}`;
      if (fielder) commentaryText += ` by ${fielder}`;
    } else if (runs === 6) {
      commentaryText += ` - SIX! What a shot!`;
    } else if (runs === 4) {
      commentaryText += ` - FOUR! Beautiful boundary`;
    } else if (isWide) {
      commentaryText += ` - Wide ball`;
    } else if (isNoBall) {
      commentaryText += ` - No ball`;
    } else {
      commentaryText += ` - ${runs} run${runs !== 1 ? 's' : ''}`;
    }

    match.commentary.unshift({
      ballNumber: `${currentInnings.currentOver}.${currentOver.balls.length}`,
      text: commentaryText,
      timestamp: new Date()
    });

    // Check if innings is complete
    if (currentInnings.wickets >= 10 || currentInnings.currentOver >= match.totalOvers) {
      currentInnings.isCompleted = true;
      
      if (match.currentInnings === 1) {
        // Start second innings
        match.currentInnings = 2;
        match.innings.push({
          inningsNumber: 2,
          battingTeam: currentInnings.bowlingTeam,
          bowlingTeam: currentInnings.battingTeam,
          runs: 0,
          wickets: 0,
          overs: [],
          currentOver: 0,
          currentBall: 0,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 }
        });
      } else {
        // Match completed
        match.status = 'completed';
        match.isLive = false;
        
        // Determine winner
        const firstInnings = match.innings[0];
        const secondInnings = match.innings[1];
        
        if (secondInnings.runs > firstInnings.runs) {
          match.result.winner = secondInnings.battingTeam;
          match.result.winBy = `${10 - secondInnings.wickets} wickets`;
        } else if (firstInnings.runs > secondInnings.runs) {
          match.result.winner = firstInnings.battingTeam;
          match.result.winBy = `${firstInnings.runs - secondInnings.runs} runs`;
        } else {
          match.result.winner = 'tie';
          match.result.winBy = 'Match tied';
        }
        
        // Emit match ended event
        if (io) {
          io.emit('matchEnded', {
            matchId: match.matchId,
            match: match,
            winner: match.result.winner,
            winBy: match.result.winBy
          });
          console.log('🏆 Match ended event emitted:', match.matchId);
        }
      }
    }

    await match.save();
    
    console.log('✅ Ball saved successfully. Updated match:', {
      matchId: match.matchId,
      innings: match.currentInnings,
      score: `${currentInnings.runs}/${currentInnings.wickets}`,
      overs: `${currentInnings.currentOver}.${currentInnings.currentBall}`,
      striker: currentInnings.striker,
      nonStriker: currentInnings.nonStriker,
      batsmanStats: match.batsmanStats.map(b => `${b.playerName}: ${b.runs}(${b.ballsFaced})`)
    });
    
    // Emit real-time update
    if (io) {
      io.emit('ballUpdate', {
        matchId: match.matchId,
        match: match,
        ball: ball,
        commentary: commentaryText
      });
      console.log('📡 WebSocket event emitted: ballUpdate');
    }
    
    res.json({ match, ball });
  } catch (error) {
    console.error('Error adding ball:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update match details
router.put('/:matchId', async (req, res) => {
  try {
    const match = await Match.findOneAndUpdate(
      { matchId: req.params.matchId },
      req.body,
      { new: true }
    );
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Emit score update to all connected clients
    if (io) {
      io.emit('scoreUpdate', {
        matchId: match.matchId,
        match: match
      });
      console.log('📡 Score update emitted for match:', match.matchId);
    }
    
    res.json(match);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete match
router.delete('/:matchId', async (req, res) => {
  try {
    const match = await Match.findOneAndDelete({ matchId: req.params.matchId });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
