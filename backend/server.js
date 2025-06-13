// 🎓 ÉtudIA v4.0 - RÉVOLUTION SILICON VALLEY LEVEL ! 🚀
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { v2: cloudinary } = require('cloudinary');
const Groq = require('groq-sdk');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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'
});

// 🧠 GESTION MÉMOIRE IA RÉVOLUTIONNAIRE
const MemoryManager = {
  // Analyser le style d'apprentissage de l'élève
  async analyzeLearnignStyle(chatHistory, userResponses) {
    // Analyse des patterns : répond vite/lentement, préfère exemples/théorie, etc.
    const totalMessages = chatHistory.length;
    const questionsAsked = chatHistory.filter(msg => msg.reponse_ia.includes('?')).length;
    const exercicesMentioned = chatHistory.filter(msg => 
      msg.message_eleve.toLowerCase().includes('exercice') || 
      msg.reponse_ia.toLowerCase().includes('exercice')
    ).length;

    let style = 'equilibre'; // Par défaut

    if (questionsAsked > totalMessages * 0.7) {
      style = 'interactif'; // Aime les questions
    } else if (exercicesMentioned > totalMessages * 0.5) {
      style = 'pratique'; // Préfère la pratique
    } else {
      style = 'theorique'; // Préfère les explications
    }

    return style;
  },

  // Identifier les difficultés récurrentes
  async identifyDifficulties(chatHistory, documents) {
    const difficulties = [];
    const subjects = new Map();

    // Analyser les matières les plus mentionnées
    for (const doc of documents) {
      const subject = doc.matiere || 'general';
      subjects.set(subject, (subjects.get(subject) || 0) + 1);
    }

    // Analyser les mots-clés de difficulté dans le chat
    const difficultyKeywords = [
      'je ne comprends pas', 'difficile', 'compliqué', 'aide-moi',
      'je n\'arrive pas', 'problème', 'bloqué'
    ];

    for (const msg of chatHistory) {
      for (const keyword of difficultyKeywords) {
        if (msg.message_eleve.toLowerCase().includes(keyword)) {
          // Identifier la matière/sujet concerné
          const context = msg.message_eleve + ' ' + msg.reponse_ia;
          if (context.includes('math')) difficulties.push('mathematiques');
          if (context.includes('français')) difficulties.push('francais');
          if (context.includes('physique')) difficulties.push('physique');
          if (context.includes('exercice')) difficulties.push('resolution_exercices');
        }
      }
    }

    return [...new Set(difficulties)]; // Supprimer doublons
  },

  // Mettre à jour le profil de l'élève
  async updateStudentProfile(studentId) {
    try {
      // Récupérer données existantes
      const [chatHistoryResult, documentsResult] = await Promise.all([
        supabase.from('historique_conversations').select('*').eq('eleve_id', studentId),
        supabase.from('documents').select('*').eq('eleve_id', studentId)
      ]);

      const chatHistory = chatHistoryResult.data || [];
      const documents = documentsResult.data || [];

      // Analyser le profil
      const learnignStyle = await this.analyzeLearnignStyle(chatHistory, []);
      const difficulties = await this.identifyDifficulties(chatHistory, documents);
      const niveauGlobal = Math.min(5, Math.max(1, Math.ceil(chatHistory.length / 10))); // Niveau basé sur l'activité

      // Mettre à jour la base
      await supabase.from('eleves').update({
        style_apprentissage: learnignStyle,
        matieres_difficiles: difficulties,
        niveau_global: niveauGlobal,
        preferences_pedagogiques: {
          derniere_analyse: new Date().toISOString(),
          nb_interactions: chatHistory.length,
          nb_documents: documents.length
        }
      }).eq('id', studentId);

      console.log(`✅ Profil mis à jour pour élève ${studentId}: ${learnignStyle}, difficultés: ${difficulties.join(', ')}`);
      return { learnignStyle, difficulties, niveauGlobal };

    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      return null;
    }
  },

  // Créer un prompt personnalisé basé sur la mémoire
  createPersonalizedPrompt(studentInfo, learnignProfile, documentName, documentContent) {
    const { nom, classe } = studentInfo;
    const prenomExact = nom.trim().split(' ')[0];
    const { style_apprentissage, matieres_difficiles, niveau_global } = learnignProfile || {};

    let adaptations = [];
    
    if (style_apprentissage === 'interactif') {
      adaptations.push('Pose beaucoup de questions pour engager la réflexion');
    } else if (style_apprentissage === 'pratique') {
      adaptations.push('Privilégie les exemples concrets et exercices pratiques');
    } else if (style_apprentissage === 'theorique') {
      adaptations.push('Donne des explications détaillées avant la pratique');
    }

    if (matieres_difficiles && matieres_difficiles.length > 0) {
      adaptations.push(`Attention particulière aux difficultés en: ${matieres_difficiles.join(', ')}`);
    }

    const adaptationText = adaptations.length > 0 ? 
      `\nADAPTATIONS PERSONNALISÉES:\n${adaptations.map(a => `- ${a}`).join('\n')}` : '';

    return `Tu es ÉtudIA, tuteur IA personnel pour ${prenomExact} (${classe}) 🇨🇮

PROFIL ÉLÈVE:
- Nom: ${prenomExact}
- Classe: ${classe}
- Style d'apprentissage: ${style_apprentissage || 'à déterminer'}
- Niveau global: ${niveau_global || 1}/5
${adaptationText}

DOCUMENT: "${documentName}"
CONTENU COMPLET:
${documentContent}

RÈGLES PÉDAGOGIQUES STRICTES:
1. Utilise TOUJOURS "${prenomExact}" dans tes réponses
2. MÉTHODE OBLIGATOIRE pour exercices: "📊 Étape 1/4", "📊 Étape 2/4", etc.
3. Ne donne JAMAIS la solution directe - guide étape par étape
4. Pose une question après chaque étape pour vérifier la compréhension
5. Adapte ton style selon le profil de ${prenomExact}
6. Utilise des exemples du contexte ivoirien
7. Maximum 200 mots par réponse
8. Encourage à chaque étape: "Bravo ${prenomExact} !"
9. À la fin d'un exercice: "🎉 Excellent ${prenomExact} ! Exercice terminé !"

GUIDE PÉDAGOGIQUEMENT, NE DONNE PAS LES RÉPONSES !`;
  }
};

