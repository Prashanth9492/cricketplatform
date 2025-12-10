import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Star, TrendingUp, ArrowLeft, Calendar, Clock, MapPin, X, Zap, Shield, Award, ChevronRight, Target, UserCheck, Home, Globe, Circle, PieChart, PlayCircle, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Player interface - matching the backend Player model
interface Player {
  _id: string;
  name: string;
  position?: string;
  team: string;
  age?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  description?: string;
  photoUrl?: string;
  matches: number;
  innings: number;
  runs: number;
  highest_score: number;
  hundreds: number;
  fifties: number;
  fours: number;
  sixes: number;
  balls_faced: number;
  outs: number;
  average?: number;
  strike_rate?: number;
  pinno: string;
}

// Cricket teams data with icon-based logos
const teams = [
  {
    id: "1",
    name: "THUNDER STRIKERS",
    shortName: "TS",
    icon: Zap,
    iconColor: "#FF4444",
    bgColor: "#FF444420",
    captain: "Arun Sharma",
    home_ground: "Thunder Stadium",
    founded: 2010,
    description: "Thunder Strikers dominate with explosive batting and strategic gameplay.",
    stats: {
      matches: 42,
      wins: 28,
      losses: 14
    }
  },
  {
    id: "2",
    name: "ROYAL LIONS",
    shortName: "RL",
    icon: Award,
    iconColor: "#4444FF",
    bgColor: "#4444FF20",
    captain: "Vikram Singh",
    home_ground: "Lions Arena",
    founded: 2012,
    description: "Royal Lions reign supreme with powerful all-rounders and fierce competition.",
    stats: {
      matches: 45,
      wins: 30,
      losses: 15
    }
  },
  {
    id: "3",
    name: "EAGLES UNITED",
    shortName: "EU",
    icon: TrendingUp,
    iconColor: "#44FF44",
    bgColor: "#44FF4420",
    captain: "Rahul Verma",
    home_ground: "Eagles Park",
    founded: 2008,
    description: "Eagles United soar high with exceptional bowling and swift fielding.",
    stats: {
      matches: 50,
      wins: 32,
      losses: 18
    }
  },
  {
    id: "4",
    name: "WARRIORS XI",
    shortName: "WXI",
    icon: Shield,
    iconColor: "#f18f20ff",
    bgColor: "#f18f2020",
    captain: "Sameer Patel",
    home_ground: "Warriors Ground",
    founded: 2015,
    description: "Warriors XI fight with determination and consistent performance.",
    stats: {
      matches: 38,
      wins: 22,
      losses: 16
    }
  },
  {
    id: "5",
    name: "TITANS CHAMPION",
    shortName: "TC",
    icon: Trophy,
    iconColor: "#FF44FF",
    bgColor: "#FF44FF20",
    captain: "Kiran Reddy",
    home_ground: "Titans Oval",
    founded: 2005,
    description: "Titans Champion stand tall with solid defense and match-winning knocks.",
    stats: {
      matches: 55,
      wins: 38,
      losses: 17
    }
  },
];

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const scaleUp = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1 }
};

const slideIn = {
  hidden: { x: -100, opacity: 0 },
  visible: { x: 0, opacity: 1 }
};

export default function Teams() {
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState("circular");

  // Function to fetch all players
  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/players`);
      setPlayers(response.data);
    } catch (err) {
      console.error('Error fetching players:', err);
      setPlayers([]);
    }
  };

  // Function to fetch team-specific players
  const fetchTeamPlayers = async (teamName: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/players?team=${encodeURIComponent(teamName)}`);
      setTeamPlayers(response.data);
    } catch (err) {
      console.error('Error fetching team players:', err);
      setTeamPlayers([]);
    }
  };

  // Function to fetch matches
  const fetchMatches = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/matches`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMatches(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    fetchPlayers();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchMatches();
    };
    const handleFocus = () => fetchMatches();
    const interval = setInterval(() => fetchMatches(), 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const getTeamMatches = (teamName) => {
    const normalized = teamName.toLowerCase();
    return matches.filter(match =>
      match.team1.toLowerCase().startsWith(normalized) ||
      match.team2.toLowerCase().startsWith(normalized)
    );
  };

  const showDetails = (teamId) => {
    const team = teams.find((team) => team.id === teamId);
    const teamMatches = matches.filter(match => 
      match.team1 === team.name || match.team2 === team.name
    );
    const upcomingMatches = teamMatches.filter(match => 
      match.status === 'upcoming' || match.status === 'scheduled'
    );
    const completedMatches = teamMatches.filter(match => 
      match.status === 'completed' || match.status === 'finished'
    );
    const pastMatches = completedMatches.map(match => ({
      opponent: match.team1 === team.name ? match.team2 : match.team1,
      venue: match.venue,
      date: match.date,
      status: match.status,
      type: match.type
    }));
    
    setSelectedTeam({
      ...team,
      pastMatches,
      upcomingMatches,
      totalMatches: teamMatches.length
    });
    
    // Fetch players for this team
    fetchTeamPlayers(team.name);
  };

  const hideDetails = () => {
    setSelectedTeam(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading teams and matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Circular Layout View */}
      {!selectedTeam && (
        <div className="relative min-h-screen overflow-hidden">
          {/* Background Circles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`absolute rounded-full border-2 border-gray-200 dark:border-gray-700 opacity-20`}
                style={{
                  width: `${300 + i * 200}px`,
                  height: `${300 + i * 200}px`,
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%)`,
                  animation: `spin-${i % 2 === 0 ? 'reverse' : 'normal'} ${30 + i * 10}s linear infinite`
                }}
              />
            ))}
          </div>

          {/* Main Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={slideIn}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center shadow-2xl">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Championship Circle
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    5 teams arranged in circular formation
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Circular Teams Layout */}
            <div className="relative h-[600px] w-full">
              {/* Central Hub */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-r from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/30 shadow-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">5</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Teams</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Click any team to explore
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/10"></div>
                </div>
              </div>

              {/* Teams arranged in circle */}
              {teams.map((team, index) => {
                const angle = (index / teams.length) * 2 * Math.PI;
                const radius = 280;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const Icon = team.icon;
                const teamMatches = getTeamMatches(team.name);
                
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      x: x,
                      y: y
                    }}
                    transition={{
                      delay: index * 0.2,
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                    className="absolute top-1/2 left-1/2 cursor-pointer group"
                    style={{
                      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
                    }}
                    onClick={() => showDetails(team.id)}
                  >
                    <div className="relative">
                      {/* Outer Ring */}
                      <div 
                        className="absolute inset-0 rounded-full animate-spin-slow"
                        style={{
                          border: `2px dashed ${team.iconColor}50`,
                          width: '140px',
                          height: '140px',
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                      
                      {/* Team Circle */}
                      <div 
                        className="w-32 h-32 rounded-full flex flex-col items-center justify-center transform transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl group-hover:-translate-y-2"
                        style={{
                          backgroundColor: team.bgColor,
                          border: `3px solid ${team.iconColor}`,
                          boxShadow: `0 10px 40px ${team.iconColor}40`
                        }}
                      >
                        {/* Icon */}
                        <div className="mb-2">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: team.iconColor }}
                          >
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        
                        {/* Team Name */}
                        <div className="text-center">
                          <div className="font-bold text-sm text-gray-900 dark:text-white">
                            {team.shortName}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {teamMatches.length} matches
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover Indicator */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-5 w-5 text-primary animate-bounce" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Info Panel */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 1 }}
              className="mt-20"
            >
              <div className="max-w-4xl mx-auto">

              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Team Details View - Radial Design */}
      {selectedTeam && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="relative min-h-screen overflow-hidden"
        >
          {/* Background Radial Gradient */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                width: '200vw',
                height: '200vh',
                background: `radial-gradient(circle, ${selectedTeam.iconColor}10 0%, transparent 70%)`,
              }}
            />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
            {/* Back Button */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="mb-8"
            >
              <Button
                onClick={hideDetails}
                variant="ghost"
                className="group gap-2 hover:bg-white/20 backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Back to Circle
              </Button>
            </motion.div>

            {/* Team Header - Radial Design */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center relative"
              >
                {/* Outer Rings */}
                <div className="absolute inset-0">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full border-2 animate-spin-slow"
                      style={{
                        width: `${200 + i * 60}px`,
                        height: `${200 + i * 60}px`,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        borderColor: `${selectedTeam.iconColor}${20 + i * 20}`,
                        animationDirection: i % 2 === 0 ? 'reverse' : 'normal'
                      }}
                    />
                  ))}
                </div>

                {/* Main Team Circle */}
                <div 
                  className="w-64 h-64 rounded-full flex flex-col items-center justify-center relative z-10 shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${selectedTeam.iconColor}20, ${selectedTeam.iconColor}40)`,
                    border: `4px solid ${selectedTeam.iconColor}`,
                  }}
                >
                  <div className="mb-4">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: selectedTeam.iconColor }}
                    >
                      <selectedTeam.icon className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    {selectedTeam.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Since {selectedTeam.founded}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Radial Stats Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Left Column - Team Info */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <div className="space-y-6">
                  {/* Description in circular format */}
                  <div className="relative">
                    <div className="bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-4">
                        <div 
                          className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: selectedTeam.bgColor }}
                        >
                          <Target className="h-8 w-8" style={{ color: selectedTeam.iconColor }} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                            Team Philosophy
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {selectedTeam.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Stats in Radial Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Captain", value: selectedTeam.captain, icon: UserCheck },
                      { label: "Home Ground", value: selectedTeam.home_ground, icon: Home },
                      { label: "Established", value: selectedTeam.founded, icon: Calendar },
                      { label: "Total Matches", value: selectedTeam.totalMatches || 0, icon: Trophy },
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="relative"
                      >
                        <div className="aspect-square rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-xl transition-shadow">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                            style={{ backgroundColor: selectedTeam.bgColor }}
                          >
                            <stat.icon className="h-6 w-6" style={{ color: selectedTeam.iconColor }} />
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stat.value}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {stat.label}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Upcoming Matches Radial */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="sticky top-8">
                  <div className="bg-gradient-to-b from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 h-full">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <PlayCircle className="h-6 w-6" style={{ color: selectedTeam.iconColor }} />
                      Upcoming Fixtures
                    </h3>
                    
                    {(() => {
                      const upcomingMatches = getTeamMatches(selectedTeam.name)
                        .filter(m => m.status === 'upcoming' || m.status === 'scheduled')
                        .slice(0, 4);
                      
                      if (upcomingMatches.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                              <Calendar className="h-12 w-12 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">No upcoming matches</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-4">
                          {upcomingMatches.map((match, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                              className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-colors"
                            >
                              <div 
                                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: selectedTeam.bgColor }}
                              >
                                <Calendar className="h-6 w-6" style={{ color: selectedTeam.iconColor }} />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  vs {match.team1 === selectedTeam.name ? match.team2 : match.team1}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  {new Date(match.date).toLocaleDateString()}
                                </div>
                              </div>
                              <Badge 
                                className="px-3 py-1 rounded-full"
                                style={{ 
                                  backgroundColor: selectedTeam.bgColor,
                                  color: selectedTeam.iconColor
                                }}
                              >
                                {match.type}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Team Squad Section */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-12"
            >
              <div className="bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Users className="h-6 w-6" style={{ color: selectedTeam.iconColor }} />
                  Team Squad
                </h3>
                
                {teamPlayers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No players found for this team</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamPlayers.map((player, index) => (
                      <motion.div
                        key={player._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                        className="relative"
                      >
                        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all hover:shadow-lg group">
                          {/* Player Header */}
                          <div className="flex items-start gap-4 mb-4">
                            <div 
                              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                              style={{ backgroundColor: selectedTeam.iconColor }}
                            >
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                {player.name}
                              </h4>
                              {player.position && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {player.position}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Player Stats */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-300">Matches</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{player.matches || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-300">Runs</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{player.runs || 0}</span>
                            </div>
                            {player.average !== undefined && player.average > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Average</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{player.average.toFixed(2)}</span>
                              </div>
                            )}
                            {player.highest_score > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Highest Score</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{player.highest_score}</span>
                              </div>
                            )}
                          </div>

                          {/* Batting & Bowling Style */}
                          {(player.battingStyle || player.bowlingStyle) && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              {player.battingStyle && (
                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                  <span className="font-medium">Bat:</span> {player.battingStyle}
                                </div>
                              )}
                              {player.bowlingStyle && (
                                <div className="text-xs text-gray-600 dark:text-gray-300">
                                  <span className="font-medium">Bowl:</span> {player.bowlingStyle}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Match History - Circular Timeline */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-12"
            >
              <div className="bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Circle className="h-6 w-6 animate-pulse" style={{ color: selectedTeam.iconColor }} />
                  Recent Match Timeline
                </h3>
                
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent"></div>
                  
                  <div className="space-y-6 pl-12">
                    {getTeamMatches(selectedTeam.name)
                      .filter(m => m.status === 'completed' || m.status === 'finished')
                      .slice(0, 5)
                      .map((match, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          className="relative"
                        >
                          {/* Timeline Dot */}
                          <div 
                            className="absolute -left-7 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white dark:border-gray-800"
                            style={{ backgroundColor: selectedTeam.iconColor }}
                          />
                          
                          <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                  {selectedTeam.name} vs {match.team1 === selectedTeam.name ? match.team2 : match.team1}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {match.venue}
                                  </span>
                                  <span>•</span>
                                  <span>{match.type}</span>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Completed
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Add custom animations */}
      <style>{`
        @keyframes spin-normal {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}