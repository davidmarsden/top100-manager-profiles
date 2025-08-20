// src/App.jsx - Complete Manager Profiles Application
import React, { useState, useEffect } from 'react';

// Since we can't import lucide-react in basic setup, we'll use emoji icons
const SearchIcon = () => '🔍';
const FilterIcon = () => '📋';
const TrophyIcon = () => '🏆';
const StarIcon = () => '⭐';
const ArrowRightIcon = () => '→';
const ArrowLeftIcon = () => '←';
const UsersIcon = () => '👥';
const CalendarIcon = () => '📅';

function App() {
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample data - this will be replaced by API calls to Netlify Functions
  const sampleManagers = [
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
      story: 'In the annals of Top 100 history, no name commands more respect than Scott McKenzie. With an unprecedented eight Division 1 titles, the Barcelona legend has established a record that may never be equalled. From his early triumphs in Seasons 2 and 3 to the remarkable four-peat of Seasons 9-12, McKenzie\'s tactical brilliance and unwavering consistency have defined an era.',
      achievements: [
        {
          type: 'title',
          competition: 'Division 1',
          count: 8,
          seasons: ['S2', 'S3', 'S6', 'S7', 'S9', 'S10', 'S11', 'S12'],
          description: 'Unprecedented Division 1 dominance'
        },
        {
          type: 'title',
          competition: 'World Club Cup',
          count: 1,
          seasons: ['S10'],
          description: 'WCC Champion'
        },
        {
          type: 'milestone',
          name: 'Four-peat Champion',
          description: 'S9-S12 consecutive Division 1 titles - a feat unmatched in Top 100 history'
        }
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
      story: 'Glen Mullan represents the heart of what makes Top 100 special. As Espanyol\'s longest serving manager with 300+ games, he has transformed the club from life support to Division 1 regulars. Known as Top 100\'s standard bearer for activity, Glen consistently defies relegation predictions through tactical discipline and never-say-die attitude.',
      achievements: [
        {
          type: 'milestone',
          name: '300 Games Milestone',
          description: 'Longest serving Espanyol manager in Top 100 history'
        },
        {
          type: 'achievement',
          name: 'Against All Odds S24',
          description: 'Kept team in Division 1 when predicted to go down'
        },
        {
          type: 'achievement',
          name: 'Miracle Promotion S23',
          description: 'Promoted to Division 1 despite being favourites for relegation from D2 to D3'
        }
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
      story: 'David Marsden holds a unique position in Top 100 history as both active manager and primary rule enforcer. For 25 seasons, he has served as the administrative backbone, handling everything from transfer disputes to Youth Cup eligibility while maintaining his own managerial career. His balanced approach and commitment to fair play has enabled Top 100\'s growth into a thriving community.',
      achievements: [
        {
          type: 'admin',
          name: 'S25 Youth Cup Crackdown',
          description: 'Led administrative action against five clubs for squad eligibility violations'
        },
        {
          type: 'admin',
          name: 'Transfer Rule Framework',
          description: 'Established standardized reporting procedures and private dispute resolution'
        },
        {
          type: 'milestone',
          name: '25 Seasons of Service',
          description: 'Administrative backbone since Top 100\'s inception'
        }
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
      story: 'André Libras-Boas represents the new face of Top 100 excellence. With four Division 1 titles in five seasons and currently leading the S25 championship race, he has built a modern dynasty at Hellas Verona. His complete success across multiple competitions demonstrates that excellence spans multiple eras, proving himself as both a tactical innovator and consistent performer.',
      achievements: [
        {
          type: 'title',
          competition: 'Division 1',
          count: 4,
          seasons: ['S20', 'S22', 'S23', 'S24'],
          description: 'Modern Division 1 dominance'
        },
        {
          type: 'title',
          competition: 'Various Cups',
          count: 5,
          seasons: ['Multiple'],
          description: 'Multi-competition success'
        },
        {
          type: 'milestone',
          name: 'Modern Dynasty',
          description: 'Leading S25 championship race, representing the current era of Top 100 excellence'
        }
      ]
    }
  ];

  // Load managers (using sample data for now)
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setManagers(sampleManagers);
      setLoading(false);
    }, 500);
  }, []);

  // Filter managers based on search and filters
  const filteredManagers = managers.filter(manager => {
    const matchesSearch = manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manager.club.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDivision = filterDivision === 'all' || manager.division.toString() === filterDivision;
    const matchesType = filterType === 'all' || manager.type === filterType;
    
    return matchesSearch && matchesDivision && matchesType;
  });

  // Styling functions
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

  const getAchievementIcon = (type) => {
    switch(type) {
      case 'title': return '🏆';
      case 'milestone': return '⭐';
      case 'achievement': return '🎯';
      case 'admin': return '🛡️';
      default: return '🏅';
    }
  };

  // If viewing a specific manager profile
  if (selectedManager) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        {/* Header */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            <button
              onClick={() => setSelectedManager(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '1.1rem',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#eff6ff'}
              onMouseOut={(e) => e.target.style.background = 'none'}
            >
              {ArrowLeftIcon()} Back to Directory
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
          {/* Profile Header */}
          <div style={{ 
            background: 'white', 
            borderRadius: '1rem', 
            padding: '2rem', 
            marginBottom: '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: getAvatarColor(selectedManager.type).replace('bg-gradient-to-br ', ''),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                position: 'relative'
              }}>
                {selectedManager.avatar}
                {selectedManager.type === 'admin' && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#fbbf24',
                    color: '#1f2937',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    👑
                  </div>
                )}
                {selectedManager.games >= 300 && selectedManager.type !== 'admin' && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#fbbf24',
                    color: '#1f2937',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}>
                    300
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    {selectedManager.name}
                  </h1>
                  <span style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '2rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    border: '1px solid',
                    ...getManagerTypeColor(selectedManager.type).split(' ').reduce((acc, cls) => {
                      if (cls.startsWith('bg-')) acc.background = cls.replace('bg-', '').replace('-100', '');
                      if (cls.startsWith('text-')) acc.color = cls.replace('text-', '').replace('-800', '');
                      if (cls.startsWith('border-')) acc.borderColor = cls.replace('border-', '').replace('-300', '');
                      return acc;
                    }, {})
                  }}>
                    {selectedManager.type === 'legend' ? 'Legend' : 
                     selectedManager.type === 'dynasty' ? 'Modern Dynasty' :
                     selectedManager.type === 'pillar' ? 'Community Pillar' :
                     selectedManager.type === 'admin' ? 'Administrator' : selectedManager.type}
                  </span>
                </div>
                
                <p style={{ fontSize: '1.3rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  {selectedManager.club}
                </p>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                  {selectedManager.signature}
                </p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '1rem' 
                }}>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    background: '#f9fafb', 
                    borderRadius: '0.5rem' 
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {selectedManager.titles}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total Titles</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    background: '#f9fafb', 
                    borderRadius: '0.5rem' 
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {selectedManager.points}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Career Points</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    background: '#f9fafb', 
                    borderRadius: '0.5rem' 
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {selectedManager.games}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Games Played</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    background: '#f9fafb', 
                    borderRadius: '0.5rem' 
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {selectedManager.avgPoints}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Avg Points</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story & Achievements */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth > 1024 ? '1fr 1fr' : '1fr',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {/* Story */}
            <div style={{ 
              background: 'white', 
              borderRadius: '1rem', 
              padding: '2rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                The Story
              </h2>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                {selectedManager.story}
              </p>
              
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>
                Specialties
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedManager.specialties.map((specialty, index) => (
                  <span key={index} style={{
                    padding: '0.25rem 0.75rem',
                    background: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '1rem',
                    fontSize: '0.9rem'
                  }}>
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div style={{ 
              background: 'white', 
              borderRadius: '1rem', 
              padding: '2rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Major Achievements
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedManager.achievements.map((achievement, index) => (
                  <div key={index} style={{
                    borderLeft: '4px solid #3b82f6',
                    paddingLeft: '1rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {getAchievementIcon(achievement.type)}
                      </span>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>
                        {achievement.competition || achievement.name}
                        {achievement.count && ` (${achievement.count}x)`}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      {achievement.description}
                    </p>
                    {achievement.seasons && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                        {achievement.seasons.map((season, idx) => (
                          <span key={idx} style={{
                            padding: '0.125rem 0.5rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            borderRadius: '0.25rem',
                            fontSize: '0.8rem'
                          }}>
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
          <div style={{ 
            background: 'white', 
            borderRadius: '1rem', 
            padding: '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
              Career Timeline
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>S{selectedManager.joinedSeason}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Joined Top 100</div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ margin: '0 1rem', fontSize: '1.5rem' }}>{ArrowRightIcon()}</span>
                <div style={{ 
                  flex: 1, 
                  borderTop: '2px dashed white', 
                  margin: '0 1rem' 
                }}></div>
                <span style={{ margin: '0 1rem', fontSize: '1.5rem' }}>📈</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>S{selectedManager.currentSeason}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Current Season</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem', color: '#6b7280' }}>
              <span style={{ fontWeight: '600' }}>
                {selectedManager.currentSeason - selectedManager.joinedSeason + 1}
              </span> seasons of dedication to Top 100
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main directory view
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '2rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Top 100 Manager Profiles
          </h1>
          <p style={{ fontSize: '1.3rem', color: '#6b7280' }}>
            Celebrating 25 seasons of excellence
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '1rem', 
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth > 768 ? '2fr 1fr 1fr' : '1fr',
            gap: '1rem' 
          }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.2rem'
              }}>
                {SearchIcon()}
              </span>
              <input
                type="text"
                placeholder="Search managers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Division Filter */}
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.2rem'
              }}>
                {FilterIcon()}
              </span>
              <select
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'white'
                }}
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
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.2rem'
              }}>
                {UsersIcon()}
              </span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'white'
                }}
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
              Loading Manager Profiles...
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)' }}>
              Fetching data from Top 100 archives
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(3, 1fr)' : 
                                window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
            gap: '1.5rem' 
          }}>
            {filteredManagers.map((manager) => (
              <div
                key={manager.id}
                onClick={() => setSelectedManager(manager)}
                style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: getAvatarColor(manager.type).replace('bg-gradient-to-br ', ''),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    position: 'relative'
                  }}>
                    {manager.avatar}
                    {manager.type === 'admin' && (
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#fbbf24',
                        color: '#1f2937',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem'
                      }}>
                        👑
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
                      {manager.name}
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>{manager.club}</p>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '1rem',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      border: '1px solid',
                      ...getManagerTypeColor(manager.type).split(' ').reduce((acc, cls) => {
                        if (cls.startsWith('bg-')) acc.background = cls.replace('bg-', '').replace('-100', '');
                        if (cls.startsWith('text-')) acc.color = cls.replace('text-', '').replace('-800', '');
                        if (cls.startsWith('border-')) acc.borderColor = cls.replace('border-', '').replace('-300', '');
                        return acc;
                      }, {})
                    }}>
                      {manager.type === 'legend' ? 'Legend' : 
                       manager.type === 'dynasty' ? 'Dynasty' :
                       manager.type === 'pillar' ? 'Pillar' :
                       manager.type === 'admin' ? 'Admin' : manager.type}
                    </span>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '1rem', 
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {manager.titles}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Titles</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {manager.games}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Games</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {manager.avgPoints}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Avg</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {manager.specialties.slice(0, 2).map((specialty, index) => (
                      <span key={index} style={{
                        padding: '0.125rem 0.5rem',
                        background: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        {specialty}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: '1.2rem', color: '#9ca3af' }}>
                    {ArrowRightIcon()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredManagers.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
              No managers found
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)' }}>
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        background: '#1f2937', 
        color: 'white', 
        padding: '3rem 0', 
        marginTop: '4rem' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            🏆 Celebrating 25 Seasons of Top 100 🏆
          </h3>
          <p style={{ color: '#d1d5db', marginBottom: '1.5rem' }}>
            From Manchester United's inaugural triumph to Hellas Verona's modern dynasty
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '2rem', 
            textAlign: 'center',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>100</div>
              <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Active Managers</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>25</div>
              <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Seasons Completed</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>125</div>
              <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Trophies Awarded</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;