  // 🎓 ÉtudIA v4.0 - APP.JS AVEC LLAMA 3.3 ET DESIGN ORANGE/VERT
// =================================================================
// APPLICATION PRINCIPALE AVEC LOGO DYNAMIQUE ET COULEURS OPTIMISÉES
// Alimenté par Llama 3.3-70b-versatile pour une précision supérieure
// =================================================================

import React, { useState, useEffect } from 'react';
import './App.css'; // 🎨 STYLES EXTERNALISÉS
import UploadDocument from './components/UploadDocument';
import ChatIA from './components/ChatIA';

// =================================================================
// 🔗 CONFIGURATION API STABLE
// =================================================================
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production'  
  ? 'https://etudia-africa-v4-production.up.railway.app'
  : '';

console.log('🔗 API_URL configuré:', API_URL);

function App() {
  // =================================================================
  // 🎯 ÉTATS PRINCIPAUX DE L'APPLICATION
  // =================================================================
  
  // États navigation et utilisateur
  const [activeTab, setActiveTab] = useState('inscription');
  const [student, setStudent] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [documentContext, setDocumentContext] = useState('');
  
  // États serveur et connexion
  const [backendStatus, setBackendStatus] = useState('checking');
  const [stats, setStats] = useState({ 
    students: 0, 
    documents: 0, 
    chats: 0,
    active_students_7days: 0,
    tokens_status: { used_today: 0, remaining: 95000 }
  });
  
  // États messages et notifications
  const [connectionMessage, setConnectionMessage] = useState({
    show: false,
    text: '',
    type: 'success'
  });

  // États formulaire d'inscription
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    class_level: '',
    school: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // =================================================================
  // 📚 DONNÉES STATIQUES POUR FORMULAIRES
  // =================================================================
  
  // Liste des écoles ivoiriennes
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

  // Niveaux scolaires supportés
  const classLevels = [
    '6ème', '5ème', '4ème', '3ème',
    'Seconde', 'Première', 'Terminale'
  ];

  // =================================================================
  // 🛠️ FONCTIONS UTILITAIRES
  // =================================================================
  
  // Afficher message temporaire avec animation
  const showTemporaryMessage = (text, type = 'success', duration = 10000) => {
    setConnectionMessage({ show: true, text, type });
    setTimeout(() => {
      setConnectionMessage(prev => ({ ...prev, show: false }));
    }, duration);
  };

  // Obtenir le numéro d'étape selon l'onglet
  const getStepNumber = (tabId) => {
    const steps = { 'inscription': 1, 'upload': 2, 'chat': 3 };
    return steps[tabId] || 1;
  };

  // Gérer les changements dans les champs de formulaire
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // =================================================================
  // 🔍 VÉRIFICATION STATUT SERVEUR LLAMA 3.3
  // =================================================================
  
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/health');
        if (response.ok) {
          const data = await response.json();
          setBackendStatus('online');
          
          // Message de succès seulement au premier démarrage
          if (backendStatus !== 'online') {
            showTemporaryMessage('🎉 ÉtudIA v4.0 est en ligne ! ✅');
          }

          // Mise à jour statut tokens si disponible
          if (data.tokens_status) {
            setStats(prev => ({ ...prev, tokens_status: data.tokens_status }));
          }
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        setBackendStatus('offline');
        if (backendStatus === 'online') {
          showTemporaryMessage('❌ Serveur temporairement hors ligne', 'error', 5000);
        }
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Vérification toutes les 30s
    return () => clearInterval(interval);
  }, [backendStatus]);

  // =================================================================
  // 📊 RÉCUPÉRATION STATISTIQUES EN TEMPS RÉEL
  // =================================================================
  
  useEffect(() => {
    const fetchStats = async () => {
      if (backendStatus !== 'online') return;
      
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            students: data.students || 0,
            documents: data.documents || 0,
            chats: data.chats || 0,
            active_students_7days: data.active_students_7days || 0,
            tokens_status: data.tokens_status || { used_today: 0, remaining: 95000 }
          });
        }
      } catch (error) {
        console.warn('📊 Erreur récupération stats:', error.message);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 300000); // Actualisation toutes les 5 minutes
    return () => clearInterval(interval);
  }, [backendStatus]);

  // =================================================================
  // 📝 GESTION INSCRIPTION ÉLÈVE
  // =================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    // Validation côté client
    if (!formData.name.trim() || !formData.email.trim() || !formData.class_level) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();

      if (response.ok) {
        setStudent(data.student);
        setMessage({ type: 'success', text: data.message });
        setCurrentStep(2);
        setBackendStatus('online');
        
        showTemporaryMessage(`🎉 Bienvenue ${data.student.nom} ! Inscription réussie avec LLAMA 3.3 !`);
        
        // Transition automatique vers upload
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
      setMessage({ 
        type: 'error', 
        text: `Erreur de connexion: ${error.message}. Vérifiez votre connexion internet.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // =================================================================
  // 🚀 CONNEXION RAPIDE ÉLÈVE EXISTANT
  // =================================================================
  
  const handleLogin = async (email) => {
    if (!email?.trim()) {
      setMessage({ type: 'error', text: 'Veuillez saisir votre email' });
      return;
    }

    try {
      setMessage({ type: '', text: '' });
      
      const response = await fetch('/api/students/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

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
      setMessage({ 
        type: 'error', 
        text: 'Erreur de connexion au serveur. Réessayez dans quelques instants.' 
      });
    }
  };

  // =================================================================
  // 📄 GESTION DOCUMENTS UPLOADÉS
  // =================================================================
  
  const handleDocumentProcessed = (extractedText) => {
    setDocumentContext(extractedText);
    setCurrentStep(3);
    showTemporaryMessage('📄 Document analysé avec ÉtudIA ! Passons au chat IA !');
    setTimeout(() => setActiveTab('chat'), 1500);
  };

  // =================================================================
  // 🎯 COMPOSANT BOUTON NAVIGATION
  // =================================================================
  
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

  // =================================================================
  // 🎨 RENDU PRINCIPAL DE L'APPLICATION
  // =================================================================
  
  return (
    <div className="app">
      {/* Message flottant temporaire avec animations */}
      {connectionMessage.show && (
        <div className={`floating-message ${connectionMessage.type}`}>
          {connectionMessage.text}
        </div>
      )}

      {/* 🎨 HEADER RÉVOLUTIONNAIRE AVEC LOGO DYNAMIQUE */}
      <header className="app-header">
        <div className="cosmic-background"></div>
        <div className="header-content">
          {/* Section logo avec animation */}
          <div className="logo-section">
            <h1 className="app-title">
              <span className="title-etud">Étud</span>
              <span className="title-ia">IA</span>
              <span className="title-version">4.0</span>
            </h1>
            <p className="app-subtitle">L'Assistant IA Révolutionnaire pour l'Education Aficaine !</p>
            <div className="made-in-ci">
              <span className="flag">🇨🇮</span>
              <span>Made with ❤️ in Côte d'Ivoire by @Pacousstar</span>
            </div>
            <div className="llama-badge">
              <span className="llama-icon">🦙</span>
              <span>Powered by Llama 3.3-70b-versatile</span>
            </div>
          </div>
          
          {/* Section statistiques temps réel */}
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
                {stats.tokens_status.remaining > 85000 ? '🟢' : 
                 stats.tokens_status.remaining > 50000 ? '🟡' : '🔴'}
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
                <span>Tokens: {stats.tokens_status.remaining.toLocaleString()}/95k</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 📊 BARRE DE PROGRESSION INTERACTIVE */}
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

      {/* 🧭 NAVIGATION ONGLETS */}
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

      {/* 📱 CONTENU PRINCIPAL */}
      <main className="main-content">
        {/* 📝 ONGLET INSCRIPTION */}
        {activeTab === 'inscription' && (
          <div className="tab-content inscription-tab">
            <div className="content-header">
              <h2 className="main-title">🎓 Rejoignez la Révolution Éducative ÉtudIA !</h2>
              <p className="main-subtitle">
                Inscrivez-vous en moins de 2 minutes et bénéficiez des performances de ÉtudIA
              </p>
              
              {/* Alerte serveur si problème */}
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

            {/* Messages d'état */}
            {message.text && (
              <div className={`message ${message.type}`}>
                <strong>{message.type === 'error' ? '❌ ' : '✅ '}</strong>
                {message.text}
              </div>
            )}

            {/* 📋 FORMULAIRE D'INSCRIPTION */}
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

            {/* ⚡ SECTION CONNEXION RAPIDE */}
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
                  disabled={backendStatus !== 'online'}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value && backendStatus === 'online') {
                      handleLogin(e.target.value);
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const email = e.target.previousSibling.value;
                    if (email && backendStatus === 'online') handleLogin(email);
                  }}
                  className="login-button"
                  disabled={backendStatus !== 'online'}
                >
                  {backendStatus === 'online' ? 'Se connecter' : 'Serveur indisponible'}
                </button>
              </div>
            </div>

            {/* 🚀 GRILLE DES FONCTIONNALITÉS LLAMA 3.3 */}
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
                  {stats.tokens_status.remaining > 85000 ? '🟢 Optimal' : 
                   stats.tokens_status.remaining > 50000 ? '🟡 Modéré' : '🔴 Limité'}
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

            {/* 🦙 SECTION AMÉLIORATIONS LlAMA 3.3 */}
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

            {/* 💬 TÉMOIGNAGES ÉLÈVES */}
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

        {/* 📸 ONGLET UPLOAD DOCUMENTS */}
        {activeTab === 'upload' && student && (
          <UploadDocument
            student={student}
            apiUrl={API_URL}
            onDocumentProcessed={handleDocumentProcessed}
          />
        )}

        {/* 🦙 ONGLET CHAT ÉtudIA */}
        {activeTab === 'chat' && student && (
          <ChatIA
            student={student}
            apiUrl={API_URL}
            documentContext={documentContext}
          />
        )}
      </main>

      {/* 🦶 FOOTER */}
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
            <span>🦙 LlAMA 3.3 {stats.tokens_status.remaining > 85000 ? 'optimal' : 'actif'}</span>
          </div>
          
          <div className="footer-tech">
            <span>Powered by: React.js • Node.js • LlAMA 3.3 • Supabase</span>
            <span>Status: {backendStatus === 'online' ? '🟢 En ligne' : '🔴 Maintenance'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
