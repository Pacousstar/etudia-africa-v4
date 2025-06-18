// App.js - VERSION UX/UI RÉVOLUTIONNAIRE AVEC RESPONSIVE PARFAIT + AMÉLIORATIONS
import React, { useState, useEffect } from 'react';
import './App.css';
import UploadDocument from './components/UploadDocument';
import ChatIA from './components/ChatIA';

// Configuration API pour Render
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production'  
  ? 'https://etudia-v4-revolutionary.onrender.com'  // NOUVELLE URL RENDER
  : 'http://localhost:10000');  // Port local changé

console.log('🔗 API_URL:', API_URL || 'PROXY LOCAL ACTIVÉ');
console.log('🏢 Hébergement: Render.com (Frankfurt)');

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
  
  // 🔋 NOUVEAUX ÉTATS POUR STATISTIQUES UTILISATEUR
  const [userStats, setUserStats] = useState({
    conversations: 0,
    documents: 0,
    tokens_used: 0,
    level: 1
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

  // 🔧 INJECTION STYLES CSS POUR FORMULAIRE CENTRÉ + COMPTEURS ORANGE
  useEffect(() => {
    const additionalStyles = `
      /* 🟠 FORMULAIRE D'INSCRIPTION CENTRÉ */
      .inscription-form {
        background: linear-gradient(135deg, #FF6B35, #FF8C00) !important;
        padding: 2.5rem;
        border-radius: 1.5rem;
        box-shadow: 0 12px 35px rgba(255, 107, 53, 0.3);
        position: relative;
        overflow: hidden;
        margin: 2rem auto; /* 📐 CENTRAGE AJOUTÉ */
        max-width: 600px; /* 📐 LARGEUR LIMITÉE POUR CENTRAGE */
        animation: formSlideIn 0.6s ease-out;
      }

      /* 🟠 COMPTEURS HEADER EN ORANGE + VISIBILITÉ */
      .stats-section .stat-number {
        color: #FF8C00 !important;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8) !important;
        font-weight: 900 !important;
        font-size: 1.1rem !important;
        background: rgba(255, 255, 255, 0.1);
        padding: 0.25rem 0.5rem;
        border-radius: 0.5rem;
        backdrop-filter: blur(10px);
      }

      .stats-section .stat-label {
        color: rgba(255, 255, 255, 0.95) !important;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8) !important;
        font-weight: 600 !important;
        background: rgba(0, 0, 0, 0.2);
        padding: 0.25rem 0.5rem;
        border-radius: 0.5rem;
        margin-top: 0.25rem;
      }

      .stats-section .stat-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 140, 0, 0.3);
        border-radius: 0.75rem;
        padding: 0.75rem;
        backdrop-filter: blur(5px);
      }

      /* 🗑️ BOUTON SUPPRESSION DOCUMENTS */
      .document-card {
        position: relative;
      }

      .document-delete-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: #EF4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        z-index: 10;
      }

      .document-card:hover .document-delete-btn {
        opacity: 1;
      }

      .document-delete-btn:hover {
        background: #DC2626;
        transform: scale(1.1);
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
      }

      /* 🔋 GRAPHIQUE TOKENS UTILISATEUR */
      .user-tokens-display {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.05));
        border: 2px solid rgba(99, 102, 241, 0.2);
        border-radius: 1rem;
        padding: 1rem;
        margin: 1rem 0;
        position: relative;
        overflow: hidden;
      }

      .user-tokens-display::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, rgba(99, 102, 241, 0.05) 25%, transparent 25%);
        background-size: 10px 10px;
        opacity: 0.3;
      }

      .tokens-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        position: relative;
        z-index: 2;
      }

      .tokens-title {
        font-weight: 700;
        color: #4F46E5;
        font-size: 1.1rem;
      }

      .tokens-value {
        background: rgba(99, 102, 241, 0.1);
        color: #4F46E5;
        padding: 0.25rem 0.75rem;
        border-radius: 0.5rem;
        font-weight: 600;
        font-size: 0.9rem;
      }

      .tokens-progress-container {
        position: relative;
        height: 8px;
        background: rgba(99, 102, 241, 0.1);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
        z-index: 2;
      }

      .tokens-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #32CD32, #FFD700, #FF6B35);
        border-radius: 4px;
        transition: width 0.8s ease;
        position: relative;
      }

      .tokens-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: tokensShimmer 2s infinite;
      }

      @keyframes tokensShimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .tokens-details {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
        font-size: 0.8rem;
        color: #6B7280;
        position: relative;
        z-index: 2;
      }

      .inscription-form::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.1) 75%),
                    linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.1) 75%);
        background-size: 20px 20px;
        background-position: 0 0, 10px 10px;
        opacity: 0.3;
        pointer-events: none;
      }

      .inscription-form .form-group {
        position: relative;
        margin-bottom: 2rem;
        z-index: 2;
      }

      .inscription-form .form-label {
        color: white;
        font-weight: 700;
        font-size: 1.1rem;
        margin-bottom: 0.75rem;
        display: block;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      }

      /* 🎯 EFFETS SUR LES CHAMPS DE SAISIE */
      .inscription-form .form-input,
      .inscription-form .form-select {
        width: 100%;
        padding: 1.25rem 1.5rem;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.95);
        font-size: 1rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        position: relative;
        z-index: 3;
      }

      .inscription-form .form-input:focus,
      .inscription-form .form-select:focus {
        outline: none;
        border-color: #FFF;
        background: #FFF;
        transform: translateY(-3px);
        box-shadow: 
          0 8px 25px rgba(0, 0, 0, 0.2),
          0 0 0 4px rgba(255, 255, 255, 0.5),
          inset 0 2px 5px rgba(255, 107, 53, 0.1);
        border-width: 4px;
        animation: fieldFocus 0.3s ease-out;
      }

      .inscription-form .form-input:hover,
      .inscription-form .form-select:hover {
        border-color: rgba(255, 255, 255, 0.6);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      }

      .inscription-form .form-input::placeholder {
        color: #999;
        font-style: italic;
        transition: all 0.3s ease;
      }

      .inscription-form .form-input:focus::placeholder {
        transform: translateY(-20px);
        opacity: 0;
      }

      /* 🔥 BOUTON SUBMIT AMÉLIORÉ */
      .inscription-form .submit-button {
        width: 100%;
        padding: 1.5rem 2rem;
        background: linear-gradient(135deg, #4CAF50, #32CD32);
        color: white;
        border: none;
        border-radius: 1rem;
        font-size: 1.2rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
        position: relative;
        z-index: 3;
        margin-top: 1rem;
      }

      .inscription-form .submit-button:hover:not(:disabled) {
        background: linear-gradient(135deg, #45A049, #2EBF2E);
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(76, 175, 80, 0.5);
      }

      .inscription-form .submit-button::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 0;
        height: 0;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
        border-radius: 50%;
        transition: all 0.3s ease;
      }

      .inscription-form .submit-button:hover::after {
        width: 100px;
        height: 100px;
      }

      .inscription-form .submit-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }

      /* 🔵 BOUTON MODE NORMAL AVEC STYLE IDENTIQUE AUX AUTRES */
      .mode-button.normal {
        border-color: #6366F1 !important;
        background: white;
        color: #1F2937;
      }

      .mode-button.normal::before {
        background: linear-gradient(135deg, #6366F1, #4F46E5) !important;
      }

      .mode-button.normal:hover:not(:disabled) {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05)) !important;
        border-color: #4F46E5 !important;
      }

      .mode-button.normal .mode-benefit {
        background: rgba(99, 102, 241, 0.1);
        color: #4F46E5;
      }

      /* 🌙 MODE SOMBRE */
      .dark-mode .inscription-form {
        background: linear-gradient(135deg, #D2691E, #FF6B35);
        box-shadow: 0 12px 35px rgba(210, 105, 30, 0.4);
      }

      .dark-mode .inscription-form .form-input,
      .dark-mode .inscription-form .form-select {
        background: rgba(31, 41, 55, 0.95);
        color: #F9FAFB;
        border-color: rgba(255, 255, 255, 0.4);
      }

      .dark-mode .inscription-form .form-input:focus,
      .dark-mode .inscription-form .form-select:focus {
        background: #1F2937;
        color: #F9FAFB;
        border-color: #FFF;
      }

      .dark-mode .inscription-form .form-input::placeholder {
        color: #9CA3AF;
      }

      /* 🎨 ANIMATIONS */
      @keyframes formSlideIn {
        0% {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes fieldFocus {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }

      /* 📱 RESPONSIVE */
      @media (max-width: 768px) {
        .inscription-form {
          padding: 2rem;
          margin: 1.5rem auto;
          max-width: 95%;
        }

        .inscription-form .form-input,
        .inscription-form .form-select {
          padding: 1rem 1.25rem;
          font-size: 0.95rem;
        }

        .inscription-form .submit-button {
          padding: 1.25rem 1.5rem;
          font-size: 1.1rem;
        }
      }

      @media (max-width: 480px) {
        .inscription-form {
          padding: 1.5rem;
          border-radius: 1rem;
          margin: 1rem auto;
          max-width: 90%;
        }

        .inscription-form .form-group {
          margin-bottom: 1.5rem;
        }

        .inscription-form .form-input,
        .inscription-form .form-select {
          padding: 0.875rem 1rem;
          font-size: 0.9rem;
        }

        .inscription-form .form-label {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
      }
    `;

    // Injection des styles
    if (!document.getElementById('enhanced-form-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'enhanced-form-styles';
      styleElement.textContent = additionalStyles;
      document.head.appendChild(styleElement);
    }
  }, []);

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
        // Mettre à jour la liste locale
        setAllDocuments(prev => prev.filter(doc => doc.id !== documentId));
        
        // Si c'était le document sélectionné, sélectionner le suivant
        if (selectedDocumentId === documentId) {
          const remainingDocs = allDocuments.filter(doc => doc.id !== documentId);
          if (remainingDocs.length > 0) {
            setSelectedDocumentId(remainingDocs[0].id);
            setDocumentContext(remainingDocs[0].texte_extrait);
          } else {
            setSelectedDocumentId(null);
            setDocumentContext('');
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

  // 📊 FONCTION MISE À JOUR STATISTIQUES UTILISATEUR
  const updateUserStats = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/student/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserStats({
            conversations: data.statistics.total_conversations || 0,
            documents: data.statistics.documents_uploaded || 0,
            tokens_used: data.statistics.total_tokens_used || 0,
            level: data.learning_profile.level || 1
          });
        }
      }
    } catch (error) {
      console.warn('Erreur récupération stats utilisateur:', error);
    }
  };

  // 🔧 CORRECTION: Fonction déconnexion avec bon message
  const handleLogout = () => {
    setStudent(null);
    setCurrentStep(1);
    setActiveTab('inscription');
    setDocumentContext('');
    setAllDocuments([]);
    setSelectedDocumentId(null);
    setUserStats({ conversations: 0, documents: 0, tokens_used: 0, level: 1 });
    setFormData({
      name: '',
      email: '',
      class_level: '',
      school: ''
    });
    // 🔧 CORRECTION: Message approprié pour déconnexion
    showTemporaryMessage('👋 Déconnexion réussie ! À bientôt sur ÉtudIA !', 'info');
  };

  // Charger tous les documents de l'utilisateur
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

  // Changer de document actif
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
      console.log('📱 PWA: ÉtudIA peut être installée !');
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

  // Charger documents utilisateur après connexion + stats utilisateur
  useEffect(() => {
    if (student?.id) {
      loadUserDocuments(student.id);
      updateUserStats(student.id);
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
  // 🔧 CORRECTION App.js - handleDocumentProcessed SIMPLIFIÉE

const handleDocumentProcessed = (extractedText, documentData) => {
  console.log('📄 DOCUMENT TRAITÉ - Début liaison:', {
    document_name: documentData?.nom_original,
    text_length: extractedText?.length,
    document_id: documentData?.id
  });

  // ✅ MISE À JOUR IMMÉDIATE DU CONTEXTE
  setDocumentContext(extractedText);
  setCurrentStep(3);
  
  // ✅ MISE À JOUR LISTE DOCUMENTS
  if (documentData) {
    const newDocument = {
      id: documentData.id,
      nom_original: documentData.nom_original,
      matiere: documentData.matiere || 'Général',
      texte_extrait: extractedText,
      date_upload: new Date().toISOString()
    };
    
    // Ajouter en début de liste
    setAllDocuments(prev => [newDocument, ...prev.filter(doc => doc.id !== newDocument.id)]);
    
    // Sélectionner automatiquement
    setSelectedDocumentId(documentData.id);
    
    console.log('✅ Document ajouté et sélectionné:', newDocument.nom_original);
  }
  
  // ✅ MISE À JOUR STATS UTILISATEUR
  if (student?.id) {
    updateUserStats(student.id);
  }
  
  // ✅ MESSAGE DE CONFIRMATION DÉTAILLÉ
  showTemporaryMessage(
    `🎉 Document "${documentData?.nom_original || 'Document'}" analysé avec succès !
    
📊 ${extractedText?.length || 0} caractères extraits
🤖 ÉtudIA est maintenant prêt à t'aider !

➡️ Direction le chat automatique...`, 
    'success', 
    4000
  );
  
  // ✅ REDIRECTION AUTOMATIQUE AVEC FEEDBACK
  setTimeout(() => {
    setActiveTab('chat');
    console.log('🎯 Redirection vers chat avec document:', documentData?.nom_original);
    
    // Force un nouveau message d'accueil pour prendre en compte le document
    setWelcomeMessageSent(false);
    
    // Message additionnel de confirmation
    setTimeout(() => {
      showTemporaryMessage(
        `📄 Document "${documentData?.nom_original}" chargé ! Pose tes questions !`, 
        'info', 
        3000
      );
    }, 1000);
    
  }, 2000);
};

// 🔧 CORRECTION ChatIA.js - triggerWelcomeMessage SIMPLIFIÉE

const triggerWelcomeMessage = async () => {
  if (welcomeMessageSent) return;
  
  console.log('🎉 Déclenchement message d\'accueil...');
  
  try {
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    // 🔧 RÉCUPÉRATION DOCUMENT SIMPLE
    const currentDocument = allDocuments.length > 0 ? allDocuments[0] : null;
    const contextToSend = currentDocument?.texte_extrait || documentContext || '';
    
    console.log('📄 Contexte pour accueil:', {
      document_found: !!currentDocument,
      document_name: currentDocument?.nom_original,
      context_length: contextToSend.length
    });
    
    // ✅ APPEL SIMPLIFIÉ À L'API
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'connexion',
        user_id: student.id,
        document_context: contextToSend,
        is_welcome: true,
        mode: 'normal'
      }),
    });

    console.log('📡 Réponse API accueil:', response.status, response.ok);
    
    if (!response.ok) {
      throw new Error(`Erreur serveur: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Données accueil reçues:', {
      success: data.success,
      has_context: data.has_context,
      document_name: data.document_name
    });

    if (data.success !== false) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: data.response,
        timestamp: data.timestamp,
        tokens: data.tokens_used || 0,
        model: data.model,
        hasContext: data.has_context,
        isWelcome: true,
        documentUsed: data.document_name
      };

      setMessages([welcomeMessage]);
      setWelcomeMessageSent(true);
      setConnectionStatus('online');

      if (data.tokens_used) {
        updateTokenUsage(data.tokens_used);
      }
      
      console.log(`✅ Message d'accueil OK avec document: "${data.document_name}"`);
      
    } else {
      throw new Error(data.error || 'Erreur réponse API');
    }
    
  } catch (error) {
    console.error('❌ Erreur message d\'accueil:', error.message);
    setConnectionStatus('offline');
    
    // FALLBACK LOCAL ROBUSTE
    const fallbackMessage = {
      id: Date.now(),
      type: 'ai',
      content: `Salut ${prenomEleve} ! 🤖

Je suis ÉtudIA, ton tuteur IA !

${allDocuments.length > 0 ? 
  `📄 Document détecté : "${allDocuments[0].nom_original}"` : 
  '📄 Aucun document - Upload en pour commencer !'}

🎯 Mode hors ligne temporaire activé.
Pose-moi tes questions, je ferai de mon mieux ! ✨`,
      timestamp: new Date().toISOString(),
      tokens: 0,
      isWelcome: true,
      isOffline: true
    };

    setMessages([fallbackMessage]);
    setWelcomeMessageSent(true);
    
  } finally {
    setIsLoading(false);
  }
};

      {/* HEADER RÉVOLUTIONNAIRE ÉPURÉ - NE PAS MODIFIER */}
<header className="app-header revolutionary">
  <div className="cosmic-background"></div>
  
  <div className="header-content">
    {/* Section logo SEULE */}
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

      {/* 🔋 AFFICHAGE STATISTIQUES UTILISATEUR */}
      {student && (
        <div className="user-tokens-display">
          <div className="tokens-header">
            <h3 className="tokens-title">🔋 Utilisation Tokens Aujourd'hui</h3>
            <span className="tokens-value">{userStats.tokens_used.toLocaleString()} tokens</span>
          </div>
          <div className="tokens-progress-container">
            <div 
              className="tokens-progress-fill"
              style={{ 
                width: `${Math.min(100, (userStats.tokens_used / 1000) * 100)}%` 
              }}
            ></div>
          </div>
          <div className="tokens-details">
            <span>📊 {userStats.conversations} conversations</span>
            <span>📄 {userStats.documents} documents</span>
            <span>🎯 Niveau {userStats.level}/5</span>
          </div>
        </div>
      )}

      {/* Sélecteur de documents AVEC BOUTON SUPPRESSION */}
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
                {/* 🗑️ BOUTON SUPPRESSION */}
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
          <button className="logout-button" onClick={handleLogout}>
          <span className="logout-icon">🚪</span>
          <span className="logout-label">Déconnexion</span>
          </button>
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

            {/* 🟠 FORMULAIRE D'INSCRIPTION CENTRÉ */}
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
                  Mémoire avancée en mathématique et compréhension française amélioréepour ÉtudIA
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
                  Solutions complètes instantanées de tous vos sujets d'examen, exercices et devoirs avec ÉtudIA
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

            {/* Section améliorations LlAMA 3.3 */}
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
            <p>&copy; 2025 ÉtudIA v4.0 - Révolutionnons l'éducation Africaine ! 🌍</p>
            <p>Développé avec ❤️ par <strong>@Pacousstar</strong> - Côte d'Ivoire</p>
          </div>
        
          
          <a href="https://etudia-v4.gsnexpertises.com" className="footer-feedback-link">
           📝 Donner votre avis testeur
          </a>
        
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
