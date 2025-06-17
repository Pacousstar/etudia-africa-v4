// src/services/GroqApiManager.js
// ===================================================================
// 🔑 GESTIONNAIRE MULTI-CLÉS API GROQ POUR ÉtudIA
// ===================================================================

class GroqApiManager {
  constructor() {
    // 🔐 Configuration des 5 clés API Groq
    this.apiKeys = [
      process.env.REACT_APP_GROQ_API_KEY_1,
      process.env.REACT_APP_GROQ_API_KEY_2,
      process.env.REACT_APP_GROQ_API_KEY_3,
      process.env.REACT_APP_GROQ_API_KEY_4,
      process.env.REACT_APP_GROQ_API_KEY_5
    ].filter(key => key && key !== ''); // Filtre les clés vides

    // 📊 État de chaque clé
    this.keyStatus = this.apiKeys.map((key, index) => ({
      id: index,
      key: key,
      isBlocked: false,
      blockedUntil: null,
      requestCount: 0,
      lastUsed: null,
      errorCount: 0
    }));

    this.currentKeyIndex = 0;
    this.maxRetries = this.apiKeys.length;
    
    console.log(`🔑 GroqApiManager initialisé avec ${this.apiKeys.length} clés API`);
  }

  // 🎯 Obtenir la clé API active
  getCurrentKey() {
    return this.keyStatus[this.currentKeyIndex];
  }

  // 🔄 Rotation vers la clé suivante
  rotateToNextKey() {
    const startIndex = this.currentKeyIndex;
    
    do {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      const currentKey = this.keyStatus[this.currentKeyIndex];
      
      // Vérifier si la clé est disponible
      if (!this.isKeyBlocked(currentKey)) {
        console.log(`🔄 Rotation vers la clé ${this.currentKeyIndex + 1}`);
        return currentKey;
      }
    } while (this.currentKeyIndex !== startIndex);

    // Toutes les clés sont bloquées
    throw new Error('🚫 Toutes les clés API Groq sont temporairement bloquées');
  }

  // ⚠️ Vérifier si une clé est bloquée
  isKeyBlocked(keyInfo) {
    if (!keyInfo.isBlocked) return false;
    
    const now = new Date();
    if (keyInfo.blockedUntil && now < keyInfo.blockedUntil) {
      return true;
    }
    
    // Débloquer la clé si le délai est passé
    keyInfo.isBlocked = false;
    keyInfo.blockedUntil = null;
    keyInfo.errorCount = 0;
    console.log(`✅ Clé ${keyInfo.id + 1} débloquée automatiquement`);
    return false;
  }

  // 🚫 Bloquer une clé temporairement
  blockKey(keyInfo, durationMinutes = 60) {
    keyInfo.isBlocked = true;
    keyInfo.blockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    keyInfo.errorCount++;
    
    console.warn(`🚫 Clé ${keyInfo.id + 1} bloquée pour ${durationMinutes} minutes`);
    
    // Passer à la clé suivante
    this.rotateToNextKey();
  }

  // 📊 Enregistrer l'utilisation d'une clé
  recordKeyUsage(keyInfo, success = true) {
    keyInfo.lastUsed = new Date();
    keyInfo.requestCount++;
    
    if (!success) {
      keyInfo.errorCount++;
      
      // Bloquer après 3 erreurs consécutives
      if (keyInfo.errorCount >= 3) {
        this.blockKey(keyInfo, 30); // Bloquer 30 minutes
      }
    } else {
      keyInfo.errorCount = 0; // Reset erreurs en cas de succès
    }
  }

  // 🔑 Obtenir une clé API valide
  async getValidApiKey() {
    let attempts = 0;
    
    while (attempts < this.maxRetries) {
      const currentKey = this.getCurrentKey();
      
      if (!this.isKeyBlocked(currentKey)) {
        return currentKey;
      }
      
      this.rotateToNextKey();
      attempts++;
    }
    
    throw new Error('🚫 Aucune clé API Groq disponible');
  }

  // 📈 Statistiques des clés
  getKeyStatistics() {
    return this.keyStatus.map(key => ({
      keyId: key.id + 1,
      isBlocked: key.isBlocked,
      requestCount: key.requestCount,
      errorCount: key.errorCount,
      lastUsed: key.lastUsed,
      blockedUntil: key.blockedUntil
    }));
  }

