// ===================================================================
// 🎓 APP.JS COMPLET DÉFINITIF - ÉtudIA v2.0 
// Avec système Multi-Clés Groq intégré
// ===================================================================

import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// 🔑 Import des services Groq multi-clés
import GroqService from './services/groqService';
import GroqKeyMonitor from './components/GroqKeyMonitor';

function App() {
  // ===================================================================
  // 🔑 INITIALISATION DU SERVICE GROQ MULTI-CLÉS
  // ===================================================================
  const [groqService] = useState(() => {
    try {
      return new GroqService();
    } catch (error) {
      console.error('❌ Erreur initialisation GroqService:', error.message);
      return null;
    }
  });

  // ===================================================================
  // 📊 ÉTATS DE L'APPLICATION
  // ===================================================================
  
  // Navigation et interface
  const [activeTab, setActiveTab] = useState('accueil');
  const [currentStep, setCurrentStep] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Documents et fichiers
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [documentText, setDocumentText] = useState('');
  
  // Conversation et messages
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  
  // Résultats IA
  const [summary, setSummary] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  // Inscription et authentification
  const [userInfo, setUserInfo] = useState({
    nom: '',
    prenom: '',
    email: '',
    etablissement: '',
    niveau: '',
    filiere: ''
  });
  const [isRegistered, setIsRegistered] = useState(false);
  const [quickLoginCode, setQuickLoginCode] = useState('');
  
  // 🔑 Statut des clés API
  const [apiStatus, setApiStatus] = useState({
    available: 0,
    total: 0,
    currentKey: 1
  });
  
  // Messages et notifications
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  
  // Références pour le scroll
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // ===================================================================
  // 🔄 EFFETS ET MISE À JOUR
  // ===================================================================
  
  // Mise à jour du statut des clés API
  useEffect(() => {
    if (groqService) {
      const updateApiStatus = () => {
        try {
          const status = groqService.getDetailedStatus();
          setApiStatus({
            available: status.availableKeys,
            total: status.totalKeys,
            currentKey: status.currentKeyIndex
          });
        } catch (error) {
          console.error('Erreur mise à jour statut API:', error);
        }
      };

      updateApiStatus();
      const interval = setInterval(updateApiStatus, 30000); // Toutes les 30 secondes

      return () => clearInterval(interval);
    }
  }, [groqService]);

  // Auto-scroll des messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ===================================================================
  // 🛠️ FONCTIONS UTILITAIRES
  // ===================================================================
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 5000);
  };

  const resetForm = () => {
    setUserInput('');
    setDocumentText('');
    setSummary('');
    setGeneratedQuestions('');
    setAiResponse('');
  };

  // ===================================================================
  // 🔑 FONCTIONS API GROQ AVEC MULTI-CLÉS
  // ===================================================================
  
  // 💬 Envoyer un message à l'IA
  const handleSendMessage = async (message = userInput) => {
    if (!message.trim()) return;
    if (!groqService) {
      showNotification('Service IA non disponible. Vérifiez vos clés API.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      // Ajouter le message utilisateur
      const newUserMessage = { role: 'user', content: message, timestamp: new Date() };
      const updatedHistory = [...conversationHistory, newUserMessage];
      setMessages(prev => [...prev, newUserMessage]);
      setConversationHistory(updatedHistory);
      
      // Appel à l'IA avec rotation automatique des clés
      const response = await groqService.chat(message, updatedHistory, {
        temperature: 0.7,
        max_tokens: 1500
      });

      const aiMessage = {
        role: 'assistant',
        content: response.choices[0].message.content,
        timestamp: new Date()
      };

      // Mettre à jour les messages et l'historique
      setMessages(prev => [...prev, aiMessage]);
      setConversationHistory(prev => [...prev, aiMessage]);
      setAiResponse(response.choices[0].message.content);
      
      showNotification('✅ Réponse générée avec succès !', 'success');

    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la communication avec l\'IA.';
      
      if (error.message.includes('bloquées')) {
        errorMessage = '🚫 Toutes les clés API sont temporairement bloquées. Veuillez réessayer dans quelques minutes.';
      } else if (error.message.includes('quota')) {
        errorMessage = '📊 Quota API atteint. Le système passe automatiquement à une autre clé.';
      } else if (error.message.includes('disponible')) {
        errorMessage = '🔑 Aucune clé API disponible. Vérifiez votre configuration.';
      }
      
      showNotification(errorMessage, 'error');
      
      // Ajouter un message d'erreur dans la conversation
      const errorMsg = {
        role: 'assistant',
        content: `❌ ${errorMessage}`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
      
    } finally {
      setIsLoading(false);
      setUserInput('');
    }
  };

  // 📄 Traiter un document avec l'IA
  const handleProcessDocument = async (instruction) => {
    if (!documentText.trim()) {
      showNotification('Veuillez d\'abord charger un document.', 'error');
      return;
    }
    
    if (!groqService) {
      showNotification('Service IA non disponible.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await groqService.processDocument(documentText, instruction, {
        temperature: 0.5,
        max_tokens: 2000
      });

      const result = response.choices[0].message.content;
      setAiResponse(result);
      
      // Ajouter à l'historique des messages
      const userMsg = { role: 'user', content: `Document analysé avec instruction: ${instruction}`, timestamp: new Date() };
      const aiMsg = { role: 'assistant', content: result, timestamp: new Date() };
      
      setMessages(prev => [...prev, userMsg, aiMsg]);
      setConversationHistory(prev => [...prev, userMsg, aiMsg]);
      
      showNotification('✅ Document traité avec succès !', 'success');
      
    } catch (error) {
      console.error('❌ Erreur traitement document:', error);
      showNotification(`❌ Erreur lors du traitement: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 📝 Générer un résumé
  const handleGenerateSummary = async () => {
    if (!documentText.trim()) {
      showNotification('Aucun texte à résumer.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await groqService.generateSummary(documentText);
      const summaryText = response.choices[0].message.content;
      
      setSummary(summaryText);
      setAiResponse(summaryText);
      
      showNotification('✅ Résumé généré avec succès !', 'success');
      
    } catch (error) {
      console.error('❌ Erreur génération résumé:', error);
      showNotification(`❌ Erreur lors de la génération du résumé: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ❓ Générer des questions
  const handleGenerateQuestions = async (questionCount = 5) => {
    if (!documentText.trim()) {
      showNotification('Aucun texte pour générer des questions.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await groqService.generateQuestions(documentText, questionCount);
      const questionsText = response.choices[0].message.content;
      
      setGeneratedQuestions(questionsText);
      setAiResponse(questionsText);
      
      showNotification('✅ Questions générées avec succès !', 'success');
      
    } catch (error) {
      console.error('❌ Erreur génération questions:', error);
      showNotification(`❌ Erreur lors de la génération: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ===================================================================
  // 📁 GESTION DES FICHIERS
  // ===================================================================
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Vérification du type de fichier
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      showNotification('Type de fichier non supporté. Utilisez: .txt, .pdf, .doc, .docx', 'error');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      setDocumentText(text);
      setSelectedDocument(file.name);
      setUploadedFiles(prev => [...prev, { name: file.name, size: file.size, type: file.type }]);
      showNotification(`✅ Fichier "${file.name}" chargé avec succès !`, 'success');
      setCurrentStep(2);
    };

    reader.onerror = () => {
      showNotification('❌ Erreur lors de la lecture du fichier.', 'error');
    };

    reader.readAsText(file);
  };

  // ===================================================================
  // 👤 GESTION UTILISATEUR
  // ===================================================================
  
  const handleRegistration = (e) => {
    e.preventDefault();
    
    if (!userInfo.nom || !userInfo.prenom || !userInfo.email) {
      showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    // Générer un code de connexion rapide
    const quickCode = `EI${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setQuickLoginCode(quickCode);
    setIsRegistered(true);
    setCurrentStep(2);
    
    showNotification(`✅ Inscription réussie ! Votre code rapide: ${quickCode}`, 'success');
  };

  const handleQuickLogin = (code) => {
    if (code === quickLoginCode) {
      setIsRegistered(true);
      setCurrentStep(2);
      showNotification('✅ Connexion réussie !', 'success');
    } else {
      showNotification('❌ Code de connexion invalide.', 'error');
    }
  };

  // ===================================================================
  // 🎨 RENDU DU STATUT API
  // ===================================================================
  
  const renderApiStatus = () => {
    if (!groqService) {
      return (
        <div className="api-status error">
          <span>❌</span>
          <span>Service IA indisponible</span>
        </div>
      );
    }

    const statusColor = apiStatus.available > 0 ? '#4CAF50' : '#f44336';
    
    return (
      <div className="api-status" style={{ backgroundColor: statusColor }}>
        <span>🔑</span>
        <span>Clés: {apiStatus.available}/{apiStatus.total}</span>
        <span>Active: {apiStatus.currentKey}</span>
      </div>
    );
  };

  // ===================================================================
  // 🧭 RENDU DES ONGLETS
  // ===================================================================
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'accueil':
        return (
          <div className="tab-content">
            <div className="content-header">
              <h2 className="main-title">Bienvenue sur ÉtudIA v2.0</h2>
              <p className="main-subtitle">
                Votre assistant IA révolutionnaire pour vos études, conçu spécialement pour les étudiants africains !
              </p>
            </div>

            {!isRegistered ? (
              <div className="inscription-section">
                <form onSubmit={handleRegistration} className="inscription-form">
                  <h3>📝 Inscription rapide</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nom *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={userInfo.nom}
                        onChange={(e) => setUserInfo({...userInfo, nom: e.target.value})}
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Prénom *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={userInfo.prenom}
                        onChange={(e) => setUserInfo({...userInfo, prenom: e.target.value})}
                        placeholder="Votre prénom"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                      placeholder="votre.email@exemple.com"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Établissement</label>
                      <input
                        type="text"
                        className="form-input"
                        value={userInfo.etablissement}
                        onChange={(e) => setUserInfo({...userInfo, etablissement: e.target.value})}
                        placeholder="Université, École..."
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Niveau</label>
                      <select
                        className="form-select"
                        value={userInfo.niveau}
                        onChange={(e) => setUserInfo({...userInfo, niveau: e.target.value})}
                      >
                        <option value="">Sélectionnez</option>
                        <option value="licence1">Licence 1</option>
                        <option value="licence2">Licence 2</option>
                        <option value="licence3">Licence 3</option>
                        <option value="master1">Master 1</option>
                        <option value="master2">Master 2</option>
                        <option value="doctorat">Doctorat</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Filière</label>
                    <input
                      type="text"
                      className="form-input"
                      value={userInfo.filiere}
                      onChange={(e) => setUserInfo({...userInfo, filiere: e.target.value})}
                      placeholder="Informatique, Médecine, Droit..."
                    />
                  </div>

                  <button type="submit" className="submit-button">
                    🚀 Commencer avec ÉtudIA
                  </button>
                </form>

                <div className="login-section">
                  <h4>⚡ Connexion rapide</h4>
                  <p>Vous avez déjà un code ? Connectez-vous rapidement !</p>
                  <div className="quick-login">
                    <input
                      type="text"
                      className="login-input"
                      placeholder="Entrez votre code (ex: EI123ABC)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleQuickLogin(e.target.value);
                        }
                      }}
                    />
                    <button 
                      className="login-button"
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        handleQuickLogin(input.value);
                      }}
                    >
                      🔓 Se connecter
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="welcome-back">
                <h3>👋 Bon retour, {userInfo.prenom} !</h3>
                <p>Votre code de connexion rapide : <strong>{quickLoginCode}</strong></p>
                <div className="features-grid">
                  <div className="feature-card" onClick={() => setActiveTab('document')}>
                    <div className="feature-icon">📄</div>
                    <h4>Analyse de documents</h4>
                    <p>Uploadez vos cours et obtenez des résumés, questions et explications.</p>
                  </div>
                  
                  <div className="feature-card" onClick={() => setActiveTab('chat')}>
                    <div className="feature-icon">💬</div>
                    <h4>Assistant IA</h4>
                    <p>Posez vos questions et obtenez de l'aide personnalisée pour vos études.</p>
                  </div>
                  
                  <div className="feature-card" onClick={() => setActiveTab('outils')}>
                    <div className="feature-icon">🛠️</div>
                    <h4>Outils d'étude</h4>
                    <p>Générateurs de résumés, de questions et d'exercices adaptatifs.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'document':
        return (
          <div className="tab-content">
            <div className="content-header">
              <h2 className="main-title">📄 Analyse de Documents</h2>
              <p className="main-subtitle">
                Uploadez vos documents et laissez ÉtudIA les analyser pour vous !
              </p>
            </div>

            <div className="document-upload-section">
              <div className="upload-area">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,.doc,.docx"
                  style={{ display: 'none' }}
                />
                
                <button 
                  className="upload-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Choisir un document
                </button>
                
                <p className="upload-info">
                  Formats supportés: .txt, .pdf, .doc, .docx
                </p>
              </div>

              {selectedDocument && (
                <div className="selected-document">
                  <h4>📋 Document sélectionné: {selectedDocument}</h4>
                  
                  <div className="document-actions">
                    <button 
                      className="action-button"
                      onClick={handleGenerateSummary}
                      disabled={isLoading}
                    >
                      📝 Générer un résumé
                    </button>
                    
                    <button 
                      className="action-button"
                      onClick={() => handleGenerateQuestions(5)}
                      disabled={isLoading}
                    >
                      ❓ Générer des questions
                    </button>
                    
                    <button 
                      className="action-button"
                      onClick={() => handleProcessDocument("Explique-moi les concepts clés de ce document")}
                      disabled={isLoading}
                    >
                      💡 Expliquer les concepts
                    </button>
                  </div>
                </div>
              )}

              {documentText && (
                <div className="document-preview">
                  <h4>👀 Aperçu du contenu:</h4>
                  <div className="text-preview">
                    {documentText.substring(0, 500)}...
                  </div>
                </div>
              )}
            </div>

            {aiResponse && (
              <div className="ai-response">
                <h4>🤖 Réponse d'ÉtudIA:</h4>
                <div className="response-content">
                  {aiResponse}
                </div>
              </div>
            )}
          </div>
        );

      case 'chat':
        return (
          <div className="tab-content">
            <div className="content-header">
              <h2 className="main-title">💬 Assistant IA</h2>
              <p className="main-subtitle">
                Discutez avec ÉtudIA et obtenez de l'aide pour vos études !
              </p>
            </div>

            <div className="chat-container">
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="welcome-message">
                    <div className="welcome-avatar">🤖</div>
                    <div className="welcome-text">
                      <h3>Salut {userInfo.prenom || 'étudiant'} ! 👋</h3>
                      <p>Je suis ÉtudIA, votre assistant IA personnel. Comment puis-je vous aider aujourd'hui ?</p>
                      <div className="suggestion-chips">
                        <button 
                          className="suggestion-chip"
                          onClick={() => setUserInput("Explique-moi le concept de photosynthèse")}
                        >
                          🌱 Expliquer un concept
                        </button>
                        <button 
                          className="suggestion-chip"
                          onClick={() => setUserInput("Aide-moi à réviser pour mon examen de mathématiques")}
                        >
                          📚 Aide aux révisions
                        </button>
                        <button 
                          className="suggestion-chip"
                          onClick={() => setUserInput("Comment rédiger une dissertation ?")}
                        >
                          ✍️ Méthodes d'étude
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((message, index) => (
                      <div key={index} className={`message ${message.role} ${message.isError ? 'error' : ''}`}>
                        <div className="message-avatar">
                          {message.role === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className="message-content">
                          <div className="message-text">{message.content}</div>
                          <div className="message-time">
                            {message.timestamp?.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="chat-input-container">
                {isLoading && (
                  <div className="loading-indicator">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>ÉtudIA réfléchit... (Clé {apiStatus.currentKey})</span>
                  </div>
                )}
                
                <div className="chat-input-wrapper">
                  <textarea
                    className="chat-input"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Tapez votre message..."
                    rows="3"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <button 
                    className="send-button"
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !userInput.trim()}
                  >
                    {isLoading ? '⏳' : '📤'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'outils':
        return (
          <div className="tab-content">
            <div className="content-header">
              <h2 className="main-title">🛠️ Outils d'Étude</h2>
              <p className="main-subtitle">
                Une collection d'outils IA pour optimiser votre apprentissage
              </p>
            </div>

            <div className="tools-grid">
              <div className="tool-card">
                <div className="tool-icon">📝</div>
                <h3>Générateur de Résumés</h3>
                <p>Transformez vos longs documents en résumés clairs et concis</p>
                <button 
                  className="tool-button"
                  onClick={() => setActiveTab('document')}
                >
                  Utiliser
                </button>
              </div>

              <div className="tool-card">
                <div className="tool-icon">❓</div>
                <h3>Générateur de Questions</h3>
                <p>Créez des questions d'examen à partir de vos cours</p>
                <button 
                  className="tool-button"
                  onClick={() => setActiveTab('document')}
                >
                  Utiliser
                </button>
              </div>

              <div className="tool-card">
                <div className="tool-icon">🧠</div>
                <h3>Explication de Concepts</h3>
                <p>Obtenez des explications simples pour les concepts complexes</p>
                <button 
                  className="tool-button"
                  onClick={() => setActiveTab('chat')}
                >
                  Utiliser
                </button>
              </div>

              <div className="tool-card">
                <div className="tool-icon">📚</div>
                <h3>Assistant de Révision</h3>
                <p>Planifiez et optimisez vos sessions de révision</p>
                <button 
                  className="tool-button"
                  onClick={() => setActiveTab('chat')}
                >
                  Utiliser
                </button>
              </div>
            </div>

            <div className="statistics-section">
              <h3>📊 Vos Statistiques</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">{messages.filter(m => m.role === 'user').length}</div>
                  <div className="stat-label">Messages envoyés</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{uploadedFiles.length}</div>
                  <div className="stat-label">Documents analysés</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{apiStatus.available}</div>
                  <div className="stat-label">Clés API actives</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Onglet non trouvé</div>;
    }
  };

  // ===================================================================
  // 🎨 RENDU PRINCIPAL
  // ===================================================================
  
  return (
    <div className="app">
      {/* Header révolutionnaire */}
      <header className="app-header revolutionary">
        <div className="cosmic-background"></div>
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">
              <span className="title-etud">Étud</span>
              <span className="title-ia">IA</span>
              <span className="title-version">v2.0</span>
            </h1>
            <p className="app-subtitle">
              Votre assistant IA révolutionnaire pour vos études !
            </p>
            <div className="made-in-ci">
              <span className="flag">🇨🇮</span>
              <span>Made in Côte d'Ivoire</span>
            </div>
            
            {/* 🔑 Statut des clés API */}
            <div className="api-status-container">
              {renderApiStatus()}
            </div>
          </div>
        </div>
      </header>

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
            <div className="step-number">1</div>
            <div className="step-label">Inscription</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Documents</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Assistant IA</div>
          </div>
        </div>
      </div>

      {/* Navigation des onglets */}
      {isRegistered && (
        <nav className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'accueil' ? 'active' : ''}`}
            onClick={() => setActiveTab('accueil')}
          >
            <span className="tab-icon">🏠</span>
            <span className="tab-label">Accueil</span>
          </button>
          
          <button 
            className={`tab-button ${activeTab === 'document' ? 'active' : ''}`}
            onClick={() => setActiveTab('document')}
          >
            <span className="tab-icon">📄</span>
            <span className="tab-label">Documents</span>
            {uploadedFiles.length > 0 && (
              <span className="tab-badge">{uploadedFiles.length}</span>
            )}
          </button>
          
          <button 
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="tab-icon">💬</span>
            <span className="tab-label">Assistant IA</span>
            {messages.length > 0 && (
              <span className="tab-badge">{messages.filter(m => m.role === 'user').length}</span>
            )}
          </button>
          
          <button 
            className={`tab-button ${activeTab === 'outils' ? 'active' : ''}`}
            onClick={() => setActiveTab('outils')}
          >
            <span className="tab-icon">🛠️</span>
            <span className="tab-label">Outils</span>
          </button>
        </nav>
      )}

      {/* Contenu principal */}
      <main className="main-content enhanced">
        {renderTabContent()}
      </main>

      {/* Notification flottante */}
      {notification.show && (
        <div className={`floating-message ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* 🔑 Moniteur des clés API Groq */}
      {groqService && <GroqKeyMonitor groqService={groqService} />}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-main">
            <p><strong>ÉtudIA v2.0</strong> - Assistant IA pour étudiants africains</p>
            <p>Développé avec ❤️ en Côte d'Ivoire 🇨🇮</p>
            
            <div className="footer-stats">
              <span>🤖 IA Avancée</span>
              <span>🔐 Multi-Clés API</span>
              <span>📱 Responsive Design</span>
              <span>🌍 Made in Africa</span>
            </div>
            
            <div className="footer-tech">
              <span>Powered by React</span>
              <span>•</span>
              <span>Groq LLaMA</span>
              <span>•</span>
              <span>CSS3 Animations</span>
              <span>•</span>
              <span>African Innovation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
