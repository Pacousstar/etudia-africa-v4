// App.js - VERSION UX/UI RÉVOLUTIONNAIRE AVEC RESPONSIVE PARFAIT + CORRECTIONS MonAP
import React, { useState, useEffect } from 'react';
import './App.css';
import UploadDocument from './components/UploadDocument';
import ChatIA from './components/ChatIA';

// Configuration API pour Render - DÉFINITIVE !
// ✅ REMPLACE PAR ÇA (temporaire pour débugger) :
const API_URL = 'https://etudia-v4-revolutionary.onrender.com';
console.log('🔗 API_URL FORCÉ RENDER:', API_URL);

console.log('🎉 Hébergement: Render (Backend) + Vercel (Frontend)');
console.log('✅ ÉtudIA v4.0 - READY TO ROCK!');


function App() {
  // États principaux
  const [activeTab, setActiveTab] = useState('inscription');
  const [student, setStudent] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [documentContext, setDocumentContext] = useState('');
  const [allDocuments, setAllDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  
  // États serveur et connexion
  const [backendStatus, setBackendStatus] = useState('checking');
  const [stats, setStats] = useState({ 
    students: 0, 
    documents: 0, 
    chats: 0,
    active_students_7days: 0,
    tokens_status: { used_today: 0, remaining: 95000 }
  });
  
  // États statistiques utilisateur
  const [userStats, setUserStats] = useState({
    conversations: 0,
    documents: 0,
    tokens_used: 0,
    level: 1
  });
  
  // États UI/UX
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  // 🔧 NOUVEAUX ÉTATS POUR CHAT FONCTIONNEL
  const [chatHistory, setChatHistory] = useState([]);
  const [chatTokensUsed, setChatTokensUsed] = useState(0);

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

  // 💾 FONCTIONS DE PERSISTANCE SÉCURISÉES
  const saveToStorage = (key, data) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const jsonData = JSON.stringify({
          data: data,
          timestamp: Date.now(),
          version: '4.0.0'
        });
        localStorage.setItem(`etudia_${key}`, jsonData);
        console.log(`💾 Sauvegarde ${key}:`, data);
      }
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde localStorage:', error);
    }
  };

  const loadFromStorage = (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(`etudia_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours
          if (Date.now() - parsed.timestamp < maxAge) {
            console.log(`📂 Chargement ${key}:`, parsed.data);
            return parsed.data;
          } else {
            localStorage.removeItem(`etudia_${key}`);
            console.log(`🗑️ Données ${key} expirées et supprimées`);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur chargement localStorage:', error);
    }
    return null;
  };

  const clearAllStorage = () => {
    try {
      const keys = [
        'student', 'currentStep', 'activeTab', 'documentContext', 
        'allDocuments', 'selectedDocumentId', 'userStats', 'formData',
        'chatHistory', 'chatTokensUsed'
      ];
      keys.forEach(key => {
        localStorage.removeItem(`etudia_${key}`);
      });
      console.log('🗑️ Tout le storage ÉtudIA vidé');
    } catch (error) {
      console.warn('⚠️ Erreur nettoyage storage:', error);
    }
  };

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

  // 📊 FONCTION MISE À JOUR STATISTIQUES UTILISATEUR CORRIGÉE
  const updateUserStats = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/student/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newStats = {
            conversations: data.statistics.total_conversations || 0,
            documents: data.statistics.documents_uploaded || allDocuments.length || 0,
            tokens_used: data.statistics.total_tokens_used || chatTokensUsed || 0,
            level: data.learning_profile?.level || Math.min(5, Math.max(1, Math.ceil((data.statistics.total_conversations || 0) / 10)))
          };
          
          setUserStats(newStats);
          saveToStorage('userStats', newStats);
          console.log('📊 Stats utilisateur mises à jour:', newStats);
        }
      } else {
        // Fallback avec données locales
        const fallbackStats = {
          conversations: chatHistory.length || 0,
          documents: allDocuments.length || 0,
          tokens_used: chatTokensUsed || 0,
          level: Math.min(5, Math.max(1, Math.ceil((chatHistory.length || 0) / 10)))
        };
        setUserStats(fallbackStats);
        saveToStorage('userStats', fallbackStats);
        console.log('📊 Stats fallback utilisées:', fallbackStats);
      }
    } catch (error) {
      console.warn('Erreur récupération stats utilisateur:', error);
      const localStats = {
        conversations: chatHistory.length || 0,
        documents: allDocuments.length || 0,
        tokens_used: chatTokensUsed || 0,
        level: Math.min(5, Math.max(1, Math.ceil((chatHistory.length || 0) / 10)))
      };
      setUserStats(localStats);
      saveToStorage('userStats', localStats);
    }
  };

  // 🔧 FONCTION LOGOUT CORRIGÉE
  const handleLogout = () => {
    console.log('👋 Déconnexion en cours...');
    
    if (!window.confirm('🚪 Êtes-vous sûr de vouloir vous déconnecter ?')) {
      return;
    }
    
    setStudent(null);
    setCurrentStep(1);
    setActiveTab('inscription');
    setDocumentContext('');
    setAllDocuments([]);
    setSelectedDocumentId(null);
    setUserStats({ conversations: 0, documents: 0, tokens_used: 0, level: 1 });
    setChatHistory([]);
    setChatTokensUsed(0);
    setFormData({
      name: '',
      email: '',
      class_level: '',
      school: ''
    });
    
    clearAllStorage();
    showTemporaryMessage('👋 Déconnexion réussie ! À bientôt sur ÉtudIA !', 'info');
  };

  // FONCTION LOGIN CORRIGÉE
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

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Réponse serveur vide');
      }
      
      const data = JSON.parse(responseText);

      if (response.ok) {
        const studentData = data.student;
        
        setStudent(studentData);
        setMessage({ type: 'success', text: data.message });
        setCurrentStep(2);
        setActiveTab('upload');
        setBackendStatus('online');
        
        saveToStorage('student', studentData);
        saveToStorage('currentStep', 2);
        saveToStorage('activeTab', 'upload');
        
        loadUserDocuments(studentData.id);
        updateUserStats(studentData.id);
        
        showTemporaryMessage(`🎉 Connexion réussie ! Bonjour ${studentData.nom.split(' ')[0]} !`);
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

  // FONCTION INSCRIPTION CORRIGÉE
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
      
      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Réponse serveur vide');
      }
      
      const data = JSON.parse(responseText);

      if (response.ok) {
        const studentData = data.student;
        
        setStudent(studentData);
        setMessage({ type: 'success', text: data.message });
        setCurrentStep(2);
        setBackendStatus('online');
        
        saveToStorage('student', studentData);
        saveToStorage('currentStep', 2);
        localStorage.removeItem('etudia_formData');
        
        showTemporaryMessage(`🎉 Bienvenue ${studentData.nom.split(' ')[0]} ! Inscription réussie !`);
        
        setTimeout(() => {
          setActiveTab('upload');
          saveToStorage('activeTab', 'upload');
        }, 2000);
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

  // 🔧 FONCTION DOCUMENT PROCESSÉ CORRIGÉE
  const handleDocumentProcessed = (extractedText, documentData) => {
    console.log('📄 Document traité:', {
      document_name: documentData?.nom_original,
      text_length: extractedText?.length,
      document_id: documentData?.id
    });

    setDocumentContext(extractedText);
    setCurrentStep(3);
    
    if (documentData) {
      const newDocuments = [documentData, ...allDocuments];
      setAllDocuments(newDocuments);
      setSelectedDocumentId(documentData.id);
      
      saveToStorage('documentContext', extractedText);
      saveToStorage('currentStep', 3);
      saveToStorage('allDocuments', newDocuments);
      saveToStorage('selectedDocumentId', documentData.id);
    }
    
    if (student?.id) {
      updateUserStats(student.id);
    }
    
    showTemporaryMessage('📄 Document analysé avec ÉtudIA ! Passons au chat IA !');
    setTimeout(() => {
      setActiveTab('chat');
      saveToStorage('activeTab', 'chat');
    }, 1500);
  };

  // Charger documents utilisateur
  const loadUserDocuments = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/documents/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const documents = data.documents || [];
        setAllDocuments(documents);
        saveToStorage('allDocuments', documents);
        
        if (documents.length > 0) {
          const latestDoc = documents[0];
          setSelectedDocumentId(latestDoc.id);
          setDocumentContext(latestDoc.texte_extrait);
          saveToStorage('selectedDocumentId', latestDoc.id);
          saveToStorage('documentContext', latestDoc.texte_extrait);
        }
      }
    } catch (error) {
      console.warn('📄 Erreur chargement documents:', error);
    }
  };

  // Changer de document actif
  const switchDocument = (documentId) => {
    const selectedDoc = allDocuments.find(doc => doc.id === documentId);
    if (selectedDoc) {
      setSelectedDocumentId(documentId);
      setDocumentContext(selectedDoc.texte_extrait);
      saveToStorage('selectedDocumentId', documentId);
      saveToStorage('documentContext', selectedDoc.texte_extrait);
      showTemporaryMessage(`📄 Document "${selectedDoc.nom_original}" sélectionné !`, 'success');
    }
  };

  // 🗑️ FONCTION SUPPRESSION DOCUMENT
  const handleDeleteDocument = async (documentId, documentName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${documentName}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const newDocuments = allDocuments.filter(doc => doc.id !== documentId);
        setAllDocuments(newDocuments);
        saveToStorage('allDocuments', newDocuments);
        
        if (selectedDocumentId === documentId) {
          if (newDocuments.length > 0) {
            setSelectedDocumentId(newDocuments[0].id);
            setDocumentContext(newDocuments[0].texte_extrait);
            saveToStorage('selectedDocumentId', newDocuments[0].id);
            saveToStorage('documentContext', newDocuments[0].texte_extrait);
          } else {
            setSelectedDocumentId(null);
            setDocumentContext('');
            localStorage.removeItem('etudia_selectedDocumentId');
            localStorage.removeItem('etudia_documentContext');
          }
        }

        showTemporaryMessage(`🗑️ Document "${documentName}" supprimé avec succès !`, 'success');
      } else {
        showTemporaryMessage('❌ Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      showTemporaryMessage('❌ Erreur technique lors de la suppression', 'error');
    }
  };

  // 🔧 RESTAURATION DONNÉES AU CHARGEMENT
  useEffect(() => {
    console.log('🚀 Chargement données sauvegardées...');
    
    if (typeof window === 'undefined') return;
    
    try {
      const savedStudent = loadFromStorage('student');
      const savedCurrentStep = loadFromStorage('currentStep');
      const savedActiveTab = loadFromStorage('activeTab');
      const savedDocumentContext = loadFromStorage('documentContext');
      const savedAllDocuments = loadFromStorage('allDocuments');
      const savedSelectedDocumentId = loadFromStorage('selectedDocumentId');
      const savedUserStats = loadFromStorage('userStats');
      const savedFormData = loadFromStorage('formData');
      const savedChatHistory = loadFromStorage('chatHistory');
      const savedChatTokensUsed = loadFromStorage('chatTokensUsed');

      if (savedStudent && savedStudent.id) {
        console.log('✅ Élève trouvé en localStorage:', savedStudent.nom);
        setStudent(savedStudent);
        
        const stepToRestore = savedCurrentStep || 2;
        setCurrentStep(stepToRestore);
        
        const tabToRestore = savedActiveTab || (stepToRestore >= 3 ? 'chat' : 'upload');
        setActiveTab(tabToRestore);
        
        if (savedDocumentContext) {
          setDocumentContext(savedDocumentContext);
          console.log('📄 Contexte document restauré');
        }
        
        if (savedAllDocuments && Array.isArray(savedAllDocuments)) {
          setAllDocuments(savedAllDocuments);
          console.log(`📚 ${savedAllDocuments.length} documents restaurés`);
        }
        
        if (savedSelectedDocumentId) {
          setSelectedDocumentId(savedSelectedDocumentId);
        }
        
        if (savedChatHistory && Array.isArray(savedChatHistory)) {
          setChatHistory(savedChatHistory);
          console.log(`💬 ${savedChatHistory.length} messages de chat restaurés`);
        }
        
        if (savedChatTokensUsed) {
          setChatTokensUsed(savedChatTokensUsed);
          console.log(`🔋 ${savedChatTokensUsed} tokens de chat restaurés`);
        }
        
        if (savedUserStats) {
          setUserStats(savedUserStats);
        } else {
          updateUserStats(savedStudent.id);
        }
        
        if (!savedAllDocuments || savedAllDocuments.length === 0) {
          loadUserDocuments(savedStudent.id);
        }
        
        showTemporaryMessage(
          `👋 Re-bienvenue ${savedStudent.nom.split(' ')[0]} ! Session restaurée !`, 
          'success'
        );
      } else {
        console.log('📝 Aucune session sauvegardée');
        
        if (savedFormData) {
          setFormData(savedFormData);
          console.log('📝 Formulaire d\'inscription restauré');
        }
      }
    } catch (error) {
      console.error('❌ Erreur restauration données:', error);
      clearAllStorage();
    }
  }, []);

  // Sauvegarde états chat
  useEffect(() => {
    if (chatHistory.length > 0) {
      saveToStorage('chatHistory', chatHistory);
    }
  }, [chatHistory]);

  useEffect(() => {
    if (chatTokensUsed > 0) {
      saveToStorage('chatTokensUsed', chatTokensUsed);
    }
  }, [chatTokensUsed]);

  // Sauvegarde autres états
  useEffect(() => {
    if (student) saveToStorage('student', student);
  }, [student]);

  useEffect(() => {
    if (currentStep) saveToStorage('currentStep', currentStep);
  }, [currentStep]);

  useEffect(() => {
    if (activeTab) saveToStorage('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (documentContext) saveToStorage('documentContext', documentContext);
  }, [documentContext]);

  useEffect(() => {
    if (allDocuments.length > 0) saveToStorage('allDocuments', allDocuments);
  }, [allDocuments]);

  useEffect(() => {
    if (selectedDocumentId) saveToStorage('selectedDocumentId', selectedDocumentId);
  }, [selectedDocumentId]);

  useEffect(() => {
    if (userStats) saveToStorage('userStats', userStats);
  }, [userStats]);

  useEffect(() => {
    if (formData.name || formData.email) {
      saveToStorage('formData', formData);
    }
  }, [formData]);

  // Vérification serveur
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/health`);
        
        if (response.ok) {
          const data = await response.json();
          setBackendStatus('online');
          
          if (data.tokens_status) {
            setStats(prev => ({ ...prev, tokens_status: data.tokens_status }));
          }
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

// 🎉 MESSAGE DE VICTOIRE QUAND SERVEUR REVIENT EN LIGNE
useEffect(() => {
  if (backendStatus === 'online') {
    const wasOffline = localStorage.getItem('etudia_was_offline');
    
    if (wasOffline === 'true') {
      showTemporaryMessage(
        '🎉 ÉtudIA est de retour ! Serveur opérationnel sur Render ! ✨', 
        'success', 
        5000
      );
      localStorage.removeItem('etudia_was_offline');
    }
  } else if (backendStatus === 'offline') {
    localStorage.setItem('etudia_was_offline', 'true');
  }
}, [backendStatus]);
  
  // Récupération statistiques
  useEffect(() => {
    const fetchStats = async () => {
      if (backendStatus !== 'online') return;
      
      try {
        const response = await fetch(`${API_URL}/api/stats`);
        
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
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [backendStatus]);

  // Charger données utilisateur après connexion
  useEffect(() => {
    if (student?.id) {
      loadUserDocuments(student.id);
      updateUserStats(student.id);
    }
  }, [student]);

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

      {/* HEADER RÉVOLUTIONNAIRE */}
      <header className="app-header revolutionary">
        <div className="cosmic-background"></div>
        
        <div className="header-content">
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
          </div>
        </div>
      </header>

      {/* Statistiques utilisateur */}
     {/* 🔋 NOUVEAU DESIGN TOKENS RÉVOLUTIONNAIRE */}
{student && (
  <div className="user-tokens-display-v2">
    <div className="tokens-container">
      <div className="tokens-header-main">
        <div className="tokens-icon-wrapper">
          <span className="tokens-icon">🔋</span>
          <div className="tokens-pulse"></div>
        </div>
        <div className="tokens-info">
          <h3 className="tokens-title">Consommation IA Aujourd'hui</h3>
          <div className="tokens-value-display">
            <span className="tokens-number">{userStats.tokens_used.toLocaleString('fr-FR')}</span>
            <span className="tokens-unit">tokens</span>
          </div>
        </div>
        <div className="tokens-status-badge">
          <span className={`status-indicator ${
            userStats.tokens_used < 1000 ? 'optimal' : 
            userStats.tokens_used < 5000 ? 'moderate' : 'high'
          }`}></span>
          <span className="status-text">
            {userStats.tokens_used < 1000 ? 'Optimal' : 
             userStats.tokens_used < 5000 ? 'Modéré' : 'Intensif'}
          </span>
        </div>
      </div>

      <div className="tokens-progress-wrapper">
        <div className="tokens-progress-track">
          <div 
            className="tokens-progress-fill-animated"
            style={{ 
              width: `${Math.min(100, (userStats.tokens_used / 10000) * 100)}%`,
              background: userStats.tokens_used < 1000 ? 
                'linear-gradient(90deg, #00ff88, #00cc6a)' :
                userStats.tokens_used < 5000 ?
                'linear-gradient(90deg, #ffa500, #ff8c00)' :
                'linear-gradient(90deg, #ff6b6b, #ee5a52)'
            }}
          >
            <div className="tokens-progress-shimmer"></div>
          </div>
        </div>
        <div className="tokens-progress-labels">
          <span>0</span>
          <span>10K tokens/jour</span>
        </div>
      </div>

      <div className="tokens-stats-grid">
        <div className="stat-card conversations">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <div className="stat-number">{userStats.conversations}</div>
            <div className="stat-label">Conversations</div>
          </div>
          <div className="stat-trend">
            {userStats.conversations > 10 ? '📈' : '🚀'}
          </div>
        </div>

        <div className="stat-card documents">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <div className="stat-number">{userStats.documents}</div>
            <div className="stat-label">Documents</div>
          </div>
          <div className="stat-trend">
            {userStats.documents > 5 ? '📚' : '📝'}
          </div>
        </div>

        <div className="stat-card level">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-number">Niveau {userStats.level}/5</div>
            <div className="stat-label">Expertise</div>
          </div>
          <div className="stat-trend">
            {'⭐'.repeat(userStats.level)}
          </div>
        </div>

        <div className="stat-card efficiency">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-number">
              {userStats.conversations > 0 ? 
                Math.round(userStats.tokens_used / userStats.conversations) : 0}
            </div>
            <div className="stat-label">Tokens/Conv</div>
          </div>
          <div className="stat-trend">
            {(userStats.conversations > 0 && (userStats.tokens_used / userStats.conversations) < 500) ? '🔥' : '💡'}
          </div>
        </div>
      </div>

      <div className="tokens-tips">
        {userStats.tokens_used < 500 && (
          <div className="tip optimal">
            💡 <strong>Excellent !</strong> Consommation optimale. Continuez comme ça !
          </div>
        )}
        {userStats.tokens_used >= 500 && userStats.tokens_used < 2000 && (
          <div className="tip moderate">
            ⚡ <strong>Bon rythme !</strong> Vous utilisez ÉtudIA de manière équilibrée.
          </div>
        )}
        {userStats.tokens_used >= 2000 && (
          <div className="tip intensive">
            🔥 <strong>Utilisateur intensif !</strong> Vous exploitez bien ÉtudIA !
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {/* Sélecteur de documents */}
      {student && allDocuments.length > 0 && (
        <div className="document-selector">
          <h3>📄 Vos Documents Analysés</h3>
          <div className="documents-grid">
            {allDocuments.map((doc) => (
              <button
                key={doc.id}
                className={`document-card ${selectedDocumentId === doc.id ? 'active' : ''}`}
                onClick={() => switchDocument(doc.id)}
              >
                <button
                  className="document-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDocument(doc.id, doc.nom_original);
                  }}
                  title={`Supprimer "${doc.nom_original}"`}
                >
                  🗑️
                </button>
                
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

      {/* 🔧 NAVIGATION ONGLETS AVEC BOUTON DÉCONNEXION STYLÉ */}
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
        
        {/* 🚪 BOUTON DÉCONNEXION STYLÉ */}
        {student && (
          <button
            className="logout-button"
            onClick={handleLogout}
            title="Se déconnecter de ÉtudIA"
          >
            <span className="logout-icon">🚪</span>
            <span className="logout-label">Déconnexion</span>
          </button>
        )}
      </nav>

      {/* CONTENU PRINCIPAL */}
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
              <div className="form-header">
                <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '800' }}>
                  🚀 Rejoindre ÉtudIA
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: '2rem' }}>
                  Créez votre compte en quelques secondes
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  👤 Nom complet *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Entrez votre nom et prénom"
                  className="form-input"
                  disabled={backendStatus !== 'online'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  📧 Email *
                </label>
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
                  <label htmlFor="class_level" className="form-label">
                    🎓 Classe *
                  </label>
                  <select
                    id="class_level"
                    name="class_level"
                    value={formData.class_level}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                    disabled={backendStatus !== 'online'}
                  >
                    <option value="">Choisissez votre classe</option>
                    {classLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="school" className="form-label">
                    🏫 École
                  </label>
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
                    ⏳ Inscription en cours...
                  </>
                ) : backendStatus !== 'online' ? (
                  <>⏳ Attente serveur EtudIA...</>
                ) : (
                  <>🚀 Rejoindre ÉtudIA Maintenant !</>
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
                  Mémoire avancée en mathématique et compréhension française
                </p>
                <div className="feature-status status-active">✅ Actif</div>
              </div>
              
              <div className="feature-card step-mode">
                <span className="feature-icon">🔁</span>
                <h3 className="feature-title">Mode Étape par Étape</h3>
                <p className="feature-description">
                  Guidage progressif "📊 Étape 1/4" optimisé par la logique améliorée de ÉtudIA
                </p>
                <div className="feature-status status-active">✅ Optimisé</div>
              </div>
              
              <div className="feature-card direct-mode">
                <span className="feature-icon">✅</span>
                <h3 className="feature-title">Mode Solution Directe</h3>
                <p className="feature-description">
                  Solutions complètes instantanées avec ÉtudIA
                </p>
                <div className="feature-status status-active">✅ Accéléré</div>
              </div>
              
              <div className="feature-card ocr">
                <span className="feature-icon">📸</span>
                <h3 className="feature-title">OCR Révolutionnaire</h3>
                <p className="feature-description">
                  Extraction texte 95% de précision analysée par ÉtudIA
                </p>
                <div className="feature-status status-active">✅ Analysé</div>
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

            {/* Section améliorations */}
            <div className="llama-improvements-section">
              <h3 className="section-title">🦙 Pourquoi ÉtudIA change tout ?</h3>
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

        {/* 🔧 ONGLET CHAT IA CORRIGÉ AVEC TOUS LES PROPS */}
        {activeTab === 'chat' && student && (
  <ChatIA
    student={student}
    apiUrl={API_URL}
    documentContext={documentContext}
    allDocuments={allDocuments}
    selectedDocumentId={selectedDocumentId}  // ✅ PROP AJOUTÉE
    chatHistory={chatHistory}               // ✅ PROP AJOUTÉE
    setChatHistory={setChatHistory}         // ✅ PROP AJOUTÉE  
    chatTokensUsed={chatTokensUsed}         // ✅ PROP AJOUTÉE
    setChatTokensUsed={setChatTokensUsed}   // ✅ PROP AJOUTÉE
    onStatsUpdate={updateUserStats}         // ✅ PROP AJOUTÉE
  />
)}
      </main>

      {/* 🔧 FOOTER CORRIGÉ SANS COMMENTAIRES */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-main">
            <p>&copy; 2025 ÉtudIA v4.0 - Révolutionnons l'éducation Africaine ! 🌍</p>
            <p>Développé avec ❤️ par <strong>@Pacousstar</strong> - Côte d'Ivoire</p>
          </div>
        
          <div className="footer-feedback">
            <a 
              href="https://etudia-v4.gsnexpertises.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-feedback-link"
            >
              📝 Donner votre avis testeur
            </a>
          </div>
        
          <div className="footer-stats">
            <span>🚀 {stats.students.toLocaleString()}+ élèves</span>
            <span>📚 {stats.documents.toLocaleString()}+ documents</span>
            <span>💬 {stats.chats.toLocaleString()}+ conversations</span>
            <span>🦙 07 07 80 18 17</span>
          </div>
          
          <div className="footer-tech">
            <span>Status: {backendStatus === 'online' ? '🟢 En ligne' : '🔴 Maintenance'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