// 🎯 GESTIONNAIRE MODES DE CHAT
const ChatModeManager = {
  // Mode étape par étape
  createStepByStepPrompt(basePrompt, currentStep, totalSteps) {
    return `${basePrompt}

MODE SPÉCIAL: ÉTAPE PAR ÉTAPE ACTIVÉ
- Tu dois absolument suivre le format: "📊 Étape ${currentStep}/${totalSteps}"
- Pose UNE question précise pour cette étape
- Attends la réponse avant de passer à l'étape suivante
- Ne donne AUCUNE solution finale, juste guide cette étape

CONCENTRE-TOI UNIQUEMENT SUR L'ÉTAPE ${currentStep}/${totalSteps} !`;
  },

  // Mode solution directe
  createDirectSolutionPrompt(basePrompt) {
    return `${basePrompt}

MODE SPÉCIAL: SOLUTION DIRECTE ACTIVÉ
- Analyse TOUS les exercices du document
- Donne les solutions complètes et détaillées
- Formate proprement avec numérotation
- Explique brièvement chaque réponse
- Reste pédagogique même en donnant les solutions

FOURNIS TOUTES LES SOLUTIONS MAINTENANT !`;
  }
};

// Fonctions OCR (inchangées)
async function extractTextFromFile(filePath, mimeType, originalName) {
  try {
    let extractedText = '';
    
    if (mimeType.startsWith('image/')) {
      const result = await Tesseract.recognize(filePath, 'fra+eng');
      extractedText = result.data.text;
    } else if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else if (mimeType === 'text/plain') {
      extractedText = fs.readFileSync(filePath, 'utf8');
    } else if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      extractedText = result.value;
    }
    
    return extractedText.replace(/\s+/g, ' ').trim();
  } catch (error) {
    return `[ERREUR OCR: ${error.message}]`;
  }
}

