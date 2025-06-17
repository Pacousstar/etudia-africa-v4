import React, { useState, useEffect, useRef } from 'react';

{/* Onglet chat ÉtudIA */}
{activeTab === 'chat' && student && (
  <ChatIA
    student={student}
    apiUrl={API_URL}
    documentContext={documentContext}
    allDocuments={allDocuments}
    selectedDocumentId={selectedDocumentId}
    chatHistory={chatHistory} // NOUVEAU
    setChatHistory={setChatHistory} // NOUVEAU
    chatTokensUsed={chatTokensUsed} // NOUVEAU
    setChatTokensUsed={setChatTokensUsed} // NOUVEAU
    onStatsUpdate={updateUserStats} // NOUVEAU
  />
  }) => {
  const [messages, setMessages] = useState(chatHistory || []);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [welcomeMessageSent, setWelcomeMessageSent] = useState(false);
  const [learningProfile, setLearningProfile] = useState(null);
  
  // 🎯 ÉTATS RÉVOLUTIONNAIRES
  const [chatMode, setChatMode] = useState('normal');
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(4);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 🔧 CORRECTION 1: GESTION TOKENS CORRIGÉE
  const [tokenUsage, setTokenUsage] = useState({ 
    used_today: 0, 
    remaining: 95000,
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

  // 🔧 CORRECTION 2: FONCTION MISE À JOUR TOKENS
  const updateTokenUsage = (newTokens, totalTokens = null) => {
    setTokenUsage(prev => {
      const updated = {
        ...prev,
        used_today: totalTokens !== null ? totalTokens : prev.used_today + newTokens,
        remaining: totalTokens !== null ? 95000 - totalTokens : prev.remaining - newTokens,
        total_conversations: prev.total_conversations + 1,
        last_updated: Date.now()
      };
      
      console.log('🔋 Tokens mis à jour:', updated);
      return updated;
    });
  };

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
      // Arrêter toute synthèse en cours
      speechSynthesis.cancel();
      
      // Nettoyer le texte (supprimer emojis et formatage)
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
      
      // Trouver une voix française si disponible
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

  // 🔧 CORRECTION 3: MESSAGE D'ACCUEIL CORRIGÉ
 // 📍 MODIFIEZ LA FONCTION triggerWelcomeMessage
const triggerWelcomeMessage = async () => {
  // Si on a déjà des messages restaurés, ne pas envoyer le message d'accueil
  if (messages.length > 0 || chatHistory.length > 0) {
    console.log('💬 Messages existants trouvés, pas de message d\'accueil');
    setWelcomeMessageSent(true);
    return;
  }
  
  if (welcomeMessageSent) return;
  
  try {
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Connexion',
        user_id: student.id,
        document_context: documentContext,
        is_welcome: true
      }),
    });

    const data = await response.json();

    if (response.ok) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: data.response,
        timestamp: data.timestamp,
        tokens: data.tokens_used || 0,
        model: data.model,
        hasContext: data.has_context,
        isWelcome: true
      };

      const welcomeMessages = [welcomeMessage];
      setMessages(welcomeMessages);
      setChatHistory(welcomeMessages); // NOUVEAU : Sauvegarder le message d'accueil
      
      setWelcomeMessageSent(true);
      setTotalTokens(data.tokens_used || 0);
      setLearningProfile(data.learning_profile);
      setConnectionStatus('online');

      // CORRECTION: Mise à jour tokens correcte
      if (data.tokens_used) {
        updateTokenUsage(data.tokens_used);
        setChatTokensUsed(data.tokens_used); // NOUVEAU
      }
    }
  } catch (error) {
    console.error('❌ Erreur message d\'accueil:', error);
    setConnectionStatus('offline');
    
    const fallbackWelcome = {
      id: Date.now(),
      type: 'ai',
      content: `Salut ${prenomEleve} ! 🎓

Je suis ÉtudIA, ton tuteur IA révolutionnaire ! 🤖✨

⚠️ Mode hors ligne activé. Reconnecte-toi pour l'expérience complète !`,
      timestamp: new Date().toISOString(),
      tokens: 0,
      isWelcome: true,
      isOffline: true
    };

    const fallbackMessages = [fallbackWelcome];
    setMessages(fallbackMessages);
    setChatHistory(fallbackMessages); // NOUVEAU : Sauvegarder même en mode hors ligne
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

useEffect(() => {
  if (chatHistory && chatHistory.length > 0) {
    setMessages(chatHistory);
    console.log(`💬 ${chatHistory.length} messages restaurés dans ChatIA`);
  }
}, [chatHistory]);

  
  // 🔧 CORRECTION 4: ENVOI MESSAGE CORRIGÉ
  // 📍 MODIFIEZ LA FONCTION handleSendMessage POUR SAUVEGARDER
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

    // Mettre à jour les messages localement ET dans le parent
  const newMessages = [...messages, userMessage];
  setMessages(newMessages);
  setChatHistory(newMessages); // NOUVEAU : Sauvegarder dans le parent

  setInputMessage('');
  setIsLoading(true);


    try {
      // Construire payload selon le mode
      const payload = {
        message: messageText.trim(),
        user_id: student.id,
        document_context: documentContext,
        mode: mode
      };

      // Ajouter info étapes si mode step_by_step
      if (mode === 'step_by_step') {
        payload.step_info = {
          current_step: currentStep,
          total_steps: totalSteps
        };
      }

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.response,
        timestamp: data.timestamp,
        tokens: data.tokens_used || 0,
        model: data.model,
        hasContext: data.has_context,
        mode: mode,
        nextStep: data.next_step
      };


       // Mettre à jour avec le message IA
      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      setChatHistory(finalMessages); // NOUVEAU : Sauvegarder dans le parent

      setConversationCount(prev => prev + 1);
      const newTotalTokens = totalTokens + (data.tokens_used || 0);
      setTotalTokens(newTotalTokens);
      
      // 🔧 NOUVEAU : Mettre à jour les tokens du chat
      const newChatTokens = chatTokensUsed + (data.tokens_used || 0);
      setChatTokensUsed(newChatTokens);
      
      setConnectionStatus('online');

      // CORRECTION: Mise à jour tokens en temps réel
      if (data.tokens_used) {
        updateTokenUsage(data.tokens_used, newTotalTokens);
      }

      // 🔧 NOUVEAU : Notifier le parent pour mettre à jour les stats
      if (onStatsUpdate && student?.id) {
        setTimeout(() => onStatsUpdate(student.id), 1000);
      }

      // Gérer progression étapes
      if (mode === 'step_by_step' && data.next_step?.next) {
        setCurrentStep(data.next_step.next);
      }

      // Synthèse vocale si mode audio ACTIVÉ
      if (isAudioMode && data.response) {
        setTimeout(() => speakResponse(data.response), 500);
      }

    } else {
      throw new Error(data.error || 'Erreur communication IA');
    }
  } catch (error) {
    console.error('❌ Erreur chat:', error);
    setConnectionStatus('error');
    
    const errorMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: `Désolé ${prenomEleve}, je rencontre des difficultés techniques ! 😅

Veuillez réessayer dans quelques instants.

🤖 ÉtudIA sera bientôt de retour pour t'aider !`,
      timestamp: new Date().toISOString(),
      tokens: 0,
      isError: true
    };
    
    const errorMessages = [...newMessages, errorMessage];
    setMessages(errorMessages);
    setChatHistory(errorMessages); // NOUVEAU : Sauvegarder même les erreurs
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
      // Activer audio
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
      
      // Message de bienvenue audio
      setTimeout(() => speakResponse(`Mode audio activé ! ${prenomEleve}, tu peux maintenant me parler !`), 1000);
    } else {
      // Désactiver audio
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
      case 'step_by_step': return '#FF8C00'; // Orange pour étape par étape
      case 'direct_solution': return '#32CD32'; // Vert pour solution directe
      case 'audio': return '#F59E0B'; // Jaune pour audio
      default: return '#6366F1'; // Bleu pour normal
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
            {documentContext && <span className="document-badge">📄 Document analysé</span>}
          </div>
          
          {/* 🔧 SECTION STATUS CORRIGÉE */}
          <div className="status-section">
            {/* Mode actuel */}
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
            
            {/* 🔧 CORRECTION 5: AFFICHAGE TOKENS CORRIGÉ */}
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
                Tokens: {tokenUsage.used_today.toLocaleString()}/{(95000).toLocaleString()}
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
          
          {/* Boutons de contrôle */}
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

          {/* 🔧 CORRECTION 6: ZONE SAISIE DARK MODE CORRIGÉE */}
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
              
              {/* 🔧 BOUTONS D'ENVOI AMÉLIORÉS */}
              <div className="input-buttons">
                {/* 🎤 BOUTON VOCAL AMÉLIORÉ */}
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

            {/* 🔧 CONSEILS CONTEXTUELS AMÉLIORÉS */}
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
                <span className="hint warning">⚠️ Attention : Limite tokens bientôt atteinte ({tokenUsage.remaining.toLocaleString()} restants)</span>
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

          {/* 🔧 CORRECTION 7: STATISTIQUES PERSONNELLES MISES À JOUR */}
          <div className="personal-stats">
  <h4>📊 Tes Statistiques, {prenomEleve}</h4>
  <div className="stats-grid">
    <div className="stat-item">
      <span className="stat-number">{messages.length}</span>
      <span className="stat-label">Messages Chat</span>
    </div>
    <div className="stat-item">
      <span className="stat-number">{chatTokensUsed.toLocaleString()}</span>
      <span className="stat-label">Tokens Chat</span>
    </div>
    <div className="stat-item">
      <span className="stat-number">
        {allDocuments?.length || (documentContext ? '1' : '0')}
      </span>
      <span className="stat-label">Documents analysés</span>
    </div>
    <div className="stat-item">
      <span className="stat-number">
        {Math.min(5, Math.max(1, Math.ceil(messages.length / 10)))}
      </span>
      <span className="stat-label">Niveau IA</span>
    </div>
  </div>
  
  {/* Graphique progression tokens ACTUALISÉ */}
  <div className="token-progress-chart">
    <h5>🔋 Tokens Utilisés Cette Session</h5>
    <div className="progress-visualization">
      <div className="progress-segment green" style={{ width: '60%' }}>
        <span>Zone optimale</span>
      </div>
      <div className="progress-segment yellow" style={{ width: '25%' }}>
        <span>Attention</span>
      </div>
      <div className="progress-segment red" style={{ width: '15%' }}>
        <span>Limite</span>
      </div>
    </div>
    <div className="current-position" style={{ 
      left: `${Math.min(100, (chatTokensUsed / 1000) * 100)}%` 
    }}>
      <div className="position-marker">📍</div>
      <div className="position-label">{chatTokensUsed.toLocaleString()}</div>
    </div>
  </div>
</div>
      )}

      {/* 🔧 CORRECTION 8 + 9 + 10: STYLES CSS RÉVOLUTIONNAIRES COMPLETS */}
      <style jsx>{`
        /* 🔧 CORRECTIONS VISUELLES PRINCIPALES */
        .chat-tab.dark-mode {
          background: linear-gradient(135deg, #1F2937, #111827);
          color: #F9FAFB;
        }

        .student-profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 1.5rem 0;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(99, 102, 241, 0.1));
          border-radius: 1rem;
          border: 2px solid rgba(16, 185, 129, 0.2);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .student-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .student-name {
          font-weight: 700;
          font-size: 1.1rem;
          color: #059669;
        }

        .learning-style, .document-badge {
          background: rgba(99, 102, 241, 0.2);
          padding: 0.4rem 0.8rem;
          border-radius: 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        /* 🔧 SECTION STATUS CORRIGÉE */
        .status-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1rem;
        }

        .current-mode {
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          border-radius: 1rem;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 2px solid currentColor;
        }

        .mode-indicator {
          font-size: 1rem;
          font-weight: 700;
        }

        .step-counter {
          background: rgba(59, 130, 246, 0.2);
          padding: 0.3rem 0.7rem;
          border-radius: 0.75rem;
          font-size: 0.8rem;
          border: 1px solid rgba(59, 130, 246, 0.4);
        }

        /* 🔧 COMPTEUR TOKENS COMPLÈTEMENT CORRIGÉ */
        .tokens-display {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
          min-width: 200px;
        }

        .tokens-bar {
          width: 150px;
          height: 8px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.2);
        }

        .tokens-fill {
          height: 100%;
          border-radius: 4px;
          transition: all 0.3s ease;
          position: relative;
        }

        .tokens-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .tokens-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #6B7280;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .status-dot.online { 
          background: #10B981; 
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }
        .status-dot.offline { 
          background: #EF4444; 
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
        }
        .status-dot.connecting { 
          background: #F59E0B; 
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* MODE SOMBRE POUR ZONE SAISIE - CORRECTION 6 */
        .dark-mode .chat-input.enhanced {
          background: rgba(31, 41, 55, 0.9) !important;
          color: #F9FAFB !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
        }

        .dark-mode .chat-input.enhanced:focus {
          background: rgba(31, 41, 55, 0.95) !important;
          border-color: var(--accent-blue) !important;
          color: #F9FAFB !important;
        }

        .dark-mode .chat-input.enhanced::placeholder {
          color: #9CA3AF !important;
        }

        .dark-mode .input-hints.enhanced {
          background: rgba(31, 41, 55, 0.8) !important;
          color: #D1D5DB !important;
        }

        .dark-mode .chat-input-wrapper.revolutionary.enhanced {
          background: rgba(31, 41, 55, 0.9) !important;
          border-color: var(--primary-orange) !important;
        }

        /* GRAPHIQUE PROGRESSION TOKENS - CORRECTION 8 */
        .token-progress-chart {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 1rem;
          border: 2px solid rgba(99, 102, 241, 0.2);
        }

        .token-progress-chart h5 {
          text-align: center;
          color: #6366F1;
          margin-bottom: 1rem;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .progress-visualization {
          position: relative;
          height: 40px;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          margin-bottom: 1rem;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .progress-segment {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .progress-segment:hover {
          transform: scaleY(1.1);
          z-index: 2;
        }

        .progress-segment.green {
          background: linear-gradient(135deg, #32CD32, #4CAF50);
        }

        .progress-segment.yellow {
          background: linear-gradient(135deg, #F59E0B, #FbbF24);
        }

        .progress-segment.red {
          background: linear-gradient(135deg, #EF4444, #DC2626);
        }

        .current-position {
          position: relative;
          height: 60px;
          pointer-events: none;
        }

        .position-marker {
          position: absolute;
          top: -50px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 1.5rem;
          animation: bounce 2s infinite;
        }

        .position-label {
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          background: #6366F1;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          40% {
            transform: translateX(-50%) translateY(-5px);
          }
          60% {
            transform: translateX(-50%) translateY(-2px);
          }
        }

        /* MODE SOMBRE POUR NOUVELLES FONCTIONNALITÉS - CORRECTION 9 */
        .dark-mode .token-progress-chart {
          background: rgba(31, 41, 55, 0.9);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .dark-mode .token-progress-chart h5 {
          color: #818CF8;
        }

        .dark-mode .position-label {
          background: #4F46E5;
        }

        /* TOUS LES AUTRES STYLES RÉVOLUTIONNAIRES */
        .revolutionary-buttons {
          margin: 1.5rem 0;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(255, 140, 0, 0.1), rgba(50, 205, 50, 0.1));
          border-radius: 1.5rem;
          border: 2px solid rgba(255, 140, 0, 0.2);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .mode-buttons-header h3 {
          text-align: center;
          color: #FF8C00;
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
          font-weight: 800;
        }

        .mode-buttons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .mode-button {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          border: 3px solid transparent;
          border-radius: 1.5rem;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .mode-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          transition: all 0.3s ease;
        }

        .mode-button:hover:not(:disabled) {
          transform: translateY(-5px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
        }

        .mode-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .mode-button.step-by-step {
          border-color: #FF8C00;
        }

        .mode-button.step-by-step::before {
          background: linear-gradient(135deg, #FF8C00, #FF6B35);
        }

        .mode-button.step-by-step:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(255, 140, 0, 0.1), rgba(255, 140, 0, 0.05));
          border-color: #E67E00;
        }

        .mode-button.direct-solution {
          border-color: #32CD32;
        }

        .mode-button.direct-solution::before {
          background: linear-gradient(135deg, #32CD32, #10B981);
        }

        .mode-button.direct-solution:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(50, 205, 50, 0.1), rgba(50, 205, 50, 0.05));
          border-color: #059669;
        }

        .mode-icon {
          font-size: 3rem;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .mode-button:hover .mode-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .mode-content {
          flex: 1;
        }

        .mode-title {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #1F2937;
        }

        .mode-description {
          font-size: 1rem;
          color: #6B7280;
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }

        .mode-benefit {
          font-size: 0.9rem;
          font-weight: 600;
          color: #059669;
          padding: 0.5rem 1rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 0.75rem;
          display: inline-block;
        }

        /* ZONE MESSAGES AMÉLIORÉE */
        .chat-messages.enhanced {
          max-height: 500px;
          overflow-y: auto;
          padding: 1.5rem;
          background: linear-gradient(135deg, #F9FAFB, #FFFFFF);
          border-radius: 1rem;
          border: 2px solid rgba(99, 102, 241, 0.1);
          margin: 1rem 0;
        }

        .message-bubble {
          max-width: 85%;
          margin-bottom: 1.5rem;
          padding: 1.5rem;
          border-radius: 1.5rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          position: relative;
          animation: messageSlideIn 0.4s ease-out;
        }

        @keyframes messageSlideIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-bubble.user {
          align-self: flex-end;
          background: linear-gradient(135deg, #FF8C00, #FF6B35);
          color: white;
          margin-left: auto;
          border-bottom-right-radius: 0.5rem;
        }

        .message-bubble.user::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: -8px;
          width: 0;
          height: 0;
          border-left: 8px solid #FF6B35;
          border-bottom: 8px solid transparent;
        }

        .message-bubble.ai {
          align-self: flex-start;
          background: white;
          border: 2px solid #32CD32;
          color: #1F2937;
          border-bottom-left-radius: 0.5rem;
        }

        .message-bubble.ai::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: -10px;
          width: 0;
          height: 0;
          border-right: 10px solid #32CD32;
          border-bottom: 10px solid transparent;
        }

        .message-bubble.system {
          align-self: center;
          background: linear-gradient(135deg, #FEF3C7, #FDE68A);
          border: 2px solid #F59E0B;
          color: #92400E;
          text-align: center;
          margin: 0 auto;
          max-width: 90%;
        }

        .message-bubble.loading.enhanced {
          background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
          border: 2px solid #D1D5DB;
          animation: pulse 2s infinite;
        }

        .message-content {
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .message-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .message-time {
          color: #6B7280;
          font-weight: 500;
        }

        .message-info {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .message-tag {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 0.4rem;
          color: white;
          font-weight: 600;
        }

        .message-tag.welcome { background: #10B981; }
        .message-tag.context { background: #6366F1; }
        .message-tag.error { background: #EF4444; }
        .message-tag.offline { background: #6B7280; }
        .message-tag.mode { font-weight: 600; }

        .message-tokens {
          background: rgba(107, 114, 128, 0.2);
          padding: 0.2rem 0.5rem;
          border-radius: 0.4rem;
          font-size: 0.7rem;
          color: #4B5563;
          font-weight: 500;
        }

        /* ANIMATION CHARGEMENT AMÉLIORÉE */
        .ai-thinking {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .thinking-animation {
          display: flex;
          gap: 0.3rem;
        }

        .thinking-animation .dot {
          width: 10px;
          height: 10px;
          background: #FF8C00;
          border-radius: 50%;
          animation: thinking 1.4s infinite ease-in-out;
        }

        .thinking-animation .dot:nth-child(1) { animation-delay: -0.32s; }
        .thinking-animation .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes thinking {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }

        .thinking-text {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .main-text {
          font-weight: 600;
          color: #374151;
        }

        .step-info {
          font-size: 0.8rem;
          color: #6B7280;
          font-style: italic;
        }

        /* ZONE SAISIE RÉVOLUTIONNAIRE CORRIGÉE */
        .chat-input-wrapper.revolutionary.enhanced {
          background: white;
          border-radius: 1.5rem;
          border: 3px solid #FF8C00;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .input-container {
          display: flex;
          align-items: flex-end;
          gap: 0;
        }

        .chat-input.enhanced {
          flex: 1;
          padding: 1.25rem 1.5rem;
          border: none;
          background: transparent;
          resize: none;
          font-size: 1rem;
          line-height: 1.5;
          font-family: inherit;
          min-height: 60px;
          max-height: 150px;
          transition: all 0.3s ease;
        }

        .chat-input.enhanced:focus {
          outline: none;
          background: rgba(255, 140, 0, 0.02);
        }

        .chat-input.enhanced::placeholder {
          color: #9CA3AF;
          font-style: italic;
        }

        .input-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(255, 140, 0, 0.05);
        }

        /* BOUTON VOCAL AMÉLIORÉ */
        .voice-button {
          background: linear-gradient(135deg, #F59E0B, #D97706);
          border: none;
          padding: 0.75rem;
          border-radius: 1rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1.2rem;
          min-width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }

        .voice-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #D97706, #B45309);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
        }

        .voice-button.recording {
          background: linear-gradient(135deg, #EF4444, #DC2626);
          animation: recordingPulse 1s infinite;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        }

        @keyframes recordingPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .voice-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .send-button.enhanced {
          background: linear-gradient(135deg, #32CD32, #10B981);
          border: none;
          padding: 0.75rem;
          border-radius: 1rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1.2rem;
          min-width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(50, 205, 50, 0.3);
        }

        .send-button.enhanced:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(50, 205, 50, 0.4);
        }

        .send-button.enhanced:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          background: #9CA3AF;
        }

        .send-icon {
          font-size: 1.1rem;
        }

        /* CONSEILS AMÉLIORÉS */
        .input-hints.enhanced {
          padding: 1rem 1.5rem;
          background: rgba(255, 140, 0, 0.05);
          font-size: 0.9rem;
          text-align: center;
          line-height: 1.4;
        }

        .hint {
          display: block;
          margin: 0.25rem 0;
        }

        .hint.recording {
          color: #F59E0B;
          font-weight: 700;
          animation: recordingText 1s infinite;
        }

        @keyframes recordingText {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .hint.normal, .hint.step, .hint.direct, .hint.audio {
          color: #6B7280;
        }

        .hint.warning {
          color: #EF4444;
          font-weight: 600;
        }

        /* CONTRÔLES CHAT AMÉLIORÉS */
        .chat-header.revolutionary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 1.5rem 1.5rem 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .title-icon {
          font-size: 1.5rem;
        }

        .title-text {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .chat-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .control-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          padding: 0.75rem;
          border-radius: 1rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1.1rem;
          min-width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-button:hover, .control-button.active {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
        }

        .control-button.audio-btn.active {
          background: linear-gradient(135deg, #F59E0B, #D97706);
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
        }

        /* FEATURES SHOWCASE AMÉLIORÉ */
        .features-showcase {
          margin-top: 2rem;
          padding: 2.5rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05));
          border-radius: 1.5rem;
          border: 2px solid rgba(99, 102, 241, 0.1);
        }

        .features-grid.revolutionary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin: 2rem 0;
        }

        .feature-card {
          padding: 2rem;
          border-radius: 1.5rem;
          border: 2px solid rgba(99, 102, 241, 0.2);
          transition: all 0.3s ease;
          text-align: center;
        }

        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
        }

        .feature-card.memory { 
          background: linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(139, 69, 19, 0.05)); 
          border-color: #8B4513;
        }
        .feature-card.modes { 
          background: linear-gradient(135deg, rgba(255, 140, 0, 0.1), rgba(255, 140, 0, 0.05)); 
          border-color: #FF8C00;
        }
        .feature-card.adaptive { 
          background: linear-gradient(135deg, rgba(50, 205, 50, 0.1), rgba(50, 205, 50, 0.05)); 
          border-color: #32CD32;
        }
        .feature-card.audio { 
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05)); 
          border-color: #F59E0B;
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .feature-card h4 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #1F2937;
        }

        .feature-card p {
          color: #6B7280;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .mode-badges {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .mode-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
        }

        .mode-badge.step {
          background: linear-gradient(135deg, #FF8C00, #FF6B35);
        }

        .mode-badge.direct {
          background: linear-gradient(135deg, #32CD32, #10B981);
        }

        .audio-status {
          margin-top: 1rem;
        }

        .status-active {
          color: #10B981;
          font-weight: 600;
        }

        .status-available {
          color: #6B7280;
          font-weight: 500;
        }

        .profile-info, .difficulties-info {
          background: rgba(255, 255, 255, 0.8);
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          margin-top: 0.75rem;
          font-size: 0.9rem;
        }

        /* STATISTIQUES PERSONNELLES CORRIGÉES */
        .personal-stats {
          margin-top: 2.5rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 1.5rem;
          border: 2px solid rgba(99, 102, 241, 0.2);
        }

        .personal-stats h4 {
          text-align: center;
          color: #6366F1;
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1.5rem;
        }

        .stat-item {
          text-align: center;
          padding: 1.5rem 1rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.1));
          border-radius: 1rem;
          border: 1px solid rgba(99, 102, 241, 0.2);
          transition: all 0.3s ease;
        }

        .stat-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: 800;
          color: #6366F1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #6B7280;
          font-weight: 500;
        }

        /* MODE SOMBRE AMÉLIORÉ */
        .dark-mode .student-profile-header {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(99, 102, 241, 0.2));
          border-color: rgba(16, 185, 129, 0.4);
        }

        .dark-mode .student-name {
          color: #34D399;
        }

        .dark-mode .learning-style,
        .dark-mode .document-badge {
          background: rgba(99, 102, 241, 0.3);
          border-color: rgba(99, 102, 241, 0.5);
          color: #C7D2FE;
        }

        .dark-mode .current-mode {
          background: rgba(31, 41, 55, 0.9);
          color: white;
        }

        .dark-mode .tokens-text {
          color: #D1D5DB;
        }

        .dark-mode .revolutionary-buttons {
          background: linear-gradient(135deg, rgba(255, 140, 0, 0.15), rgba(50, 205, 50, 0.15));
          border-color: rgba(255, 140, 0, 0.4);
        }

        .dark-mode .mode-button {
          background: #374151;
          color: white;
          border-color: #4B5563;
        }

        .dark-mode .mode-title {
          color: #F9FAFB;
        }

        .dark-mode .mode-description {
          color: #D1D5DB;
        }

        .dark-mode .chat-messages.enhanced {
          background: linear-gradient(135deg, #1F2937, #111827);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .dark-mode .message-bubble.ai {
          background: #374151;
          border-color: #32CD32;
          color: #F9FAFB;
        }

        .dark-mode .message-bubble.system {
          background: linear-gradient(135deg, #92400E, #B45309);
          border-color: #F59E0B;
          color: #FEF3C7;
        }

        .dark-mode .features-showcase {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.1));
          border-color: rgba(99, 102, 241, 0.3);
        }

        .dark-mode .feature-card {
          background: #374151;
          border-color: #4B5563;
          color: #F9FAFB;
        }

        .dark-mode .feature-card h4 {
          color: #F9FAFB;
        }

        .dark-mode .feature-card p {
          color: #D1D5DB;
        }

        .dark-mode .personal-stats {
          background: rgba(31, 41, 55, 0.9);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .dark-mode .personal-stats h4 {
          color: #818CF8;
        }

        .dark-mode .stat-item {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(16, 185, 129, 0.2));
          border-color: rgba(99, 102, 241, 0.4);
        }

        .dark-mode .stat-number {
          color: #818CF8;
        }

        .dark-mode .stat-label {
          color: #D1D5DB;
        }

        /* RESPONSIVE POUR TOKENS - CORRECTION 10 */
        @media (max-width: 768px) {
          .student-profile-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .status-section {
            align-items: center;
          }

          .tokens-display {
            align-items: center;
            min-width: auto;
          }

          .mode-buttons-grid {
            grid-template-columns: 1fr;
          }

          .mode-button {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .chat-messages.enhanced {
            max-height: 400px;
            padding: 1rem;
          }

          .input-buttons {
            flex-direction: row;
            padding: 0.75rem;
          }

          .features-grid.revolutionary {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .progress-segment span {
            font-size: 0.7rem;
          }
          
          .position-label {
            font-size: 0.7rem;
            padding: 0.2rem 0.5rem;
          }
          
          .token-progress-chart {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .student-profile-header {
            padding: 1rem;
          }

          .revolutionary-buttons {
            padding: 1.5rem;
          }

          .mode-button {
            padding: 1.5rem;
          }

          .mode-icon {
            font-size: 2.5rem;
          }

          .mode-title {
            font-size: 1.1rem;
          }

          .mode-description {
            font-size: 0.9rem;
          }

          .chat-messages.enhanced {
            max-height: 350px;
            padding: 0.75rem;
          }

          .message-bubble {
            max-width: 95%;
            padding: 1rem;
          }

          .chat-input.enhanced {
            padding: 1rem;
            min-height: 50px;
          }

          .voice-button,
          .send-button.enhanced {
            min-width: 45px;
            height: 45px;
            font-size: 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .progress-visualization {
            height: 30px;
          }
          
          .progress-segment span {
            display: none;
          }
          
          .position-marker {
            font-size: 1.2rem;
          }
        }

        /* ANIMATIONS SUPPLÉMENTAIRES */
        .mode-reset {
          display: flex;
          justify-content: center;
          margin: 1.5rem 0;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .reset-button {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #6B7280, #4B5563);
          color: white;
          border: none;
          border-radius: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3);
        }

        .reset-button:hover {
          background: linear-gradient(135deg, #4B5563, #374151);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(107, 114, 128, 0.4);
        }

        /* AMÉLIORATIONS SUGGESTIONS */
        .suggestions-container {
          margin-bottom: 1.5rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 1rem;
          border: 2px solid rgba(99, 102, 241, 0.2);
        }

        .suggestions-title {
          text-align: center;
          color: #6366F1;
          font-weight: 600;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .suggestion-button {
          padding: 1rem;
          background: white;
          border: 2px solid #32CD32;
          border-radius: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          text-align: center;
          color: #374151;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .suggestion-button:hover:not(:disabled) {
          background: #32CD32;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(50, 205, 50, 0.3);
        }

        .suggestion-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dark-mode .suggestions-container {
          background: rgba(31, 41, 55, 0.9);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .dark-mode .suggestions-title {
          color: #818CF8;
        }

        .dark-mode .suggestion-button {
          background: #374151;
          color: #F9FAFB;
          border-color: #32CD32;
        }

        .dark-mode .suggestion-button:hover:not(:disabled) {
          background: #32CD32;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default ChatIA;
