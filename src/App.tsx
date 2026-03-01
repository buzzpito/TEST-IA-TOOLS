import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Moon, Sun, Sparkles, Copy, Check, AlertTriangle, Loader2, FileText, Languages, ShieldCheck, Search, CheckCircle2, LogOut, Settings, UserPlus, Trash2, Shield, UserX, UserCheck, Key, Megaphone, Type } from 'lucide-react';

type Language = 'French' | 'English' | 'Arabic' | 'Darija Morocco';

interface User {
  id: number;
  email: string;
  is_admin: number;
  has_access: number;
}

export default function App() {
  const [user, setUser] = useState<{ email: string; isAdmin: boolean } | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [inputMode, setInputMode] = useState<'manual' | 'url'>('manual');
  const [productUrl, setProductUrl] = useState('');
  const [productName, setProductName] = useState('');
  const [productInfo, setProductInfo] = useState('');
  const [language, setLanguage] = useState<Language>('French');
  const [result, setResult] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(0); // 0: Idle, 1: Generating, 2: Analyzing, 3: Validating
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'generator' | 'translator' | 'adcopy' | 'wordcounter'>('generator');
  
  // Word Counter State
  const [wordCounterText, setWordCounterText] = useState('');

  // AdCopy Generator State
  const [adInputMode, setAdInputMode] = useState<'manual' | 'url'>('manual');
  const [adProductUrl, setAdProductUrl] = useState('');
  const [adProductName, setAdProductName] = useState('');
  const [adProductInfo, setAdProductInfo] = useState('');
  const [adLanguage, setAdLanguage] = useState<Language>('French');
  const [adResult, setAdResult] = useState<string | null>(null);
  const [adAnalysis, setAdAnalysis] = useState<string | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  // Image Translator State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translatedImageUrl, setTranslatedImageUrl] = useState<string | null>(null);
  const [translatorLang, setTranslatorLang] = useState<Language>('French');

  // Password Modal State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setLoginError(data.message);
      }
    } catch (err) {
      setLoginError("Connection error. Please try again.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowAdmin(false);
    localStorage.removeItem('user');
  };

  const fetchUsers = async () => {
    if (!user?.isAdmin) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-email': user.email }
      });
      const data = await res.json();
      setAdminUsers(data);
    } catch (err) {
      console.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    if (showAdmin) {
      fetchUsers();
    }
  }, [showAdmin]);

  const toggleAccess = async (userId: number, currentAccess: number) => {
    try {
      await fetch('/api/admin/toggle-access', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': user!.email
        },
        body: JSON.stringify({ userId, hasAccess: !currentAccess })
      });
      fetchUsers();
    } catch (err) {
      console.error("Failed to toggle access");
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': user!.email
        },
        body: JSON.stringify({ userId })
      });
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user");
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': user!.email
        },
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword })
      });
      if (res.ok) {
        setNewUserEmail('');
        setNewUserPassword('');
        fetchUsers();
      } else {
        alert("User already exists or error occurred");
      }
    } catch (err) {
      console.error("Failed to add user");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user!.email, oldPassword: oldPwd, newPassword: newPwd })
      });
      const data = await res.json();
      if (data.success) {
        setPwdMsg({ type: 'success', text: 'Password updated successfully!' });
        setTimeout(() => {
          setShowPwdModal(false);
          setOldPwd('');
          setNewPwd('');
          setPwdMsg(null);
        }, 2000);
      } else {
        setPwdMsg({ type: 'error', text: data.message });
      }
    } catch (err) {
      setPwdMsg({ type: 'error', text: 'Connection error. Please try again.' });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setTranslatedImageUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const translateImage = async () => {
    if (!selectedImage) return;
    setTranslating(true);
    setTranslatedImageUrl(null);
    setError(null);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Use the image generation model for editing/recreating with translated text
    const model = "gemini-2.5-flash-image";

    try {
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];
      const langName = translatorLang === 'Darija Morocco' ? 'Darija Marocaine' : translatorLang;

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: `RECREATE this image exactly but REPLACE all visible text with its translation in ${langName}. 
              Maintain the same visual style, colors, and layout. 
              The final output MUST be an image where the text is now in ${langName}.`,
            },
          ],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setTranslatedImageUrl(`data:image/png;base64,${base64EncodeString}`);
          break;
        }
      }
      
      if (!translatedImageUrl && response.text) {
        // Fallback if it only returned text for some reason
        console.log("Model returned text instead of image:", response.text);
      }
    } catch (err: any) {
      console.error(err);
      setError(`❌ Erreur de génération d'image : ${err.message}`);
    } finally {
      setTranslating(false);
    }
  };

  const generateAdCopy = async () => {
    if (adInputMode === 'manual' && !adProductName.trim() && !adProductInfo.trim()) {
      setAdError("⚠️ Please enter at least the product name or description.");
      return;
    }
    if (adInputMode === 'url' && !adProductUrl.trim()) {
      setAdError("⚠️ Please enter the product URL.");
      return;
    }

    setAdLoading(true);
    setAdError(null);
    setAdResult(null);
    setAdAnalysis(null);
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = "gemini-3-flash-preview";

    try {
      let cleanedUrl = adProductUrl;
      if (adInputMode === 'url') {
        try {
          const urlObj = new URL(adProductUrl);
          cleanedUrl = urlObj.origin + urlObj.pathname;
        } catch (e) {
          cleanedUrl = adProductUrl;
        }
      }

      const langName = adLanguage === 'Darija Morocco' ? 'Darija Marocaine' : adLanguage;
      const productContext = adInputMode === 'url' 
        ? `URL du produit: ${cleanedUrl}` 
        : `Nom: ${adProductName}\nDétails: ${adProductInfo}`;

      const prompt = `Act as an expert Senior Media Buyer. Generate high-converting Facebook Ad copies in ${langName} for the following product.
      
Product Info: ${productContext}

Follow this strict 8-step process for this generation:
1. Analyze: Understand the product's purpose, benefits, and selling angles.
2. Draft: Write two unique Facebook ad copies in ${langName}.
3. Structure: Catchy intro (1-2 sentences) + CTA starting with '🛒 Commandez maintenant et...' (or translated equivalent) + soft urgency.
4. Style: Persuasive, emotionally engaging, optimized for mobile.
5. Emojis: Relevant emojis only at the very beginning.
6. Marketing Evaluation: Rate copies (1-10) and suggest improvements for persuasion.
7. Facebook Diagnostics: Predict 'Quality Ranking' and 'Engagement Rate Ranking' based on Facebook's Ad Relevance principles.
8. Revision: Provide two final 'Revised Versions' that combine all suggestions from the evaluation steps.
9. Compliance Check: Ensure 100% adherence to Facebook's policies (no misleading claims, no sensationalism).

Format your response clearly using Markdown with these exact headings:
### Original Copies
### Expert Analysis & Diagnostics
### Final Revised Versions
### Compliance Check`;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
          temperature: 0.7,
          tools: adInputMode === 'url' ? [{ urlContext: {} }, { googleSearch: {} }] : undefined
        },
      });

      if (!response.text) throw new Error("Empty response from AI.");
      
      const responseText = response.text;
      
      const originalMatch = responseText.match(/### Original Copies[\s\S]*?(?=###|$)/i);
      const revisedMatch = responseText.match(/### Final Revised Versions[\s\S]*?(?=###|$)/i);
      const analysisMatch = responseText.match(/### Expert Analysis & Diagnostics[\s\S]*?(?=###|$)/i);
      const complianceMatch = responseText.match(/### Compliance Check[\s\S]*?(?=###|$)/i);

      let copies = "";
      if (revisedMatch) copies += revisedMatch[0].replace(/### Final Revised Versions/i, '').trim() + "\n\n";

      let analysisText = "";
      if (originalMatch) analysisText += originalMatch[0] + "\n\n";
      if (analysisMatch) analysisText += analysisMatch[0] + "\n\n";
      if (complianceMatch) analysisText += complianceMatch[0] + "\n\n";

      if (!copies.trim()) {
        setAdResult(responseText);
      } else {
        setAdResult(copies.trim());
        setAdAnalysis(analysisText.trim() || null);
      }
    } catch (err: any) {
      console.error(err);
      setAdError(`❌ Error: ${err.message}`);
    } finally {
      setAdLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const generate = async () => {
    if (inputMode === 'manual' && !productName.trim() && !productInfo.trim()) {
      setError(language === 'Arabic' || language === 'Darija Morocco' 
        ? "⚠️ يرجى إدخال اسم المنتج أو وصفه على الأقل." 
        : "⚠️ Please enter at least the product name or description.");
      return;
    }

    if (inputMode === 'url') {
      if (!productUrl.trim()) {
        setError(language === 'Arabic' || language === 'Darija Morocco' 
          ? "⚠️ يرجى إدخال رابط المنتج." 
          : "⚠️ Please enter the product URL.");
        return;
      }

      const supportedDomains = ['alibaba.com', 'aliexpress.com', 'amazon.', 'temu.com'];
      const isSupported = supportedDomains.some(domain => productUrl.toLowerCase().includes(domain));
      
      if (!isSupported) {
        setError(language === 'Arabic' || language === 'Darija Morocco' 
          ? "⚠️ يرجى استخدام روابط من Alibaba أو AliExpress أو Amazon أو Temu فقط." 
          : "⚠️ Please use links from Alibaba, AliExpress, Amazon, or Temu only.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setAnalysis(null);
    setValidation(null);
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = "gemini-3-flash-preview";

    try {
      let cleanedUrl = productUrl;
      if (inputMode === 'url') {
        try {
          const urlObj = new URL(productUrl);
          // Keep only essential params for 1688/Alibaba if needed, or just clean everything
          // For now, let's just use the origin + pathname to remove tracking junk
          cleanedUrl = urlObj.origin + urlObj.pathname;
        } catch (e) {
          cleanedUrl = productUrl;
        }
      }

      // STEP 1: INITIAL GENERATION
      setStep(1);
      const prompt1 = buildPrompt1(productName, productInfo, language, inputMode === 'url' ? cleanedUrl : undefined);
      const res1 = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt1 }] }],
        config: { 
          temperature: 0.7,
          tools: inputMode === 'url' ? [{ urlContext: {} }, { googleSearch: {} }] : undefined
        },
      });
      const initialPage = res1.text;
      if (!initialPage) throw new Error("Step 1 failed: Empty response.");

      // STEP 2: ANALYSIS & REFINEMENT
      setStep(2);
      const prompt2 = buildPrompt2(initialPage, language);
      const res2 = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt2 }] }],
        config: { temperature: 0.4 }, // Lower temperature for analysis
      });
      const analysisAndFinal = res2.text;
      if (!analysisAndFinal) throw new Error("Step 2 failed: Empty response.");
      
      // Extract final version from Prompt 2 output (usually at the end)
      const finalVersionMatch = analysisAndFinal.split(/Version finale conforme|Final compliant version/i);
      let finalPage = finalVersionMatch.length > 1 ? finalVersionMatch[1].trim() : analysisAndFinal;
      
      // Cleanup unwanted markdown symbols and sections
      finalPage = finalPage
        .replace(/#### \*\*/g, '')
        .replace(/### \*\*/g, '')
        .replace(/\*\*/g, '') // Also remove bold markers
        .replace(/Note pour les visuels[\s\S]*/gi, '') // Remove visual notes section and everything after
        .replace(/Notes? for visuals[\s\S]*/gi, '') // English version too
        .trim();
      
      setAnalysis(analysisAndFinal);
      setResult(finalPage);

      // STEP 3: FINAL VALIDATION
      setStep(3);
      const prompt3 = buildPrompt3(finalPage, language);
      const res3 = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt3 }] }],
        config: { temperature: 0.2 },
      });
      setValidation(res3.text);

      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(`❌ ${err.message || "An error occurred during the multi-step process."}`);
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  const buildPrompt1 = (name: string, info: string, lang: Language, url?: string) => {
    const langName = lang === 'Darija Morocco' ? 'Darija Marocaine' : lang;
    const productContext = url 
      ? `IMPORTANT : Le produit se trouve à cette URL : ${url}. 
         1. Analyse le contenu de la page via l'URL.
         2. Utilise l'outil Google Search si nécessaire pour confirmer les détails techniques (matériaux, dimensions, fonctionnalités).
         3. Extrais avec une précision absolue : le nom exact du produit, les matériaux de fabrication, les dimensions, et les bénéfices réels.
         4. NE PAS INVENTER. Si tu ne trouves pas d'infos fiables, indique-le.`
      : `Nom: ${name}\nDétails: ${info}`;

    return `Agis comme un expert en rédaction de pages produit e-commerce en ${langName}, tout en respectant strictement les politiques publicitaires de Facebook.

Voici la politique à respecter impérativement :
""Pratiques commerciales trompeuses :
Nous n’autorisons pas les publicités qui utilisent des pratiques commerciales trompeuses ou mensongères pouvant escroquer des personnes en leur soutirant de l’argent ou des informations personnelles.
Exemples :
- Promouvoir une aide financière dans le but d’inciter les gens à divulguer des informations sensibles
- Utiliser l’image d’une personnalité publique pour inciter les gens à cliquer sur la publicité
- Faire des déclarations sensationnalistes ou non vérifiées concernant l’efficacité d’un produit""

➡️ Instructions :
0. Propose 4 titres :
- Maximum 8 mots par titre.
- Titres simples, clairs et descriptifs comme ces exemples :
*Toilette Enfant avec Marches Ajustables
*Stickers Miroir en Cercle 3D
*Pantalon Multi-Poches Haut de Gamme
*Friteuse Sans Huile pour Toute la Famille
- Pas de phrases émotionnelles.

Ensuite, génère la page produit complète selon cette structure :
1. Phrase d'accroche forte (commençant par un verbe à l'impératif).

2. INTRODUCTION :
- Présentation rapide du produit (maximum 3 lignes).

3. ✅ BÉNÉFICES : (respecte la politique de facebook)
- 4 bénéfices concrets et réalistes.
- Format : Petit titre : explication courte.

4. ✅ CARACTÉRISTIQUES :
- 4 caractéristiques pratiques ou techniques.
- Format : Petit titre : explication courte.

5. ✅ SPÉCIFICATIONS :
- 4 spécifications techniques et factuelles.
- Format : Petit titre : explication courte.

6. ✅ MODE D'UTILISATION :
- Ajouter uniquement si nécessaire (produit complexe).
- Format : Petit titre : explication courte.

⚠️ Rappels très importants :
- Aucun emoji dans les paragraphes (seulement dans les titres principaux).
- Pas de promesses exagérées ou de résultats garantis.
- Pas de références à des célébrités.
- Langage simple, vendeur, émotionnel et responsable.
- Format d’écriture : Petit titre : explication courte sur la même ligne.

🛒 Informations du produit : 
${productContext}`;
  };

  const buildPrompt2 = (pageContent: string, lang: Language) => {
    return `Analyser la page produit que j'ai fourni en vous basant sur la section de la politique Facebook intitulée « Pratiques commerciales trompeuses »:

« Nous n’autorisons pas les publicités qui utilisent des pratiques commerciales trompeuses ou mensongères pouvant escroquer des personnes en leur soutirant de l’argent ou des informations personnelles.  
Exemples :  
1. Promouvoir une aide financière dans le but d’inciter les gens à divulguer des informations sensibles.  
2. Utiliser l’image d’une personnalité publique pour inciter les gens à cliquer sur la publicité.  
3. Faire des déclarations sensationnalistes ou non vérifiées concernant l’efficacité d’un produit. »

*Étapes à suivre :*  
1. *Analyse détaillée, section par section*  
   - Passez en revue chaque bloc de texte (titre, visuels, accroches, bénéfices, CTA, etc.).  
   - Pour chaque section, identifiez tous les éléments pouvant poser un risque de non-conformité.  
   - Expliquez précisément pourquoi tel ou tel passage contrevient (ou pourrait contrevenir) à la politique.  

2. *Recommandations de modifications*  
   - Pour chaque problème identifié, proposez une reformulation ou un ajustement stylistique.  
   - Assurez-vous que la nouvelle formulation reste persuasive et cohérente avec la promesse marketing.  

3. *Version finale conforme*  
   - À la suite des recommandations, assemblez une version complète de la page publicitaire (titres, textes, légendes, CTA, texte alternatif des visuels…).  
   - Cette version doit être intégralement conforme à la politique Facebook et optimisée pour la conversion.
   - Utilise la langue : ${lang}.

Page du produit à analyser :
${pageContent}`;
  };

  const buildPrompt3 = (finalContent: string, lang: Language) => {
    return `vous êtes un expert en marketing facebook et vous êtes chargé d'évaluer si ces pages des produit respectent et adhèrent aux politiques de facebook :
Ces pages de produits respectent-elles et adhèrent-elles aux politiques de Facebook suivantes ?

Pratiques commerciales trompeuses
Nous n'autorisons pas les pages de produits qui utilisent des pratiques commerciales trompeuses ou mensongères pouvant inciter les gens à divulguer de l'argent ou des informations personnelles.

Exemples de ce que nous n'autorisons pas :

Promouvoir un soutien financier pour tromper les gens et les inciter à partager des informations sensibles
Utiliser l'image d'une personnalité publique pour attirer les gens à cliquer sur la page
Faire des affirmations sensationnalistes ou non vérifiées concernant l'efficacité d'un produit

Page du produit :
${finalContent}`;
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const isRtl = language === 'Arabic' || language === 'Darija Morocco';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-8 shadow-xl"
        >
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-linear-to-br from-[var(--accent)] to-[#9a3412] rounded-2xl flex items-center justify-center text-white">
              <ShoppingCart size={24} />
            </div>
            <h1 className="font-syne font-extrabold text-2xl text-[var(--text)]">COD Process</h1>
            <p className="text-[var(--text2)] text-sm">Login to access the COD Process</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)]">Email Address</label>
              <input 
                type="email" 
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] outline-hidden focus:border-[var(--accent)] transition-all"
                placeholder="email@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)]">Password</label>
              <input 
                type="password" 
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] outline-hidden focus:border-[var(--accent)] transition-all"
                placeholder="••••••••"
              />
            </div>
            {loginError && (
              <div className="text-red-500 text-xs bg-red-500/5 p-2 rounded border border-red-500/20 flex items-center gap-2">
                <AlertTriangle size={14} /> {loginError}
              </div>
            )}
            <button 
              type="submit"
              className="w-full py-3 bg-[var(--accent)] text-white rounded-xl font-bold font-syne mt-2 hover:bg-[#b45309] transition-all"
            >
              Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg)]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-[260px] md:h-screen sticky top-0 md:border-r border-[var(--border)] bg-[var(--bg2)] z-50 flex flex-col transition-colors duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-[var(--border)] md:border-none">
          <div className="w-10 h-10 bg-linear-to-br from-[var(--accent)] to-[#9a3412] rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
            <ShoppingCart size={22} />
          </div>
          <div className="flex flex-col">
            <h1 className="font-syne font-extrabold text-[16px] text-[var(--text)] leading-tight">
              COD Process
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar">
          <button 
            onClick={() => { setActiveTab('generator'); setShowAdmin(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all shrink-0 md:shrink ${activeTab === 'generator' && !showAdmin ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]'}`}
          >
            <Sparkles size={18} />
            <span>PPs Generator</span>
          </button>
          <button 
            onClick={() => { setActiveTab('translator'); setShowAdmin(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all shrink-0 md:shrink ${activeTab === 'translator' && !showAdmin ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]'}`}
          >
            <Languages size={18} />
            <span>Image Translator</span>
          </button>
          <button 
            onClick={() => { setActiveTab('adcopy'); setShowAdmin(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all shrink-0 md:shrink ${activeTab === 'adcopy' && !showAdmin ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]'}`}
          >
            <Megaphone size={18} />
            <span>AdCopy Generator</span>
          </button>
          <button 
            onClick={() => { setActiveTab('wordcounter'); setShowAdmin(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all shrink-0 md:shrink ${activeTab === 'wordcounter' && !showAdmin ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]'}`}
          >
            <Type size={18} />
            <span>Word Counter</span>
          </button>
          
          {user.isAdmin && (
            <button 
              onClick={() => setShowAdmin(!showAdmin)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all shrink-0 md:shrink ${showAdmin ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]'}`}
            >
              <Settings size={18} />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        <div className="p-4 mt-auto border-t border-[var(--border)] hidden md:flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={toggleTheme}>
              <div className="w-9 h-5 bg-[var(--toggle-bg)] border border-[var(--border2)] rounded-full relative">
                <motion.div 
                  className="absolute top-[2px] left-[2px] w-3 h-3 bg-[var(--accent)] rounded-full"
                  animate={{ x: theme === 'light' ? 16 : 0 }}
                />
              </div>
              <span className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-wider">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span >
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowPwdModal(true)}
                className="p-2 text-[var(--text3)] hover:text-[var(--text)] transition-all"
                title="Change Password"
              >
                <Key size={18} />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-[var(--text3)] hover:text-red-500 transition-all"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-2 py-2 bg-[var(--bg3)] rounded-lg border border-[var(--border)]">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent)] text-[12px] font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-bold text-[var(--text)] truncate">{user.email}</span>
              <span className="text-[9px] text-[var(--text3)] uppercase font-bold">{user.isAdmin ? 'Administrator' : 'User'}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white">
              <ShoppingCart size={16} />
            </div>
            <span className="font-syne font-bold text-[14px] text-[var(--text)]">PPs Generator</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="text-[var(--text3)]"><Sun size={18}/></button>
            <button onClick={() => setShowPwdModal(true)} className="text-[var(--text3)]"><Key size={18}/></button>
            <button onClick={handleLogout} className="text-[var(--text3)]"><LogOut size={18}/></button>
          </div>
        </header>

        <main className="flex-1 max-w-[1000px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="md:hidden flex bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-1 mb-6 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => { setActiveTab('generator'); setShowAdmin(false); }}
            className={`flex-1 min-w-[120px] py-2 text-[12px] font-bold rounded-lg transition-all ${activeTab === 'generator' && !showAdmin ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text)]'}`}
          >
            PPs Generator
          </button>
          <button 
            onClick={() => { setActiveTab('translator'); setShowAdmin(false); }}
            className={`flex-1 min-w-[120px] py-2 text-[12px] font-bold rounded-lg transition-all ${activeTab === 'translator' && !showAdmin ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text)]'}`}
          >
            Image Translator
          </button>
          <button 
            onClick={() => { setActiveTab('adcopy'); setShowAdmin(false); }}
            className={`flex-1 min-w-[120px] py-2 px-3 text-[12px] font-bold rounded-lg transition-all ${activeTab === 'adcopy' && !showAdmin ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text)]'}`}
          >
            AdCopy Generator
          </button>
          <button 
            onClick={() => { setActiveTab('wordcounter'); setShowAdmin(false); }}
            className={`flex-1 min-w-[120px] py-2 px-3 text-[12px] font-bold rounded-lg transition-all ${activeTab === 'wordcounter' && !showAdmin ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text)]'}`}
          >
            Word Counter
          </button>
        </div>

          {showAdmin ? (
            <section className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-5 sm:p-8 mb-5 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 text-[var(--text)] font-bold font-syne text-xl">
                  <Shield size={24} className="text-[var(--accent)]" />
                  Admin Dashboard
                </div>
              </div>

            <div className="grid gap-6">
              <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text3)] mb-4 flex items-center gap-2">
                  <UserPlus size={14} /> Add New User
                </h3>
                <form onSubmit={addUser} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    placeholder="User Email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text)] outline-hidden focus:border-[var(--accent)]"
                  />
                  <input 
                    type="password" 
                    placeholder="Password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text)] outline-hidden focus:border-[var(--accent)]"
                  />
                  <button type="submit" className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-[#b45309]">
                    Add User
                  </button>
                </form>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text3)]">
                      <th className="pb-3 font-bold uppercase tracking-wider text-[10px]">User Email</th>
                      <th className="pb-3 font-bold uppercase tracking-wider text-[10px]">Status</th>
                      <th className="pb-3 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {adminUsers.map(u => (
                      <tr key={u.id} className="group">
                        <td className="py-3 text-[var(--text)] font-medium">
                          {u.email}
                          {u.is_admin === 1 && <span className="ml-2 text-[9px] bg-[var(--accent-bg)] text-[var(--accent)] px-1.5 py-0.5 rounded border border-[var(--accent-border)] font-bold uppercase">Admin</span>}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold ${u.has_access === 1 ? 'text-[var(--success)] bg-[var(--success-bg)]' : 'text-red-500 bg-red-500/5'}`}>
                            {u.has_access === 1 ? <UserCheck size={12} /> : <UserX size={12} />}
                            {u.has_access === 1 ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.is_admin === 0 && (
                              <>
                                <button 
                                  onClick={() => toggleAccess(u.id, u.has_access)}
                                  className={`p-1.5 rounded-lg transition-all ${u.has_access === 1 ? 'text-[var(--text3)] hover:text-red-500' : 'text-[var(--text3)] hover:text-[var(--success)]'}`}
                                  title={u.has_access === 1 ? "Block Access" : "Grant Access"}
                                >
                                  {u.has_access === 1 ? <UserX size={16} /> : <UserCheck size={16} />}
                                </button>
                                <button 
                                  onClick={() => deleteUser(u.id)}
                                  className="p-1.5 text-[var(--text3)] hover:text-red-500 transition-all"
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : activeTab === 'translator' ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 mb-5 transition-colors duration-300 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5 text-[10.5px] font-bold tracking-widest uppercase text-[var(--text3)] transition-colors duration-300 after:content-[''] after:flex-1 after:h-[1px] after:bg-[var(--border)]">
                Image Translator
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)] flex items-center gap-2">
                    <Languages size={14} /> Target Language
                  </label>
                  <select 
                    value={translatorLang}
                    onChange={(e) => setTranslatorLang(e.target.value as Language)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] font-dm-sans text-[13.5px] outline-hidden focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent-bg)] transition-all appearance-none cursor-pointer"
                  >
                    <option value="French">🇫🇷 French</option>
                    <option value="English">🇺🇸 English</option>
                    <option value="Arabic">🇸🇦 Arabic</option>
                    <option value="Darija Morocco">🇲🇦 Darija Morocco</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)]">
                    Upload Image
                  </label>
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <div className={`w-full aspect-video rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 ${selectedImage ? 'border-[var(--accent)] bg-[var(--accent-bg)]' : 'border-[var(--border)] bg-[var(--bg3)] hover:border-[var(--text3)]'}`}>
                      {selectedImage ? (
                        <img src={selectedImage} alt="Selected" className="w-full h-full object-contain rounded-lg p-2" />
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-[var(--bg)] flex items-center justify-center text-[var(--text3)] group-hover:text-[var(--accent)] transition-colors">
                            <Languages size={24} />
                          </div>
                          <div className="text-center">
                            <p className="text-[13px] font-bold text-[var(--text)]">Click to upload image</p>
                            <p className="text-[11px] text-[var(--text3)]">PNG, JPG or WEBP</p>
                          </div>
                        </>
                      )}
                    </div>
                    <input 
                      id="image-upload"
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3.5 text-red-500 text-[13px] mt-4 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <button 
                onClick={translateImage}
                disabled={translating || !selectedImage}
                className="w-full p-4 bg-linear-to-br from-[var(--accent)] to-[#b45309] text-white rounded-xl text-[14px] font-bold font-syne cursor-pointer shadow-[var(--shadow)] flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 disabled:bg-[var(--border2)] disabled:text-[var(--text3)] disabled:shadow-none disabled:cursor-not-allowed mt-6"
              >
                {translating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Translating Image...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    ✦ Translate Text from Image
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {translatedImageUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl"
                >
                  <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg3)]">
                    <div className="font-syne text-[13px] font-bold text-[var(--text)] flex items-center gap-2.5">
                      <div className="w-2 h-2 bg-[var(--success)] rounded-full shadow-[0_0_0_3px_var(--success-bg)]" />
                      Translated Image
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={translatedImageUrl} 
                        download="translated-product.png"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border2)] text-[12px] font-medium text-[var(--text2)] hover:border-[var(--text)] hover:text-[var(--text)] transition-all"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col items-center gap-4">
                    <img src={translatedImageUrl} alt="Translated" className="w-full max-h-[600px] object-contain rounded-lg shadow-lg" />
                    <p className="text-[12px] text-[var(--text3)] italic">
                      Note: The AI has recreated the image with translated text.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        ) : activeTab === 'adcopy' ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Inputs */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-5 text-[10.5px] font-bold tracking-widest uppercase text-[var(--text3)] after:content-[''] after:flex-1 after:h-[1px] after:bg-[var(--border)]">
                    AdCopy Settings
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)] flex items-center gap-2">
                        <Languages size={14} /> Output Language
                      </label>
                      <select 
                        value={adLanguage}
                        onChange={(e) => setAdLanguage(e.target.value as Language)}
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] font-dm-sans text-[13.5px] outline-hidden focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent-bg)] transition-all appearance-none cursor-pointer"
                      >
                        <option value="French">🇫🇷 French</option>
                        <option value="English">🇺🇸 English</option>
                        <option value="Arabic">🇸🇦 Arabic</option>
                        <option value="Darija Morocco">🇲🇦 Darija Morocco</option>
                      </select>
                    </div>

                    <div className="flex p-1 bg-[var(--bg3)] border border-[var(--border)] rounded-xl mb-2">
                      <button 
                        onClick={() => setAdInputMode('manual')}
                        className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${adInputMode === 'manual' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text)]'}`}
                      >
                        Manual Input
                      </button>
                      <button 
                        onClick={() => setAdInputMode('url')}
                        className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${adInputMode === 'url' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text)]'}`}
                      >
                        Product Link
                      </button>
                    </div>

                    {adInputMode === 'url' ? (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)]">
                          Product URL
                        </label>
                        <input 
                          type="url" 
                          value={adProductUrl}
                          onChange={(e) => setAdProductUrl(e.target.value)}
                          placeholder="https://example.com/product/..."
                          className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] font-dm-sans text-[13.5px] outline-hidden focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent-bg)] transition-all"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)]">
                            Product Name
                          </label>
                          <input 
                            type="text" 
                            value={adProductName}
                            onChange={(e) => setAdProductName(e.target.value)}
                            placeholder="e.g.: 5L Air Fryer"
                            className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] font-dm-sans text-[13.5px] outline-hidden focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent-bg)] transition-all"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)]">
                            Description & Features
                          </label>
                          <textarea 
                            value={adProductInfo}
                            onChange={(e) => setAdProductInfo(e.target.value)}
                            placeholder="Paste all available info: description, materials, benefits..."
                            className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] font-dm-sans text-[13.5px] outline-hidden focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent-bg)] transition-all min-h-[150px] resize-y"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {adError && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3.5 text-red-500 text-[13px] mt-4 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {adError}
                    </div>
                  )}

                  <button 
                    onClick={generateAdCopy}
                    disabled={adLoading}
                    className="w-full p-4 bg-linear-to-br from-[var(--accent)] to-[#b45309] text-white rounded-xl text-[14px] font-bold font-syne cursor-pointer shadow-[var(--shadow)] flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 disabled:bg-[var(--border2)] disabled:text-[var(--text3)] disabled:shadow-none disabled:cursor-not-allowed mt-6"
                  >
                    {adLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Generating Ad Copies...
                      </>
                    ) : (
                      <>
                        <Megaphone size={18} />
                        ✦ Generate Ad Copies
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-7">
                <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm min-h-[400px] flex flex-col">
                  {adLoading ? (
                    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-[var(--text2)]">
                      <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
                      <p className="text-[14px]">Analyzing product & crafting high-converting copies...</p>
                    </div>
                  ) : adResult ? (
                    <div className="flex flex-col gap-5">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[var(--bg3)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-inner"
                      >
                       <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg2)]">
                         <div className="font-syne text-[13px] font-bold text-[var(--text)] flex items-center gap-2.5">
                           <div className="w-2 h-2 bg-[var(--success)] rounded-full shadow-[0_0_0_3px_var(--success-bg)]" />
                           Generated Ad Copies
                         </div>
                         <button 
                           onClick={() => { 
                             navigator.clipboard.writeText(adResult); 
                             setCopied(true); 
                             setTimeout(() => setCopied(false), 2000); 
                           }} 
                           className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border2)] text-[12px] font-medium transition-all ${copied ? 'text-[var(--success)] border-[var(--success)]' : 'text-[var(--text2)] hover:border-[var(--text2)] hover:text-[var(--text)]'}`}
                         >
                           {copied ? <Check size={14}/> : <Copy size={14}/>} 
                           {copied ? 'Copied!' : 'Copy'}
                         </button>
                       </div>
                       <div 
                         className={`p-6 whitespace-pre-wrap text-[14px] sm:text-[15px] leading-[1.9] text-[var(--result-text)] max-h-[700px] overflow-y-auto ${adLanguage === 'Arabic' || adLanguage === 'Darija Morocco' ? 'text-right' : 'text-left'}`}
                         dir={adLanguage === 'Arabic' || adLanguage === 'Darija Morocco' ? 'rtl' : 'ltr'}
                       >
                         {adResult}
                       </div>
                      </motion.div>

                      {adAnalysis && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5"
                        >
                          <div className="flex items-center gap-2 text-emerald-500 font-bold text-[13px] mb-3 uppercase tracking-wider">
                            <CheckCircle2 size={16} /> Résumé de l'Optimisation
                          </div>
                          <ul className="text-[13px] text-[var(--text2)] space-y-2">
                            <li className="flex items-start gap-2">
                              <span className="text-[var(--accent)] mt-1">•</span>
                              <span>Rédaction experte orientée conversion en {adLanguage}.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[var(--accent)] mt-1">•</span>
                              <span>Analyse et correction automatique des risques Facebook Ads.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[var(--accent)] mt-1">•</span>
                              <span>Validation finale de la conformité et de la structure.</span>
                            </li>
                          </ul>
                        </motion.div>
                      )}

                      {adAnalysis && (
                        <details className="group">
                          <summary className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--bg3)] border border-[var(--border)] rounded-xl cursor-pointer text-[12px] font-bold text-[var(--text3)] hover:text-[var(--text)] transition-all list-none">
                            <Search size={14} /> View Full Analysis & Compliance Check
                          </summary>
                          <div className="mt-4 p-6 bg-[var(--bg2)] border border-[var(--border)] rounded-2xl text-[13px] text-[var(--text2)] leading-relaxed whitespace-pre-wrap">
                            {adAnalysis}
                          </div>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-[var(--text3)] gap-4 opacity-50 py-12">
                      <Megaphone size={48} />
                      <p className="text-[14px]">Your generated ad copies will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : activeTab === 'wordcounter' ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-5 sm:p-8 shadow-xl flex flex-col gap-6">
              <div className="flex items-center gap-2.5 text-[11px] font-bold tracking-widest uppercase text-[var(--text3)] after:content-[''] after:flex-1 after:h-[1px] after:bg-[var(--border)]">
                Word Counter
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                  <span className="text-[24px] font-syne font-bold text-[var(--text)]">
                    {wordCounterText.trim() ? wordCounterText.trim().split(/\s+/).length : 0}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text3)] font-bold">Words</span>
                </div>
                <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                  <span className="text-[24px] font-syne font-bold text-[var(--text)]">
                    {wordCounterText.length}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text3)] font-bold">Characters</span>
                </div>
                <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                  <span className="text-[24px] font-syne font-bold text-[var(--text)]">
                    {wordCounterText.split(/[.!?]+/).filter(s => s.trim().length > 0).length}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text3)] font-bold">Sentences</span>
                </div>
                <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                  <span className="text-[24px] font-syne font-bold text-[var(--text)]">
                    {wordCounterText.split(/\n+/).filter(p => p.trim().length > 0).length}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text3)] font-bold">Paragraphs</span>
                </div>
                <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center gap-1 col-span-2 md:col-span-1">
                  <span className="text-[24px] font-syne font-bold text-[var(--text)]">
                    {Math.ceil((wordCounterText.trim() ? wordCounterText.trim().split(/\s+/).length : 0) / 200)}m
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text3)] font-bold">Reading Time</span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={wordCounterText}
                  onChange={(e) => setWordCounterText(e.target.value)}
                  placeholder="Type or paste your text here..."
                  className="w-full h-[400px] bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-5 text-[var(--text)] font-dm-sans text-[15px] leading-relaxed outline-hidden focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-bg)] transition-all resize-none"
                />
                {wordCounterText && (
                  <button
                    onClick={() => setWordCounterText('')}
                    className="absolute top-4 right-4 p-2 text-[var(--text3)] hover:text-[var(--text)] bg-[var(--bg2)] rounded-lg border border-[var(--border)] transition-colors"
                    title="Clear text"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-5 sm:p-8 mb-5 transition-colors duration-300 shadow-xl">
              <div className="flex items-center gap-2.5 mb-6 text-[11px] font-bold tracking-widest uppercase text-[var(--text3)] transition-colors duration-300 after:content-[''] after:flex-1 after:h-[1px] after:bg-[var(--border)]">
                Product Details
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)] flex items-center gap-2">
                    <Languages size={14} /> Output Language
                  </label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] font-dm-sans text-[13.5px] outline-hidden focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent-bg)] transition-all appearance-none cursor-pointer"
                  >
                    <option value="French">🇫🇷 French</option>
                    <option value="English">🇺🇸 English</option>
                    <option value="Arabic">🇸🇦 Arabic</option>
                    <option value="Darija Morocco">🇲🇦 Darija Morocco</option>
                  </select>
                </div>

                <div className="flex p-1 bg-[var(--bg3)] border border-[var(--border)] rounded-xl mb-2">
                  <button 
                    onClick={() => setInputMode('manual')}
                    className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${inputMode === 'manual' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text)]'}`}
                  >
                    Manual Input
                  </button>
                  <button 
                    onClick={() => setInputMode('url')}
                    className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${inputMode === 'url' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text)]'}`}
                  >
                    Product Link
                  </button>
                </div>

                {inputMode === 'url' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)]">
                      Product URL
                    </label>
                    <input 
                      type="url" 
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="https://example.com/product/..."
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] font-dm-sans text-[13.5px] outline-hidden focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent-bg)] transition-all"
                    />
                    <p className="text-[11px] text-[var(--text3)] mt-1 italic">
                      Note: Use links from Alibaba, AliExpress, Amazon, or Temu for best results. Chinese-only links (like 1688) may not be accurate.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)]">
                        Product Name
                      </label>
                      <input 
                        type="text" 
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g.: 5L Air Fryer"
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] font-dm-sans text-[13.5px] outline-hidden focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent-bg)] transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10.5px] font-bold tracking-wider uppercase text-[var(--text3)]">
                        Description & Features
                      </label>
                      <textarea 
                        value={productInfo}
                        onChange={(e) => setProductInfo(e.target.value)}
                        placeholder="Paste all available info: description, materials, benefits..."
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] font-dm-sans text-[13.5px] outline-hidden focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent-bg)] transition-all min-h-[150px] resize-y"
                      />
                    </div>
                  </>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/5 border border-red-500/20 rounded-lg p-3.5 text-red-500 text-[13px] mt-4 flex items-center gap-2"
                  >
                    <AlertTriangle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={generate}
                disabled={loading}
                className="w-full p-4 bg-linear-to-br from-[var(--accent)] to-[#b45309] text-white rounded-xl text-[14px] font-bold font-syne cursor-pointer shadow-[var(--shadow)] flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_30px_rgba(249,115,22,0.3)] disabled:bg-[var(--border2)] disabled:text-[var(--text3)] disabled:shadow-none disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing Steps...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    ✦ Generate Optimized Page
                  </>
                )}
              </button>
            </section>

            <div id="output">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-8 flex flex-col items-center gap-6 text-[var(--text2)] text-[14px] text-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg3)] text-[var(--text3)]'}`}>
                        <FileText size={20} />
                      </div>
                      <div className={`w-8 h-[2px] ${step >= 2 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg3)] text-[var(--text3)]'}`}>
                        <Search size={20} />
                      </div>
                      <div className={`w-8 h-[2px] ${step >= 3 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg3)] text-[var(--text3)]'}`}>
                        <ShieldCheck size={20} />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <p className="font-bold text-[var(--text)]">
                        {step === 1 && "Step 1: Generating Initial Draft..."}
                        {step === 2 && "Step 2: Analyzing Policy Compliance..."}
                        {step === 3 && "Step 3: Final Expert Validation..."}
                      </p>
                      <p className="text-[13px]">This multi-step optimization ensures maximum conversion and safety.</p>
                    </div>
                    <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
                  </motion.div>
                ) : result ? (
                  <div className="flex flex-col gap-6">
                    <motion.div 
                      key="result"
                      id="result-section"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl overflow-hidden transition-colors duration-300 shadow-md"
                    >
                      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg3)] transition-colors duration-300">
                        <div className="font-syne text-[13px] font-bold text-[var(--text)] flex items-center gap-2.5">
                          <div className="w-2 h-2 bg-[var(--success)] rounded-full shadow-[0_0_0_3px_var(--success-bg)] animate-pulse" />
                          Final Optimized Page
                        </div>
                        <button 
                          onClick={copyResult}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border2)] text-[12px] font-medium transition-all ${copied ? 'text-[var(--success)] border-[var(--success)]' : 'text-[var(--text2)] hover:border-[var(--text2)] hover:text-[var(--text)]'}`}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div 
                        className={`p-6 whitespace-pre-wrap text-[14px] sm:text-[15px] leading-[1.9] text-[var(--result-text)] max-h-[700px] overflow-y-auto ${isRtl ? 'text-right' : 'text-left'}`}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        {result}
                      </div>
                    </motion.div>

                    {validation && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5"
                      >
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-[13px] mb-3 uppercase tracking-wider">
                          <CheckCircle2 size={16} /> Résumé de l'Optimisation
                        </div>
                        <ul className="text-[13px] text-[var(--text2)] space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-[var(--accent)] mt-1">•</span>
                            <span>Rédaction experte orientée conversion en {language}.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[var(--accent)] mt-1">•</span>
                            <span>Analyse et correction automatique des risques Facebook Ads.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[var(--accent)] mt-1">•</span>
                            <span>Validation finale de la conformité et de la structure.</span>
                          </li>
                        </ul>
                      </motion.div>
                    )}

                    {analysis && (
                      <details className="group">
                        <summary className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--bg3)] border border-[var(--border)] rounded-xl cursor-pointer text-[12px] font-bold text-[var(--text3)] hover:text-[var(--text)] transition-all list-none">
                          <Search size={14} /> View Full Compliance Analysis
                        </summary>
                        <div className="mt-4 p-6 bg-[var(--bg2)] border border-[var(--border)] rounded-2xl text-[13px] text-[var(--text2)] leading-relaxed whitespace-pre-wrap">
                          {analysis}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <motion.div 
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 px-5 text-[var(--text3)] text-[13px]"
                  >
                    <div className="text-[40px] mb-4 opacity-30">
                      <FileText className="mx-auto" />
                    </div>
                    Enter product details to start the 3-step expert optimization
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      <footer className="py-8 px-5 border-t border-[var(--border)] bg-[var(--bg2)] text-center transition-colors duration-300">
        <p className="text-[12px] text-[var(--text3)] font-medium">
          © {new Date().getFullYear()} Developed by <span className="text-[var(--accent)] font-bold">Yassine HAOUARI</span>
        </p>
      </footer>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPwdModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[var(--accent-bg)] rounded-xl flex items-center justify-center text-[var(--accent)]">
                  <Key size={20} />
                </div>
                <h3 className="font-syne font-bold text-lg text-[var(--text)]">Change Password</h3>
              </div>

              <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text3)]">Current Password</label>
                  <input 
                    type="password" 
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] text-[14px] outline-hidden focus:border-[var(--accent)] transition-all"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text3)]">New Password</label>
                  <input 
                    type="password" 
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[var(--text)] text-[14px] outline-hidden focus:border-[var(--accent)] transition-all"
                    required
                  />
                </div>

                {pwdMsg && (
                  <div className={`p-3 rounded-lg text-[13px] flex items-center gap-2 ${pwdMsg.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                    {pwdMsg.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
                    {pwdMsg.text}
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button 
                    type="button"
                    onClick={() => { setShowPwdModal(false); setPwdMsg(null); setOldPwd(''); setNewPwd(''); }}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--border2)] text-[var(--text2)] font-bold text-[13px] hover:bg-[var(--bg3)] hover:text-[var(--text)] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-white font-bold text-[13px] hover:opacity-90 transition-all shadow-md"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
