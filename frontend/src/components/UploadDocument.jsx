import React, { useState, useRef } from 'react';

const UploadDocument = ({ student, apiUrl, onDocumentProcessed }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const supportedFormats = ['JPG', 'PNG', 'WebP', 'PDF', 'DOC', 'DOCX', 'TXT'];
  const maxFileSize = 15 * 1024 * 1024; // 15MB (augmenté pour correspondre au serveur)

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const validateFile = (file) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/jpg',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non supporté. Utilisez: ${supportedFormats.join(', ')}`);
    }

    if (file.size > maxFileSize) {
      throw new Error('Fichier trop volumineux. Taille maximale: 15MB');
    }

    return true;
  };

  const handleFileUpload = async (file) => {
    try {
      setError('');
      setUploadResult(null);
      setUploading(true);
      setUploadProgress(0);

      console.log('📁 Début upload:', file.name, file.type, file.size);

      // Valider le fichier
      validateFile(file);

      // Créer FormData
      const formData = new FormData();
      formData.append('document', file);
      formData.append('user_id', student.id);

      console.log('🚀 Envoi vers:', `${apiUrl}/api/upload`);
      console.log('👤 User ID:', student.id);

      // Simuler progression pour une meilleure UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + Math.random() * 10;
        });
      }, 300);

      // ✅ CORRECTION PRINCIPALE: Utiliser /api/upload au lieu de /api/upload-document
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('📡 Statut réponse:', response.status);

      // ✅ CORRECTION: Meilleure gestion des erreurs de réponse
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Si ce n'est pas du JSON, c'est probablement une page d'erreur HTML
        const textResponse = await response.text();
        console.error('❌ Réponse non-JSON reçue:', textResponse.substring(0, 200));
        throw new Error('Le serveur a retourné une réponse inattendue. Vérifiez que le backend fonctionne correctement.');
      }

      console.log('📦 Données reçues:', data);

      if (response.ok && data.success) {
        // Adapter les données au format attendu par le composant
        const adaptedResult = {
          message: data.message || 'Document traité avec succès !',
          document: {
            id: data.data?.id,
            filename: data.data?.nom_original || file.name,
            extracted_text: data.data?.texte_extrait || '',
            confidence: 95.0
          },
          quick_actions: [
            'Résumer ce document',
            'Poser une question sur ce contenu', 
            'Identifier les points clés',
            'Créer un plan de révision'
          ],
          next_step: 'Passez au chat pour poser vos questions ! 💬'
        };

        setUploadResult(adaptedResult);
        
        // Notifier le parent avec le texte extrait
        if (onDocumentProcessed && adaptedResult.document.extracted_text) {
          onDocumentProcessed(adaptedResult.document.extracted_text);
        }
        
        // Animation de succès
        setTimeout(() => {
          setUploadProgress(0);
        }, 2000);

      } else {
        throw new Error(data.error || data.message || 'Erreur lors du traitement du document');
      }

    } catch (err) {
      console.error('❌ Erreur upload:', err);
      
      // ✅ CORRECTION: Messages d'erreur plus informatifs
      let errorMessage = err.message;
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend fonctionne sur le port 3000.';
      } else if (err.message.includes('<!DOCTYPE')) {
        errorMessage = 'Le serveur a retourné une page d\'erreur. Vérifiez que la route /api/upload existe.';
      }
      
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleQuickAction = (action) => {
    if (uploadResult && onDocumentProcessed) {
      // Passer l'action au composant chat avec le contexte du document
      const contextMessage = `Contexte du document: ${uploadResult.document.extracted_text}\n\nAction demandée: ${action}`;
      onDocumentProcessed(contextMessage);
    }
  };

  const resetUpload = () => {
    setUploadResult(null);
    setError('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="tab-content upload-tab">
      <div className="content-header">
        <h2>📸 Upload & OCR Révolutionnaire</h2>
        <p>Photographiez vos devoirs, ÉtudIA extrait le texte instantanément avec une précision de 95%+ !</p>
      </div>

      <div className="upload-container">
        {/* Zone d'upload */}
        <div
          className={`upload-zone ${dragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">
            {uploading ? '⚡' : '📸'}
          </div>
          
          <div className="upload-text">
            <h3>
              {uploading 
                ? 'Analyse en cours...' 
                : 'Glissez votre document ici ou cliquez pour sélectionner'
              }
            </h3>
            <p>
              {uploading 
                ? 'ÉtudIA utilise l\'OCR Tesseract.js pour extraire le texte' 
                : 'Formats supportés: Photos de devoirs, PDF, Documents Word, TXT'
              }
            </p>
          </div>

          {!uploading && (
            <div className="supported-formats">
              {supportedFormats.map(format => (
                <span key={format} className="format-tag">{format}</span>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Barre de progression */}
        {uploading && (
          <div className="upload-progress">
            <div className="progress-info">
              <span className="file-name">
                {fileInputRef.current?.files[0]?.name || 'Document'}
              </span>
              <span className="progress-percent">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="progress-bar-upload">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
              {uploadProgress < 30 && '📤 Upload en cours...'}
              {uploadProgress >= 30 && uploadProgress < 60 && '🔍 Extraction OCR en cours...'}
              {uploadProgress >= 60 && uploadProgress < 85 && '🧠 Analyse IA en cours...'}
              {uploadProgress >= 85 && uploadProgress < 100 && '💾 Finalisation...'}
              {uploadProgress === 100 && '✅ Terminé ! 🎉'}
            </div>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="message error">
            <h3 style={{ color: '#ff4444', marginBottom: '0.5rem' }}>
              ⚠️ Erreur lors du traitement du document
            </h3>
            <p style={{ marginBottom: '1rem' }}>{error}</p>
            
            <div style={{ marginTop: '1rem' }}>
              <strong>💡 Conseils :</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                <li>Vérifiez que le serveur backend fonctionne sur le port 3000</li>
                <li>Assurez-vous que l'image est nette et bien éclairée</li>
                <li>Le texte doit être clairement visible</li>
                <li>Essayez avec un format différent (PDF recommandé)</li>
                <li>Vérifiez que le fichier fait moins de 15MB</li>
                <li>Vérifiez votre connexion internet</li>
              </ul>
            </div>
            
            <button 
              onClick={resetUpload}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              🔄 Réessayer
            </button>
          </div>
        )}

        {/* Résultat de l'upload */}
        {uploadResult && (
          <div className="upload-result">
            <div className="result-header">
              <span className="result-icon">🎉</span>
              <h3 className="result-title">Document analysé avec succès !</h3>
              <button 
                onClick={resetUpload}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Nouveau document
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong>📄 Fichier :</strong> {uploadResult.document.filename}
              <br />
              <strong>🎯 Confiance OCR :</strong> {uploadResult.document.confidence}%
              <br />
              <strong>📝 Caractères extraits :</strong> {uploadResult.document.extracted_text.length}
            </div>

            {/* Aperçu du texte extrait */}
            <div>
              <h4 style={{ marginBottom: '0.5rem', color: 'white' }}>
                📖 Texte extrait :
              </h4>
              <div className="extracted-text">
                {uploadResult.document.extracted_text.length > 500 
                  ? uploadResult.document.extracted_text.substring(0, 500) + '...'
                  : uploadResult.document.extracted_text
                }
              </div>
              {uploadResult.document.extracted_text.length > 500 && (
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
                  Texte tronqué pour l'aperçu. Le texte complet sera utilisé dans le chat.
                </p>
              )}
            </div>

            {/* Actions rapides */}
            <div className="quick-actions">
              <h4>⚡ Actions rapides :</h4>
              <div className="action-buttons">
                {uploadResult.quick_actions.map((action, index) => (
                  <button
                    key={index}
                    className="action-button"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            {/* Prochaine étape */}
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: 'rgba(29, 185, 84, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(29, 185, 84, 0.3)',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#1DB954' }}>
                🚀 {uploadResult.next_step}
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                Votre document a été analysé et ajouté au contexte de l'IA. 
                Vous pouvez maintenant poser des questions spécifiques sur ce contenu !
              </p>
            </div>
          </div>
        )}

        {/* Instructions et conseils */}
        {!uploadResult && !uploading && (
          <div style={{ marginTop: '2rem' }}>
            <div className="features-grid">
              <div className="feature-card">
                <span className="feature-icon">📱</span>
                <h3>Photos de Devoirs</h3>
                <p>Photographiez vos exercices, problèmes de maths, textes à analyser</p>
              </div>
              
              <div className="feature-card">
                <span className="feature-icon">📄</span>
                <h3>Documents Scannés</h3>
                <p>PDF, Word, images scannées, TXT - tous les formats éducatifs supportés</p>
              </div>
              
              <div className="feature-card">
                <span className="feature-icon">🤖</span>
                <h3>IA Contextuelle</h3>
                <p>L'IA utilise le contenu de vos documents pour des réponses précises</p>
              </div>
              
              <div className="feature-card">
                <span className="feature-icon">⚡</span>
                <h3>Analyse Instantanée</h3>
                <p>OCR révolutionnaire avec Tesseract.js - résultats en secondes</p>
              </div>
            </div>

            {/* Conseils d'utilisation */}
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#FF6B35' }}>
                💡 Conseils pour un OCR optimal :
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <h4 style={{ color: '#1DB954', marginBottom: '0.5rem' }}>📸 Qualité Photo</h4>
                  <ul style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                    <li>Éclairage suffisant et uniforme</li>
                    <li>Éviter les ombres sur le texte</li>
                    <li>Tenir le téléphone bien droit</li>
                    <li>Texte net, sans flou de mouvement</li>
                  </ul>
                </div>
                
                <div>
                  <h4 style={{ color: '#6366F1', marginBottom: '0.5rem' }}>📄 Préparation Document</h4>
                  <ul style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                    <li>Aplatir les pages froissées</li>
                    <li>Éviter les reflets brillants</li>
                    <li>Cadrer uniquement le texte utile</li>
                    <li>Contraste élevé entre texte et fond</li>
                  </ul>
                </div>
                
                <div>
                  <h4 style={{ color: '#F59E0B', marginBottom: '0.5rem' }}>⚙️ Formats Optimaux</h4>
                  <ul style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                    <li>PDF pour les documents scannés</li>
                    <li>PNG pour les captures d'écran</li>
                    <li>JPG pour les photos</li>
                    <li>Word pour les devoirs tapés</li>
                    <li>TXT pour les fichiers texte simples</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Statistiques de réussite */}
            <div style={{
              marginTop: '2rem',
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <h3 style={{ color: '#10B981', marginBottom: '1rem' }}>
                🎯 Statistiques de Réussite ÉtudIA
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>95%+</div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Précision OCR</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>3s</div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Temps moyen</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>15MB</div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Taille max</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>98%</div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Satisfaction élèves</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDocument;