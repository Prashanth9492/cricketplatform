import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import agni from "@/assets/agni.jpg";
import prudhvi from "@/assets/prudhvi.jpg";
import vayu from "@/assets/vayu.jpg";
import jal from "@/assets/jal.jpg";
import aakash from "@/assets/aakash.png";

interface Match {
  _id: string;
  team1: string;
  team2: string;
  matchDate: string;
  venue: string;
  type: string;
  matchType?: string;
  status: string;
  team1Logo: string;
  team2Logo: string;
  result?: {
    winner?: string;
    winBy?: string;
    playerOfMatch?: string;
  };
}

const Fixtures = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [formatFilter, setFormatFilter] = useState<string>("");
  const [seriesFilter, setSeriesFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/matches");
        const data = await res.json();
        console.log("Fetched matches:", data);
        setMatches(data);
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  useEffect(() => {
    console.log("Matches data:", matches);
  }, [matches]);

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const getTeamLogo = (teamName: string) => {
    const normalizedTeamName = teamName.toLowerCase().replace(/-.*$/, "");
    switch (normalizedTeamName) {
      case "agni":
        return agni;
      case "prudhvi":
        return prudhvi;
      case "vayu":
        return vayu;
      case "jal":
        return jal;
      case "aakash":
        return aakash;
      default:
        return "";
    }
  };

  // Get unique filter options
  const teamOptions = Array.from(new Set(matches.flatMap(m => [m.team1, m.team2])));
  const formatOptions = Array.from(new Set(matches.map(m => m.type)));
  const seriesOptions = Array.from(new Set(matches.map(m => m.status)));

  // Filter matches
  const filteredMatches = matches.filter(match => {
    const teamMatch = teamFilter ? (match.team1 === teamFilter || match.team2 === teamFilter) : true;
    const formatMatch = formatFilter ? match.type === formatFilter : true;
    const seriesMatch = seriesFilter ? match.status === seriesFilter : true;
    const searchMatch = search ? (
      match.team1.toLowerCase().includes(search.toLowerCase()) ||
      match.team2.toLowerCase().includes(search.toLowerCase()) ||
      match.venue.toLowerCase().includes(search.toLowerCase())
    ) : true;
    return teamMatch && formatMatch && seriesMatch && searchMatch;
  });

  return (
    <div className="bg-background min-h-screen text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 pt-8">
        {/* Fixtures List */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="text-lg font-semibold">Fri, 22 Aug 2025</div>
            <input
              type="text"
              placeholder="Search team, venue..."
              className="border rounded px-3 py-2 w-64 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">
              {[...Array(6)].map((_, i) => (
                <motion.div key={i} variants={item}>
                  <Skeleton className="h-24 w-full rounded-lg" />
                </motion.div>
              ))}
            </motion.div>
          ) : filteredMatches.length === 0 ? (
            <motion.p className="text-center text-xl text-gray-500 dark:text-gray-300 py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              No fixtures found
            </motion.p>
          ) : (
            <motion.div className="flex flex-col gap-2" variants={container} initial="hidden" animate="show">
              {filteredMatches.map((match) => (
                <motion.div key={match._id} variants={item}>
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-4 py-3 mb-2">
                    {/* Team 1 */}
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <img src={getTeamLogo(match.team1)} alt={match.team1} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-base text-gray-900 dark:text-gray-100">{match.team1}</span>
                        <span className="text-xs text-gray-500">Yet to bat</span>
                      </div>
                    </div>
                    {/* Status/Result */}
                    <div className="flex flex-col items-center min-w-[120px]">
                      {match.status === "completed" ? (
                        <>
                          <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                            <Trophy className="w-4 h-4" />
                            Completed
                          </span>
                          {match.result?.winner && (
                            <span className="text-xs font-semibold text-green-700 mt-1">
                              {match.result.winner === 'tie' ? '🤝 Tie' : 
                               match.result.winner === 'no_result' ? 'No Result' : 
                               `🏆 ${match.result.winner} won`}
                            </span>
                          )}
                        </>
                      ) : match.status.toLowerCase().includes("semi") ? (
                        <span className="flex items-center gap-1 text-yellow-600 text-sm font-semibold">Semi Final</span>
                      ) : match.status.toLowerCase().includes("final") ? (
                        <span className="flex items-center gap-1 text-blue-600 text-sm font-semibold">Final</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm font-semibold">
                          <span className="w-2 h-2 bg-red-500 rounded-full inline-block" />
                          {match.status}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{match.matchType || match.type}, {match.venue}</span>
                      <span className="text-xs text-gray-400">{new Date(match.matchDate).toLocaleString()}</span>
                    </div>
                    {/* Team 2 */}
                    <div className="flex items-center gap-2 min-w-[120px] justify-end">
                      <div className="flex flex-col text-right">
                        <span className="font-semibold text-base text-gray-900 dark:text-gray-100">{match.team2}</span>
                        <span className="text-xs text-gray-500">Yet to bat</span>
                      </div>
                      <img src={getTeamLogo(match.team2)} alt={match.team2} className="w-10 h-10 rounded-full object-cover" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
        {/* Filter Sidebar */}
        <div className="w-full md:w-[340px] flex-shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
            <div className="font-semibold text-lg mb-6">Filter Fixtures</div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Team</label>
                <select className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
                  <option value="">All Teams</option>
                  {teamOptions.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <select className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={formatFilter} onChange={e => setFormatFilter(e.target.value)}>
                  <option value="">All Formats</option>
                  {formatOptions.map(format => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Series Type</label>
                <select className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={seriesFilter} onChange={e => setSeriesFilter(e.target.value)}>
                  <option value="">All Series</option>
                  {seriesOptions.map(series => (
                    <option key={series} value={series}>{series}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fixtures;