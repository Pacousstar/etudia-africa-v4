import React, { useState, useEffect, useRef } from 'react';

// Onglet de chat ÉtudIA
const ChatIA = ({
   etudiant,
   urlApi,
   contexteDocument = '',
   tousDocuments = [],
   historiqueChat = [],
   setHistoriqueChat = () => {},
   tokensUtilisesChat = 0,
   setTokensUtilisesChat = () => {},
   surMiseAJourStats = () => {}
}) => {
   const [messages, setMessages] = useState(historiqueChat || []);
   const [messageSaisie, setMessageSaisie] = useState('');
   const [estEnChargement, setEstEnChargement] = useState(false);
   const [nombreConversations, setNombreConversations] = useState(0);
   const [totalTokens, setTotalTokens] = useState(0);
   const [messageBienvenueEnvoye, setMessageBienvenueEnvoye] = useState(false);
   const [profilApprentissage, setProfilApprentissage] = useState(null);
   
   // États révolutionnaires
   const [modeChat, setModeChat] = useState('normal');
   const [etapeActuelle, setEtapeActuelle] = useState(1);
   const [totalEtapes, setTotalEtapes] = useState(4);
   const [estModeAudio, setEstModeAudio] = useState(false);
   const [estModeNuit, setEstModeNuit] = useState(false);
   
   // Gestion des tokens corrigée
   const [utilisationTokens, setUtilisationTokens] = useState({
      utilisesAujourdhui: 0,
      restants: 95000,
      totalConversations: 0,
      derniereMiseAJour: Date.now()
   });
   
   // CORRECTION: Variables manquantes ajoutées
   const [statutConnexion, setStatutConnexion] = useState('online');
   const [estEnregistrement, setEstEnregistrement] = useState(false);
   const [reconnaissance, setReconnaissance] = useState(null);
   
   const refFinMessages = useRef(null);
   const refSaisie = useRef(null);

   // ✅ Récupération sécurisée du prénom
   const prenomEleve = etudiant?.nom?.split(' ')[0] || etudiant?.name?.split(' ')[0] || 'Élève';
   const classeEleve = etudiant?.classe || etudiant?.class_level || 'votre classe';

   // 🔧 CORRECTION 2: FONCTION MISE À JOUR TOKENS
   const mettreAJourUtilisationTokens = (nouveauxTokens, totalTokens = null) => {
     setUtilisationTokens(prev => {
       const misAJour = {
         ...prev,
         utilisesAujourdhui: totalTokens !== null ? totalTokens : prev.utilisesAujourdhui + nouveauxTokens,
         restants: totalTokens !== null ? 95000 - totalTokens : prev.restants - nouveauxTokens,
         totalConversations: prev.totalConversations + 1,
         derniereMiseAJour: Date.now()
       };
       
       console.log('🔋 Tokens mis à jour:', misAJour);
       return misAJour;
     });
   };

   // 🎤 INITIALISATION RECONNAISSANCE VOCALE
   useEffect(() => {
     if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
       const ReconnaissanceVocale = window.SpeechRecognition || window.webkitSpeechRecognition;
       const instanceReconnaissance = new ReconnaissanceVocale();
       
       instanceReconnaissance.continuous = false;
       instanceReconnaissance.interimResults = false;
       instanceReconnaissance.lang = 'fr-FR';
       
       instanceReconnaissance.onstart = () => {
         console.log('🎤 Reconnaissance vocale démarrée');
         setEstEnregistrement(true);
       };
       
       instanceReconnaissance.onresult = (event) => {
         const transcription = event.results[0][0].transcript;
         console.log('🎤 Texte reconnu:', transcription);
         setMessageSaisie(transcription);
         setEstEnregistrement(false);
       };
       
       instanceReconnaissance.onerror = (event) => {
         console.error('❌ Erreur reconnaissance vocale:', event.error);
         setEstEnregistrement(false);
       };
       
       instanceReconnaissance.onend = () => {
         console.log('🎤 Reconnaissance vocale terminée');
         setEstEnregistrement(false);
       };
       
       setReconnaissance(instanceReconnaissance);
     }
   }, []);

   // 🔊 FONCTION SYNTHÈSE VOCALE AMÉLIORÉE
   const parlerReponse = (texte) => {
     if ('speechSynthesis' in window) {
       speechSynthesis.cancel();
       
       const texteNettoye = texte
         .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
         .replace(/📊|🔁|✅|🎯|💬|🤖/g, '')
         .replace(/Étape \d+\/\d+/g, '')
         .trim();
       
       const elocution = new SpeechSynthesisUtterance(texteNettoye);
       elocution.lang = 'fr-FR';
       elocution.rate = 0.9;
       elocution.pitch = 1.0;
       elocution.volume = 0.8;
       
       const voix = speechSynthesis.getVoices();
       const voixFrancaise = voix.find(voix => voix.lang.startsWith('fr'));
       if (voixFrancaise) {
         elocution.voice = voixFrancaise;
       }
       
       elocution.onstart = () => console.log('🔊 Synthèse vocale démarrée');
       elocution.onend = () => console.log('🔊 Synthèse vocale terminée');
       elocution.onerror = (event) => console.error('❌ Erreur synthèse vocale:', event.error);
       
       speechSynthesis.speak(elocution);
     } else {
       console.warn('⚠️ Synthèse vocale non supportée');
     }
   };

   // 🎤 FONCTION DÉMARRAGE RECONNAISSANCE VOCALE
   const demarrerReconnaissanceVocale = () => {
     if (reconnaissance && !estEnregistrement) {
       try {
         reconnaissance.start();
         console.log('🎤 Démarrage reconnaissance vocale...');
       } catch (error) {
         console.error('❌ Erreur démarrage reconnaissance:', error);
         setEstEnregistrement(false);
       }
     } else if (!reconnaissance) {
       console.warn('⚠️ Reconnaissance vocale non supportée');
       alert('🎤 Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome ou Edge.');
     } else {
       console.log('🎤 Reconnaissance vocale déjà en cours...');
     }
   };

   // Suggestions intelligentes selon le profil
   const obtenirSuggestions = () => {
     const suggestionsBase = [
       "Explique-moi ce document en détail",
       "Quels sont les points clés à retenir ?",
       "Aide-moi avec cet exercice",
       "Comment réviser efficacement cette leçon ?"
     ];

     if (profilApprentissage?.style === 'interactif') {
       return [
         "Pose-moi des questions sur ce chapitre",
         "Créons un quiz ensemble",
         "Vérifie ma compréhension",
         "Débattons de ce sujet"
       ];
     } else if (profilApprentissage?.style === 'pratique') {
       return [
         "Montrons avec des exemples concrets",
         "Faisons des exercices pratiques",
         "Applications dans la vie réelle",
         "Exercices étape par étape"
       ];
     }

     return suggestionsBase;
   };

   // 🔧 CORRECTION 3: MESSAGE D'ACCUEIL CORRIGÉ
   const declencherMessageBienvenue = async () => {
     if (messages.length > 0 || historiqueChat.length > 0) {
       console.log('💬 Messages existants trouvés, pas de message d\'accueil');
       setMessageBienvenueEnvoye(true);
       return;
     }
     
     if (messageBienvenueEnvoye) return;
     
     try {
       setEstEnChargement(true);
       setStatutConnexion('connecting');
       
       const reponse = await fetch(`${urlApi}/api/chat`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           message: 'Connexion',
           user_id: etudiant.id,
           document_context: contexteDocument,
           is_welcome: true
         }),
       });

       const donnees = await reponse.json();

       if (reponse.ok) {
         const messageBienvenue = {
           id: Date.now(),
           type: 'ai',
           content: donnees.response,
           timestamp: donnees.timestamp,
           tokens: donnees.tokens_used || 0,
           model: donnees.model,
           hasContext: donnees.has_context,
           isWelcome: true
         };

         const messagesBienvenue = [messageBienvenue];
         setMessages(messagesBienvenue);
         setHistoriqueChat(messagesBienvenue);
         
         setMessageBienvenueEnvoye(true);
         setTotalTokens(donnees.tokens_used || 0);
         setProfilApprentissage(donnees.learning_profile);
         setStatutConnexion('online');

         if (donnees.tokens_used) {
           mettreAJourUtilisationTokens(donnees.tokens_used);
           setTokensUtilisesChat(donnees.tokens_used);
         }
       }
     } catch (error) {
       console.error('❌ Erreur message d\'accueil:', error);
       setStatutConnexion('offline');
       
       const messageBienvenueSecours = {
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

       const messagesSecours = [messageBienvenueSecours];
       setMessages(messagesSecours);
       setHistoriqueChat(messagesSecours);
       setMessageBienvenueEnvoye(true);
     } finally {
       setEstEnChargement(false);
     }
   };

   useEffect(() => {
     if (etudiant?.id && !messageBienvenueEnvoye) {
       setTimeout(declencherMessageBienvenue, 500);
     }
   }, [etudiant, messageBienvenueEnvoye]);

   useEffect(() => {
     refFinMessages.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages]);

   useEffect(() => {
     if (!estEnChargement && refSaisie.current) {
       refSaisie.current.focus();
     }
   }, [estEnChargement]);

   useEffect(() => {
     if (historiqueChat && historiqueChat.length > 0) {
       setMessages(historiqueChat);
       console.log(`💬 ${historiqueChat.length} messages restaurés dans ChatIA`);
     }
   }, [historiqueChat]);

   // 🔧 CORRECTION 4: ENVOI MESSAGE CORRIGÉ
   const gererEnvoiMessage = async (texteMessage = messageSaisie, mode = modeChat) => {
     if (!texteMessage.trim() || estEnChargement) return;

     const messageUtilisateur = {
       id: Date.now(),
       type: 'user',
       content: texteMessage.trim(),
       timestamp: new Date().toISOString(),
       tokens: 0,
       mode: mode
     };

     const nouveauxMessages = [...messages, messageUtilisateur];
     setMessages(nouveauxMessages);
     setHistoriqueChat(nouveauxMessages);

     setMessageSaisie('');
     setEstEnChargement(true);

     try {
       const donneesEnvoi = {
         message: texteMessage.trim(),
         user_id: etudiant.id,
         document_context: contexteDocument,
         mode: mode
       };

       if (mode === 'step_by_step') {
         donneesEnvoi.step_info = {
           current_step: etapeActuelle,
           total_steps: totalEtapes
         };
       }

       const reponse = await fetch(`${urlApi}/api/chat`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(donneesEnvoi),
       });

       const donnees = await reponse.json();

       if (reponse.ok) {
         const messageIA = {
           id: Date.now() + 1,
           type: 'ai',
           content: donnees.response,
           timestamp: donnees.timestamp,
           tokens: donnees.tokens_used || 0,
           model: donnees.model,
           hasContext: donnees.has_context,
           mode: mode,
           nextStep: donnees.next_step
         };

         const messagesFinaux = [...nouveauxMessages, messageIA];
         setMessages(messagesFinaux);
         setHistoriqueChat(messagesFinaux);

         setNombreConversations(prev => prev + 1);
         const nouveauTotalTokens = totalTokens + (donnees.tokens_used || 0);
         setTotalTokens(nouveauTotalTokens);
         
         const nouveauxTokensChat = tokensUtilisesChat + (donnees.tokens_used || 0);
         setTokensUtilisesChat(nouveauxTokensChat);
         
         setStatutConnexion('online');

         if (donnees.tokens_used) {
           mettreAJourUtilisationTokens(donnees.tokens_used, nouveauTotalTokens);
         }

         if (surMiseAJourStats && etudiant?.id) {
           setTimeout(() => surMiseAJourStats(etudiant.id), 1000);
         }

         if (mode === 'step_by_step' && donnees.next_step?.next) {
           setEtapeActuelle(donnees.next_step.next);
         }

         if (estModeAudio && donnees.response) {
           setTimeout(() => parlerReponse(donnees.response), 500);
         }

       } else {
         throw new Error(donnees.error || 'Erreur communication IA');
       }
     } catch (error) {
       console.error('❌ Erreur chat:', error);
       setStatutConnexion('error');
       
       const messageErreur = {
         id: Date.now() + 1,
         type: 'ai',
         content: `Désolé ${prenomEleve}, je rencontre des difficultés techniques ! 😅

Veuillez réessayer dans quelques instants.

🤖 ÉtudIA sera bientôt de retour pour t'aider !`,
         timestamp: new Date().toISOString(),
         tokens: 0,
         isError: true
       };
       
       const messagesErreur = [...nouveauxMessages, messageErreur];
       setMessages(messagesErreur);
       setHistoriqueChat(messagesErreur);
     } finally {
       setEstEnChargement(false);
     }
   };

   // Activer mode étape par étape
   const activerModeEtapeParEtape = () => {
     setModeChat('step_by_step');
     setEtapeActuelle(1);
     setTotalEtapes(4);
     
     const messageMode = `🔁 Mode "Étape par Étape" activé !

${prenomEleve}, je vais te guider progressivement à travers chaque étape de résolution.

📊 Format strict : "📊 Étape X/4"
🎯 Une seule question à la fois
✅ Validation de ta compréhension

Pose ta question et nous procéderons étape par étape ! 🚀`;

     const messageSysteme = {
       id: Date.now(),
       type: 'system',
       content: messageMode,
       timestamp: new Date().toISOString(),
       mode: 'step_by_step'
     };

     setMessages(prev => [...prev, messageSysteme]);
   };

   // Activer mode solution directe
   const activerModeSolutionDirecte = () => {
     setModeChat('direct_solution');
     
     const messageConfirmation = `✅ Mode "Solution Directe" activé !

${prenomEleve}, je vais analyser ton document et te donner toutes les solutions complètes.

🎯 Toutes les réponses finales
📝 Solutions détaillées et structurées
💡 Explications claires pour chaque calcul
⚡ Résultats immédiats

Quel exercice veux-tu que je résolve complètement ?`;

     const messageSysteme = {
       id: Date.now(),
       type: 'system', 
       content: messageConfirmation,
       timestamp: new Date().toISOString(),
       mode: 'direct_solution'
     };

     setMessages(prev => [...prev, messageSysteme]);
   };

   // Toggle mode audio
   const basculerModeAudio = () => {
     setEstModeAudio(!estModeAudio);
     
     if (!estModeAudio) {
       const messageAudio = {
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
       setMessages(prev => [...prev, messageAudio]);
       
       setTimeout(() => parlerReponse(`Mode audio activé ! ${prenomEleve}, tu peux maintenant me parler !`), 1000);
     } else {
       speechSynthesis.cancel();
       const messageAudioOff = {
         id: Date.now(),
         type: 'system',
         content: `🔇 Mode Audio désactivé !

${prenomEleve}, retour au mode texte uniquement.`,
         timestamp: new Date().toISOString(),
         mode: 'normal'
       };
       setMessages(prev => [...prev, messageAudioOff]);
     }
   };

   const gererAppuiTouche = (e) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       gererEnvoiMessage();
     }
   };

   const gererClicSuggestion = (suggestion) => {
     gererEnvoiMessage(suggestion);
   };

   // Retour mode normal
   const reinitialiserModeNormal = () => {
     setModeChat('normal');
     setEtapeActuelle(1);
     
     const messageReinit = {
       id: Date.now(),
       type: 'system',
       content: `↩️ Retour au mode normal !

${prenomEleve}, nous reprenons la conversation équilibrée. Tu peux à nouveau choisir tes modes d'apprentissage !`,
       timestamp: new Date().toISOString(),
       mode: 'normal'
     };

     setMessages(prev => [...prev, messageReinit]);
   };

   const formaterMessage = (contenu) => {
     return contenu
       .split('\n')
       .map((ligne, index) => (
         <React.Fragment key={index}>
           {ligne}
           {index < contenu.split('\n').length - 1 && <br />}
         </React.Fragment>
       ));
   };

   const formaterHeure = (horodatage) => {
     return new Date(horodatage).toLocaleTimeString('fr-FR', {
       hour: '2-digit',
       minute: '2-digit'
     });
   };

   // Obtenir couleur selon le mode
   const obtenirCouleurMode = (mode) => {
     switch (mode) {
       case 'step_by_step': return '#FF8C00';
       case 'direct_solution': return '#32CD32';
       case 'audio': return '#F59E0B';
       default: return '#6366F1';
     }
   };

   return (
     <div className={`tab-content chat-tab ${estModeNuit ? 'dark-mode' : ''}`}>
       <div className="content-header">
         <h2>🤖 Chat Révolutionnaire avec ÉtudIA</h2>
         <p>Votre tuteur IA personnel avec mémoire et modes d'apprentissage adaptatifs !</p>
         
         <div className="student-profile-header">
           <div className="student-info">
             <span className="student-name">👤 {prenomEleve} • 🎓 {classeEleve}</span>
             {profilApprentissage && (
               <span className="learning-style">
                 🧠 Style: {profilApprentissage.style || 'adaptatif'}
               </span>
             )}
             {contexteDocument && <span className="document-badge">📄 Document analysé</span>}
           </div>
           
           <div className="status-section">
             <div className="current-mode" style={{ color: obtenirCouleurMode(modeChat) }}>
               <span className="mode-indicator">
                 {modeChat === 'step_by_step' ? '🔁 Étape par Étape' :
                  modeChat === 'direct_solution' ? '✅ Solution Directe' :
                  modeChat === 'audio' ? '🎤 Audio' : '💬 Normal'}
               </span>
               {modeChat === 'step_by_step' && (
                 <span className="step-counter">📊 Étape {etapeActuelle}/{totalEtapes}</span>
               )}
             </div>
             
             <div className="tokens-display">
               <div className="tokens-bar">
                 <div 
                   className="tokens-fill" 
                   style={{ 
                     width: `${Math.min(100, (utilisationTokens.utilisesAujourdhui / 95000) * 100)}%`,
                     backgroundColor: utilisationTokens.utilisesAujourdhui > 85000 ? '#EF4444' : 
                                     utilisationTokens.utilisesAujourdhui > 50000 ? '#F59E0B' : '#32CD32'
                   }}
                 ></div>
               </div>
               <span className="tokens-text">
                 Tokens: {utilisationTokens.utilisesAujourdhui.toLocaleString()}/{(95000).toLocaleString()}
               </span>
               <div className="connection-status">
                 <div className={`status-dot ${statutConnexion}`}></div>
                 <span>{statutConnexion === 'online' ? 'En ligne' : 
                        statutConnexion === 'offline' ? 'Hors ligne' : 'Connexion...'}</span>
               </div>
             </div>
           </div>
         </div>
       </div>

       <div className="chat-container">
         <div className="chat-header revolutionary">
           <div className="chat-title">
             <span className="title-icon">💬</span>
             <span className="title-text">ÉtudIA - Tuteur IA Révolutionnaire</span>
           </div>
           
           <div className="chat-controls">
             <button 
               onClick={() => setEstModeNuit(!estModeNuit)}
               className={`control-button ${estModeNuit ? 'active' : ''}`}
               title="Mode sombre"
             >
               {estModeNuit ? '☀️' : '🌙'}
             </button>
             
             <button
               onClick={basculerModeAudio}
               className={`control-button audio-btn ${estModeAudio ? 'active' : ''}`}
               title="Mode audio"
             >
               🎤
             </button>
           </div>
         </div>

         {modeChat === 'normal' && (
           <div className="revolutionary-buttons">
             <div className="mode-buttons-header">
               <h3>🎯 Choisis ton mode d'apprentissage, {prenomEleve} !</h3>
             </div>
             
             <div className="mode-buttons-grid">
               <button
                 onClick={() => setModeChat('normal')}
                 className="mode-button normal active"
                 disabled={estEnChargement}
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
                 onClick={activerModeEtapeParEtape}
                 className="mode-button step-by-step"
                 disabled={estEnChargement}
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
                 onClick={activerModeSolutionDirecte}
                 className="mode-button direct-solution"
                 disabled={estEnChargement}
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

         {modeChat !== 'normal' && (
           <div className="mode-reset">
             <button onClick={reinitialiserModeNormal} className="reset-button">
               ↩️ Retour au mode normal
             </button>
           </div>
         )}

         <div className="chat-messages enhanced">
           {messages.map((message) => (
             <div
               key={message.id}
               className={`message-bubble ${message.type} ${message.mode ? `mode-${message.mode}` : ''}`}
             >
               <div className="message-content">
                 {formaterMessage(message.content)}
               </div>
               <div className="message-meta">
                 <div className="message-time">
                   {formaterHeure(message.timestamp)}
                 </div>
                 <div className="message-info">
                   {message.isWelcome && (
                     <span className="message-tag welcome">🎉 Accueil</span>
                   )}
                   {message.hasContext && (
                     <span className="message-tag context">📄 Doc</span>
                   )}
                   {message.mode && message.mode !== 'normal' && (
                     <span className="message-tag mode" style={{ backgroundColor: obtenirCouleurMode(message.mode) }}>
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

           {estEnChargement && (
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
                     {modeChat === 'step_by_step' && (
                       <div className="step-info">📊 Préparation étape {etapeActuelle}/{totalEtapes}</div>
                     )}
                     {modeChat === 'direct_solution' && (
                       <div className="step-info">✅ Résolution complète en cours...</div>
                     )}
                     {estModeAudio && (
                       <div className="step-info">🎤 Réponse vocale activée</div>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           )}

           <div ref={refFinMessages} />
         </div>

         <div className="chat-input-container">
           {messages.length <= 2 && !estEnChargement && (
             <div className="suggestions-container">
               <div className="suggestions-title">
                 💡 Questions suggérées pour {prenomEleve} :
               </div>
               <div className="suggestions-grid">
                 {obtenirSuggestions().slice(0, 4).map((suggestion, index) => (
                   <button
                     key={index}
                     className="suggestion-button"
                     onClick={() => gererClicSuggestion(suggestion)}
                     disabled={estEnChargement}
                   >
                     {suggestion}
                   </button>
                 ))}
               </div>
             </div>
           )}

           <div className="chat-input-wrapper revolutionary enhanced">
             <div className="input-container">
               <textarea
                 ref={refSaisie}
                 className="chat-input enhanced"
                 value={messageSaisie}
                 onChange={(e) => setMessageSaisie(e.target.value)}
                 onKeyPress={gererAppuiTouche}
                 placeholder={
                   estEnregistrement ? `🎤 Écoute en cours... Parlez maintenant !` :
                   modeChat === 'step_by_step' ? `${prenomEleve}, pose ta question pour l'étape ${etapeActuelle}...` :
                   modeChat === 'direct_solution' ? `${prenomEleve}, quel exercice résoudre directement ?` :
                   estModeAudio ? `${prenomEleve}, parle (🎙️) ou écris à ÉtudIA...` :
                   `${prenomEleve}, pose une question à ton tuteur IA...`
                 }
                 disabled={estEnChargement || estEnregistrement}
                 rows={1}
                 style={{
                   borderColor: estEnregistrement ? '#F59E0B' : obtenirCouleurMode(modeChat),
                   backgroundColor: estEnregistrement ? 'rgba(245, 158, 11, 0.1)' : 'white'
                 }}
               />
               
               <div className="input-buttons">
                 {estModeAudio && (
                   <button
                     className={`voice-button ${estEnregistrement ? 'recording' : ''}`}
                     onClick={demarrerReconnaissanceVocale}
                     disabled={estEnChargement || estEnregistrement}
                     title={estEnregistrement ? "Écoute en cours..." : "Parler à ÉtudIA"}
                   >
                     {estEnregistrement ? '🔴' : '🎙️'}
                   </button>
                 )}
                 
                 <button
                   className="send-button enhanced"
                   onClick={() => gererEnvoiMessage()}
                   disabled={!messageSaisie.trim() || estEnChargement || estEnregistrement}
                   style={{ backgroundColor: obtenirCouleurMode(modeChat) }}
                 >
                   <span className="send-icon">
                     {estEnChargement ? '⏳' : 
                      estEnregistrement ? '🎤' :
                      modeChat === 'step_by_step' ? '📊' :
                      modeChat === 'direct_solution' ? '✅' : '🚀'}
                   </span>
                 </button>
               </div>
             </div>

             <div className="input-hints enhanced">
               {estEnregistrement && (
                 <span className="hint recording">🎤 Parlez maintenant ! ÉtudIA vous écoute...</span>
               )}
               {!estEnregistrement && modeChat === 'normal' && (
                 <span className="hint normal">💡 Conseil : Choisis un mode d'apprentissage pour une expérience optimisée</span>
               )}
               {!estEnregistrement && modeChat === 'step_by_step' && (
                 <span className="hint step">📊 Mode Étape par Étape : Je te guide progressivement vers la solution</span>
               )}
               {!estEnregistrement && modeChat === 'direct_solution' && (
                 <span className="hint direct">✅ Mode Solution Directe : Je résous complètement tes exercices</span>
               )}
               {!estEnregistrement && estModeAudio && modeChat === 'normal' && (
                 <span className="hint audio">🎤 Mode Audio actif : Parle (🎙️) ou écris à ÉtudIA - Réponses vocales automatiques</span>
               )}
               {utilisationTokens.utilisesAujourdhui > 85000 && (
                 <span className="hint warning">⚠️ Attention : Limite tokens bientôt atteinte ({utilisationTokens.restants.toLocaleString()} restants)</span>
               )}
             </div>
           </div>
         </div>
       </div>

       {messages.length <= 2 && (
         <div className="features-showcase">
           <h3>🚀 Fonctionnalités Révolutionnaires d'ÉtudIA</h3>
           
           <div className="features-grid revolutionary">
             <div className="feature-card memory">
               <span className="feature-icon">🧠</span>
               <h4>Mémoire IA Personnalisée</h4>
               <p>ÉtudIA mémorise ton style d'apprentissage et s'adapte automatiquement</p>
               {profilApprentissage && (
                 <div className="profile-info">
                   Style détecté: <strong>{profilApprentissage.style}</strong>
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
                 {estModeAudio ? (
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
                 <span className="stat-number">{messages.length}</span>
                 <span className="stat-label">Messages Chat</span>
               </div>
               <div className="stat-item">
                 <span className="stat-number">{tokensUtilisesChat.toLocaleString()}</span>
                 <span className="stat-label">Tokens Chat</span>
               </div>
               <div className="stat-item">
                 <span className="stat-number">
                   {tousDocuments?.length || (contexteDocument ? '1' : '0')}
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
                 left: `${Math.min(100, (tokensUtilisesChat / 1000) * 100)}%` 
               }}>
                 <div className="position-marker">📍</div>
                 <div className="position-label">{tokensUtilisesChat.toLocaleString()}</div>
               </div>
             </div>
           </div>
         </div>
       )}

       <style jsx>{`
         /* Styles CSS complets ici - tous les styles du fichier original */
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

         .mode-button:hover:not(:disabled) {
           transform: translateY(-5px);
           box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
         }

         .mode-button:disabled {
           opacity: 0.6;
           cursor: not-allowed;
           transform: none;
         }

         .mode-icon {
           font-size: 3rem;
           flex-shrink: 0;
           transition: all 0.3s ease;
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

         .message-bubble.ai {
           align-self: flex-start;
           background: white;
           border: 2px solid #32CD32;
           color: #1F2937;
           border-bottom-left-radius: 0.5rem;
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

         .input-buttons {
           display: flex;
           flex-direction: column;
           gap: 0.5rem;
           padding: 1rem;
           background: rgba(255, 140, 0, 0.05);
         }

         .voice-button, .send-button.enhanced {
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
         }

         .voice-button {
           background: linear-gradient(135deg, #F59E0B, #D97706);
           box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
         }

         .send-button.enhanced {
           background: linear-gradient(135deg, #32CD32, #10B981);
           box-shadow: 0 4px 15px rgba(50, 205, 50, 0.3);
         }

         .voice-button:hover:not(:disabled), .send-button.enhanced:hover:not(:disabled) {
           transform: translateY(-2px);
         }

         .voice-button.recording {
           background: linear-gradient(135deg, #EF4444, #DC2626);
           animation: recordingPulse 1s infinite;
         }

         @keyframes recordingPulse {
           0%, 100% { transform: scale(1); }
           50% { transform: scale(1.1); }
         }

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

         .personal-stats {
           margin-top: 2.5rem;
           padding: 2rem;
           background: rgba(255, 255, 255, 0.9);
           border-radius: 1.5rem;
           border: 2px solid rgba(99, 102, 241, 0.2);
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

         .token-progress-chart {
           margin-top: 2rem;
           padding: 1.5rem;
           background: rgba(255, 255, 255, 0.9);
           border-radius: 1rem;
           border: 2px solid rgba(99, 102, 241, 0.2);
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
         }

         @media (max-width: 768px) {
           .mode-buttons-grid {
             grid-template-columns: 1fr;
           }
           .features-grid.revolutionary {
             grid-template-columns: 1fr;
           }
         }
       `}</style>
     </div>
   );
 };

 export default ChatIA;
