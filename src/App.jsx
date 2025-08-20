import React from 'react'

function App() {
  return (
    React.createElement('div', { 
      style: { 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '20px'
      }
    },
      React.createElement('div', null,
        React.createElement('h1', { 
          style: { fontSize: '3rem', marginBottom: '1rem' }
        }, '🏆 Top 100 Manager Profiles'),
        React.createElement('p', { 
          style: { fontSize: '1.2rem', marginBottom: '2rem' }
        }, 'Celebrating 25 Seasons of Excellence'),
        React.createElement('div', {
          style: { 
            background: 'rgba(255,255,255,0.1)', 
            padding: '2rem', 
            borderRadius: '10px' 
          }
        },
          React.createElement('h2', null, '🚀 Coming Soon!'),
          React.createElement('p', null, 'Interactive manager profiles for the Top 100 community')
        )
      )
    )
  )
}

export default App