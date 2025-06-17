// src/components/GroqKeyMonitor.js
import React, { useState, useEffect } from 'react';

const GroqKeyMonitor = ({ groqService }) => {
  const [stats, setStats] = useState([]);
  const [showMonitor, setShowMonitor] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (groqService) {
        setStats(groqService.getStatistics());
      }
    }, 5000); // Mise à jour toutes les 5 secondes

    return () => clearInterval(interval);
  }, [groqService]);

  const resetAllKeys = () => {
    groqService.resetKeys();
    setStats(groqService.getStatistics());
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleTimeString() : 'Jamais';
  };

  if (!showMonitor) {
    return (
      <button 
        onClick={() => setShowMonitor(true)}
        className="monitor-toggle-btn"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '20px',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      >
        🔑
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #4CAF50',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '400px',
      maxHeight: '70vh',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '15px',
        borderBottom: '2px solid #4CAF50',
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#4CAF50', fontSize: '16px' }}>
          🔑 Moniteur Clés Groq
        </h3>
        <button 
          onClick={() => setShowMonitor(false)} 
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '18px', 
            cursor: 'pointer',
            color: '#666',
            padding: '5px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={resetAllKeys}
          style={{
            background: '#FF6B35',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            width: '100%'
          }}
          onMouseOver={(e) => e.target.style.background = '#FF5722'}
          onMouseOut={(e) => e.target.style.background = '#FF6B35'}
        >
          🔄 Reset toutes les clés
        </button>
      </div>

      <div style={{ fontSize: '12px' }}>
        {stats.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            padding: '20px',
            fontStyle: 'italic'
          }}>
            Aucune clé API configurée
          </div>
        ) : (
          stats.map((key) => (
            <div key={key.keyId} style={{
              padding: '12px',
              margin: '8px 0',
              background: key.isBlocked ? '#ffebee' : '#e8f5e8',
              borderRadius: '8px',
              border: `2px solid ${key.isBlocked ? '#f44336' : '#4CAF50'}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                color: key.isBlocked ? '#f44336' : '#4CAF50',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                🔑 Clé {key.keyId} {key.isBlocked ? '🚫 BLOQUÉE' : '✅ ACTIVE'}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px' }}>
                <div><strong>Requêtes:</strong> {key.requestCount}</div>
                <div><strong>Erreurs:</strong> {key.errorCount}</div>
              </div>
              
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#666' }}>
                <div><strong>Dernière utilisation:</strong></div>
                <div>{formatDate(key.lastUsed)}</div>
              </div>
              
              {key.isBlocked && (
                <div style={{ 
                  marginTop: '6px', 
                  color: '#f44336', 
                  fontSize: '11px',
                  background: 'rgba(244, 67, 54, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  <strong>Bloquée jusqu'à:</strong><br/>
                  {formatDate(key.blockedUntil)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <div style={{ 
        marginTop: '15px', 
        paddingTop: '10px', 
        borderTop: '1px solid #eee',
        fontSize: '10px',
        color: '#666',
        textAlign: 'center'
      }}>
        Mise à jour automatique toutes les 5s
      </div>
    </div>
  );
};

export default GroqKeyMonitor;
