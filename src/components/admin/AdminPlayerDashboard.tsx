import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Users, 
  Trophy, 
  Target,
  TrendingUp,
  Filter,
  Search,
  Download,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import { Zap, Shield, Award } from 'lucide-react';

interface Player {
  _id?: string;
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
  age?: string;
  position?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  description?: string;
  photoUrl?: string;
  average?: number;
  strike_rate?: number;
}

interface PlayerStats {
  totalPlayers: number;
  totalRuns: number;
  totalMatches: number;
  highestScore: number;
  topScorer: string;
}

export default function AdminPlayerDashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats>({
    totalPlayers: 0,
    totalRuns: 0,
    totalMatches: 0,
    highestScore: 0,
    topScorer: ''
  });
  const { toast } = useToast();

  const [playerForm, setPlayerForm] = useState<Player>({
    name: '',
    team: '',
    matches: 0,
    innings: 0,
    runs: 0,
    highest_score: 0,
    hundreds: 0,
    fifties: 0,
    fours: 0,
    sixes: 0,
    balls_faced: 0,
    outs: 0,
    age: '',
    position: '',
    battingStyle: '',
    bowlingStyle: '',
    description: '',
    photoUrl: ''
  });

  const teams = [
    'THUNDER STRIKERS',
    'ROYAL LIONS',
    'EAGLES UNITED',
    'WARRIORS XI',
    'TITANS CHAMPION'
  ];
  const positions = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
  const battingStyles = ['Right-handed', 'Left-handed'];
  const bowlingStyles = [
    'Right-arm fast', 
    'Left-arm fast', 
    'Right-arm medium', 
    'Left-arm medium', 
    'Right-arm spin', 
    'Left-arm spin'
  ];

  const fetchPlayers = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/players`);
      setPlayers(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to fetch players",
        variant: "destructive",
      });
    }
  }, [toast]);

  const calculateStats = (playerData: Player[]) => {
    const totalPlayers = playerData.length;
    const totalRuns = playerData.reduce((sum, player) => sum + player.runs, 0);
    const totalMatches = playerData.reduce((sum, player) => sum + player.matches, 0);
    const highestScore = Math.max(...playerData.map(player => player.highest_score));
    const topScorer = playerData.find(player => player.highest_score === highestScore)?.name || 'N/A';

    setStats({
      totalPlayers,
      totalRuns,
      totalMatches,
      highestScore,
      topScorer
    });
  };

  const filterPlayers = useCallback(() => {
    let filtered = players;

    if (searchTerm) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (teamFilter !== 'ALL') {
      filtered = filtered.filter(player => player.team === teamFilter);
    }

    setFilteredPlayers(filtered);
  }, [players, searchTerm, teamFilter]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    filterPlayers();
  }, [filterPlayers]);

  const getTeamIcon = (team: string) => {
    const teamIcons: Record<string, any> = {
      'THUNDER STRIKERS': Zap,
      'ROYAL LIONS': Award,
      'EAGLES UNITED': TrendingUp,
      'WARRIORS XI': Shield,
      'TITANS CHAMPION': Trophy
    };
    return teamIcons[team] || Trophy;
  };

  const getTeamColor = (team: string) => {
    const teamColors: Record<string, string> = {
      'THUNDER STRIKERS': '#FF4444',
      'ROYAL LIONS': '#4444FF',
      'EAGLES UNITED': '#44FF44',
      'WARRIORS XI': '#f18f20ff',
      'TITANS CHAMPION': '#FF44FF'
    };
    return teamColors[team] || '#666';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!playerForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Player name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!playerForm.team) {
      toast({
        title: "Validation Error", 
        description: "Please select a team",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all player data to FormData
      Object.keys(playerForm).forEach(key => {
        const value = playerForm[key as keyof Player];
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Add file if selected
      if (selectedFile) {
        formData.append('photo', selectedFile);
      }

      if (selectedPlayer) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/players/${selectedPlayer._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast({
          title: "Success",
          description: "Player updated successfully",
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/players`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast({
          title: "Success",
          description: "Player created successfully",
        });
      }
      
      fetchPlayers();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error saving player:', error);
      
      let errorMessage = "Failed to save player";
      
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        // Handle specific backend validation errors
        if (error.response.data.message.includes('duplicate key error')) {
          errorMessage = "PIN number already exists. Please use a different PIN.";
        } else if (error.response.data.message.includes('validation failed')) {
          // Extract field-specific errors
          const details = error.response.data.details;
          if (details) {
            const fieldErrors = Object.keys(details).map(field => {
              return `${field}: ${details[field].message}`;
            });
            errorMessage = fieldErrors.join(', ');
          } else {
            errorMessage = error.response.data.message;
          }
        } else {
          errorMessage = error.response.data.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerForm(player);
    
    // Set preview URL for existing image
    if (player.photoUrl) {
      setPreviewUrl(player.photoUrl.startsWith('http') ? player.photoUrl : `http://localhost:5001${player.photoUrl}`);
    } else {
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/players/${playerId}`);
      toast({
        title: "Success",
        description: "Player deleted successfully",
      });
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: "Error",
        description: "Failed to delete player",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid image file (JPEG, PNG, or GIF)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPlayerForm(prev => ({ ...prev, photoUrl: '' }));
  };

  const resetForm = () => {
    setPlayerForm({
      name: '',
      team: '',
      matches: 0,
      innings: 0,
      runs: 0,
      highest_score: 0,
      hundreds: 0,
      fifties: 0,
      fours: 0,
      sixes: 0,
      balls_faced: 0,
      outs: 0,
      age: '',
      position: '',
      battingStyle: '',
      bowlingStyle: '',
      description: '',      photoUrl: ''
    });
    setSelectedPlayer(null);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleInputChange = (field: keyof Player, value: string | number) => {
    setPlayerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Player Management</h1>
          <p className="text-muted-foreground">Manage cricket players and their statistics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Players</p>
                <h3 className="text-2xl font-bold">{stats.totalPlayers}</h3>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Total Runs</p>
                <h3 className="text-2xl font-bold">{stats.totalRuns.toLocaleString()}</h3>
              </div>
              <Target className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Highest Score</p>
                <h3 className="text-2xl font-bold">{stats.highestScore}</h3>
              </div>
              <Trophy className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Top Scorer</p>
                <h3 className="text-xl font-bold truncate">{stats.topScorer}</h3>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search players by name, team, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
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
                  <TableHead className="w-[120px]">Actions</TableHead>
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
                          <p className="font-medium">{player.name}</p>
                          <p className="text-sm text-muted-foreground">{player.position}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const TeamIcon = getTeamIcon(player.team);
                          return (
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: getTeamColor(player.team) }}
                            >
                              <TeamIcon className="w-4 h-4 text-white" />
                            </div>
                          );
                        })()}
                        <Badge 
                          variant="secondary" 
                          style={{ backgroundColor: getTeamColor(player.team) + '20', color: getTeamColor(player.team) }}
                        >
                          {player.team}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">{player.runs}</TableCell>
                    <TableCell className="text-right">{player.outs > 0 ? (player.runs / player.outs).toFixed(2) : player.runs}</TableCell>
                    <TableCell className="text-right">{player.balls_faced > 0 ? ((player.runs / player.balls_faced) * 100).toFixed(2) : 0}</TableCell>
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
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(player)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(player._id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Player Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedPlayer ? 'Edit Player' : 'Add New Player'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={playerForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="team">Team *</Label>  
                    <Select value={playerForm.team} onValueChange={(value) => handleInputChange('team', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team} value={team}>{team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Select value={playerForm.position} onValueChange={(value) => handleInputChange('position', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      value={playerForm.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="battingStyle">Batting Style</Label>
                    <Select value={playerForm.battingStyle} onValueChange={(value) => handleInputChange('battingStyle', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batting style" />
                      </SelectTrigger>
                      <SelectContent>
                        {battingStyles.map(style => (
                          <SelectItem key={style} value={style}>{style}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="photo">Player Photo (Optional)</Label>
                    <div className="space-y-4">
                      {/* Image Preview */}
                      {previewUrl && (
                        <div className="relative w-32 h-32 mx-auto">
                          <img 
                            src={previewUrl} 
                            alt="Player preview" 
                            className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                            onClick={removeImage}
                          >
                            ×
                          </Button>
                        </div>
                      )}
                      
                      {/* File Upload */}
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <div className="space-y-2">
                          <Label htmlFor="photoUpload" className="cursor-pointer">
                            <span className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                              Click to upload
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400"> or drag and drop</span>
                          </Label>
                          <Input
                            id="photoUpload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="matches">Matches</Label>
                    <Input
                      id="matches"
                      type="number"
                      value={playerForm.matches}
                      onChange={(e) => handleInputChange('matches', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="innings">Innings</Label>
                    <Input
                      id="innings"
                      type="number"
                      value={playerForm.innings}
                      onChange={(e) => handleInputChange('innings', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="runs">Runs</Label>
                    <Input
                      id="runs"
                      type="number"
                      value={playerForm.runs}
                      onChange={(e) => handleInputChange('runs', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="highest_score">Highest Score</Label>
                    <Input
                      id="highest_score"
                      type="number"
                      value={playerForm.highest_score}
                      onChange={(e) => handleInputChange('highest_score', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hundreds">Hundreds</Label>
                    <Input
                      id="hundreds"
                      type="number"
                      value={playerForm.hundreds}
                      onChange={(e) => handleInputChange('hundreds', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fifties">Fifties</Label>
                    <Input
                      id="fifties"
                      type="number"
                      value={playerForm.fifties}
                      onChange={(e) => handleInputChange('fifties', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fours">Fours</Label>
                    <Input
                      id="fours"
                      type="number"
                      value={playerForm.fours}
                      onChange={(e) => handleInputChange('fours', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sixes">Sixes</Label>
                    <Input
                      id="sixes"
                      type="number"
                      value={playerForm.sixes}
                      onChange={(e) => handleInputChange('sixes', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="balls_faced">Balls Faced</Label>
                    <Input
                      id="balls_faced"
                      type="number"
                      value={playerForm.balls_faced}
                      onChange={(e) => handleInputChange('balls_faced', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="outs">Outs</Label>
                    <Input
                      id="outs"
                      type="number"
                      value={playerForm.outs}
                      onChange={(e) => handleInputChange('outs', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Player'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
