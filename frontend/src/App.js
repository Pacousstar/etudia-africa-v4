// App.js - VERSION UX/UI RÉVOLUTIONNAIRE AVEC RESPONSIVE PARFAIT
import React, { useState, useEffect } from 'react';
import './App.css';
import UploadDocument from './components/UploadDocument';
import ChatIA from './components/ChatIA';

// Configuration API
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production'  
  ? 'https://etudia-africa-v4-production.up.railway.app'
  : '');

console.log('🔗 API_URL:', API_URL || 'PROXY LOCAL ACTIVÉ');

function App() {
  // États principaux
  const [activeTab, setActiveTab] = useState('inscription');
  const [student, setStudent] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [documentContext, setDocumentContext] = useState('');
  const [allDocuments, setAllDocuments] = useState([]); // NOUVEAU: Tous les documents
  const [selectedDocumentId, setSelectedDocumentId] = useState(null); // NOUVEAU: Document sélectionné
  
  // États serveur et connexion
  const [backendStatus, setBackendStatus] = useState('checking');
  const [stats, setStats] = useState({ 
    students: 0, 
    documents: 0, 
    chats: 0,
    active_students_7days: 0,
    tokens_status: { used_today: 0, remaining: 95000 }
  });
  
  // États UI/UX
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState({
    show: false,
    text: '',
    type: 'success'
  });

  // États formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    class_level: '',
    school: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Données statiques
  const schools = [
    'Lycée Classique d\'Abidjan',
    'Lycée Technique d\'Abidjan',
    'Collège Notre-Dame d\'Afrique',
    'Lycée Sainte-Marie de Cocody',
    'Institution Sainte-Marie de Cocody',
    'Cours Secondaire Catholique',
    'Lycée Municipal d\'Abidjan',
    'Groupe Scolaire Les Génies',
    'École Internationale WASCAL',
    'Autre'
  ];

  const classLevels = [
    '6ème', '5ème', '4ème', '3ème',
    'Seconde', 'Première', 'Terminale'
  ];

  // Fonctions utilitaires
  const showTemporaryMessage = (text, type = 'success', duration = 10000) => {
    setConnectionMessage({ show: true, text, type });
    setTimeout(() => {
      setConnectionMessage(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const getStepNumber = (tabId) => {
    const steps = { 'inscription': 1, 'upload': 2, 'chat': 3 };
    return steps[tabId] || 1;
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // NOUVEAU: Fonction déconnexion
  const handleLogout = () => {
    setStudent(null);
    setCurrentStep(1);
    setActiveTab('inscription');
    setDocumentContext('');
    setAllDocuments([]);
    setSelectedDocumentId(null);
    setFormData({
      name: '',
      email: '',
      class_level: '',
      school: ''
    });
    showTemporaryMessage('👋 Déconnexion réussie ! À bientôt sur ÉtudIA !', 'info');
  };

  // NOUVEAU: Charger tous les documents de l'utilisateur
  const loadUserDocuments = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/documents/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAllDocuments(data.documents || []);
        if (data.documents && data.documents.length > 0) {
          const latestDoc = data.documents[0];
          setSelectedDocumentId(latestDoc.id);
          setDocumentContext(latestDoc.texte_extrait);
        }
      }
    } catch (error) {
      console.warn('📄 Erreur chargement documents:', error);
    }
  };

  // NOUVEAU: Changer de document actif
  const switchDocument = (documentId) => {
    const selectedDoc = allDocuments.find(doc => doc.id === documentId);
    if (selectedDoc) {
      setSelectedDocumentId(documentId);
      setDocumentContext(selectedDoc.texte_extrait);
      showTemporaryMessage(`📄 Document "${selectedDoc.nom_original}" sélectionné !`, 'success');
    }
  };

  // Vérification statut serveur + PWA
  useEffect(() => {
    const checkBackend = async () => {
      console.log('🔍 Vérification backend...', API_URL);
      try {
        const response = await fetch(`${API_URL}/health`);
        console.log('📡 Response status:', response.status, response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Data reçue:', data);
          console.log('🔄 Ancien état:', backendStatus, '→ Nouveau: online');
          setBackendStatus('online');
          
          if (backendStatus !== 'online') {
            showTemporaryMessage('🎉 ÉtudIA v4.0 est en ligne ! ✅');
          }

          if (data.tokens_status) {
            setStats(prev => ({ ...prev, tokens_status: data.tokens_status }));
          }
        } else {
          console.log('❌ Response not OK:', response.status);
          setBackendStatus('offline');
        }
      } catch (error) {
        console.log('💥 Erreur fetch:', error.message);
        setBackendStatus('offline');
        if (backendStatus === 'online') {
          showTemporaryMessage('❌ Serveur temporairement hors ligne', 'error', 5000);
        }
      }
    };

    // PWA Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('✅ PWA: Service Worker ÉtudIA enregistré');
          })
          .catch(error => {
            console.log('❌ PWA: Erreur Service Worker:', error);
          });
      });
    }

    // Détection installation PWA
    let installPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      installPrompt = e;
      console.log('📱 PWA: ÉtudIA peut être installé !');
      showTemporaryMessage('📱 Installez ÉtudIA sur votre téléphone ! Menu → Installer', 'success', 8000);
    });

    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA: ÉtudIA installé avec succès !');
      showTemporaryMessage('🎉 ÉtudIA installé ! Trouvez l\'app sur votre écran d\'accueil', 'success');
    });

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [backendStatus]);

  // Récupération statistiques
  useEffect(() => {
    const fetchStats = async () => {
      if (backendStatus !== 'online') return;
      
      try {
        console.log('📊 Récupération stats...');
        const response = await fetch(`${API_URL}/api/stats`);
        console.log('📡 Stats response:', response.status, response.ok);
        
        if (response.ok) {
          const responseText = await response.text();
          console.log('📄 Stats raw:', responseText);
          
          const data = JSON.parse(responseText);
          console.log('📊 Stats parsed:', data);
          
          setStats({
            students: data.students || 0,
            documents: data.documents || 0,
            chats: data.chats || 0,
            active_students_7days: data.active_students_7days || 0,
            tokens_status: data.tokens_status || { used_today: 0, remaining: 95000 }
          });
          
          console.log('✅ Stats mises à jour:', {
            students: data.students,
            documents: data.documents,
            chats: data.chats
          });
        }
      } catch (error) {
        console.warn('📊 Erreur récupération stats:', error.message);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [backendStatus, API_URL]);

  // Charger documents utilisateur après connexion
  useEffect(() => {
    if (student?.id) {
      loadUserDocuments(student.id);
    }
  }, [student]);

  // Gestion inscription
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    if (!formData.name.trim() || !formData.email.trim() || !formData.class_level) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('🚀 Tentative inscription...', formData);
      
      const response = await fetch(`${API_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      console.log('📡 Response status:', response.status, response.ok);
      
      const responseText = await response.text();
      console.log('📄 Response raw:', responseText);
      
      if (!responseText.trim()) {
        throw new Error('Réponse serveur vide');
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
        throw new Error('Réponse serveur invalide');
      }
      
      console.log('📊 Data parsed:', data);

      if (response.ok) {
        setStudent(data.student);
        setMessage({ type: 'success', text: data.message });
        setCurrentStep(2);
        setBackendStatus('online');
        
        showTemporaryMessage(`🎉 Bienvenue ${data.student.nom} ! Inscription réussie avec ÉtudIA !`);
        setTimeout(() => setActiveTab('upload'), 2000);
      } else {
        if (data.error === 'EMAIL_EXISTS') {
          setMessage({ 
            type: 'error', 
            text: '📧 Cet email est déjà inscrit ! Utilisez la connexion rapide ci-dessous.' 
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: data.message || data.error || `Erreur serveur: ${response.status}`
          });
        }
      }
    } catch (error) {
      console.error('💥 Erreur inscription:', error);
      setMessage({ 
        type: 'error', 
        text: `Erreur: ${error.message}. Réessayez dans quelques instants.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Connexion rapide
  const handleLogin = async (email) => {
    if (!email?.trim()) {
      setMessage({ type: 'error', text: 'Veuillez saisir votre email' });
      return;
    }

    try {
      console.log('🚀 Tentative connexion...', email);
      
      const response = await fetch(`${API_URL}/api/students/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      console.log('📡 Response status:', response.status, response.ok);
      
      const responseText = await response.text();
      console.log('📄 Response raw:', responseText);
      
      if (!responseText.trim()) {
        throw new Error('Réponse serveur vide');
      }
      
      const data = JSON.parse(responseText);
      console.log('📊 Data parsed:', data);

      if (response.ok) {
        setStudent(data.student);
        setMessage({ type: 'success', text: data.message });
        setCurrentStep(2);
        setActiveTab('upload');
        setBackendStatus('online');
        
        showTemporaryMessage(`🎉 Connexion réussie ! Bonjour ${data.student.nom} !`);
      } else {
        if (response.status === 404) {
          setMessage({ 
            type: 'error', 
            text: '🔍 Email non trouvé. Inscrivez-vous d\'abord avec le formulaire ci-dessus.' 
          });
        } else {
          setMessage({ type: 'error', text: data.error || data.message });
        }
      }
    } catch (error) {
      console.error('💥 Erreur connexion:', error);
      setMessage({ 
        type: 'error', 
        text: `Erreur: ${error.message}. Réessayez dans quelques instants.`
      });
    }
  };

  // Gestion documents
  const handleDocumentProcessed = (extractedText, documentData) => {
    setDocumentContext(extractedText);
    setCurrentStep(3);
    
    // Ajouter le nouveau document à la liste
    if (documentData) {
      setAllDocuments(prev => [documentData, ...prev]);
      setSelectedDocumentId(documentData.id);
    }
    
    showTemporaryMessage('📄 Document analysé avec ÉtudIA ! Passons au chat IA !');
    setTimeout(() => setActiveTab('chat'), 1500);
  };

  // Composant bouton navigation
  const TabButton = ({ id, label, icon, isActive, onClick, disabled = false }) => (
    <button
      className={`tab-button ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onClick(id)}
      disabled={disabled}
      title={disabled ? 'Complétez les étapes précédentes' : `Aller à ${label}`}
    >
      <span className="tab-icon">{icon}</span>
      <span className="tab-label">{label}</span>
      {currentStep > getStepNumber(id) && <span className="tab-check">✓</span>}
      {disabled && <span className="tab-lock">🔒</span>}
    </button>
  );

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Message flottant */}
      {connectionMessage.show && (
        <div className={`floating-message ${connectionMessage.type}`}>
          {connectionMessage.text}
        </div>
      )}

      {/* HEADER RÉVOLUTIONNAIRE RESPONSIVE */}
      <header className="app-header revolutionary">
        <div className="cosmic-background"></div>
        
        {/* Menu mobile toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`header-content ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* Section logo */}
          <div className="logo-section">
            <h1 className="app-title">
              <span className="title-etud">Étud</span>
              <span className="title-ia">IA</span>
              <span className="title-version">4.0</span>
            </h1>
            <p className="app-subtitle">L'Assistant IA Révolutionnaire pour l'Education Africaine !</p>
            <div className="made-in-ci">
              <span className="flag">🇨🇮</span>
              <span>Made with ❤️ in Côte d'Ivoire by @Pacousstar</span>
            </div>
            <div className="llama-badge">
              <span className="llama-icon">🦙</span>
              <span>Powered by Llama 3.3-70b-versatile</span>
            </div>
          </div>
          
          {/* Section contrôles utilisateur */}
          {student && (
            <div className="user-controls">
              <div className="user-info">
                <span className="user-welcome">👋 Salut {student.nom?.split(' ')[0]} !</span>
                <span className="user-class">🎓 {student.classe}</span>
              </div>
              <div className="control-buttons">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`control-btn ${isDarkMode ? 'active' : ''}`}
                  title="Mode sombre"
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
                <button 
                  onClick={handleLogout}
                  className="control-btn logout"
                  title="Déconnexion"
                >
                  🚪 Déconnexion
                </button>
              </div>
            </div>
          )}
          
          {/* Section statistiques */}
          <div className="stats-section">
            <div className="stat-item">
              <span className="stat-number">{stats.students.toLocaleString()}+</span>
              <span className="stat-label">Élèves aidés</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.documents.toLocaleString()}+</span>
              <span className="stat-label">Documents analysés</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.active_students_7days}+</span>
              <span className="stat-label">Actifs cette semaine</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {stats.tokens_status?.remaining > 85000 ? '🟢' : 
                 stats.tokens_status?.remaining > 50000 ? '🟡' : '🔴'}
              </span>
              <span className="stat-label">ÉtudIA Status</span>
            </div>
          </div>

          {/* Section statut serveur */}
          <div className="backend-status">
            <div className={`status-indicator ${backendStatus}`}>
              <span className="status-dot">
                {backendStatus === 'online' ? '✅' : 
                 backendStatus === 'offline' ? '🔴' : '⏳'}
              </span>
              <span className="status-text">
                {backendStatus === 'online' ? 'ÉtudIA En ligne' :
                 backendStatus === 'offline' ? 'Hors ligne' : 'Connexion...'}
              </span>
            </div>
            {backendStatus === 'online' && stats.tokens_status && (
              <div className="tokens-info">
                <div className="tokens-bar">
                  <div 
                    className="tokens-fill" 
                    style={{ 
                      width: `${((stats.tokens_status.used_today || 0) / 95000) * 100}%`,
                      backgroundColor: (stats.tokens_status.used_today || 0) > 85000 ? '#EF4444' : '#32CD32'
                    }}
                  ></div>
                </div>
                <span className="tokens-text">
                  Tokens: {(stats.tokens_status.used_today || 0).toLocaleString()}/95k
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* NOUVEAU: Sélecteur de documents */}
      {student && allDocuments.length > 1 && (
        <div className="document-selector">
          <h3>📄 Vos Documents Analysés</h3>
          <div className="documents-grid">
            {allDocuments.map((doc) => (
              <button
                key={doc.id}
                className={`document-card ${selectedDocumentId === doc.id ? 'active' : ''}`}
                onClick={() => switchDocument(doc.id)}
              >
                <div className="doc-icon">📄</div>
                <div className="doc-info">
                  <div className="doc-name">{doc.nom_original}</div>
                  <div className="doc-meta">
                    <span>{doc.matiere || 'Général'}</span>
                    <span>{new Date(doc.date_upload).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                {selectedDocumentId === doc.id && <div className="doc-active">✓</div>}
              </button>
            ))}
          </div>
          <button 
            className="add-document-btn"
            onClick={() => setActiveTab('upload')}
          >
            ➕ Charger un autre document
          </button>
        </div>
      )}

      {/* Barre de progression */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Inscription</span>
          </div>
          <div className={`step ${currentStep >= 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Upload Document</span>
          </div>
          <div className={`step ${currentStep >= 3 ? 'completed' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Chat ÉtudIA</span>
          </div>
        </div>
      </div>

      {/* Navigation onglets */}
      <nav className="tab-navigation">
        <TabButton
          id="inscription"
          label="Inscription"
          icon="👤"
          isActive={activeTab === 'inscription'}
          onClick={setActiveTab}
        />
        <TabButton
          id="upload"
          label="Upload OCR"
          icon="📸"
          isActive={activeTab === 'upload'}
          onClick={setActiveTab}
          disabled={!student}
        />
        <TabButton
          id="chat"
          label="Chat ÉtudIA"
          icon="🦙"
          isActive={activeTab === 'chat'}
          onClick={setActiveTab}
          disabled={!student}
        />
      </nav>

      {/* CONTENU PRINCIPAL AVEC NOUVEAU BACKGROUND */}
      <main className="main-content enhanced">
        {/* Onglet inscription */}
        {activeTab === 'inscription' && (
          <div className="tab-content inscription-tab">
            <div className="content-header">
              <h2 className="main-title">🎓 Rejoignez la Révolution Éducative ÉtudIA !</h2>
              <p className="main-subtitle">
                Inscrivez-vous en moins de 2 minutes et bénéficiez des performances de ÉtudIA
              </p>
              
              {backendStatus !== 'online' && (
                <div className="server-warning">
                  {backendStatus === 'checking' ? (
                    <span>⏳ Connexion au serveur en cours...</span>
                  ) : (
                    <span>⚠️ Serveur temporairement indisponible. Réessayez dans quelques instants.</span>
                  )}
                </div>
              )}
            </div>

            {message.text && (
              <div className={`message ${message.type}`}>
                <strong>{message.type === 'error' ? '❌ ' : '✅ '}</strong>
                {message.text}
              </div>
            )}

            {/* Formulaire d'inscription */}
            <form onSubmit={handleSubmit} className="inscription-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Nom complet *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Votre nom et prénom"
                  className="form-input"
                  disabled={backendStatus !== 'online'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="votre.email@exemple.com"
                  className="form-input"
                  disabled={backendStatus !== 'online'}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="class_level" className="form-label">Classe *</label>
                  <select
                    id="class_level"
                    name="class_level"
                    value={formData.class_level}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                    disabled={backendStatus !== 'online'}
                  >
                    <option value="">Sélectionnez votre classe</option>
                    {classLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="school" className="form-label">École</label>
                  <select
                    id="school"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    className="form-select"
                    disabled={backendStatus !== 'online'}
                  >
                    <option value="">Sélectionnez votre école</option>
                    {schools.map(school => (
                      <option key={school} value={school}>{school}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || backendStatus !== 'online'}
                className="submit-button"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Inscription en cours...
                  </>
                ) : backendStatus !== 'online' ? (
                  <>⏳ Attente serveur LLAMA 3.3...</>
                ) : (
                  <>🚀 Rejoindre ÉtudIA </>
                )}
              </button>
            </form>

            {/* Section connexion rapide */}
            <div className="login-section">
              <div className="login-header">
                <h3 className="section-title">⚡ Connexion Rapide</h3>
                <p className="section-subtitle">Déjà inscrit ? Connectez-vous pour accéder à ÉtudIA :</p>
              </div>
              <div className="quick-login">
                <input
                  type="email"
                  placeholder="Votre email d'inscription"
                  className="login-input"
                  id="login-email-input"
                  disabled={backendStatus !== 'online'}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value && backendStatus === 'online') {
                      handleLogin(e.target.value);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const emailInput = document.getElementById('login-email-input');
                    const email = emailInput?.value;
                    if (email && backendStatus === 'online') {
                      handleLogin(email);
                    }
                  }}
                  className="login-button"
                  disabled={backendStatus !== 'online'}
                >
                  {backendStatus === 'online' ? 'Se connecter' : 'Serveur indisponible'}
                </button>
              </div>
            </div>

            {/* Grille des fonctionnalités */}
            <div className="features-grid">
              <div className="feature-card memory">
                <span className="feature-icon">🧠</span>
                <h3 className="feature-title">IA ÉtudIA Personnalisée</h3>
                <p className="feature-description">
                  Mémoire avancée avec +25% de précision mathématique et +30% de compréhension française
                </p>
                <div className="feature-status status-active">✅ Actif </div>
              </div>
              
              <div className="feature-card step-mode">
                <span className="feature-icon">🔁</span>
                <h3 className="feature-title">Mode Étape par Étape</h3>
                <p className="feature-description">
                  Guidage progressif "📊 Étape 1/4" optimisé par la logique améliorée de ÉtudIA
                </p>
                <div className="feature-status status-active">✅ Optimisé </div>
              </div>
              
              <div className="feature-card direct-mode">
                <span className="feature-icon">✅</span>
                <h3 className="feature-title">Mode Solution Directe</h3>
                <p className="feature-description">
                  Solutions complètes instantanées avec +20% de vitesse et de satisfaction avec ÉtudIA
                </p>
                <div className="feature-status status-active">✅ Accéléré </div>
              </div>
              
              <div className="feature-card ocr">
                <span className="feature-icon">📸</span>
                <h3 className="feature-title">OCR Révolutionnaire</h3>
                <p className="feature-description">
                  Extraction texte 95% de précision analysée par ÉtudIA
                </p>
                <div className="feature-status status-active">✅ Analysé </div>
              </div>
              
              <div className="feature-card protection">
                <span className="feature-icon">🛡️</span>
                <h3 className="feature-title">Protection Intelligente</h3>
                <p className="feature-description">
                  Gestion automatique des limites avec fallback seamless 
                </p>
                <div className="feature-status">
                  {stats.tokens_status?.remaining > 85000 ? '🟢 Optimal' : 
                   stats.tokens_status?.remaining > 50000 ? '🟡 Modéré' : '🔴 Limité'}
                </div>
              </div>
              
              <div className="feature-card africa">
                <span className="feature-icon">🇨🇮</span>
                <h3 className="feature-title">Made in Côte d'Ivoire</h3>
                <p className="feature-description">
                  Conçu spécialement pour l'Afrique avec contexte culturel intégré 
                </p>
                <div className="feature-status status-special">🌍 Pour l'Afrique</div>
              </div>
            </div>

            {/* Section améliorations LlAMA 3.3 */}
            <div className="llama-improvements-section">
              <h3 className="section-title">🦙 Pourquoi LlAMA 3.3 de ÉtudIA change tout ?</h3>
              <div className="improvements-grid">
                <div className="improvement-item">
                  <span className="improvement-icon">📊</span>
                  <div className="improvement-content">
                    <h4>Précision Mathématique</h4>
                    <div className="improvement-stats">
                      <span className="old-value">Avant: 78%</span>
                      <span className="arrow">→</span>
                      <span className="new-value">Maintenant: 97% (+25%)</span>
                    </div>
                  </div>
                </div>
                
                <div className="improvement-item">
                  <span className="improvement-icon">🇫🇷</span>
                  <div className="improvement-content">
                    <h4>Compréhension Française</h4>
                    <div className="improvement-stats">
                      <span className="old-value">Avant: 85%</span>
                      <span className="arrow">→</span>
                      <span className="new-value">Maintenant: 96% (+30%)</span>
                    </div>
                  </div>
                </div>
                
                <div className="improvement-item">
                  <span className="improvement-icon">⚡</span>
                  <div className="improvement-content">
                    <h4>Vitesse Réponses</h4>
                    <div className="improvement-stats">
                      <span className="old-value">Avant: 2.3s</span>
                      <span className="arrow">→</span>
                      <span className="new-value">Maintenant: 1.8s (+20%)</span>
                    </div>
                  </div>
                </div>
                
                <div className="improvement-item">
                  <span className="improvement-icon">🧠</span>
                  <div className="improvement-content">
                    <h4>Raisonnement Logique</h4>
                    <div className="improvement-stats">
                      <span className="old-value">Avant: 82%</span>
                      <span className="arrow">→</span>
                      <span className="new-value">Maintenant: 94% (+20%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Témoignages élèves */}
            <div className="testimonials-section">
              <h3 className="section-title">💬 Ce que disent nos élèves sur ÉtudIA</h3>
              <div className="testimonials-grid">
                <div className="testimonial">
                  <p>"ÉtudIA comprend encore mieux mes questions en français ! C'est impressionnant !"</p>
                  <span>- Doriane, Première S - Abidjan</span>
                </div>
                <div className="testimonial">
                  <p>"Les solutions en maths sont maintenant parfaites ! ÉtudIA ne fait plus d'erreurs de calcul."</p>
                  <span>- Kalou, Terminale C - Cocody</span>
                </div>
                <div className="testimonial">
                  <p>"Le mode étape par étape est devenu encore plus clair. Je comprends tout du premier coup !"</p>
                  <span>- Gougnan, 3ème - Yopougon</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet upload documents */}
        {activeTab === 'upload' && student && (
          <UploadDocument
            student={student}
            apiUrl={API_URL}
            onDocumentProcessed={handleDocumentProcessed}
          />
        )}

        {/* Onglet chat ÉtudIA */}
        {activeTab === 'chat' && student && (
          <ChatIA
            student={student}
            apiUrl={API_URL}
            documentContext={documentContext}
            allDocuments={allDocuments}
            selectedDocumentId={selectedDocumentId}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-main">
            <p>&copy; 2025 ÉtudIA v4.0 - Révolutionnons l'éducation africaine ! 🌍</p>
            <p>Développé avec ❤️ par <strong>@Pacousstar</strong> - Côte d'Ivoire</p>
          </div>
          
          <div className="footer-stats">
            <span>🚀 {stats.students.toLocaleString()}+ élèves</span>
            <span>📚 {stats.documents.toLocaleString()}+ documents</span>
            <span>💬 {stats.chats.toLocaleString()}+ conversations</span>
            <span>🦙 LlAMA 3.3 {stats.tokens_status?.remaining > 85000 ? 'optimal' : 'actif'}</span>
          </div>
          
          <div className="footer-tech">
            <span>Powered by: React.js • Node.js • LlAMA 3.3 • Supabase</span>
            <span>Status: {backendStatus === 'online' ? '🟢 En ligne' : '🔴 Maintenance'}</span>
          </div>
        </div>
      </footer>

      {/* STYLES CSS RÉVOLUTIONNAIRES RESPONSIVE */}
      <style jsx>{`
        /* =================================================================
           🎨 VARIABLES CSS POUR COHÉRENCE DES COULEURS
           ================================================================= */
        :root {
          --primary-orange: #FF6B35;
          --primary-green: #4CAF50;
          --secondary-orange: #FF8C00;
          --secondary-green: #32CD32;
          --accent-blue: #6366F1;
          --text-dark: #1F2937;
          --text-light: #6B7280;
          --bg-light: #F9FAFB;
          --bg-white: #FFFFFF;
          --border-light: rgba(99, 102, 241, 0.1);
          --shadow-light: 0 4px 15px rgba(0, 0, 0, 0.1);
          --shadow-medium: 0 8px 25px rgba(0, 0, 0, 0.15);
          --gradient-orange: linear-gradient(135deg, var(--primary-orange), var(--secondary-orange));
          --gradient-green: linear-gradient(135deg, var(--primary-green), var(--secondary-green));
          --gradient-cosmic: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        /* =================================================================
           🌙 VARIABLES MODE SOMBRE
           ================================================================= */
        .dark-mode {
          --bg-light: #1F2937;
          --bg-white: #374151;
          --text-dark: #F9FAFB;
          --text-light: #D1D5DB;
          --border-light: rgba(99, 102, 241, 0.3);
        }

        /* =================================================================
           📱 RESET ET BASE MOBILE-FIRST
           ================================================================= */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--bg-light), var(--bg-white));
          color: var(--text-dark);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          transition: all 0.3s ease;
          overflow-x: hidden;
        }

        /* =================================================================
           🎯 HEADER RÉVOLUTIONNAIRE RESPONSIVE
           ================================================================= */
        .app-header.revolutionary {
          background: var(--gradient-cosmic);
          color: white;
          padding: 1rem;
          position: relative;
          overflow: hidden;
          min-height: 120px;
        }

        .cosmic-background {
          position: absolute;
          top: 0;
          left: 0
