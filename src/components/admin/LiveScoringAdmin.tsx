import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Play, Pause, RotateCcw, Trophy, AlertCircle, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { socketService } from '@/lib/socket';

interface Match {
  _id: string;
  matchId: string;
  team1: string;
  team2: string;
  venue: string;
  matchDate: Date;
  status: 'upcoming' | 'live' | 'completed' | 'scheduled';
  isLive: boolean;
  currentInnings: number;
  innings: Innings[];
  batsmanStats: BatsmanStat[];
  bowlerStats: BowlerStat[];
  commentary: Commentary[];
  totalOvers: number;
  result?: {
    winner: string;
    winBy: string;
  };
}

interface Innings {
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  runs: number;
  wickets: number;
  overs: Over[];
  currentOver: number;
  currentBall: number;
}

interface Over {
  overNumber: number;
  bowler: string;
  balls: Ball[];
  runsInOver: number;
  wicketsInOver: number;
}

interface Ball {
  ballNumber: number;
  runs: number;
  isWicket: boolean;
  isWide: boolean;
  isNoBall: boolean;
  striker: string;
  nonStriker: string;
  bowler: string;
  wicketType?: string;
  fielder?: string;
  isBye?: boolean;
  isLegBye?: boolean;
}

interface BatsmanStat {
  playerName: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
}

interface BowlerStat {
  playerName: string;
  overs: number;
  runs: number;
  wickets: number;
  economy: number;
  maidens?: number;
  wides?: number;
  noBalls?: number;
}

interface Commentary {
  ballNumber: string;
  text: string;
  timestamp: Date;
}