  // 🔄 Reset manuel d'une clé
  resetKey(keyIndex) {
    if (keyIndex >= 0 && keyIndex < this.keyStatus.length) {
      const key = this.keyStatus[keyIndex];
      key.isBlocked = false;
      key.blockedUntil = null;
      key.errorCount = 0;
      console.log(`🔄 Clé ${keyIndex + 1} réinitialisée manuellement`);
    }
  }

  // 🔄 Reset toutes les clés
  resetAllKeys() {
    this.keyStatus.forEach((key, index) => {
      key.isBlocked = false;
      key.blockedUntil = null;
      key.errorCount = 0;
    });
    this.currentKeyIndex = 0;
    console.log('🔄 Toutes les clés API ont été réinitialisées');
  }
}

// ===================================================================
// 🚀 SERVICE GROQ AVEC GESTION MULTI-CLÉS
// ===================================================================

class GroqService {
  constructor() {
    this.apiManager = new GroqApiManager();
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  }

  // 🤖 Appel API avec rotation automatique des clés
  async callGroqAPI(messages, options = {}) {
    const maxRetries = this.apiManager.apiKeys.length;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const keyInfo = await this.apiManager.getValidApiKey();
        
        console.log(`🔑 Tentative ${attempt + 1} avec la clé ${keyInfo.id + 1}`);

        const response = await this.makeApiCall(keyInfo.key, messages, options);
        
        // Enregistrer le succès
        this.apiManager.recordKeyUsage(keyInfo, true);
        
        return response;

      } catch (error) {
        lastError = error;
        const currentKey = this.apiManager.getCurrentKey();
        
        console.error(`❌ Erreur avec la clé ${currentKey.id + 1}:`, error.message);

        // Gestion des erreurs spécifiques
        if (this.isQuotaError(error) || this.isRateLimitError(error)) {
          console.warn(`🚫 Quota/Rate limit atteint pour la clé ${currentKey.id + 1}`);
          this.apiManager.blockKey(currentKey, 60); // Bloquer 1 heure
        } else if (this.isAuthError(error)) {
          console.error(`🔐 Erreur d'authentification pour la clé ${currentKey.id + 1}`);
          this.apiManager.blockKey(currentKey, 120); // Bloquer 2 heures
        } else {
          // Erreur temporaire, juste enregistrer
          this.apiManager.recordKeyUsage(currentKey, false);
          this.apiManager.rotateToNextKey();
        }

        // Attendre avant la prochaine tentative
        if (attempt < maxRetries - 1) {
          await this.delay(1000 * (attempt + 1)); // Délai progressif
        }
      }
    }

    throw new Error(`🚫 Échec après ${maxRetries} tentatives. Dernière erreur: ${lastError?.message}`);
  }

  // 🌐 Effectuer l'appel API réel
  async makeApiCall(apiKey, messages, options) {
    const requestBody = {
      model: options.model || "llama-3.1-70b-versatile",
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      top_p: options.top_p || 1,
      stream: false
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error?.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.response = errorData;
      throw error;
    }

    return await response.json();
  }

  // 🔍 Identifier les erreurs de quota
  isQuotaError(error) {
    return error.status === 429 || 
           error.message?.includes('quota') ||
           error.message?.includes('limit exceeded');
  }

  // 🔍 Identifier les erreurs de rate limiting
  isRateLimitError(error) {
    return error.status === 429 ||
           error.message?.includes('rate limit') ||
           error.message?.includes('too many requests');
  }

  // 🔍 Identifier les erreurs d'authentification
  isAuthError(error) {
    return error.status === 401 || 
           error.status === 403 ||
           error.message?.includes('authorization') ||
           error.message?.includes('invalid api key');
  }

  // ⏰ Fonction de délai
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 📊 Obtenir les statistiques
  getStatistics() {
    return this.apiManager.getKeyStatistics();
  }

  // 🔄 Réinitialiser les clés
  resetKeys() {
    this.apiManager.resetAllKeys();
  }
}

export { GroqApiManager, GroqService };