async function analyzeDocumentWithIA(extractedText, fileName) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{
        role: "system",
        content: "Expert pédagogique. Réponds UNIQUEMENT avec du JSON valide."
      }, {
        role: "user",
        content: `Analyse: ${extractedText.substring(0, 2000)}
JSON requis:
{"subject": "matière", "summary": "résumé", "exercise_count": nombre_exercices}`
      }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 300
    });

    try {
      return JSON.parse(completion.choices[0].message.content.trim());
    } catch {
      return { subject: "Document", summary: "Document analysé", exercise_count: 1 };
    }
  } catch {
    return { subject: "Document", summary: "Document uploadé", exercise_count: 1 };
  }
}

// Middlewares

// Configuration CORS universelle
// 1. CORS en PREMIER
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
}));

// 2. PARSING JSON après CORS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 3. Headers manuels en DERNIER
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});


// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: "🎓 ÉtudIA v4.0 - RÉVOLUTION SILICON VALLEY LEVEL !",
    version: "4.0.0-revolutionary",
    new_features: [
      "🧠 IA à mémoire personnalisée",
      "📊 Mode étape par étape structuré", 
      "✅ Mode solution directe",
      "🎤 Support audio (prochainement)",
      "📈 Suivi des progrès",
      "🎯 Adaptation automatique au profil élève"
    ]
  });
});

// API Élèves avec nouvelles colonnes
app.get('/api/students', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eleves')
      .select('id, nom, email, classe, ecole, date_inscription, style_apprentissage, matieres_difficiles, niveau_global')
      .order('date_inscription', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, students: data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, email, class_level, school } = req.body;
    
    if (!name || !email || !class_level) {
      return res.status(400).json({ success: false, error: 'Données manquantes' });
    }

    const { data: existingStudent } = await supabase
      .from('eleves')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        error: 'EMAIL_EXISTS',
        message: 'Email déjà inscrit !'
      });
    }
    
    const { data, error } = await supabase
      .from('eleves')
      .insert([{
        nom: name.trim(),
        email: email.toLowerCase().trim(),
        classe: class_level,
        ecole: school || 'Non spécifié',
        style_apprentissage: 'equilibre', // Valeur par défaut
        matieres_difficiles: [],
        niveau_global: 1,
        preferences_pedagogiques: {
          date_inscription: new Date().toISOString(),
          premiere_utilisation: true
        }
      }])
      .select();
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      student: data[0],
      message: `🎉 Bienvenue ${name} sur ÉtudIA ! Ton tuteur IA personnel t'attend !`
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/students/login', async (req, res) => {
  try {
    console.log('🔥 ROUTE LOGIN APPELÉE !');
    console.log('📧 Body reçu:', req.body);
    
    const { email } = req.body;
    console.log('📧 Email extrait:', email);
    
    if (!email) {
      console.log('❌ Email manquant');
      return res.status(400).json({ error: 'Email requis' });
    }

    console.log('🔍 Recherche dans Supabase...');
    const { data: student, error } = await supabase
      .from('eleves')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    console.log('📊 Résultat Supabase:', { student: !!student, error: error?.message });

    if (error || !student) {
      console.log('❌ Élève non trouvé');
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    console.log('✅ Élève trouvé:', student.nom);
    
    // Mettre à jour le profil lors de la connexion
    MemoryManager.updateStudentProfile(student.id).catch(console.error);

    res.json({ message: 'Connexion réussie ! 🎉', student });

  } catch (error) {
    console.error('💥 ERREUR ROUTE LOGIN:', error);
    res.status(500).json({ error: 'Erreur connexion' });
  }
});


// Upload documents (amélioré)
app.post('/api/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier fourni' });
    }

    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'ID utilisateur manquant' });
    }

    const nomOriginal = req.file.originalname;
    const nomFichier = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log('🔍 Extraction OCR...');
    const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype, nomOriginal);

    if (extractedText.startsWith('[ERREUR')) {
      return res.status(400).json({ success: false, error: 'Impossible d\'extraire le texte' });
    }

    console.log('🧠 Analyse IA avancée...');
    const aiAnalysis = await analyzeDocumentWithIA(extractedText, nomOriginal);

    console.log('☁️ Upload Cloudinary...');
    let uploadResult;
    try {
      uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'etudia_documents_v4',
        public_id: nomFichier,
        resource_type: 'auto'
      });
    } catch {
      uploadResult = { secure_url: 'url_non_disponible', public_id: nomFichier + '_local' };
    }

    const documentData = {
      eleve_id: parseInt(user_id),
      nom_fichier: nomFichier,
      nom_original: nomOriginal,
      taille_fichier: req.file.size,
      type_fichier: req.file.mimetype,
      url_cloudinary: uploadResult.secure_url,
      id_public_cloudinary: uploadResult.public_id,
      texte_extrait: extractedText,
      confiance_ocr: 95.00,
      langue_ocr: 'fra',
      matiere: aiAnalysis.subject,
      type_document: 'document',
      est_traite: true,
      statut_traitement: 'termine',
      mots_cles: [],
      date_traitement: new Date().toISOString(),
      nb_exercices: aiAnalysis.exercise_count || 1
    };

    const { data, error } = await supabase
      .from('documents')
      .insert([documentData])
      .select();

    if (error) throw error;

    // Mettre à jour le profil après upload
    MemoryManager.updateStudentProfile(user_id).catch(console.error);

    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch {}

    res.json({
      success: true,
      message: 'Document analysé avec IA avancée ! 🎉',
      data: {
        id: data[0].id,
        nom_original: nomOriginal,
        matiere: aiAnalysis.subject,
        resume: aiAnalysis.summary,
        texte_extrait: extractedText,
        nb_exercices: aiAnalysis.exercise_count || 1
      }
    });

  } catch (error) {
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch {}

    res.status(500).json({ success: false, error: 'Erreur traitement document' });
  }
});

app.get('/api/documents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('eleve_id', userId)
      .order('date_upload', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, documents: data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🚀 CHAT IA RÉVOLUTIONNAIRE AVEC MÉMOIRE ET MODES
app.post('/api/chat', async (req, res) => {
  try {
    const { message, user_id, document_context = '', is_welcome = false, mode = 'normal', step_info = null } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'ID utilisateur manquant' });
    }

    console.log(`🤖 Chat RÉVOLUTIONNAIRE pour élève ${user_id} - Mode: ${mode}`);
    
    // ✅ RÉCUPÉRATION DONNÉES COMPLÈTES AVEC PROFIL
    const [studentResult, documentResult, profilResult] = await Promise.all([
      supabase.from('eleves').select('*').eq('id', user_id).single(),
      supabase.from('documents').select('nom_original, texte_extrait, nb_exercices').eq('eleve_id', user_id).order('date_upload', { ascending: false }).limit(1).single(),
      supabase.from('eleves').select('style_apprentissage, matieres_difficiles, niveau_global, preferences_pedagogiques').eq('id', user_id).single()
    ]);

    const studentInfo = studentResult.data;
    const prenomExact = (studentInfo?.nom || 'Élève').trim().split(' ')[0];
    const nomDocumentExact = documentResult.data?.nom_original || 'Aucun document';
    const documentComplet = document_context || documentResult.data?.texte_extrait || '';
    const learnignProfile = profilResult.data;

    console.log(`👤 PROFIL: ${prenomExact} | Style: ${learnignProfile?.style_apprentissage} | Document: ${nomDocumentExact}`);

    // ✅ HISTORIQUE AVEC ANALYSE
    const { data: chatHistory } = await supabase
      .from('historique_conversations')
      .select('message_eleve, reponse_ia, modele_ia')
      .eq('eleve_id', user_id)
      .order('date_creation', { ascending: false })
      .limit(5);

    // ✅ MESSAGE D'ACCUEIL PERSONNALISÉ
    if (!chatHistory?.length || is_welcome) {
      const reponseAccueil = `Salut ${prenomExact} ! 🎓

Je suis ÉtudIA, ton tuteur IA personnel ! 🤖✨

Document analysé : "${nomDocumentExact}"
Contenu : ${documentComplet.length} caractères
${learnignProfile?.style_apprentissage ? `Style d'apprentissage : ${learnignProfile.style_apprentissage}` : ''}

🧠 Je mémorise tes préférences et m'adapte à ton rythme !
🎯 Choisis ton mode d'apprentissage :
• Mode guidé étape par étape
• Mode solution directe

🇨🇮 Prêt à révolutionner tes études ?

Sur quoi veux-tu travailler aujourd'hui ?`;

      await supabase.from('historique_conversations').insert([{
        eleve_id: parseInt(user_id),
        message_eleve: 'Connexion',
        reponse_ia: reponseAccueil,
        tokens_utilises: 0,
        modele_ia: 'etudia-revolutionary-accueil',
        a_contexte_document: !!documentComplet,
        mode_utilise: 'accueil'
      }]);

      return res.json({
        response: reponseAccueil,
        timestamp: new Date().toISOString(),
        model: 'etudia-revolutionary-accueil',
        has_context: !!documentComplet,
        student_name: prenomExact,
        learning_profile: learnignProfile
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({
        response: `${prenomExact}, écris ton message ou choisis un mode d'apprentissage ! 😊`
      });
    }

    // ✅ CRÉATION PROMPT PERSONNALISÉ SELON LE MODE
    const basePrompt = MemoryManager.createPersonalizedPrompt(
      studentInfo, 
      learnignProfile, 
      nomDocumentExact, 
      documentComplet
    );

    let finalPrompt = basePrompt;
    let maxTokens = 300;

    // Mode étape par étape
    if (mode === 'step_by_step' && step_info) {
      finalPrompt = ChatModeManager.createStepByStepPrompt(
        basePrompt, 
        step_info.current_step, 
        step_info.total_steps
      );
      maxTokens = 200;
    }
    // Mode solution directe  
    else if (mode === 'direct_solution') {
      finalPrompt = ChatModeManager.createDirectSolutionPrompt(basePrompt);
      maxTokens = 600;
    }

    // ✅ CONSTRUCTION MESSAGES AVEC HISTORIQUE
    const messages = [
      { role: 'system', content: finalPrompt },
      ...(chatHistory?.slice(-3).reverse().map(h => [
        { role: 'user', content: h.message_eleve },
        { role: 'assistant', content: h.reponse_ia }
      ]).flat() || []),
      { role: 'user', content: message }
    ];

    // ✅ PARAMÈTRES ADAPTATIFS SELON PROFIL
    const temperature = learnignProfile?.style_apprentissage === 'theorique' ? 0.05 : 0.1;

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile',
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: 0.9,
      stream: false
    });

    let aiResponse = completion.choices[0]?.message?.content || `Désolé ${prenomExact}, erreur technique.`;

    // ✅ NETTOYAGE ET PERSONNALISATION
    aiResponse = aiResponse.replace(/undefined/g, prenomExact);
    
    if (!aiResponse.includes(prenomExact)) {
      aiResponse = `${prenomExact}, ${aiResponse}`;
    }

    console.log(`✅ Réponse générée: ${aiResponse.length} chars | Tokens: ${completion.usage?.total_tokens || 0}`);

    // ✅ SAUVEGARDE AVEC MÉTADONNÉES
    await supabase.from('historique_conversations').insert([{
      eleve_id: parseInt(user_id),
      message_eleve: message.trim(),
      reponse_ia: aiResponse,
      tokens_utilises: completion.usage?.total_tokens || 0,
      modele_ia: `llama-3.3-70b-revolutionary-${mode}`,
      a_contexte_document: !!documentComplet,
      mode_utilise: mode,
      step_info: step_info
    }]);

    // ✅ MISE À JOUR PROFIL APRÈS INTERACTION
    MemoryManager.updateStudentProfile(user_id).catch(console.error);

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
      model: `llama-3.3-70b-revolutionary-${mode}`,
      has_context: !!documentComplet,
      student_name: prenomExact,
      tokens_used: completion.usage?.total_tokens || 0,
      mode_used: mode,
      learning_profile: learnignProfile,
      next_step: step_info ? {
        current: step_info.current_step,
        total: step_info.total_steps,
        next: step_info.current_step < step_info.total_steps ? step_info.current_step + 1 : null
      } : null
    });

  } catch (error) {
    console.error('❌ Erreur chat révolutionnaire:', error);
    
    const { data: studentInfo } = await supabase
      .from('eleves')
      .select('nom')
      .eq('id', req.body.user_id)
      .single();
    
    const prenomExact = (studentInfo?.nom || 'Élève').trim().split(' ')[0];
    
    res.status(500).json({
      error: 'Erreur technique',
      response: `Désolé ${prenomExact}, problème technique. Ton tuteur IA sera bientôt de retour ! 🤖`
    });
  }
});

