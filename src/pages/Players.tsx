import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Search, Filter } from "lucide-react";
import axios from "axios";
import { useState, useEffect } from "react";
import agni from "@/assets/agni.jpg";
import prudhvi from "@/assets/prudhvi.jpg";
import vayu from "@/assets/vayu.jpg";
import jal from "@/assets/jal.jpg";
import aakash from "@/assets/aakash.png";

interface Player {
  _id: string;
  name: string;
  team: string;
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
  average: number;
  strike_rate: number;
  pinno: string;
  photoUrl?: string;
}

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [pinFilter, setPinFilter] = useState('');
  
  useEffect(() => {
    axios.get("http://localhost:5001/api/players")
      .then(res => {
        setPlayers(res.data);
        setFilteredPlayers(res.data);
      })
      .catch(() => {
        setPlayers([]);
        setFilteredPlayers([]);
      });
  }, []);

  // Filter players based on search, team, and pin filters
  useEffect(() => {
    let filtered = players;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.pinno.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply team filter
    if (teamFilter !== 'ALL') {
      filtered = filtered.filter(player => player.team === teamFilter);
    }

    // Apply PIN filter
    if (pinFilter) {
      filtered = filtered.filter(player =>
        player.pinno.toLowerCase().includes(pinFilter.toLowerCase())
      );
    }

    setFilteredPlayers(filtered);
  }, [players, searchTerm, teamFilter, pinFilter]);

  const getTeamLogo = (teamName: string) => {
    if (!teamName) return "";
    // Extract house name from team name (e.g., "AGNI-A" -> "agni")
    const houseName = teamName.split('-')[0].toLowerCase();
    switch (houseName) {
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

  const getTeamColor = (team: string) => {
    if (!team) return '#666';
    const teamColors: { [key: string]: string } = {
      'THUNDER STRIKERS': '#FF4444',
      'ROYAL LIONS': '#4444FF',
      'EAGLES UNITED': '#44FF44',
      'WARRIORS XI': '#f18f20ff',
      'TITANS CHAMPION': '#FF44FF'
    };
    return teamColors[team.toUpperCase()] || '#666';
  };

  // Get unique teams for filter dropdown
  const getUniqueTeams = () => {
    const existingTeams = Array.from(new Set(players.map(player => player.team).filter(Boolean)));
    
    // Define all teams
    const allTeams = ['THUNDER STRIKERS', 'ROYAL LIONS', 'EAGLES UNITED', 'WARRIORS XI', 'TITANS CHAMPION'];
    
    // Combine existing teams with all teams and remove duplicates
    const combinedTeams = Array.from(new Set([...existingTeams, ...allTeams]));
    
    // Sort teams alphabetically
    return combinedTeams.sort((a, b) => a.localeCompare(b));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Players Statistics</h1>
          <p className="text-muted-foreground">Performance statistics of our cricket champions</p>
        </div>
        <Badge className="text-lg px-4 py-2 bg-blue-600 text-white">
          <User className="mr-2 h-5 w-5" />
          {filteredPlayers.length} Players
        </Badge>
      </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search players by name, team, or PIN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Team Filter */}
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Teams</SelectItem>
                      {getUniqueTeams().map(team => (
                        <SelectItem key={team} value={team}>
                          <div className="flex items-center gap-2">
                            {getTeamLogo(team) && (
                              <img 
                                src={getTeamLogo(team)} 
                                alt={team} 
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            )}
                            <span className="font-medium">{team}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* PIN Filter */}
                  <Input
                    placeholder="Filter by PIN"
                    value={pinFilter}
                    onChange={(e) => setPinFilter(e.target.value)}
                    className="w-full sm:w-[140px]"
                  />
                  
                  {/* Clear Filters Button */}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setTeamFilter('ALL');
                      setPinFilter('');
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
              
              {/* Filter Summary */}
              {(searchTerm || teamFilter !== 'ALL' || pinFilter) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Filters applied:</span>
                    {searchTerm && (
                      <Badge variant="secondary" className="text-xs">
                        Search: "{searchTerm}"
                      </Badge>
                    )}
                    {teamFilter !== 'ALL' && (
                      <Badge variant="secondary" className="text-xs">
                        Team: {teamFilter}
                      </Badge>
                    )}
                    {pinFilter && (
                      <Badge variant="secondary" className="text-xs">
                        PIN: "{pinFilter}"
                      </Badge>
                    )}
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      Showing {filteredPlayers.length} of {players.length} players
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Players ({filteredPlayers.length})</CardTitle>
                <Badge variant="secondary">{filteredPlayers.length} of {players.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No players found</h3>
                    <p className="text-sm">Try adjusting your search criteria or clear the filters</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">#</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-right">Runs</TableHead>
                        <TableHead className="text-right">Avg</TableHead>
                        <TableHead className="text-right">SR</TableHead>
                        <TableHead className="text-right">HS</TableHead>
                        <TableHead className="text-right">100s</TableHead>
                        <TableHead className="text-right">50s</TableHead>
                        <TableHead className="text-right">Matches</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map((player, index) => (
                        <TableRow key={player._id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage 
                                  src={player.photoUrl ? (player.photoUrl.startsWith('http') ? player.photoUrl : `http://localhost:5001${player.photoUrl}`) : undefined} 
                                  alt={player.name} 
                                />
                                <AvatarFallback style={{ backgroundColor: getTeamColor(player.team) + '20' }}>
                                  {player.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{player.name}</div>
                                <div className="text-sm text-muted-foreground">{player.pinno}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTeamLogo(player.team) && (
                                <img 
                                  src={getTeamLogo(player.team)} 
                                  alt={player.team} 
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              )}
                              <Badge 
                                variant="secondary" 
                                style={{ backgroundColor: getTeamColor(player.team) + '20', color: getTeamColor(player.team) }}
                              >
                                {player.team}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-blue-600">{player.runs}</TableCell>
                          <TableCell className="text-right">{player.average}</TableCell>
                          <TableCell className="text-right">{player.strike_rate}</TableCell>
                          <TableCell className="text-right">{player.highest_score}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={player.hundreds > 0 ? "default" : "secondary"}>
                              {player.hundreds}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={player.fifties > 0 ? "default" : "secondary"}>
                              {player.fifties}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{player.matches}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
    </div>
  );
};

export default Players;