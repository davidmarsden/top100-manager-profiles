import React, { useState, useEffect } from 'react';

const App = () => {
  const [managers, setManagers] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagers();
  }, []);

  useEffect(() => {
    filterManagers();
  }, [managers, searchTerm, selectedDivision, selectedType]);

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/managers');
      const data = await response.json();
      setManagers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching managers:', error);
      setLoading(false);
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

  const getDivisionBadgeColor = (division) => {
    const colors = {
      1: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900',
      2: 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900',
      3: 'bg-gradient-to-r from-amber-600 to-amber-800 text-amber-100',
      4: 'bg-gradient-to-r from-green-500 to-green-700 text-green-100',
      5: 'bg-gradient-to-r from-blue-500 to-blue-700 text-blue-100'
    };
    return colors[division] || 'bg-gray-500 text-white';
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      'legend': 'bg-gradient-to-r from-purple-600 to-purple-800 text-purple-100',
      'elite': 'bg-gradient-to-r from-red-600 to-red-800 text-red-100',
      'rising': 'bg-gradient-to-r from-blue-600 to-blue-800 text-blue-100',
      'veteran': 'bg-gradient-to-r from-green-600 to-green-800 text-green-100'
    };
    return colors[type] || 'bg-gray-500 text-white';
  };

  if (selectedManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900">
        {/* Navigation Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-900 border-b-2 border-green-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedManager(null)}
                  className="text-green-100 hover:text-white transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="font-medium">Back to Managers</span>
                </button>
                <div className="hidden sm:block text-green-300">|</div>
                <a 
                  href="https://smtop100.blog" 
                  className="text-green-100 hover:text-white transition-colors duration-200 font-medium hidden sm:inline"
                >
                  Main Site
                </a>
              </div>
              <div className="text-green-100 font-bold text-lg">Manager Profile</div>
            </div>
          </div>
        </div>

        {/* Manager Profile */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8">
            <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{selectedManager.name}</h1>
                <h2 className="text-2xl text-gray-700 mb-4">{selectedManager.club}</h2>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getDivisionBadgeColor(selectedManager.division)}`}>
                    Division {selectedManager.division}
                  </span>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getTypeBadgeColor(selectedManager.type)}`}>
                    {selectedManager.type.charAt(0).toUpperCase() + selectedManager.type.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-800">{formatPoints(selectedManager.points)}</div>
                    <div className="text-sm text-green-600">Total Points</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-800">{selectedManager.games}</div>
                    <div className="text-sm text-blue-600">Games Played</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-800">{formatAvgPoints(selectedManager.avgPoints)}</div>
                    <div className="text-sm text-purple-600">Avg Points</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-800">#{Math.floor(Math.random() * 100) + 1}</div>
                    <div className="text-sm text-yellow-600">Ranking</div>
                  </div>
                </div>
              </div>
            </div>

            {selectedManager.signature && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Signature Style</h3>
                <p className="text-gray-700 text-lg italic border-l-4 border-green-500 pl-4">
                  "{selectedManager.signature}"
                </p>
              </div>
            )}

            {selectedManager.story && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Top 100 Journey</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedManager.story}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900">
      {/* Navigation Header */}
      <div className="bg-gradient-to-r from-green-800 to-green-900 border-b-2 border-green-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a 
                href="https://smtop100.blog" 
                className="text-green-100 hover:text-white transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back to Main Site</span>
              </a>
              <div className="hidden sm:block text-green-300">|</div>
              <a 
                href="https://legends.smtop100.blog" 
                className="text-green-100 hover:text-white transition-colors duration-200 font-medium hidden sm:inline"
              >
                Legends
              </a>
            </div>
            <div className="text-green-100 font-bold text-lg">Manager Profiles</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🏆 TOP 100 MANAGER PROFILES 🏆
          </h1>
          <p className="text-green-100 text-xl max-w-3xl mx-auto leading-relaxed">
            Celebrating 25 seasons of Soccer Manager Worlds excellence. Discover the stories, achievements, 
            and legendary journeys of our Top 100 community's finest managers.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Managers</label>
              <input
                type="text"
                placeholder="Search by name or club..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

        {/* Results Summary */}
        <div className="text-center mb-6">
          <p className="text-green-100 text-lg">
            Showing {filteredManagers.length} of {managers.length} managers
          </p>
        </div>

        {/* Manager Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-white text-xl">Loading managers...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredManagers.map((manager) => (
              <div
                key={manager.id}
                onClick={() => setSelectedManager(manager)}
                className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{manager.name}</h3>
                    <p className="text-gray-600">{manager.club}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDivisionBadgeColor(manager.division)}`}>
                      Div {manager.division}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeBadgeColor(manager.type)}`}>
                      {manager.type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-800">{formatPoints(manager.points)}</div>
                    <div className="text-xs text-gray-600">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-800">{manager.games}</div>
                    <div className="text-xs text-gray-600">Games</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-800">{formatAvgPoints(manager.avgPoints)}</div>
                    <div className="text-xs text-gray-600">Avg</div>
                  </div>
                </div>

                {manager.signature && (
                  <p className="text-gray-700 text-sm italic line-clamp-2">
                    "{manager.signature}"
                  </p>
                )}

                <div className="mt-4 text-center">
                  <span className="text-green-600 font-medium hover:text-green-800">
                    View Profile →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredManagers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-white text-xl mb-2">No managers found</div>
            <p className="text-green-100">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 pb-8">
          <p className="text-green-100 text-lg mb-2">
            ⚽ Celebrating 25 Seasons of Soccer Manager Worlds Excellence ⚽
          </p>
          <p className="text-green-200">
            Part of the Top 100 Community • Est. 2000
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;