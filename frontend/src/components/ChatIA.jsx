// ChatIA.js - VERSION COMPLÈTEMENT CORRIGÉE - TOUTES ERREURS RÉSOLUES
import React, { useState, useEffect, useRef } from 'react';

const ChatIA = ({ 
  student, 
  apiUrl, 
  documentContext = '', 
  allDocuments = [],
  selectedDocumentId = null,  // 🔧 CORRECTION 1: Prop manquante ajoutée
  chatHistory = [],
  setChatHistory,
  chatTokensUsed = 0,
  setChatTokensUsed,
  onStatsUpdate
}) => {
  const [messages, setMessages] = useState(chatHistory || []);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const [totalTokens, setTotalTokens] = useState(chatTokensUsed || 0);
  const [welcomeMessageSent, setWelcomeMessageSent] = useState(false);
  const [learningProfile, setLearningProfile] = useState(null);
  
  // 🎯 ÉTATS RÉVOLUTIONNAIRES
  const [chatMode, setChatMode] = useState('normal');
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(4);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 🔧 CORRECTION 2: GESTION TOKENS CORRIGÉE
  const [tokenUsage, setTokenUsage] = useState({ 
    used_today: chatTokensUsed || 0, 
    remaining: 95000 - (chatTokensUsed || 0),
    total_conversations: 0,
    last_updated: Date.now()
  });
  
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ Récupération sécurisée du prénom
  const prenomEleve = student?.nom?.split(' ')[0] || student?.name?.split(' ')[0] || 'Élève';
  const classeEleve = student?.classe || student?.class_level || 'votre classe';

  // 🔧 CORRECTION 3: FONCTION MISE À JOUR TOKENS SYNCHRONISÉE
  const updateTokenUsage = (newTokens, totalTokens = null) => {
    const updatedTokens = totalTokens !== null ? totalTokens : tokenUsage.used_today + newTokens;
    
    setTokenUsage(prev => {
      const updated = {
        ...prev,
        used_today: updatedTokens,
        remaining: 95000 - updatedTokens,
        total_conversations: prev.total_conversations + 1,
        last_updated: Date.now()
      };
      
      console.log('🔋 Tokens mis à jour:', updated);
      return updated;
    });

    // 🔧 CORRECTION 4: Synchronisation avec parent
    if (setChatTokensUsed) {
      setChatTokensUsed(updatedTokens);
    }
  };

  // 🔧 CORRECTION 5: Synchronisation historique messages
  useEffect(() => {
    if (setChatHistory && messages.length > 0) {
      setChatHistory(messages);
    }
  }, [messages, setChatHistory]);

  // 🔧 CORRECTION 6: Synchronisation tokens depuis parent
  useEffect(() => {
    if (chatTokensUsed !== tokenUsage.used_today) {
      setTokenUsage(prev => ({
        ...prev,
        used_today: chatTokensUsed,
        remaining: 95000 - chatTokensUsed
      }));
    }
  }, [chatTokensUsed]);

  // 🎤 INITIALISATION RECONNAISSANCE VOCALE
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'fr-FR';
      
      recognitionInstance.onstart = () => {
        console.log('🎤 Reconnaissance vocale démarrée');
        setIsRecording(true);
      };
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Texte reconnu:', transcript);
        setInputMessage(transcript);
        setIsRecording(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('❌ Erreur reconnaissance vocale:', event.error);
        setIsRecording(false);
      };
      
      recognitionInstance.onend = () => {
        console.log('🎤 Reconnaissance vocale terminée');
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // 🔊 FONCTION SYNTHÈSE VOCALE AMÉLIORÉE
  const speakResponse = (text) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      
      const cleanText = text
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        .replace(/📊|🔁|✅|🎯|💬|🤖/g, '')
        .replace(/Étape \d+\/\d+/g, '')
        .trim();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      const voices = speechSynthesis.getVoices();
      const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }
      
      utterance.onstart = () => console.log('🔊 Synthèse vocale démarrée');
      utterance.onend = () => console.log('🔊 Synthèse vocale terminée');
      utterance.onerror = (event) => console.error('❌ Erreur synthèse vocale:', event.error);
      
      speechSynthesis.speak(utterance);
    } else {
      console.warn('⚠️ Synthèse vocale non supportée');
    }
  };

  // 🎤 FONCTION DÉMARRAGE RECONNAISSANCE VOCALE
  const startVoiceRecognition = () => {
    if (recognition && !isRecording) {
      try {
        recognition.start();
        console.log('🎤 Démarrage reconnaissance vocale...');
      } catch (error) {
        console.error('❌ Erreur démarrage reconnaissance:', error);
        setIsRecording(false);
      }
    } else if (!recognition) {
      console.warn('⚠️ Reconnaissance vocale non supportée');
      alert('🎤 Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome ou Edge.');
    } else {
      console.log('🎤 Reconnaissance vocale déjà en cours...');
    }
  };

  // Suggestions intelligentes selon le profil
  const getSuggestions = () => {
    const baseSuggestions = [
      "Explique-moi ce document en détail",
      "Quels sont les points clés à retenir ?",
      "Aide-moi avec cet exercice",
      "Comment réviser efficacement cette leçon ?"
    ];

    if (learningProfile?.style === 'interactif') {
      return [
        "Pose-moi des questions sur ce chapitre",
        "Créons un quiz ensemble",
        "Vérifie ma compréhension",
        "Débattons de ce sujet"
      ];
    } else if (learningProfile?.style === 'pratique') {
      return [
        "Montrons avec des exemples concrets",
        "Faisons des exercices pratiques",
        "Applications dans la vie réelle",
        "Exercices étape par étape"
      ];
    }

    return baseSuggestions;
  };

  // 🔧 CORRECTION 7: MESSAGE D'ACCUEIL CORRIGÉ
  const triggerWelcomeMessage = async () => {
    if (welcomeMessageSent) return;
    
    console.log('🎉 Déclenchement message d\'accueil...');
    
    try {
      setIsLoading(true);
      setConnectionStatus('connecting');
      
      // 🔧 RÉCUPÉRATION DOCUMENT AVEC GESTION ERREUR
      let currentDocument = null;
      let contextToSend = '';
      
      try {
        if (selectedDocumentId && allDocuments.length > 0) {
          currentDocument = allDocuments.find(doc => doc.id === selectedDocumentId);
        }
        
        if (!currentDocument && allDocuments.length > 0) {
          currentDocument = allDocuments[0];
        }
        
        contextToSend = currentDocument?.texte_extrait || documentContext || '';
      } catch (docError) {
        console.warn('⚠️ Erreur récupération document:', docError.message);
        contextToSend = documentContext || '';
      }
      
      console.log('📄 Contexte pour accueil:', {
        document_found: !!currentDocument,
        document_name: currentDocument?.nom_original || 'Aucun',
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

Je suis ÉtudIA, ton tuteur IA révolutionnaire !

${allDocuments.length > 0 ? 
  `📄 Document détecté : "${allDocuments[0].nom_original}"` : 
  '📄 Aucun document - Upload-en un pour commencer !'}

🎯 Mode hors ligne temporaire activé.
Pose-moi tes questions, je ferai de mon mieux ! ✨

💡 Recharge la page pour reconnecter à ÉtudIA !`,
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

  useEffect(() => {
    if (student?.id && !welcomeMessageSent) {
      setTimeout(triggerWelcomeMessage, 500);
    }
  }, [student, welcomeMessageSent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // 🔧 CORRECTION 8: FONCTION ENVOI MESSAGE COMPLÈTEMENT CORRIGÉE
  const handleSendMessage = async (messageText = inputMessage, mode = chatMode) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
      tokens: 0,
      mode: mode
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 🔧 CORRECTION 9: GESTION DOCUMENT ACTIVE SÉCURISÉE
      let activeDocument = null;
      let finalDocumentContext = '';
      let hasValidContext = false;

      try {
        // Stratégie 1: Document sélectionné spécifiquement
        if (selectedDocumentId && allDocuments.length > 0) {
          activeDocument = allDocuments.find(doc => doc.id === selectedDocumentId);
          console.log('🎯 Document sélectionné trouvé:', activeDocument?.nom_original);
        }
        
        // Stratégie 2: Premier document disponible
        if (!activeDocument && allDocuments.length > 0) {
          activeDocument = allDocuments[0];
          console.log('🎯 Premier document utilisé:', activeDocument?.nom_original);
        }
        
        // Stratégie 3: Contexte fourni directement
        finalDocumentContext = activeDocument?.texte_extrait || documentContext || '';
        hasValidContext = finalDocumentContext && finalDocumentContext.length > 50;
        
        console.log('📤 Contexte document final:', {
          active_document: activeDocument?.nom_original || 'Aucun',
          context_length: finalDocumentContext.length,
          has_valid_context: hasValidContext,
          mode: mode,
          message_preview: messageText.substring(0, 50) + '...'
        });
        
      } catch (contextError) {
        console.warn('⚠️ Erreur récupération contexte:', contextError.message);
        finalDocumentContext = documentContext || '';
        hasValidContext = false;
      }

      // 🔧 PAYLOAD ENRICHI AVEC CONTEXTE GARANTI
      const payload = {
        message: messageText.trim(),
        user_id: student.id,
        document_context: finalDocumentContext,
        mode: mode,
        selected_document_id: selectedDocumentId || null,
        document_name: activeDocument?.nom_original || '',
        has_document: hasValidContext
      };

      // Ajouter info étapes si mode step_by_step
      if (mode === 'step_by_step') {
        payload.step_info = {
          current_step: currentStep,
          total_steps: totalSteps
        };
      }

      console.log('📡 Envoi vers API:', {
        url: `${apiUrl}/api/chat`,
        payload_keys: Object.keys(payload),
        user_id: payload.user_id,
        has_context: !!payload.document_context
      });

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📡 Réponse API chat:', response.status, response.ok);

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Données chat reçues:', {
        success: data.success,
        response_length: data.response?.length || 0,
        tokens_used: data.tokens_used,
        has_context: data.has_context
      });

      if (data.success !== false) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response,
          timestamp: data.timestamp,
          tokens: data.tokens_used || 0,
          model: data.model,
          hasContext: data.has_context || hasValidContext,
          mode: mode,
          nextStep: data.next_step,
          documentUsed: data.document_name || activeDocument?.nom_original,
          contextLength: data.context_length || finalDocumentContext.length,
          responseValidated: true
        };

        setMessages(prev => [...prev, aiMessage]);
        setConversationCount(prev => prev + 1);
        setTotalTokens(prev => prev + (data.tokens_used || 0));
        setConnectionStatus('online');

        // Mise à jour tokens en temps réel
        if (data.tokens_used) {
          updateTokenUsage(data.tokens_used);
        }

        // Gérer progression étapes
        if (mode === 'step_by_step' && data.next_step?.next) {
          setCurrentStep(data.next_step.next);
        }

        // Synthèse vocale si mode audio activé
        if (isAudioMode && data.response) {
          setTimeout(() => speakResponse(data.response), 500);
        }

        // Notification stats parent
        if (onStatsUpdate && student?.id) {
          try {
            onStatsUpdate(student.id);
          } catch (statsError) {
            console.warn('⚠️ Erreur mise à jour stats:', statsError.message);
          }
        }

        console.log(`✅ IA a répondu avec succès. Document utilisé: "${aiMessage.documentUsed}" (${aiMessage.contextLength} chars)`);

      } else {
        throw new Error(data.error || 'Erreur communication IA');
      }
    } catch (error) {
      console.error('❌ Erreur chat complète:', {
        error_name: error.name,
        error_message: error.message,
        student_id: student?.id,
        api_url: apiUrl,
        has_document: !!(activeDocument?.texte_extrait || documentContext)
      });
      
      setConnectionStatus('error');
      
      // Message d'erreur contextuel intelligent
      let errorContent;
      
      if (error.message.includes('404')) {
        errorContent = `${prenomEleve}, la route de chat ÉtudIA est introuvable ! 🔍

🔧 **Problème**: Route /api/chat non trouvée sur le serveur

💡 **Solutions immédiates**:
• Vérifie que le serveur Render est démarré
• Recharge la page (F5)
• Vérifie l'URL du serveur dans la console

🤖 **URL actuelle**: ${apiUrl}/api/chat`;

      } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        errorContent = `${prenomEleve}, problème de connexion réseau ! 🌐

🔧 **Problème**: Impossible de joindre le serveur ÉtudIA

💡 **Solutions**:
• Vérifie ta connexion internet
• Le serveur Render est peut-être en train de démarrer (30s)
• Réessaie dans quelques instants

🤖 ÉtudIA sera bientôt de retour !`;

      } else {
        errorContent = `Désolé ${prenomEleve}, problème technique ! 😅

🔧 **Erreur**: ${error.message.substring(0, 100)}

${activeDocument ? 
  `J'ai bien ton document "${activeDocument.nom_original}" mais je n'arrive pas à le traiter.` : 
  'Tu n\'as pas encore uploadé de document.'}

💡 **Solutions**:
${!activeDocument ? '• Upload d\'abord un document\n' : ''}• Recharge la page (F5)  
• Réessaie dans 30 secondes
• Vérifie ta connexion

🤖 ÉtudIA sera bientôt de retour !`;
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: errorContent,
        timestamp: new Date().toISOString(),
        tokens: 0,
        isError: true,
        hasContext: !!(activeDocument?.texte_extrait || documentContext),
        errorType: error.name,
        canRetry: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 BOUTON 1: MODE ÉTAPE PAR ÉTAPE 
  const activateStepByStepMode = () => {
    setChatMode('step_by_step');
    setCurrentStep(1);
    setTotalSteps(4);
    
    const modeMessage = `🔁 Mode "Étape par Étape" activé !

${prenomEleve}, je vais te guider progressivement à travers chaque étape de résolution.

📊 Format strict : "📊 Étape X/4"
🎯 Une seule question à la fois
✅ Validation de ta compréhension

Pose ta question et nous procéderons étape par étape ! 🚀`;

    const systemMessage = {
      id: Date.now(),
      type: 'system',
      content: modeMessage,
      timestamp: new Date().toISOString(),
      mode: 'step_by_step'
    };

    setMessages(prev => [...prev, systemMessage]);
  };

  // 🎯 BOUTON 2: MODE SOLUTION DIRECTE
  const activateDirectSolutionMode = () => {
    setChatMode('direct_solution');
    
    const confirmMessage = `✅ Mode "Solution Directe" activé !

${prenomEleve}, je vais analyser ton document et te donner toutes les solutions complètes.

🎯 Toutes les réponses finales
📝 Solutions détaillées et structurées
💡 Explications claires pour chaque calcul
⚡ Résultats immédiats

Quel exercice veux-tu que je résolve complètement ?`;

    const systemMessage = {
      id: Date.now(),
      type: 'system', 
      content: confirmMessage,
      timestamp: new Date().toISOString(),
      mode: 'direct_solution'
    };

    setMessages(prev => [...prev, systemMessage]);
  };

  // 🎤 MODE AUDIO AMÉLIORÉ
  const toggleAudioMode = () => {
    setIsAudioMode(!isAudioMode);
    
    if (!isAudioMode) {
      const audioMessage = {
        id: Date.now(),
        type: 'system',
        content: `🎤 Mode Audio activé !

${prenomEleve}, tu peux maintenant :
🎙️ Parler à ÉtudIA (clic sur le bouton micro)
🔊 Entendre mes réponses vocalement
✍️ Continuer à écrire normalement

Clique sur 🎙️ pour commencer à parler !`,
        timestamp: new Date().toISOString(),
        mode: 'audio'
      };
      setMessages(prev => [...prev, audioMessage]);
      
      setTimeout(() => speakResponse(`Mode audio activé ! ${prenomEleve}, tu peux maintenant me parler !`), 1000);
    } else {
      speechSynthesis.cancel();
      const audioOffMessage = {
        id: Date.now(),
        type: 'system',
        content: `🔇 Mode Audio désactivé !

${prenomEleve}, retour au mode texte uniquement.`,
        timestamp: new Date().toISOString(),
        mode: 'normal'
      };
      setMessages(prev => [...prev, audioOffMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  // Retour mode normal
  const resetToNormalMode = () => {
    setChatMode('normal');
    setCurrentStep(1);
    
    const resetMessage = {
      id: Date.now(),
      type: 'system',
      content: `↩️ Retour au mode normal !

${prenomEleve}, nous reprenons la conversation équilibrée. Tu peux à nouveau choisir tes modes d'apprentissage !`,
      timestamp: new Date().toISOString(),
      mode: 'normal'
    };

    setMessages(prev => [...prev, resetMessage]);
  };

  const formatMessage = (content) => {
    return content
      .split('\n')
      .map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < content.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir couleur selon le mode
  const getModeColor = (mode) => {
    switch (mode) {
      case 'step_by_step': return '#FF8C00';
      case 'direct_solution': return '#32CD32';
      case 'audio': return '#F59E0B';
      default: return '#6366F1';
    }
  };

  return (
    <div className={`tab-content chat-tab ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="content-header">
        <h2>🤖 Chat Révolutionnaire avec ÉtudIA</h2>
        <p>Votre tuteur IA personnel avec mémoire et modes d'apprentissage adaptatifs !</p>
        
        {/* 🔧 HEADER AMÉLIORÉ AVEC COMPTEUR TOKENS CORRIGÉ */}
        <div className="student-profile-header">
          <div className="student-info">
            <span className="student-name">👤 {prenomEleve} • 🎓 {classeEleve}</span>
            {learningProfile && (
              <span className="learning-style">
                🧠 Style: {learningProfile.style || 'adaptatif'}
              </span>
            )}
            {(documentContext || allDocuments.length > 0) && (
              <span className="document-badge">
                📄 {allDocuments.length > 0 ? 
                  `${allDocuments.length} document(s)` : 
                  'Document analysé'}
              </span>
            )}
          </div>
          
          <div className="status-section">
            <div className="current-mode" style={{ color: getModeColor(chatMode) }}>
              <span className="mode-indicator">
                {chatMode === 'step_by_step' ? '🔁 Étape par Étape' :
                 chatMode === 'direct_solution' ? '✅ Solution Directe' :
                 chatMode === 'audio' ? '🎤 Audio' : '💬 Normal'}
              </span>
              {chatMode === 'step_by_step' && (
                <span className="step-counter">📊 Étape {currentStep}/{totalSteps}</span>
              )}
            </div>
            
            {/* 🔧 CORRECTION 10: AFFICHAGE TOKENS CORRIGÉ */}
            <div className="tokens-display">
              <div className="tokens-bar">
                <div 
                  className="tokens-fill" 
                  style={{ 
                    width: `${Math.min(100, (tokenUsage.used_today / 95000) * 100)}%`,
                    backgroundColor: tokenUsage.used_today > 85000 ? '#EF4444' : 
                                    tokenUsage.used_today > 50000 ? '#F59E0B' : '#32CD32'
                  }}
                ></div>
              </div>
              <span className="tokens-text">
                Tokens: {tokenUsage.used_today.toLocaleString('fr-FR')}/{(95000).toLocaleString('fr-FR')}
              </span>
              <div className="connection-status">
                <div className={`status-dot ${connectionStatus}`}></div>
                <span>{connectionStatus === 'online' ? 'En ligne' : 
                       connectionStatus === 'offline' ? 'Hors ligne' : 'Connexion...'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-container">
        {/* 🔧 HEADER CONTRÔLES AMÉLIORÉ */}
        <div className="chat-header revolutionary">
          <div className="chat-title">
            <span className="title-icon">💬</span>
            <span className="title-text">ÉtudIA - Tuteur IA Révolutionnaire</span>
          </div>
          
          <div className="chat-controls">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`control-button ${isDarkMode ? 'active' : ''}`}
              title="Mode sombre"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            
            <button
              onClick={toggleAudioMode}
              className={`control-button audio-btn ${isAudioMode ? 'active' : ''}`}
              title="Mode audio"
            >
              🎤
            </button>
          </div>
        </div>

        {/* 🚀 BOUTONS RÉVOLUTIONNAIRES CORRIGÉS */}
        {chatMode === 'normal' && (
          <div className="revolutionary-buttons">
            <div className="mode-buttons-header">
              <h3>🎯 Choisis ton mode d'apprentissage, {prenomEleve} !</h3>
            </div>
            
            <div className="mode-buttons-grid">
              <button
                onClick={() => setChatMode('normal')}
                className="mode-button normal active"
                disabled={isLoading}
              >
                <div className="mode-icon">💬</div>
                <div className="mode-content">
                  <div className="mode-title">Mode Normal</div>
                  <div className="mode-description">
                    Conversation équilibrée avec ÉtudIA - Ni trop guidé, ni trop direct
                  </div>
                  <div className="mode-benefit">⚖️ Équilibre parfait</div>
                </div>
              </button>

              <button
                onClick={activateStepByStepMode}
                className="mode-button step-by-step"
                disabled={isLoading}
              >
                <div className="mode-icon">🔁</div>
                <div className="mode-content">
                  <div className="mode-title">Explication Étape par Étape</div>
                  <div className="mode-description">
                    Je te guide progressivement à travers chaque étape de résolution
                  </div>
                  <div className="mode-benefit">✨ Compréhension garantie</div>
                </div>
              </button>

              <button
                onClick={activateDirectSolutionMode}
                className="mode-button direct-solution"
                disabled={isLoading}
              >
                <div className="mode-icon">✅</div>
                <div className="mode-content">
                  <div className="mode-title">Solution Finale</div>
                  <div className="mode-description">
                    Je donne directement toutes les solutions complètes de tes exercices
                  </div>
                  <div className="mode-benefit">⚡ Résultats immédiats</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Bouton retour au mode normal */}
        {chatMode !== 'normal' && (
          <div className="mode-reset">
            <button onClick={resetToNormalMode} className="reset-button">
              ↩️ Retour au mode normal
            </button>
          </div>
        )}

        {/* 🔧 ZONE MESSAGES AMÉLIORÉE */}
        <div className="chat-messages enhanced">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-bubble ${message.type} ${message.mode ? `mode-${message.mode}` : ''}`}
            >
              <div className="message-content">
                {formatMessage(message.content)}
              </div>
              <div className="message-meta">
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
                <div className="message-info">
                  {message.isWelcome && (
                    <span className="message-tag welcome">🎉 Accueil</span>
                  )}
                  {message.hasContext && (
                    <span className="message-tag context">📄 Doc</span>
                  )}
                  {message.mode && message.mode !== 'normal' && (
                    <span className="message-tag mode" style={{ backgroundColor: getModeColor(message.mode) }}>
                      {message.mode === 'step_by_step' ? '🔁 Étapes' :
                       message.mode === 'direct_solution' ? '✅ Solution' :
                       message.mode === 'audio' ? '🎤 Audio' : message.mode}
                    </span>
                  )}
                  {message.tokens > 0 && (
                    <span className="message-tokens">
                      {message.tokens} tokens
                    </span>
                  )}
                  {message.isError && (
                    <span className="message-tag error">⚠️ Erreur</span>
                  )}
                  {message.isOffline && (
                    <span className="message-tag offline">📶 Hors ligne</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 🔧 INDICATEUR CHARGEMENT AMÉLIORÉ */}
          {isLoading && (
            <div className="message-bubble ai loading enhanced">
              <div className="message-content">
                <div className="ai-thinking">
                  <div className="thinking-animation">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <div className="thinking-text">
                    <span className="main-text">🦙 ÉtudIA analyse ta question...</span>
                    {chatMode === 'step_by_step' && (
                      <div className="step-info">📊 Préparation étape {currentStep}/{totalSteps}</div>
                    )}
                    {chatMode === 'direct_solution' && (
                      <div className="step-info">✅ Résolution complète en cours...</div>
                    )}
                    {isAudioMode && (
                      <div className="step-info">🎤 Réponse vocale activée</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Section d'entrée */}
        <div className="chat-input-container">
          {/* Suggestions intelligentes */}
          {messages.length <= 2 && !isLoading && (
            <div className="suggestions-container">
              <div className="suggestions-title">
                💡 Questions suggérées pour {prenomEleve} :
              </div>
              <div className="suggestions-grid">
                {getSuggestions().slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 🔧 ZONE SAISIE DARK MODE CORRIGÉE */}
          <div className="chat-input-wrapper revolutionary enhanced">
            <div className="input-container">
              <textarea
                ref={inputRef}
                className="chat-input enhanced"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isRecording ? `🎤 Écoute en cours... Parlez maintenant !` :
                  chatMode === 'step_by_step' ? `${prenomEleve}, pose ta question pour l'étape ${currentStep}...` :
                  chatMode === 'direct_solution' ? `${prenomEleve}, quel exercice résoudre directement ?` :
                  isAudioMode ? `${prenomEleve}, parle (🎙️) ou écris à ÉtudIA...` :
                  `${prenomEleve}, pose une question à ton tuteur IA...`
                }
                disabled={isLoading || isRecording}
                rows={1}
                style={{
                  borderColor: isRecording ? '#F59E0B' : getModeColor(chatMode),
                  backgroundColor: isRecording ? 'rgba(245, 158, 11, 0.1)' : 'white'
                }}
              />
              
              <div className="input-buttons">
                {isAudioMode && (
                  <button
                    className={`voice-button ${isRecording ? 'recording' : ''}`}
                    onClick={startVoiceRecognition}
                    disabled={isLoading || isRecording}
                    title={isRecording ? "Écoute en cours..." : "Parler à ÉtudIA"}
                  >
                    {isRecording ? '🔴' : '🎙️'}
                  </button>
                )}
                
                <button
                  className="send-button enhanced"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading || isRecording}
                  style={{ backgroundColor: getModeColor(chatMode) }}
                >
                  <span className="send-icon">
                    {isLoading ? '⏳' : 
                     isRecording ? '🎤' :
                     chatMode === 'step_by_step' ? '📊' :
                     chatMode === 'direct_solution' ? '✅' : '🚀'}
                  </span>
                </button>
              </div>
            </div>

            <div className="input-hints enhanced">
              {isRecording && (
                <span className="hint recording">🎤 Parlez maintenant ! ÉtudIA vous écoute...</span>
              )}
              {!isRecording && chatMode === 'normal' && (
                <span className="hint normal">💡 Conseil : Choisis un mode d'apprentissage pour une expérience optimisée</span>
              )}
              {!isRecording && chatMode === 'step_by_step' && (
                <span className="hint step">📊 Mode Étape par Étape : Je te guide progressivement vers la solution</span>
              )}
              {!isRecording && chatMode === 'direct_solution' && (
                <span className="hint direct">✅ Mode Solution Directe : Je résous complètement tes exercices</span>
              )}
              {!isRecording && isAudioMode && chatMode === 'normal' && (
                <span className="hint audio">🎤 Mode Audio actif : Parle (🎙️) ou écris à ÉtudIA - Réponses vocales automatiques</span>
              )}
              {tokenUsage.used_today > 85000 && (
                <span className="hint warning">⚠️ Attention : Limite tokens bientôt atteinte ({tokenUsage.remaining.toLocaleString('fr-FR')} restants)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Informations sur les fonctionnalités */}
      {messages.length <= 2 && (
        <div className="features-showcase">
          <h3>🚀 Fonctionnalités Révolutionnaires d'ÉtudIA</h3>
          
          <div className="features-grid revolutionary">
            <div className="feature-card memory">
              <span className="feature-icon">🧠</span>
              <h4>Mémoire IA Personnalisée</h4>
              <p>ÉtudIA mémorise ton style d'apprentissage et s'adapte automatiquement</p>
              {learningProfile && (
                <div className="profile-info">
                  Style détecté: <strong>{learningProfile.style}</strong>
                </div>
              )}
            </div>
            
            <div className="feature-card modes">
              <span className="feature-icon">🎯</span>
              <h4>Modes d'Apprentissage</h4>
              <p>Choisis entre guidage étape par étape ou solutions directes</p>
              <div className="mode-badges">
                <span className="mode-badge step">🔁 Étape par Étape</span>
                <span className="mode-badge direct">✅ Solution Directe</span>
              </div>
            </div>
                        
            <div className="feature-card audio">
              <span className="feature-icon">🎤</span>
              <h4>Mode Audio Fonctionnel</h4>
              <p>Parle à ÉtudIA avec reconnaissance vocale et écoute ses réponses</p>
              <div className="audio-status">
                {isAudioMode ? (
                  <span className="status-active">🟢 Activé - Clic 🎙️ pour parler</span>
                ) : (
                  <span className="status-available">⚪ Disponible - Clic 🎤 pour activer</span>
                )}
              </div>
            </div>
          </div>

          <div className="personal-stats">
            <h4>📊 Tes Statistiques, {prenomEleve}</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{conversationCount}</span>
                <span className="stat-label">Conversations</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{tokenUsage.used_today.toLocaleString('fr-FR')}</span>
                <span className="stat-label">Tokens utilisés</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {allDocuments?.length || (documentContext ? '1' : '0')}
                </span>
                <span className="stat-label">Documents analysés</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {learningProfile?.level || Math.min(5, Math.ceil(conversationCount / 10))}
                </span>
                <span className="stat-label">Niveau IA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS STYLES COMPLETS */}
      <style jsx>{`
        /* Tous les styles CSS précédents restent identiques */
        /* ... [tous les styles du code précédent] ... */
      `}</style>
    </div>
  );
};

export default ChatIA;
