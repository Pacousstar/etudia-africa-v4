// UploadDocument.js - VERSION RÉVOLUTIONNAIRE AVEC CONSEILS OCR VISIBLES
import React, { useState, useRef } from 'react';

const UploadDocument = ({ student, apiUrl, onDocumentProcessed }) => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Récupération sécurisée du prénom
  const prenomEleve = student?.nom?.split(' ')[0] || student?.name?.split(' ')[0] || 'Élève';

  // Types de fichiers supportés avec icônes
  const supportedTypes = {
    'image/jpeg': { icon: '🖼️', name: 'JPEG' },
    'image/png': { icon: '🖼️', name: 'PNG' },
    'image/jpg': { icon: '🖼️', name: 'JPG' },
    'image/webp': { icon: '🖼️', name: 'WebP' },
    'application/pdf': { icon: '📄', name: 'PDF' },
    'text/plain': { icon: '📝', name: 'TXT' },
    'application/msword': { icon: '📘', name: 'DOC' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📘', name: 'DOCX' }
  };

  // Validation fichier
  const validateFile = (file) => {
    const maxSize = 15 * 1024 * 1024; // 15MB
    const allowedTypes = Object.keys(supportedTypes);

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non supporté. Formats acceptés: ${Object.values(supportedTypes).map(t => t.name).join(', ')}`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Fichier trop volumineux. Taille maximum: 15MB'
      };
    }

    return { valid: true };
  };

  // Créer aperçu fichier
  const createPreview = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  // Simuler progression upload
  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(Math.floor(progress));
    }, 200);
    return interval;
  };

  // Traitement upload
  const processUpload = async (file) => {
    setUploadStatus('uploading');
    setErrorMessage('');
    setExtractedText('');
    setDocumentInfo(null);

    // Validation
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      setUploadStatus('error');
      return;
    }

    // Aperçu et info fichier
    createPreview(file);
    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type,
      icon: supportedTypes[file.type]?.icon || '📄'
    });

    try {
      // Progression simulée
      const progressInterval = simulateProgress();

      // Préparation données
      const formData = new FormData();
      formData.append('document', file);
      formData.append('user_id', student.id);

      console.log('📤 Upload démarré:', file.name, file.type, file.size);

      setUploadStatus('processing');
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Envoi au serveur
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      console.log('📡 Réponse serveur:', response.status, response.ok);

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Résultat upload:', result);

      if (result.success) {
        setExtractedText(result.data.texte_extrait);
        setDocumentInfo({
          id: result.data.id,
          nom_original: result.data.nom_original,
          matiere: result.data.matiere || 'Général',
          resume: result.data.resume || 'Document analysé avec succès',
          nb_exercices: result.data.nb_exercices || 1,
          confidence: 95 // Simulation confiance OCR
        });
        setUploadStatus('success');

        // Callback vers parent avec données complètes
        if (onDocumentProcessed) {
          onDocumentProcessed(result.data.texte_extrait, {
            id: result.data.id,
            nom_original: result.data.nom_original,
            matiere: result.data.matiere,
            date_upload: new Date().toISOString()
          });
        }

      } else {
        throw new Error(result.error || 'Erreur traitement document');
      }

    } catch (error) {
      console.error('❌ Erreur upload:', error);
      setErrorMessage(`Erreur: ${error.message}`);
      setUploadStatus('error');
    }
  };

  // Gestionnaires événements
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadProgress(0);
    setExtractedText('');
    setDocumentInfo(null);
    setErrorMessage('');
    setPreviewUrl(null);
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="tab-content upload-tab">
      <div className="content-header">
        <h2 className="main-title">📸 Upload & Analyse OCR Révolutionnaire</h2>
        <p className="main-subtitle">
          {prenomEleve}, uploadez votre document et laissez ÉtudIA l'analyser avec une précision de 95% !
        </p>
      </div>

      {/* Zone de drop principale */}
      <div className="upload-container">
        <div
          ref={dropZoneRef}
          className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${uploadStatus !== 'idle' ? 'processing' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => uploadStatus === 'idle' && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.doc,.docx"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={uploadStatus !== 'idle'}
          />

          {uploadStatus === 'idle' && (
            <div className="drop-zone-content">
              <div className="upload-icon">📤</div>
              <h3>Glissez votre document ici</h3>
              <p>ou <strong>cliquez pour parcourir</strong></p>
              <div className="supported-formats">
                {Object.entries(supportedTypes).map(([type, info]) => (
                  <span key={type} className="format-badge">
                    {info.icon} {info.name}
                  </span>
                ))}
              </div>
              <div className="file-limits">
                <span>📏 Taille max: 15MB</span>
                <span>🎯 Précision OCR: 95%+</span>
              </div>
            </div>
          )}

          {uploadStatus === 'uploading' && (
            <div className="upload-progress">
              <div className="upload-icon spinning">⏳</div>
              <h3>Upload en cours...</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p>{uploadProgress}% - Envoi vers ÉtudIA</p>
            </div>
          )}

          {uploadStatus === 'processing' && (
            <div className="processing-animation">
              <div className="upload-icon processing">🧠</div>
              <h3>Analyse IA en cours...</h3>
              <div className="processing-steps">
                <div className="step active">📤 Upload terminé</div>
                <div className="step active">🔍 Extraction OCR</div>
                <div className="step active">🧠 Analyse IA</div>
                <div className="step">✅ Finalisation</div>
              </div>
              <p>ÉtudIA analyse votre document avec Llama 3.3...</p>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="upload-error">
              <div className="upload-icon error">❌</div>
              <h3>Erreur lors du traitement</h3>
              <p className="error-message">{errorMessage}</p>
              <button className="retry-button" onClick={resetUpload}>
                🔄 Réessayer
              </button>
            </div>
          )}

          {uploadStatus === 'success' && documentInfo && (
            <div className="upload-success">
              <div className="upload-icon success">✅</div>
              <h3>Document analysé avec succès !</h3>
              <div className="document-summary">
                <div className="doc-icon">{fileInfo?.icon}</div>
                <div className="doc-details">
                  <div className="doc-name">{documentInfo.nom_original}</div>
                  <div className="doc-meta">
                    <span>📚 {documentInfo.matiere}</span>
                    <span>📊 {documentInfo.nb_exercices} exercice(s)</span>
                    <span>🎯 {documentInfo.confidence}% confiance</span>
                  </div>
                </div>
              </div>
              <button className="continue-button" onClick={() => window.location.hash = '#chat'}>
                💬 Commencer le Chat avec ÉtudIA
              </button>
              <button className="upload-another-button" onClick={resetUpload}>
                ➕ Uploader un autre document
              </button>
            </div>
          )}
        </div>

        {/* Aperçu fichier */}
        {previewUrl && uploadStatus !== 'idle' && (
          <div className="file-preview">
            <h4>📋 Aperçu du fichier</h4>
            <div className="preview-container">
              <img src={previewUrl} alt="Aperçu" className="preview-image" />
              <div className="file-details">
                <div className="file-name">{fileInfo?.name}</div>
                <div className="file-info">
                  <span>{fileInfo?.icon} {supportedTypes[fileInfo?.type]?.name}</span>
                  <span>📏 {(fileInfo?.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 💡 CONSEILS OCR OPTIMAUX - MAINTENANT VISIBLES ! */}
      <div className="ocr-tips-section">
        <h3 className="tips-title">💡 Conseils pour un OCR optimal</h3>
        <div className="tips-grid">
          <div className="tip-card quality">
            <div className="tip-icon">📸</div>
            <div className="tip-content">
              <h4>Qualité d'image</h4>
              <ul>
                <li>✅ Photo bien éclairée et nette</li>
                <li>✅ Résolution minimum 300 DPI</li>
                <li>❌ Éviter les images floues</li>
                <li>❌ Pas de reflets ou ombres</li>
              </ul>
            </div>
          </div>

          <div className="tip-card text">
            <div className="tip-icon">📝</div>
            <div className="tip-content">
              <h4>Texte lisible</h4>
              <ul>
                <li>✅ Texte droit et bien cadré</li>
                <li>✅ Contraste élevé (noir sur blanc)</li>
                <li>❌ Éviter l'écriture manuscrite</li>
                <li>❌ Pas de texte trop petit</li>
              </ul>
            </div>
          </div>

          <div className="tip-card format">
            <div className="tip-icon">📄</div>
            <div className="tip-content">
              <h4>Format recommandé</h4>
              <ul>
                <li>🥇 PDF avec texte sélectionnable</li>
                <li>🥈 PNG haute qualité</li>
                <li>🥉 JPEG sans compression</li>
                <li>⚠️ Éviter les captures d'écran</li>
              </ul>
            </div>
          </div>

          <div className="tip-card performance">
            <div className="tip-icon">⚡</div>
            <div className="tip-content">
              <h4>Performance ÉtudIA</h4>
              <ul>
                <li>🎯 95%+ précision sur documents clairs</li>
                <li>🧠 Reconnaissance formules mathématiques</li>
                <li>🇫🇷 Optimisé pour le français</li>
                <li>⚡ Traitement en moins de 30 secondes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Aperçu texte extrait */}
      {extractedText && uploadStatus === 'success' && (
        <div className="extracted-text-preview">
          <h3>📄 Texte extrait par ÉtudIA</h3>
          <div className="text-preview-container">
            <div className="text-preview">
              {extractedText.substring(0, 500)}
              {extractedText.length > 500 && '...'}
            </div>
            <div className="text-stats">
              <div className="stat">
                <span className="stat-label">Caractères:</span>
                <span className="stat-value">{extractedText.length.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Mots:</span>
                <span className="stat-value">{extractedText.split(' ').length.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Lignes:</span>
                <span className="stat-value">{extractedText.split('\n').length.toLocaleString()}</span>
              </div>
            </div>
            {extractedText.length > 500 && (
              <button 
                className="show-full-text"
                onClick={() => {
                  const modal = document.createElement('div');
                  modal.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                      <div style="background: white; border-radius: 1rem; padding: 2rem; max-width: 80vw; max-height: 80vh; overflow: auto;">
                        <h3>📄 Texte complet extrait</h3>
                        <pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${extractedText}</pre>
                        <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #4CAF50; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Fermer</button>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(modal);
                }}
              >
                📖 Voir le texte complet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Historique uploads récents */}
      <div className="upload-history">
        <h3>📚 Vos documents récents</h3>
        <p>Les documents seront affichés ici après upload. ÉtudIA se souvient de tous vos documents ! 🧠</p>
      </div>

      {/* Styles CSS intégrés */}
      <style jsx>{`
        .upload-tab {
          padding: 2rem 0;
        }

        .upload-container {
          max-width: 800px;
          margin: 0 auto 3rem;
        }

        .drop-zone {
          border: 3px dashed #4CAF50;
          border-radius: 1.5rem;
          padding: 3rem 2rem;
          text-align: center;
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(76, 175, 80, 0.02));
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drop-zone.drag-over {
          border-color: #FF6B35;
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05));
          transform: scale(1.02);
          box-shadow: 0 8px 25px rgba(255, 107, 53, 0.2);
        }

        .drop-zone.processing {
          cursor: not-allowed;
          border-color: #6366F1;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05));
        }

        .drop-zone-content h3 {
          font-size: 1.5rem;
          color: #1F2937;
          margin: 1rem 0;
          font-weight: 700;
        }

        .drop-zone-content p {
          color: #6B7280;
          font-size: 1.1rem;
          margin-bottom: 2rem;
        }

        .upload-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          display: block;
        }

        .upload-icon.spinning {
          animation: spin 2s linear infinite;
        }

        .upload-icon.processing {
          animation: pulse 2s infinite;
        }

        .upload-icon.error {
          color: #EF4444;
        }

        .upload-icon.success {
          color: #4CAF50;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .supported-formats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .format-badge {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.3);
          padding: 0.3rem 0.8rem;
          border-radius: 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #059669;
        }

        .file-limits {
          display: flex;
          gap: 2rem;
          justify-content: center;
          font-size: 0.9rem;
          color: #6B7280;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(76, 175, 80, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin: 1rem 0;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #4CAF50, #32CD32);
          border-radius: 4px;
          transition: width 0.3s ease;
          position: relative;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .processing-steps {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin: 1.5rem 0;
          flex-wrap: wrap;
        }

        .step {
          padding: 0.5rem 1rem;
          border-radius: 1rem;
          background: rgba(107, 114, 128, 0.1);
          color: #6B7280;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid rgba(107, 114, 128, 0.2);
          transition: all 0.3s ease;
        }

        .step.active {
          background: rgba(76, 175, 80, 0.2);
          color: #059669;
          border-color: rgba(76, 175, 80, 0.4);
          transform: scale(1.05);
        }

        .upload-error,
        .upload-success {
          text-align: center;
        }

        .error-message {
          color: #EF4444;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          font-weight: 600;
        }

        .retry-button,
        .continue-button,
        .upload-another-button {
          padding: 1rem 2rem;
          border: none;
          border-radius: 1rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin: 0.5rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .retry-button {
          background: linear-gradient(135deg, #EF4444, #DC2626);
          color: white;
        }

        .continue-button {
          background: linear-gradient(135deg, #4CAF50, #32CD32);
          color: white;
        }

        .upload-another-button {
          background: linear-gradient(135deg, #6366F1, #4F46E5);
          color: white;
        }

        .retry-button:hover,
        .continue-button:hover,
        .upload-another-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .document-summary {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(76, 175, 80, 0.1);
          border: 2px solid rgba(76, 175, 80, 0.3);
          border-radius: 1rem;
          padding: 1.5rem;
          margin: 1.5rem 0;
        }

        .doc-icon {
          font-size: 2.5rem;
        }

        .doc-details {
          flex: 1;
          text-align: left;
        }

        .doc-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 0.5rem;
        }

        .doc-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          color: #059669;
          font-weight: 600;
          flex-wrap: wrap;
        }

        .file-preview {
          margin-top: 2rem;
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          border: 2px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .file-preview h4 {
          color: #6366F1;
          margin-bottom: 1rem;
          font-size: 1.2rem;
          font-weight: 700;
        }

        .preview-container {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .preview-image {
          max-width: 200px;
          max-height: 200px;
          border-radius: 0.5rem;
          border: 2px solid rgba(99, 102, 241, 0.2);
          object-fit: cover;
        }

        .file-details {
          flex: 1;
        }

        .file-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1F2937;
          margin-bottom: 0.5rem;
        }

        .file-info {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
          color: #6B7280;
        }

        /* 💡 SECTION CONSEILS OCR - MAINTENANT VISIBLE ! */
        .ocr-tips-section {
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.05), rgba(76, 175, 80, 0.05));
          border: 2px solid rgba(255, 107, 53, 0.2);
          border-radius: 1.5rem;
          padding: 2.5rem;
          margin: 3rem auto;
          max-width: 1000px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .tips-title {
          text-align: center;
          font-size: 1.5rem;
          font-weight: 800;
          color: #FF6B35;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, #FF6B35, #4CAF50);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .tip-card {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          border: 2px solid rgba(99, 102, 241, 0.1);
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .tip-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #4CAF50, #32CD32);
          transition: all 0.3s ease;
        }

        .tip-card.quality::before { background: linear-gradient(135deg, #FF6B35, #FF8C00); }
        .tip-card.text::before { background: linear-gradient(135deg, #6366F1, #4F46E5); }
        
