import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Trophy, TrendingUp, Users, Award } from 'lucide-react';
import crick from "../assets/logos/Cricket Reward.mp4";
import axios from 'axios';
import { getApiUrl } from '@/config/api';

type TeamPoints = {
  _id: string;
  team: string;
  matches: number;
  wins: number;
  losses: number;
  draws?: number;
  points: number;
  season: string;
  nrr?: number;
};

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [circleSize, setCircleSize] = useState("w-[300px] h-[300px]");
  const [topTeams, setTopTeams] = useState<TeamPoints[]>([]);

  useEffect(() => {
    const updateCircleSize = () => {
      if (window.innerWidth >= 1024) setCircleSize("w-[500px] h-[500px]");
      else if (window.innerWidth >= 768) setCircleSize("w-[400px] h-[400px]");
      else setCircleSize("w-[300px] h-[300px]");
    };
    updateCircleSize();
    window.addEventListener("resize", updateCircleSize);
    return () => window.removeEventListener("resize", updateCircleSize);
  }, []);

  // Fetch top teams from points table
  useEffect(() => {
    const fetchTopTeams = async () => {
      try {
        const response = await axios.get(getApiUrl('points-table'));
        console.log('Fetched teams:', response.data); // Debug log
        setTopTeams(response.data.slice(0, 3)); // Get top 3 teams
      } catch (error) {
        console.error('Error fetching points table:', error);
      }
    };
    fetchTopTeams();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="mt-4 md:mt-8 lg:mt-12 w-full"
        style={{
          '--move-x': '0px',
          '--move-y': '0px'
        } as React.CSSProperties}
      >
        {/* Background blurred orbs */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 
                          bg-blue-500/20 rounded-full filter blur-3xl opacity-60 animate-float" />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 
                          bg-green-500/20 rounded-full filter blur-3xl opacity-60 animate-float" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 
                          bg-yellow-500/20 rounded-full filter blur-3xl opacity-60 animate-float" />
        </div>

        {/* Text Section */}
        <div className="relative z-10 px-4 md:px-6 lg:px-8 xl:px-12 text-center lg:text-left">
          <div className="max-w-3xl">
            {/* Logo + Title */}
            <div className="inline-block animate-fade-in">
              <span className="flex items-center gap-2 text-foreground">
                <Trophy className="h-10 w-10 text-yellow-500" />
                <span className="text-blue-600 dark:text-blue-400 font-bold text-xl md:text-2xl">
                  Cricket Championship
                </span>
              </span>
            </div>

            {/* Heading */}
            <h1
              className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight 
                         text-gray-900 dark:text-gray-100 animate-slide-up"
              style={{ animationDelay: '100ms' }}
            >
              Your Gateway to <span className="text-blue-600 dark:text-blue-400">Live Cricket</span>{" "}
              <span className="text-green-600 dark:text-green-400">Action</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 animate-slide-up"
               style={{ animationDelay: '200ms' }}>
              Follow live scores, track player statistics, and stay updated with the latest cricket news
            </p>

            {/* Buttons */}
            <div
              className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 animate-slide-up"
              style={{ animationDelay: '300ms' }}
            >
              <Link
                to="/players"
                className="inline-flex items-center justify-center rounded-md 
                           bg-primary px-5 py-2 text-sm font-medium text-primary-foreground 
                           shadow transition-colors hover:bg-primary/90"
              >
                Explore Players
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                to="/teams"
                className="inline-flex items-center justify-center rounded-md 
                           bg-secondary px-5 py-2 text-sm font-medium text-secondary-foreground 
                           shadow-sm transition-colors hover:bg-secondary/80"
              >
                View Teams
              </Link>

              <Link
                to="/live-scores"
                className="inline-flex items-center justify-center rounded-md 
                           border border-input bg-background px-5 py-2 text-sm font-medium 
                           shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Live Scores
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-card border rounded-lg p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-foreground">100+</p>
                <p className="text-sm text-muted-foreground">Players</p>
              </div>
              <div className="bg-card border rounded-lg p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold text-foreground">5</p>
                <p className="text-sm text-muted-foreground">Teams</p>
              </div>
              <div className="hidden md:block bg-card border rounded-lg p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-foreground">Live</p>
                <p className="text-sm text-muted-foreground">Updates</p>
              </div>
            </div>

            {/* Top Teams */}
            {topTeams.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-6 w-6 text-yellow-600" />
                    <h2 className="text-2xl font-bold text-foreground">Top Teams</h2>
                  </div>
                  <Link
                    to="/points-table"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    More
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {topTeams.map((team, index) => (
                    <div
                      key={team._id}
                      className="bg-card border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          'bg-amber-700 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-base">
                            {team.team || 'Team Name'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            P: {team.matches} | W: {team.wins} | L: {team.losses}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{team.points}</p>
                        <p className="text-xs text-muted-foreground">Points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-8 lg:py-10 lg:w-1/2 flex items-center justify-center">
        <div className={`relative ${circleSize} flex items-center justify-center`}>
          <div className="video-wrapper">
            <video
              src={crick}
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>

        <style>
          {`
            .video-wrapper {
              width: 100%;
              height: 100%;
              border-radius: 50%;
              overflow: hidden;
              background: transparent;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .video-wrapper video {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            /* Force white parts to blend in dark mode */
            .dark .video-wrapper {
              background: radial-gradient(circle, rgba(0,0,0,0.9) 80%, transparent 100%);
            }
          `}
        </style>
      </section>
    </div>
  );
}