const LiveScoringAdmin: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Player lists
  const [battingTeamPlayers, setBattingTeamPlayers] = useState<string[]>([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState<string[]>([]);
  
  // Ball entry form state
  const [runs, setRuns] = useState<number>(0);
  const [striker, setStriker] = useState<string>('');
  const [nonStriker, setNonStriker] = useState<string>('');
  const [bowler, setBowler] = useState<string>('');
  const [isWicket, setIsWicket] = useState<boolean>(false);
  const [wicketType, setWicketType] = useState<string>('');
  const [fielder, setFielder] = useState<string>('');
  const [isWide, setIsWide] = useState<boolean>(false);
  const [isNoBall, setIsNoBall] = useState<boolean>(false);
  const [isBye, setIsBye] = useState<boolean>(false);
  const [isLegBye, setIsLegBye] = useState<boolean>(false);

  // New match form state
  const [newMatch, setNewMatch] = useState({
    team1: undefined as string | undefined,
    team2: undefined as string | undefined,
    venue: '',
    matchDate: '',
    matchType: 'T20' as string,
    totalOvers: 20,
    tossWinner: undefined as string | undefined,
    tossDecision: 'bat' as string
  });

  useEffect(() => {
    fetchMatches();
    
    // Connect to Socket.IO
    const socket = socketService.connect();
    if (socket) {
      setSocketConnected(socket.connected);
      
      socket.on('connect', () => {
        console.log('🔴 Admin connected to Socket.IO');
        setSocketConnected(true);
      });
      
      socket.on('disconnect', () => {
        console.log('🔴 Admin disconnected from Socket.IO');
        setSocketConnected(false);
      });
      
      // Listen for real-time ball updates
      socketService.onBallUpdate((data) => {
        console.log('⚡ Real-time ball update received:', data);
        
        // Update selected match if it matches
        if (selectedMatch && data.matchId === selectedMatch.matchId) {
          setSelectedMatch(data.match);
        }
        
        // Update matches list
        setMatches(prev => 
          prev.map(m => m.matchId === data.matchId ? data.match : m)
        );
        
        // Show toast notification
        toast({
          title: "Live Update!",
          description: data.commentary,
          duration: 3000,
        });
      });
      
      // Listen for match started
      socketService.onMatchStarted((match) => {
        console.log('🎯 Match started:', match);
        setMatches(prev => 
          prev.map(m => m.matchId === match.matchId ? match : m)
        );
      });
    }
    
    return () => {
      socketService.offBallUpdate();
      socketService.offMatchStarted();
    };
  }, [selectedMatch]);

  // Fetch players when match is selected or innings changes
  useEffect(() => {
    if (selectedMatch && getCurrentInnings()) {
      const battingTeam = getCurrentInnings()!.battingTeam;
      const bowlingTeam = getCurrentInnings()!.bowlingTeam;
      fetchPlayersForMatch(battingTeam, bowlingTeam);
    }
  }, [selectedMatch, selectedMatch?.currentInnings]);

  const fetchMatches = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/matches');
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch matches",
        variant: "destructive"
      });
    }
  };

  const fetchPlayersForMatch = async (battingTeam: string, bowlingTeam: string) => {
    try {
      console.log('Fetching players for:', { battingTeam, bowlingTeam });
      
      // Fetch batting team players from API
      const battingResponse = await fetch(`http://localhost:5001/api/players?team=${battingTeam}`);
      if (!battingResponse.ok) {
        throw new Error(`Failed to fetch batting team players: ${battingResponse.statusText}`);
      }
      const battingData = await battingResponse.json();
      const battingPlayers = battingData.map((p: any) => p.name);
      
      // Fetch bowling team players from API
      const bowlingResponse = await fetch(`http://localhost:5001/api/players?team=${bowlingTeam}`);
      if (!bowlingResponse.ok) {
        throw new Error(`Failed to fetch bowling team players: ${bowlingResponse.statusText}`);
      }
      const bowlingData = await bowlingResponse.json();
      const bowlingPlayers = bowlingData.map((p: any) => p.name);
      
      console.log('Batting team:', battingTeam, 'Players:', battingPlayers);
      console.log('Bowling team:', bowlingTeam, 'Players:', bowlingPlayers);
      
      setBattingTeamPlayers(battingPlayers);
      setBowlingTeamPlayers(bowlingPlayers);
      
      if (battingPlayers.length === 0) {
        toast({
          title: "Warning",
          description: `No players found for ${battingTeam}. Please add players to this team first.`,
          variant: "destructive"
        });
      }
      if (bowlingPlayers.length === 0) {
        toast({
          title: "Warning",
          description: `No players found for ${bowlingTeam}. Please add players to this team first.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch players",
        variant: "destructive"
      });
    }
  };

  const createMatch = async () => {
    // Validate required fields
    if (!newMatch.team1 || !newMatch.team2 || !newMatch.venue || !newMatch.matchDate) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields (teams, venue, date)",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMatch)
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Match created successfully"
        });
        fetchMatches();
        setNewMatch({
          team1: undefined,
          team2: undefined,
          venue: '',
          matchDate: '',
          matchType: 'T20',
          totalOvers: 20,
          tossWinner: undefined,
          tossDecision: 'bat'
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startMatch = async (matchId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/matches/${matchId}/start`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const updatedMatch = await response.json();
        setSelectedMatch(updatedMatch);
        fetchMatches();
        toast({
          title: "Match Started!",
          description: "Live scoring is now active"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start match",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addBall = async () => {
    if (!selectedMatch || !striker || !bowler) {
      toast({
        title: "Error",
        description: "Please fill required fields (striker, bowler)",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/matches/${selectedMatch.matchId}/ball`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runs,
          isWicket,
          isWide,
          isNoBall,
          isBye,
          isLegBye,
          striker,
          nonStriker,
          bowler,
          wicketType: isWicket ? wicketType : undefined,
          fielder: isWicket ? fielder : undefined
        })
      });
      
      if (response.ok) {
        const { match } = await response.json();
        setSelectedMatch(match);
        fetchMatches();
        
        // Reset form
        setRuns(0);
        setIsWicket(false);
        setIsWide(false);
        setIsNoBall(false);
        setIsBye(false);
        setIsLegBye(false);
        setWicketType('');
        setFielder('');
        
        toast({
          title: "Ball Added",
          description: "Score updated successfully"
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to add ball",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error adding ball:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add ball",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? This cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/matches/${matchId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (selectedMatch?.matchId === matchId) {
          setSelectedMatch(null);
        }
        fetchMatches();
        toast({
          title: "Match Deleted",
          description: "Match has been removed successfully"
        });
      } else {
        throw new Error('Failed to delete match');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete match",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const endInnings = async () => {
    if (!selectedMatch) return;

    const currentInnings = getCurrentInnings();
    const battingTeam = currentInnings?.battingTeam;

    if (!confirm(`Are you sure you want to end ${battingTeam}'s innings?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/matches/${selectedMatch.matchId}/end-innings`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const updatedMatch = await response.json();
        setSelectedMatch(updatedMatch);
        fetchMatches();
        toast({
          title: "Innings Ended",
          description: `${battingTeam}'s innings has been completed. ${updatedMatch.status === 'completed' ? 'Match finished!' : 'Next innings started.'}`
        });
      } else {
        throw new Error('Failed to end innings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end innings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentInnings = () => {
    if (!selectedMatch || !selectedMatch.innings.length) return null;
    return selectedMatch.innings[selectedMatch.currentInnings - 1];
  };

  const getCurrentOver = () => {
    const innings = getCurrentInnings();
    if (!innings || !innings.overs.length) return null;
    return innings.overs[innings.overs.length - 1];
  };

  const getCurrentBowler = () => {
    if (!selectedMatch || !selectedMatch.bowlerStats.length) return null;
    const over = getCurrentOver();
    if (!over) return null;
    return selectedMatch.bowlerStats.find(b => b.playerName === over.bowler);
  };

  const getRunRate = () => {
    const innings = getCurrentInnings();
    if (!innings) return '0.00';
    const totalBalls = innings.currentOver * 6 + innings.currentBall;
    return totalBalls > 0 ? (innings.runs / (totalBalls / 6)).toFixed(2) : '0.00';
  };

  const formatBallOutcome = (ball: Ball) => {
    if (ball.isWicket) return 'W';
    if (ball.isWide) return 'Wd';
    if (ball.isNoBall) return 'Nb';
    return ball.runs.toString();
  };

  const teams = ['THUNDER STRIKERS', 'ROYAL LIONS', 'EAGLES UNITED', 'WARRIORS XI', 'TITANS CHAMPION'];
  const wicketTypes = ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-bold">Live Cricket Scoring</h1>
      </div>

      <Tabs defaultValue="scoring" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scoring">Live Scoring</TabsTrigger>
          <TabsTrigger value="create">Create Match</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Match</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Team 1</label>
                  <Select value={newMatch.team1 || undefined} onValueChange={(value) => setNewMatch({...newMatch, team1: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team} value={team}>{team}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Team 2</label>
                  <Select value={newMatch.team2 || undefined} onValueChange={(value) => setNewMatch({...newMatch, team2: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.filter(team => team !== newMatch.team1).map(team => (
                        <SelectItem key={team} value={team}>{team}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Venue</label>
                  <Input
                    value={newMatch.venue}
                    onChange={(e) => setNewMatch({...newMatch, venue: e.target.value})}
                    placeholder="Match venue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Match Date</label>
                  <Input
                    type="datetime-local"
                    value={newMatch.matchDate}
                    onChange={(e) => setNewMatch({...newMatch, matchDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Match Type</label>
                  <Select value={newMatch.matchType} onValueChange={(value) => setNewMatch({...newMatch, matchType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select match type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T20">T20</SelectItem>
                      <SelectItem value="ODI">ODI</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Overs</label>
                  <Input
                    type="number"
                    value={newMatch.totalOvers}
                    onChange={(e) => setNewMatch({...newMatch, totalOvers: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Toss Winner</label>
                  <Select value={newMatch.tossWinner || undefined} onValueChange={(value) => setNewMatch({...newMatch, tossWinner: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toss winner" />
                    </SelectTrigger>
                    <SelectContent>
                      {newMatch.team1 && <SelectItem value={newMatch.team1}>{newMatch.team1}</SelectItem>}
                      {newMatch.team2 && <SelectItem value={newMatch.team2}>{newMatch.team2}</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Toss Decision</label>
                <Select value={newMatch.tossDecision} onValueChange={(value) => setNewMatch({...newMatch, tossDecision: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select toss decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bat">Bat First</SelectItem>
                    <SelectItem value="bowl">Bowl First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={createMatch} disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Match'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4">
          {/* Match Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Match</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {matches.map((match) => (
                  <div
                    key={match._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedMatch?._id === match._id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{match.team1} vs {match.team2}</h3>
                        <p className="text-sm text-gray-600">{match.venue}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          match.status === 'live' ? 'destructive' : 
                          match.status === 'completed' ? 'secondary' : 'default'
                        }>
                          {match.status.toUpperCase()}
                        </Badge>
                        {(match.status === 'upcoming' || match.status === 'scheduled') && (
                          <Button size="sm" onClick={(e) => {
                            e.stopPropagation();
                            startMatch(match.matchId);
                          }} disabled={loading}>
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMatch(match.matchId);
                          }} 
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live Scoring Interface */}
          {selectedMatch && selectedMatch.status === 'live' && (
            <>
              {/* Live Match Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Live Score Display */}
                <Card className="lg:col-span-2">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                    <CardTitle className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-600 font-bold">LIVE</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold">{selectedMatch.team1}</span>
                        <span className="text-gray-500">vs</span>
                        <span className="text-lg font-bold">{selectedMatch.team2}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {getCurrentInnings() && (
                      <div className="space-y-6">
                        {/* Current Score */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-blue-800">
                              {getCurrentInnings()!.battingTeam} - Innings {getCurrentInnings()!.inningsNumber}
                            </h3>
                            <Badge variant="secondary" className="text-sm">
                              {selectedMatch.venue}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-4xl font-bold text-blue-600">
                                {getCurrentInnings()!.runs}
                              </div>
                              <div className="text-sm text-gray-600">Runs</div>
                            </div>
                            <div>
                              <div className="text-4xl font-bold text-red-600">
                                {getCurrentInnings()!.wickets}
                              </div>
                              <div className="text-sm text-gray-600">Wickets</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold text-green-600">
                                {getCurrentInnings()!.currentOver}.{getCurrentInnings()!.currentBall}
                              </div>
                              <div className="text-sm text-gray-600">Overs</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold text-purple-600">
                                {getRunRate()}
                              </div>
                              <div className="text-sm text-gray-600">Run Rate</div>
                            </div>
                          </div>
                        </div>

                        {/* Current Partnership */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                          <h4 className="font-bold text-green-800 mb-3">Current Partnership</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedMatch.batsmanStats
                              .filter(b => !b.isOut)
                              .slice(0, 2)
                              .map((batsman, index) => (
                                <div key={batsman.playerName} className="bg-white rounded-lg p-3 shadow-sm">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h5 className="font-bold text-gray-800 flex items-center gap-2">
                                        {batsman.playerName}
                                        {index === 0 && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Striker</span>}
                                      </h5>
                                      <p className="text-sm text-gray-600">
                                        {batsman.runs}({batsman.ballsFaced}) • SR: {batsman.ballsFaced > 0 ? ((batsman.runs / batsman.ballsFaced) * 100).toFixed(1) : '0.0'}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm">
                                        <span className="text-blue-600">4s: {batsman.fours}</span>
                                        <span className="text-green-600 ml-2">6s: {batsman.sixes}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </div>

                        {/* Current Over */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-purple-800">Current Over {getCurrentInnings()!.currentOver + 1}</h4>
                            <div className="text-sm text-gray-600">
                              Bowler: {getCurrentBowler()?.playerName || 'Not set'}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            {getCurrentOver()?.balls?.map((ball, index) => (
                              <div
                                key={index}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                                  ball.isWicket
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : ball.runs === 6
                                    ? 'bg-green-500 text-white'
                                    : ball.runs === 4
                                    ? 'bg-blue-500 text-white'
                                    : ball.isWide || ball.isNoBall
                                    ? 'bg-yellow-400 text-black'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                                title={`Ball ${index + 1}: ${ball.striker} - ${formatBallOutcome(ball)} runs`}
                              >
                                {formatBallOutcome(ball)}
                              </div>
                            )) || []}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Bowler Stats */}
                    <div>
                      <h4 className="font-semibold mb-2">Current Bowler</h4>
                      {getCurrentBowler() ? (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h5 className="font-bold">{getCurrentBowler()?.playerName}</h5>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Overs: {getCurrentBowler()?.overs}</div>
                            <div>Runs: {getCurrentBowler()?.runs}</div>
                            <div>Wickets: {getCurrentBowler()?.wickets}</div>
                            <div>Economy: {getCurrentBowler()?.economy}</div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No current bowler</p>
                      )}
                    </div>

                    {/* Match Progress */}
                    <div>
                      <h4 className="font-semibold mb-2">Match Progress</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Overs:</span>
                          <span>{getCurrentInnings()?.currentOver || 0}.{getCurrentInnings()?.currentBall || 0} / {selectedMatch.totalOvers}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${getCurrentInnings() ? ((getCurrentInnings()!.currentOver + getCurrentInnings()!.currentBall/6) / selectedMatch.totalOvers) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Commentary */}
                    <div>
                      <h4 className="font-semibold mb-2">Live Commentary</h4>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {selectedMatch.commentary.slice(0, 5).map((comment, index) => (
                          <div key={index} className="text-xs bg-gray-50 rounded p-2">
                            <div className="flex items-start gap-2">
                              <span className="font-mono font-bold text-blue-600 bg-white px-1 rounded text-xs">
                                {comment.ballNumber}
                              </span>
                              <p className="flex-1 text-gray-700">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ball-by-Ball History */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Ball-by-Ball History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getCurrentInnings()?.overs?.slice(-3).reverse().map((over, overIndex) => (
                      <div key={over.overNumber} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold">Over {over.overNumber}</h4>
                          <div className="text-sm text-gray-600">
                            Bowler: {over.bowler} | Runs: {over.runsInOver} | Wickets: {over.wicketsInOver}
                          </div>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {over.balls.map((ball, ballIndex) => (
                            <div key={ballIndex} className="relative group">
                              <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm cursor-pointer ${
                                  ball.isWicket
                                    ? 'bg-red-500 text-white'
                                    : ball.runs === 6
                                    ? 'bg-green-500 text-white'
                                    : ball.runs === 4
                                    ? 'bg-blue-500 text-white'
                                    : ball.isWide || ball.isNoBall
                                    ? 'bg-yellow-400 text-black'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {formatBallOutcome(ball)}
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                  {ball.striker} - {formatBallOutcome(ball)} runs
                                  {ball.isWicket && ` (${ball.wicketType})`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )) || <p className="text-gray-500 text-center py-4">No overs bowled yet</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Batting & Bowling Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Batting Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Batting Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-2">Batsman</th>
                            <th className="text-center p-2">R</th>
                            <th className="text-center p-2">B</th>
                            <th className="text-center p-2">4s</th>
                            <th className="text-center p-2">6s</th>
                            <th className="text-center p-2">SR</th>
                            <th className="text-center p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMatch.batsmanStats.map((batsman, index) => (
                            <tr key={batsman.playerName} className={`border-b ${!batsman.isOut ? 'bg-green-50' : ''}`}>
                              <td className="p-2 font-medium">
                                {batsman.playerName}
                                {!batsman.isOut && index < 2 && (
                                  <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                                    {index === 0 ? 'Striker' : 'Non-striker'}
                                  </span>
                                )}
                              </td>
                              <td className="text-center p-2 font-bold">{batsman.runs}</td>
                              <td className="text-center p-2">{batsman.ballsFaced}</td>
                              <td className="text-center p-2 text-blue-600">{batsman.fours}</td>
                              <td className="text-center p-2 text-green-600">{batsman.sixes}</td>
                              <td className="text-center p-2">
                                {batsman.ballsFaced > 0 ? ((batsman.runs / batsman.ballsFaced) * 100).toFixed(1) : '0.0'}
                              </td>
                              <td className="text-center p-2">
                                {batsman.isOut ? (
                                  <span className="text-red-600 text-xs">Out</span>
                                ) : (
                                  <span className="text-green-600 text-xs">Not Out</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {selectedMatch.batsmanStats.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center p-4 text-gray-500">
                                No batting statistics yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Bowling Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bowling Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-2">Bowler</th>
                            <th className="text-center p-2">O</th>
                            <th className="text-center p-2">M</th>
                            <th className="text-center p-2">R</th>
                            <th className="text-center p-2">W</th>
                            <th className="text-center p-2">Eco</th>
                            <th className="text-center p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMatch.bowlerStats.map((bowler) => (
                            <tr key={bowler.playerName} className={`border-b ${getCurrentBowler()?.playerName === bowler.playerName ? 'bg-blue-50' : ''}`}>
                              <td className="p-2 font-medium">
                                {bowler.playerName}
                                {getCurrentBowler()?.playerName === bowler.playerName && (
                                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                    Bowling
                                  </span>
                                )}
                              </td>
                              <td className="text-center p-2">{bowler.overs}</td>
                              <td className="text-center p-2">{bowler.maidens || 0}</td>
                              <td className="text-center p-2">{bowler.runs}</td>
                              <td className="text-center p-2 font-bold text-red-600">{bowler.wickets}</td>
                              <td className="text-center p-2">{bowler.economy}</td>
                              <td className="text-center p-2">
                                <div className="text-xs text-gray-600">
                                  W:{bowler.wides || 0} NB:{bowler.noBalls || 0}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {selectedMatch.bowlerStats.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center p-4 text-gray-500">
                                No bowling statistics yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ball Entry Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Ball</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Player Information */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Striker * <span className="text-xs text-gray-500">({getCurrentInnings()?.battingTeam})</span>
                      </label>
                      <Select value={striker} onValueChange={setStriker}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select striker" />
                        </SelectTrigger>
                        <SelectContent>
                          {battingTeamPlayers.map(player => (
                            <SelectItem key={player} value={player}>
                              {player}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Non-Striker <span className="text-xs text-gray-500">({getCurrentInnings()?.battingTeam})</span>
                      </label>
                      <Select value={nonStriker} onValueChange={setNonStriker}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select non-striker" />
                        </SelectTrigger>
                        <SelectContent>
                          {battingTeamPlayers.map(player => (
                            <SelectItem key={player} value={player}>
                              {player}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Bowler * <span className="text-xs text-gray-500">({getCurrentInnings()?.bowlingTeam})</span>
                      </label>
                      <Select value={bowler} onValueChange={setBowler}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bowler" />
                        </SelectTrigger>
                        <SelectContent>
                          {bowlingTeamPlayers.map(player => (
                            <SelectItem key={player} value={player}>
                              {player}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Quick Scoring Buttons */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-3">Quick Score Entry</h3>
                      <div className="grid grid-cols-6 gap-3">
                        {[0, 1, 2, 3, 4, 6].map((run) => (
                          <Button
                            key={run}
                            variant={runs === run ? "default" : "outline"}
                            onClick={() => setRuns(run)}
                            className={`h-16 text-xl font-bold ${
                              run === 4 ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                              run === 6 ? 'bg-green-500 hover:bg-green-600 text-white' :
                              runs === run ? '' : 'hover:bg-gray-100'
                            }`}
                          >
                            {run}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Special Deliveries */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Special Deliveries</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                          variant={isWide ? "default" : "outline"}
                          onClick={() => setIsWide(!isWide)}
                          className={`${isWide ? 'bg-yellow-500 text-white' : ''}`}
                        >
                          Wide
                        </Button>
                        <Button
                          variant={isNoBall ? "default" : "outline"}
                          onClick={() => setIsNoBall(!isNoBall)}
                          className={`${isNoBall ? 'bg-orange-500 text-white' : ''}`}
                        >
                          No Ball
                        </Button>
                        <Button
                          variant={isBye ? "default" : "outline"}
                          onClick={() => setIsBye(!isBye)}
                          className={`${isBye ? 'bg-purple-500 text-white' : ''}`}
                        >
                          Bye
                        </Button>
                        <Button
                          variant={isLegBye ? "default" : "outline"}
                          onClick={() => setIsLegBye(!isLegBye)}
                          className={`${isLegBye ? 'bg-indigo-500 text-white' : ''}`}
                        >
                          Leg Bye
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Wicket Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant={isWicket ? "destructive" : "outline"}
                        onClick={() => setIsWicket(!isWicket)}
                        className="flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {isWicket ? 'Wicket Taken' : 'No Wicket'}
                      </Button>
                    </div>
                    
                    {isWicket && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Wicket Type</label>
                            <Select value={wicketType || undefined} onValueChange={setWicketType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select wicket type" />
                              </SelectTrigger>
                              <SelectContent>
                                {wicketTypes.map(type => (
                                  <SelectItem key={type} value={type}>
                                    {type.replace('_', ' ').toUpperCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Fielder (if applicable)</label>
                            <Input
                              value={fielder}
                              onChange={(e) => setFielder(e.target.value)}
                              placeholder="Fielder name"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Ball */}
                  <div className="flex gap-4">
                    <Button 
                      onClick={addBall} 
                      disabled={loading || !striker || !bowler} 
                      className="flex-1 h-12 text-lg font-semibold bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      {loading ? 'Adding Ball...' : 'Add Ball'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRuns(0);
                        setIsWicket(false);
                        setIsWide(false);
                        setIsNoBall(false);
                        setIsBye(false);
                        setIsLegBye(false);
                        setWicketType('');
                        setFielder('');
                      }}
                      className="h-12"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* End Innings Button */}
                  <Button 
                    onClick={endInnings} 
                    disabled={loading}
                    variant="destructive"
                    className="w-full h-12 text-lg font-semibold"
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    End Current Innings
                  </Button>

                  {/* Ball Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Current Ball Summary:</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Runs:</strong> {runs}</p>
                      <p><strong>Striker:</strong> {striker || 'Not set'}</p>
                      <p><strong>Bowler:</strong> {bowler || 'Not set'}</p>
                      {isWicket && <p className="text-red-600"><strong>Wicket:</strong> {wicketType || 'Type not set'}</p>}
                      {isWide && <p className="text-yellow-600"><strong>Wide Ball</strong></p>}
                      {isNoBall && <p className="text-orange-600"><strong>No Ball</strong></p>}
                      {isBye && <p className="text-purple-600"><strong>Bye</strong></p>}
                      {isLegBye && <p className="text-indigo-600"><strong>Leg Bye</strong></p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveScoringAdmin;