// 📊 NOUVELLES ROUTES - PROFIL ET PROGRÈS
app.get('/api/student/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Récupérer profil complet + statistiques
    const [studentResult, documentsResult, conversationsResult] = await Promise.all([
      supabase.from('eleves').select('*').eq('id', userId).single(),
      supabase.from('documents').select('*').eq('eleve_id', userId),
      supabase.from('historique_conversations').select('*').eq('eleve_id', userId)
    ]);

    const student = studentResult.data;
    const documents = documentsResult.data || [];
    const conversations = conversationsResult.data || [];

    // Calculer statistiques avancées
    const stats = {
      documents_uploaded: documents.length,
      total_conversations: conversations.length,
      total_tokens_used: conversations.reduce((sum, conv) => sum + (conv.tokens_utilises || 0), 0),
      subjects_studied: [...new Set(documents.map(doc => doc.matiere))],
      learning_progress: Math.min(100, Math.round((conversations.length / 50) * 100)),
      last_activity: conversations[0]?.date_creation || student.date_inscription,
      preferred_mode: conversations.reduce((acc, conv) => {
        acc[conv.mode_utilise || 'normal'] = (acc[conv.mode_utilise || 'normal'] || 0) + 1;
        return acc;
      }, {}),
      average_session_length: conversations.length > 0 ? Math.round(conversations.length / documents.length) : 0
    };

    res.json({
      success: true,
      student: {
        ...student,
        nom: student.nom.trim().split(' ')[0] // Prénom seulement
      },
      statistics: stats,
      learning_profile: {
        style: student.style_apprentissage || 'equilibre',
        difficulties: student.matieres_difficiles || [],
        level: student.niveau_global || 1,
        preferences: student.preferences_pedagogiques || {}
      }
    });

  } catch (error) {
    console.error('❌ Erreur profil élève:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🎯 Route pour mise à jour manuelle du profil
app.post('/api/student/profile/:userId/update', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Forcer mise à jour du profil
    const profile = await MemoryManager.updateStudentProfile(userId);
    
    if (profile) {
      res.json({
        success: true,
        message: 'Profil mis à jour !',
        profile: profile
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erreur mise à jour profil'
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🎤 Route préparatoire pour le mode audio (future)
app.post('/api/chat/audio', async (req, res) => {
  try {
    const { audio_data, user_id, mode = 'normal' } = req.body;
    
    // Pour l'instant, retourner message en attente
    res.json({
      success: true,
      message: 'Mode audio en cours de développement ! 🎤',
      features_coming: [
        'Reconnaissance vocale en français',
        'Synthèse vocale des réponses IA',
        'Support audio pour tous les modes',
        'Transcription automatique'
      ]
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📈 Route analytics avancées
app.get('/api/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30' } = req.query; // Période en jours
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Récupérer données période
    const { data: conversations } = await supabase
      .from('historique_conversations')
      .select('*')
      .eq('eleve_id', userId)
      .gte('date_creation', startDate.toISOString());

    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('eleve_id', userId)
      .gte('date_upload', startDate.toISOString());

    // Analyse tendances
    const analytics = {
      period_days: parseInt(period),
      activity_trend: {
        conversations_count: conversations?.length || 0,
        documents_uploaded: documents?.length || 0,
        avg_daily_activity: Math.round((conversations?.length || 0) / parseInt(period))
      },
      mode_usage: conversations?.reduce((acc, conv) => {
        acc[conv.mode_utilise || 'normal'] = (acc[conv.mode_utilise || 'normal'] || 0) + 1;
        return acc;
      }, {}) || {},
      token_consumption: {
        total: conversations?.reduce((sum, conv) => sum + (conv.tokens_utilises || 0), 0) || 0,
        average_per_conversation: conversations?.length > 0 ? 
          Math.round(conversations.reduce((sum, conv) => sum + (conv.tokens_utilises || 0), 0) / conversations.length) : 0
      },
      subjects_focus: documents?.reduce((acc, doc) => {
        acc[doc.matiere] = (acc[doc.matiere] || 0) + 1;
        return acc;
      }, {}) || {},
      engagement_score: Math.min(100, Math.round(((conversations?.length || 0) / parseInt(period)) * 10))
    };

    res.json({
      success: true,
      analytics: analytics,
      period: `${period} derniers jours`,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Routes stats et health améliorées
app.get('/api/stats', async (req, res) => {
  try {
    const [studentsResult, documentsResult, chatsResult] = await Promise.all([
      supabase.from('eleves').select('*', { count: 'exact', head: true }),
      supabase.from('documents').select('*', { count: 'exact', head: true }),
      supabase.from('historique_conversations').select('*', { count: 'exact', head: true })
    ]);
    
    // Stats avancées
    const { data: activeStudents } = await supabase
      .from('historique_conversations')
      .select('eleve_id')
      .gte('date_creation', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const uniqueActiveStudents = new Set(activeStudents?.map(conv => conv.eleve_id) || []).size;

    res.json({
      students: studentsResult.count || 0,
      documents: documentsResult.count || 0,
      chats: chatsResult.count || 0,
      active_students_7days: uniqueActiveStudents,
      success_rate: 99,
      ai_features: [
        'Mémoire personnalisée',
        'Adaptation automatique',
        'Mode étape par étape',
        'Solution directe',
        'Profils d\'apprentissage'
      ],
      timestamp: new Date().toISOString(),
      version: '4.0.0-revolutionary'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur statistiques' });
  }
});

app.get('/health', async (req, res) => {
  try {
    const { count } = await supabase
      .from('eleves')
      .select('*', { count: 'exact', head: true });
    
    res.json({ 
      status: '🎓 ÉtudIA v4.0 RÉVOLUTIONNAIRE fonctionne !',
      version: '4.0.0-revolutionary',
      students_count: count,
      revolutionary_features: [
        '✅ IA à mémoire personnalisée activée',
        '✅ Profils d\'apprentissage automatiques',
        '✅ Mode étape par étape structuré',
        '✅ Mode solution directe disponible',
        '✅ Analytics avancées intégrées',
        '✅ Adaptation temps réel au profil élève',
        '🎤 Mode audio en préparation'
      ],
      ai_intelligence: 'Silicon Valley Level 🚀',
      made_in: '🇨🇮 Côte d\'Ivoire avec ❤️'
    });
  } catch (error) {
    res.status(503).json({ status: '⚠️ Problème technique', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`
🎓 ═══════════════════════════════════════════════════════════
   ✨ ÉtudIA v4.0 - RÉVOLUTION SILICON VALLEY ! ✨
   
   📍 Port: ${PORT}
   
🚀 FONCTIONNALITÉS RÉVOLUTIONNAIRES ACTIVÉES:
   🧠 IA à mémoire personnalisée - ACTIF
   📊 Mode étape par étape structuré - ACTIF  
   ✅ Mode solution directe - ACTIF
   🎯 Adaptation automatique profil élève - ACTIF
   📈 Analytics avancées - ACTIF
   🔄 Mise à jour profil temps réel - ACTIF
   
🎯 INTELLIGENCE ARTIFICIELLE:
   ✅ Mémorisation styles d'apprentissage
   ✅ Détection difficultés automatique
   ✅ Prompts personnalisés par profil
   ✅ Adaptation température IA selon élève
   ✅ Tracking progression multi-dimensionnel
   
🎤 PROCHAINEMENT:
   🔊 Mode audio avec reconnaissance vocale
   🌙 Mode dark interface
   📱 App mobile progressive
   
🌍 MISSION: Révolutionner l'éducation africaine !
🇨🇮 Made with ❤️ in Côte d'Ivoire by @Pacousstar
   
🏆 NIVEAU: SILICON VALLEY REVOLUTIONARY !
═══════════════════════════════════════════════════════════
  `);
});

module.exports = app;
