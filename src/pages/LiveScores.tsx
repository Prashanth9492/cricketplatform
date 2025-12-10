import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Wifi, WifiOff, Radio } from 'lucide-react';
import axios from 'axios';
import { socketService } from '@/lib/socket';
import NativePiPScores from '@/components/NativePiPScores';

interface Match {
  _id: string;
  matchId: string;
  team1: string;
  team2: string;
  venue: string;
  matchDate: Date;
  status: 'upcoming' | 'live' | 'completed';
  isLive: boolean;
  score?: string;
  currentInnings: number;
  innings: any[];
  batsmanStats: any[];
  bowlerStats: any[];
  commentary: any[];
  result?: {
    winner: string;
    winBy: string;
  };
}

const LiveScores = () => {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchLiveMatches();
    
    // Connect to Socket.IO
    const socket = socketService.connect();
    if (socket) {
      setSocketConnected(socket.connected);
      
      socket.on('connect', () => {
        console.log('🟢 LiveScores connected to Socket.IO');
        setSocketConnected(true);
      });
      
      socket.on('disconnect', () => {
        console.log('🔴 LiveScores disconnected from Socket.IO');
        setSocketConnected(false);
      });
      
      // Listen for real-time ball updates
      socketService.onBallUpdate((data) => {
        console.log('⚡ LiveScores received ball update:', data);
        
        setLiveMatches(prev => {
          const index = prev.findIndex(m => m.matchId === data.matchId);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = data.match;
            return updated;
          }
          return prev;
        });
        
        setLastUpdate(new Date());
      });
      
      // Listen for match started
      socketService.onMatchStarted((match) => {
        console.log('🎯 LiveScores: Match started', match);
        setLiveMatches(prev => {
          const exists = prev.find(m => m.matchId === match.matchId);
          if (!exists) {
            return [match, ...prev];
          }
          return prev.map(m => m.matchId === match.matchId ? match : m);
        });
        setLastUpdate(new Date());
      });
    }
    
    // Fallback polling
    const interval = setInterval(fetchLiveMatches, 30000);
    
    return () => {
      clearInterval(interval);
      socketService.offBallUpdate();
      socketService.offMatchStarted();
    };
  }, []);

  const fetchLiveMatches = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/matches/live');
      setLiveMatches(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching live matches:', error);
      setLoading(false);
    }
  };

  const getCurrentInnings = (match: Match) => {
    if (!match.innings || match.innings.length === 0) return null;
    return match.innings[match.currentInnings - 1];
  };

  const formatScore = (innings: any) => {
    if (!innings) return 'Yet to bat';
    return `${innings.runs}/${innings.wickets} (${innings.currentOver}.${innings.currentBall})`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              Live Scores
              {socketConnected ? (
                <Wifi className="h-6 w-6 text-green-500" title="Connected" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-500" title="Disconnected" />
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              Follow live cricket matches and scores • Real-time updates via WebSocket
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <Badge className="text-lg px-4 py-2">
            <Trophy className="mr-2 h-5 w-5" />
            Live Cricket
          </Badge>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading live matches...</p>
              </div>
            </CardContent>
          </Card>
        ) : liveMatches.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Live Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No live matches at the moment</p>
                <p className="text-sm">Check back later for live cricket action!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {liveMatches.map((match) => {
              const currentInnings = getCurrentInnings(match);
              
              return (
                <Card key={match._id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                        LIVE
                      </CardTitle>
                      <Badge variant="outline">{match.venue}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Team 1 */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h3 className="font-bold text-xl">{match.team1}</h3>
                        {currentInnings?.battingTeam === match.team1 && (
                          <Badge variant="secondary" className="mt-1">Batting</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        {match.innings.find(i => i.battingTeam === match.team1) && (
                          <p className="text-2xl font-bold text-primary">
                            {formatScore(match.innings.find(i => i.battingTeam === match.team1))}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h3 className="font-bold text-xl">{match.team2}</h3>
                        {currentInnings?.battingTeam === match.team2 && (
                          <Badge variant="secondary" className="mt-1">Batting</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        {match.innings.find(i => i.battingTeam === match.team2) && (
                          <p className="text-2xl font-bold text-primary">
                            {formatScore(match.innings.find(i => i.battingTeam === match.team2))}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Recent Commentary */}
                    {match.commentary && match.commentary.length > 0 && (
                      <div className="bg-accent/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Radio className="h-4 w-4" />
                          Ball-by-Ball Commentary
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {match.commentary.slice(0, 10).map((comment, idx) => (
                            <div key={idx} className="text-sm border-l-2 border-primary pl-3 py-1">
                              <span className="font-bold text-primary">{comment.ballNumber}</span>
                              <span className="text-muted-foreground"> - {comment.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Batting Statistics */}
                    {match.batsmanStats && match.batsmanStats.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Batting Statistics</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
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
                              {match.batsmanStats.map((batsman, idx) => {
                                const strikeRate = batsman.ballsFaced > 0 
                                  ? ((batsman.runs / batsman.ballsFaced) * 100).toFixed(1) 
                                  : '0.0';
                                const isStriker = currentInnings?.striker === batsman.playerName;
                                const isNonStriker = currentInnings?.nonStriker === batsman.playerName;
                                
                                return (
                                  <tr key={idx} className={`border-b ${
                                    isStriker ? 'bg-yellow-50 dark:bg-yellow-950' : 
                                    isNonStriker ? 'bg-blue-50 dark:bg-blue-950' : ''
                                  }`}>
                                    <td className="p-2 font-medium">
                                      {batsman.playerName}
                                      {isStriker && <span className="text-primary ml-1">*</span>}
                                      {isNonStriker && <span className="text-blue-600 ml-1">†</span>}
                                    </td>
                                    <td className="text-center p-2 font-bold">{batsman.runs}</td>
                                    <td className="text-center p-2">{batsman.ballsFaced}</td>
                                    <td className="text-center p-2">{batsman.fours}</td>
                                    <td className="text-center p-2">{batsman.sixes}</td>
                                    <td className="text-center p-2">{strikeRate}</td>
                                    <td className="text-center p-2">
                                      {batsman.isOut ? (
                                        <Badge variant="destructive" className="text-xs">Out</Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">Batting</Badge>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Bowling Statistics */}
                    {match.bowlerStats && match.bowlerStats.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Bowling Statistics</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Bowler</th>
                                <th className="text-center p-2">O</th>
                                <th className="text-center p-2">M</th>
                                <th className="text-center p-2">R</th>
                                <th className="text-center p-2">W</th>
                                <th className="text-center p-2">Econ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {match.bowlerStats.map((bowler, idx) => {
                                const isBowling = currentInnings?.bowler === bowler.playerName;
                                
                                return (
                                  <tr key={idx} className={`border-b ${isBowling ? 'bg-yellow-50 dark:bg-yellow-950' : ''}`}>
                                    <td className="p-2 font-medium">
                                      {bowler.playerName}
                                      {isBowling && <span className="text-primary ml-1">*</span>}
                                    </td>
                                    <td className="text-center p-2">{bowler.overs}</td>
                                    <td className="text-center p-2">{bowler.maidens || 0}</td>
                                    <td className="text-center p-2 font-bold">{bowler.runs}</td>
                                    <td className="text-center p-2 font-bold text-primary">{bowler.wickets}</td>
                                    <td className="text-center p-2">{bowler.economy || '0.00'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Current Batsmen - Keep the compact cards */}
                    {match.batsmanStats && match.batsmanStats.filter(b => !b.isOut).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Current Partnership</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {match.batsmanStats
                            .filter(b => !b.isOut)
                            .slice(0, 2)
                            .map((batsman, idx) => {
                              const isStriker = currentInnings?.striker === batsman.playerName;
                              const isNonStriker = currentInnings?.nonStriker === batsman.playerName;
                              return (
                                <div key={idx} className={`rounded-lg p-3 ${
                                  isStriker ? 'bg-yellow-100 dark:bg-yellow-900' : 
                                  isNonStriker ? 'bg-blue-100 dark:bg-blue-900' : 'bg-accent/30'
                                }`}>
                                  <p className="font-semibold flex items-center gap-1">
                                    {batsman.playerName}
                                    {isStriker && <span className="text-xs text-primary">ON STRIKE</span>}
                                    {isNonStriker && <span className="text-xs text-blue-600">NON-STRIKER</span>}
                                  </p>
                                  <p className="text-lg font-bold text-primary">
                                    {batsman.runs} ({batsman.ballsFaced})
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {batsman.fours} fours • {batsman.sixes} sixes
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating PiP */}
      <NativePiPScores />
    </div>
  );
};

export default LiveScores;
