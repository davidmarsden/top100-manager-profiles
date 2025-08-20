import React, { useState, useEffect } from 'react';

const App = () => {
  const [managers, setManagers] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('App component mounted, fetching managers...');
    fetchManagers();
  }, []);

  useEffect(() => {
    filterManagers();
  }, [managers, searchTerm, selectedDivision, selectedType]);

  const fetchManagers = async () => {
    try {
      console.log('Fetching managers from /api/managers...');
      const response = await fetch('/api/managers');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Managers data received:', data);
      setManagers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching managers:', error);
      setError(error.message);
      setLoading(false);
      
      // Fallback to sample data if API fails
      const sampleData = [
        {
          id: "scott-mckenzie",
          name: "Scott McKenzie",
          club: "FC Barcelona",
          division: 1,
          type: "legend",
          points: 2856,
          games: 1247,
          avgPoints: 2.29,
          signature: "The master tactician who redefined what it means to be a champion",
          story: "Scott McKenzie's legendary journey in Top 100..."
        },
        {
          id: "glen-mullan",
          name: "Glen Mullan",
          club: "Real Madrid",
          division: 1,
          type: "elite",
          points: 2243,
          games: 987,
          avgPoints: 2.27,
          signature: "The tactical perfectionist known for meticulous preparation",
          story: "Glen Mullan represents the modern era of excellence..."
        },
        {
          id: "david-marsden",
          name: "David Marsden",
          club: "Liverpool FC",
          division: 2,
          type: "veteran",
          points: 1876,
          games: 823,
          avgPoints: 2.28,
          signature: "The community builder who transformed Top 100",
          story: "David Marsden's contribution extends far beyond the pitch..."
        }
      ];
      setManagers(sampleData);
    }
  };

  const filterManagers = () => {
    let filtered = managers.filter(manager => {
      const matchesSearch = manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           manager.club.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDivision = selectedDivision === 'all' || manager.division.toString() === selectedDivision;
      const matchesType = selectedType === 'all' || manager.type === selectedType;
      
      return matchesSearch && matchesDivision && matchesType;
    });

    // Sort by points (highest first)
    filtered.sort((a, b) => b.points - a.points);
    setFilteredManagers(filtered);
  };

  const formatPoints = (points) => {
    return points?.toLocaleString() || '0';
  };

  const formatAvgPoints = (avg) => {
    return avg?.toFixed(2) || '0.00';
  };

  const getBadgeStyle = (type, division) => {
    if (type === 'division') {
      const colors = {
        1: { background: '#fbbf24', color: '#92400e' },
        2: { background: '#d1d5db', color: '#374151' },
        3: { background: '#d97706', color: '#fbbf24' },
        4: { background: '#10b981', color: '#ecfdf5' },
        5: { background: '#3b82f6', color: '#dbeafe' }
      };
      return colors[division] || { background: '#6b7280', color: 'white' };
    } else {
      const colors = {
        'legend': { background: '#7c3aed', color: '#e5e7eb' },
        'elite': { background: '#dc2626', color: '#fee2e2' },
        'rising': { background: '#2563eb', color: '#dbeafe' },
        'veteran': { background: '#059669', color: '#d1fae5' }
      };
      return colors[type] || { background: '#6b7280', color: 'white' };
    }
  };

  // Debug info
  console.log('App render - managers:', managers.length, 'filtered:', filteredManagers.length, 'loading:', loading, 'error:', error);

  if (selectedManager) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #064e3b 100%)',
        color: '#f3f4f6'
      }}>
        {/* Navigation Header */}
        <div style={{
          background: 'linear-gradient(to right, #CD853F, #8B4513)',
          borderBottom: '2px solid #DEB887',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedManager(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#F5DEB3',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ← Back to Managers
              </button>
              <span style={{ color: '#DEB887' }}>|</span>
              <a 
                href="https://smtop100.blog" 
                style={{ color: '#F5DEB3', textDecoration: 'none', fontWeight: '500' }}
              >
                Main Site
              </a>
            </div>
            <div style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '1.2rem' }}>
              Manager Profile
            </div>
          </div>
        </div>

        {/* Manager Profile */}
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            color: '#374151'
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              marginBottom: '0.5rem', 
              color: '#1f2937' 
            }}>
              {selectedManager.name}
            </h1>
            <h2 style={{ 
              fontSize: '1.5rem', 
              marginBottom: '1rem', 
              color: '#6b7280' 
            }}>
              {selectedManager.club}
            </h2>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '2rem', 
              flexWrap: 'wrap' 
            }}>
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '25px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                ...getBadgeStyle('division', selectedManager.division)
              }}>
                Division {selectedManager.division}
              </span>
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '25px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                ...getBadgeStyle('type', selectedManager.type)
              }}>
                {selectedManager.type.charAt(0).toUpperCase() + selectedManager.type.slice(1)}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{ 
                textAlign: 'center', 
                padding: '1rem', 
                background: '#f0fdf4', 
                borderRadius: '8px' 
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>
                  {formatPoints(selectedManager.points)}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#16a34a' }}>Total Points</div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '1rem', 
                background: '#eff6ff', 
                borderRadius: '8px' 
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
                  {selectedManager.games}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#2563eb' }}>Games Played</div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '1rem', 
                background: '#faf5ff', 
                borderRadius: '8px' 
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7c2d12' }}>
                  {formatAvgPoints(selectedManager.avgPoints)}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#a855f7' }}>Avg Points</div>
              </div>
            </div>

            {selectedManager.signature && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem', 
                  color: '#1f2937' 
                }}>
                  Signature Style
                </h3>
                <p style={{
                  fontSize: '1.1rem',
                  fontStyle: 'italic',
                  borderLeft: '4px solid #CD853F',
                  paddingLeft: '1rem',
                  color: '#4b5563'
                }}>
                  "{selectedManager.signature}"
                </p>
              </div>
            )}

            {selectedManager.story && (
              <div>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem', 
                  color: '#1f2937' 
                }}>
                  Top 100 Journey
                </h3>
                <p style={{
                  lineHeight: '1.6',
                  color: '#4b5563',
                  whiteSpace: 'pre-line'
                }}>
                  {selectedManager.story}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8B4513 0%, #CD853F 50%, #8B4513 100%)',
      color: '#f3f4f6'
    }}>
      {/* Navigation Header */}
      <div style={{
        background: 'linear-gradient(to right, #CD853F, #8B4513)',
        borderBottom: '2px solid #DEB887',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a 
              href="https://smtop100.blog" 
              style={{ 
                color: '#F5DEB3', 
                textDecoration: 'none', 
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ← Back to Main Site
            </a>
            <span style={{ color: '#DEB887' }}>|</span>
            <a 
              href="https://legends.smtop100.blog" 
              style={{ color: '#F5DEB3', textDecoration: 'none', fontWeight: '500' }}
            >
              Legends
            </a>
          </div>
          <div style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '1.2rem' }}>
            Manager Profiles
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#f9fafb'
          }}>
            🏆 TOP 100 MANAGER PROFILES 🏆
          </h1>
          <p style={{
            fontSize: '1.2rem',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
            color: '#F5DEB3'
          }}>
            Celebrating 25 seasons of Soccer Manager Worlds excellence. Discover the stories, achievements, 
            and legendary journeys of our Top 100 community's finest managers.
          </p>
        </div>

        {/* Search and Filters */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Search Managers
              </label>
              <input
                type="text"
                placeholder="Search by name or club..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Division
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="all">All Divisions</option>
                <option value="1">Division 1</option>
                <option value="2">Division 2</option>
                <option value="3">Division 3</option>
                <option value="4">Division 4</option>
                <option value="5">Division 5</option>
              </select>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Manager Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="all">All Types</option>
                <option value="legend">Legend</option>
                <option value="elite">Elite</option>
                <option value="rising">Rising Star</option>
                <option value="veteran">Veteran</option>
              </select>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            ⚠️ API Error (using sample data): {error}
          </div>
        )}

        {/* Results Summary */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '1.1rem', color: '#F5DEB3' }}>
            Showing {filteredManagers.length} of {managers.length} managers
          </p>
        </div>

        {/* Manager Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '1.2rem', color: '#f9fafb' }}>Loading managers...</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredManagers.map((manager) => (
              <div
                key={manager.id}
                onClick={() => setSelectedManager(manager)}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 'bold', 
                      color: '#1f2937', 
                      marginBottom: '0.25rem' 
                    }}>
                      {manager.name}
                    </h3>
                    <p style={{ color: '#6b7280' }}>{manager.club}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      ...getBadgeStyle('division', manager.division)
                    }}>
                      Div {manager.division}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      ...getBadgeStyle('type', manager.type)
                    }}>
                      {manager.type}
                    </span>
                  </div>
                </div>

                 <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#CD853F' }}>
                      {formatPoints(manager.points)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Points</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2563eb' }}>
                      {manager.games}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Games</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#7c2d12' }}>
                      {formatAvgPoints(manager.avgPoints)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Avg</div>
                  </div>
                </div>

                {manager.signature && (
                  <p style={{
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    color: '#4b5563',
                    marginBottom: '1rem',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    "{manager.signature}"
                  </p>
                )}

                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: '#CD853F', fontWeight: '500' }}>
                    View Profile →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredManagers.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#f9fafb' }}>
              No managers found
            </div>
            <p style={{ color: '#d1fae5' }}>Try adjusting your search criteria</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '4rem', paddingBottom: '2rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#F5DEB3' }}>
            ⚽ Celebrating 25 Seasons of Soccer Manager Worlds Excellence ⚽
          </p>
          <p style={{ color: '#DEB887' }}>
            Part of the Top 100 Community • Est. 2000
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;