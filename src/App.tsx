import React, { useState, useEffect } from 'react';
import { Search, Trophy, Users, Calendar, Star, Filter, ArrowRight, Award, Target, TrendingUp } from 'lucide-react';

const ManagerProfilesApp = () => {
  const [selectedManager, setSelectedManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Sample manager data - this would come from your 25-season dataset
  const managers = [
    {
      id: 'scott-mckenzie',
      name: 'Scott McKenzie',
      club: 'São Paulo FC',
      division: 1,
      type: 'legend',
      avatar: 'SM',
      titles: 9,
      points: 2667,
      games: 1094,
      avgPoints: 2.44,
      joinedSeason: 2,
      currentSeason: 25,
      specialties: ['Division 1 Champion', 'The GOAT', 'Four-peat Legend'],
      signature: 'Unprecedented eight Division 1 titles and remarkable four-peat (S9-S12)',
      story: 'In the annals of Top 100 history, no name commands more respect than Scott McKenzie. His tactical brilliance and unwavering consistency have defined an era.',
      achievements: [
        { type: 'title', competition: 'Division 1', count: 8, seasons: ['S2', 'S3', 'S6', 'S7', 'S9', 'S10', 'S11', 'S12'] },
        { type: 'title', competition: 'World Club Cup', count: 1, seasons: ['S10'] },
        { type: 'milestone', name: 'Four-peat Champion', description: 'S9-S12 consecutive titles' }
      ]
    },
    {
      id: 'glen-mullan',
      name: 'Glen Mullan',
      club: 'RCD Espanyol',
      division: 1,
      type: 'pillar',
      avatar: 'GM',
      titles: 0,
      points: 1200,
      games: 300,
      avgPoints: 1.85,
      joinedSeason: 16,
      currentSeason: 25,
      specialties: ['Standard Bearer', '300+ Games', 'Survival Specialist'],
      signature: 'The community pillar who embodies everything Top 100 stands for',
      story: 'Top 100\'s standard bearer for activity with 300+ games as Espanyol manager. Known for defying relegation predictions and maintaining incredible community engagement.',
      achievements: [
        { type: 'milestone', name: '300 Games Milestone', description: 'Longest serving Espanyol manager' },
        { type: 'achievement', name: 'Against All Odds', description: 'Kept team in D1 when predicted to go down (S24)' },
        { type: 'achievement', name: 'Miracle Promotion', description: 'Promoted to D1 despite relegation predictions (S23)' }
      ]
    },
    {
      id: 'david-marsden',
      name: 'David Marsden',
      club: 'Administrator',
      division: 'Admin',
      type: 'admin',
      avatar: 'DM',
      titles: '∞',
      points: '∞',
      games: '∞',
      avgPoints: 'N/A',
      joinedSeason: 1,
      currentSeason: 25,
      specialties: ['Rule Enforcement', 'Youth Cup Authority', 'Transfer Admin'],
      signature: 'The administrator-manager ensuring fair play across Top 100',
      story: 'David Marsden serves as the primary rule enforcer while maintaining his own managerial career. A unique dual role that sets the standard for both fair play and competitive excellence.',
      achievements: [
        { type: 'admin', name: 'S25 Youth Cup Crackdown', description: 'Led action against five clubs for eligibility violations' },
        { type: 'admin', name: 'Transfer Rule Framework', description: 'Established standardized reporting procedures' },
        { type: 'milestone', name: '25 Seasons of Service', description: 'Administrative backbone since Season 1' }
      ]
    },
    {
      id: 'andre-libras-boas',
      name: 'André Libras-Boas',
      club: 'Hellas Verona',
      division: 1,
      type: 'dynasty',
      avatar: 'AL',
      titles: 9,
      points: 2274,
      games: 1063,
      avgPoints: 2.14,
      joinedSeason: 4,
      currentSeason: 25,
      specialties: ['Modern Dynasty', 'Multi-Competition Master', 'Current Champion'],
      signature: 'Building the modern Hellas Verona dynasty with 4 titles in 5 seasons',
      story: 'André Libras-Boas represents the new face of Top 100 excellence, proving that success spans multiple eras with his complete domination across competitions.',
      achievements: [
        { type: 'title', competition: 'Division 1', count: 4, seasons: ['S20', 'S22', 'S23', 'S24'] },
        { type: 'title', competition: 'Various Cups', count: 5, seasons: ['Multiple'] },
        { type: 'milestone', name: 'Modern Dynasty', description: 'Leading S25 championship race' }
      ]
    }
  ];

  const filteredManagers = managers.filter(manager => {
    const matchesSearch = manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manager.club.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDivision = filterDivision === 'all' || manager.division.toString() === filterDivision;
    const matchesType = filterType === 'all' || manager.type === filterType;
    
    return matchesSearch && matchesDivision && matchesType;
  });

  const getManagerTypeColor = (type) => {
    switch(type) {
      case 'legend': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'dynasty': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'pillar': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'admin': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAvatarColor = (type) => {
    switch(type) {
      case 'legend': return 'bg-gradient-to-br from-yellow-400 to-orange-500';
      case 'dynasty': return 'bg-gradient-to-br from-purple-500 to-pink-500';
      case 'pillar': return 'bg-gradient-to-br from-blue-500 to-cyan-500';
      case 'admin': return 'bg-gradient-to-br from-red-500 to-pink-500';
      default: return 'bg-gradient-to-br from-gray-400 to-gray-600';
    }
  };

  if (selectedManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedManager(null)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Directory
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">Manager Profile</h1>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-start gap-8">
              <div className={`w-32 h-32 rounded-full ${getAvatarColor(selectedManager.type)} flex items-center justify-center text-white text-4xl font-bold relative`}>
                {selectedManager.avatar}
                {selectedManager.type === 'admin' && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center text-lg">
                    👑
                  </div>
                )}
                {selectedManager.games >= 300 && selectedManager.type !== 'admin' && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    300
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-4xl font-bold text-gray-900">{selectedManager.name}</h1>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getManagerTypeColor(selectedManager.type)}`}>
                    {selectedManager.type === 'legend' ? 'Legend' : 
                     selectedManager.type === 'dynasty' ? 'Modern Dynasty' :
                     selectedManager.type === 'pillar' ? 'Community Pillar' :
                     selectedManager.type === 'admin' ? 'Administrator' : selectedManager.type}
                  </span>
                </div>
                
                <p className="text-xl text-gray-600 mb-2">{selectedManager.club}</p>
                <p className="text-gray-500 mb-6">{selectedManager.signature}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{selectedManager.titles}</div>
                    <div className="text-sm text-gray-600">Total Titles</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{selectedManager.points}</div>
                    <div className="text-sm text-gray-600">Career Points</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{selectedManager.games}</div>
                    <div className="text-sm text-gray-600">Games Played</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{selectedManager.avgPoints}</div>
                    <div className="text-sm text-gray-600">Avg Points</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story & Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Story */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">The Story</h2>
              <p className="text-gray-700 leading-relaxed">{selectedManager.story}</p>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedManager.specialties.map((specialty, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Major Achievements</h2>
              <div className="space-y-4">
                {selectedManager.achievements.map((achievement, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      {achievement.type === 'title' && <Trophy className="w-4 h-4 text-yellow-600" />}
                      {achievement.type === 'milestone' && <Star className="w-4 h-4 text-purple-600" />}
                      {achievement.type === 'achievement' && <Award className="w-4 h-4 text-green-600" />}
                      {achievement.type === 'admin' && <Target className="w-4 h-4 text-red-600" />}
                      <span className="font-semibold text-gray-900">
                        {achievement.competition || achievement.name}
                        {achievement.count && ` (${achievement.count}x)`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    {achievement.seasons && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {achievement.seasons.map((season, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {season}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Career Timeline */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Career Timeline</h2>
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold">S{selectedManager.joinedSeason}</div>
                <div className="text-sm opacity-90">Joined Top 100</div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <ArrowRight className="w-8 h-8 mx-4" />
                <div className="flex-1 border-t-2 border-white border-dashed"></div>
                <TrendingUp className="w-8 h-8 mx-4" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">S{selectedManager.currentSeason}</div>
                <div className="text-sm opacity-90">Current Season</div>
              </div>
            </div>
            <div className="text-center mt-4 text-gray-600">
              <span className="font-semibold">{selectedManager.currentSeason - selectedManager.joinedSeason + 1}</span> seasons of dedication to Top 100
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Top 100 Manager Profiles</h1>
            <p className="text-xl text-gray-600">Celebrating 25 seasons of excellence</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search managers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Division Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Divisions</option>
                <option value="1">Division 1</option>
                <option value="2">Division 2</option>
                <option value="3">Division 3</option>
                <option value="4">Division 4</option>
                <option value="5">Division 5</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="legend">Legends</option>
                <option value="dynasty">Modern Dynasty</option>
                <option value="pillar">Community Pillars</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>
        </div>

        {/* Manager Directory */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredManagers.map((manager) => (
            <div
              key={manager.id}
              onClick={() => setSelectedManager(manager)}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-full ${getAvatarColor(manager.type)} flex items-center justify-center text-white text-xl font-bold relative`}>
                  {manager.avatar}
                  {manager.type === 'admin' && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      👑
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{manager.name}</h3>
                  <p className="text-gray-600">{manager.club}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getManagerTypeColor(manager.type)}`}>
                    {manager.type === 'legend' ? 'Legend' : 
                     manager.type === 'dynasty' ? 'Dynasty' :
                     manager.type === 'pillar' ? 'Pillar' :
                     manager.type === 'admin' ? 'Admin' : manager.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">{manager.titles}</div>
                  <div className="text-xs text-gray-600">Titles</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{manager.games}</div>
                  <div className="text-xs text-gray-600">Games</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{manager.avgPoints}</div>
                  <div className="text-xs text-gray-600">Avg</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1">
                  {manager.specialties.slice(0, 2).map((specialty, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {specialty}
                    </span>
                  ))}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {filteredManagers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No managers found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">🏆 Celebrating 25 Seasons of Top 100 🏆</h3>
          <p className="text-gray-300 mb-6">From Manchester United's inaugural triumph to Hellas Verona's modern dynasty</p>
          <div className="flex justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">100</div>
              <div className="text-sm text-gray-400">Active Managers</div>
            </div>
            <div>
              <div className="text-3xl font-bold">25</div>
              <div className="text-sm text-gray-400">Seasons Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold">125</div>
              <div className="text-sm text-gray-400">Trophies Awarded</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerProfilesApp;
