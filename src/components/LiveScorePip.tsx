import { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Activity, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface LiveMatch {
  _id: string;
  matchId: string;
  title: string;
  team1: string;
  team2: string;
  status: string;
  currentInnings?: number;
  innings?: Array<{
    battingTeam: string;
    bowlingTeam: string;
    runs: number;
    wickets: number;
    currentOver: number;
    currentBall: number;
  }>;
}

export default function LiveScorePip() {
  // Load saved state from localStorage
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('livePipOpen');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      const saved = localStorage.getItem('livePipMinimized');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('livePipPosition');
      return saved ? JSON.parse(saved) : { x: 20, y: 20 };
    } catch {
      return { x: 20, y: 20 };
    }
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(false);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('livePipOpen', JSON.stringify(isOpen));
    } catch (e) {
      console.warn('Could not save PiP state');
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('livePipMinimized', JSON.stringify(isMinimized));
    } catch (e) {
      console.warn('Could not save PiP state');
    }
  }, [isMinimized]);

  useEffect(() => {
    try {
      localStorage.setItem('livePipPosition', JSON.stringify(position));
    } catch (e) {
      console.warn('Could not save PiP position');
    }
  }, [position]);

  // Fetch live matches
  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/matches/live`);
        setLiveMatches(response.data);
        
        // Auto-open only on first load if there are live matches and user hasn't explicitly closed it
        try {
          const hasClosedManually = localStorage.getItem('livePipClosedManually');
          if (response.data.length > 0 && !hasClosedManually) {
            setIsOpen(true);
          }
        } catch (e) {
          // Ignore storage errors
        }
      } catch (error) {
        console.error('Error fetching live matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized || e.target instanceof HTMLButtonElement) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Keep within viewport bounds with some padding
    const pipWidth = isMinimized ? 320 : 384; // w-80 = 320px, w-96 = 384px
    const pipHeight = isMinimized ? 60 : 400;
    const maxX = window.innerWidth - pipWidth - 20;
    const maxY = window.innerHeight - pipHeight - 20;

    setPosition({
      x: Math.max(20, Math.min(newX, maxX)),
      y: Math.max(20, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isMinimized]);

  // Adjust position on window resize to keep PiP visible
  useEffect(() => {
    const handleResize = () => {
      const pipWidth = isMinimized ? 320 : 384;
      const pipHeight = isMinimized ? 60 : 400;
      const maxX = window.innerWidth - pipWidth - 20;
      const maxY = window.innerHeight - pipHeight - 20;

      setPosition(prev => ({
        x: Math.max(20, Math.min(prev.x, maxX)),
        y: Math.max(20, Math.min(prev.y, maxY)),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized]);

  const getCurrentScore = (match: LiveMatch) => {
    if (!match.innings || match.innings.length === 0) {
      return { runs: 0, wickets: 0, overs: 0 };
    }

    const currentInning = match.innings[match.innings.length - 1];
    const totalBalls = (currentInning.currentOver * 6) + currentInning.currentBall;
    const overs = `${currentInning.currentOver}.${currentInning.currentBall}`;

    return {
      runs: currentInning.runs,
      wickets: currentInning.wickets,
      overs: overs,
      battingTeam: currentInning.battingTeam,
    };
  };

  if (!isOpen || liveMatches.length === 0) {
    // Show floating button when closed or no live matches
    return (
      <AnimatePresence>
        {liveMatches.length > 0 && !isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => {
              setIsOpen(true);
              localStorage.removeItem('livePipClosedManually');
            }}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200"
            style={{ cursor: 'pointer' }}
            title="View Live Scores"
          >
            <Activity className="w-8 h-8 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
          </motion.button>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed z-[9999]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border-2 border-red-500/50 overflow-hidden ${isMinimized ? 'w-80' : 'w-96'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-white animate-pulse" />
            <span className="text-white font-bold text-sm">LIVE SCORE</span>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Open live scores in new window
                window.open('/live-scores', 'LiveScores', 'width=400,height=600,left=100,top=100');
              }}
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
              title="Open in separate window (stays on top of other apps)"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                try {
                  localStorage.setItem('livePipClosedManually', 'true');
                } catch (e) {
                  // Ignore storage errors
                }
              }}
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
                <p className="text-sm">Loading...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {liveMatches.map((match) => {
                  const score = getCurrentScore(match);
                  return (
                    <div
                      key={match._id}
                      className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 hover:border-red-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 uppercase font-semibold">
                          {match.title}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          LIVE
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Team 1 */}
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${score.battingTeam === match.team1 ? 'text-white' : 'text-gray-400'}`}>
                            {match.team1}
                          </span>
                          {score.battingTeam === match.team1 && (
                            <div className="text-white font-bold">
                              {score.runs}/{score.wickets}
                              <span className="text-xs text-gray-400 ml-2">({score.overs})</span>
                            </div>
                          )}
                        </div>

                        {/* Team 2 */}
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${score.battingTeam === match.team2 ? 'text-white' : 'text-gray-400'}`}>
                            {match.team2}
                          </span>
                          {score.battingTeam === match.team2 && (
                            <div className="text-white font-bold">
                              {score.runs}/{score.wickets}
                              <span className="text-xs text-gray-400 ml-2">({score.overs})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <p className="text-xs text-gray-400">
                          {score.battingTeam} batting
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
