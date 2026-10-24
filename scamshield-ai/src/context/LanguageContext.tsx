import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'English' | 'Hindi' | 'Marathi'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaultVal?: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  English: {
    // Brand & Nav
    'brand.title': 'ScamShield',
    'brand.subtitle': 'DIGITAL SAFETY PLATFORM',
    'nav.main_menu': 'MAIN MENU',
    'nav.dashboard': 'Dashboard',
    'nav.scam_scanner': 'Scam Scanner',
    'nav.link_checker': 'Link Checker',
    'nav.human_review': 'Human Review',
    'nav.case_history': 'Case History',
    'nav.settings': 'Settings',
    'nav.stay_protected': 'Stay Protected',
    'nav.stay_protected_desc': 'Stay alert. Verify unexpected requests before sharing personal or financial information.',
    'nav.demo_mode': 'Demo Mode',
    'nav.standard_account': 'Standard Account',
    'footer.copyright': '© 2026 ScamShield AI · Built for safer digital commerce',
    'footer.tagline': 'AI-assisted screening · Human-verified response',

    // Dashboard
    'dashboard.eyebrow': 'YOUR DIGITAL SAFETY CENTER',
    'dashboard.welcome': 'Welcome to ScamShield AI 🛡️',
    'dashboard.subtitle': 'Detect suspicious messages, check links, and make safer decisions online.',
    'dashboard.total_scans': 'Total Scans',
    'dashboard.total_scans_sub': 'Live database records',
    'dashboard.high_risk': 'High-Risk Cases',
    'dashboard.high_risk_sub': 'Require attention',
    'dashboard.pending_reviews': 'Pending Reviews',
    'dashboard.pending_reviews_sub': 'Awaiting human review',
    'dashboard.cases_reviewed': 'Cases Reviewed',
    'dashboard.cases_reviewed_sub': 'Moderator assessed',
    'dashboard.quick_actions': 'Quick Actions',
    'dashboard.quick_actions_sub': 'Choose a safety tool to get started.',
    'dashboard.scan_msg_title': 'Scan a Message',
    'dashboard.scan_msg_desc': 'Check suspicious SMS messages, WhatsApp chats, or payment requests.',
    'dashboard.scan_msg_btn': 'Start scanning',
    'dashboard.check_link_title': 'Check a Link',
    'dashboard.check_link_desc': 'Inspect website URLs for deceptive domains and scam signals.',
    'dashboard.check_link_btn': 'Check link',
    'dashboard.human_review_title': 'Human Review',
    'dashboard.human_review_desc': 'Review flagged suspicious cases and record a human verdict.',
    'dashboard.human_review_btn': 'Review cases',
    'dashboard.safety_tip_title': 'Golden Rule of Digital Safety',
    'dashboard.safety_tip_desc': 'Banks and government agencies never ask for your PIN, OTP, or passwords over SMS or phone calls.',

    // Scam Scanner
    'scanner.title': 'Scam Scanner',
    'scanner.subtitle': 'Scan suspicious messages, SMS, WhatsApp texts, or payment requests.',
    'scanner.tab_text': 'Text Message',
    'scanner.tab_image': 'Screenshot & Image',
    'scanner.paste_label': 'Paste message or transcript to analyze',
    'scanner.placeholder': 'e.g. URGENT: Your bank account will be blocked within 2 hours. Click here to verify OTP immediately...',
    'scanner.voice_listen': 'Speak Message (Voice Input)',
    'scanner.voice_listening': 'Listening... speak clearly',
    'scanner.scan_btn': 'Scan Message with AI',
    'scanner.scanning': 'Analyzing with AI & Threat Engine...',
    'scanner.result_title': 'AI Threat Assessment',
    'scanner.result_completed': 'Multi-signal analysis completed',
    'scanner.listen_verdict': 'Listen to Verdict',
    'scanner.stop_reading': 'Stop Reading',
    'scanner.voice_err_unsupported': 'Speech recognition is not supported in this browser. Please use Google Chrome or Edge.',
    'scanner.voice_err_permission': 'Microphone permission denied. Please allow microphone access to use voice input.',
    'scanner.risk_level': 'Risk Level',
    'scanner.risk_score': 'Risk Score',
    'scanner.detection_method': 'Detection Method',
    'scanner.ai_model': 'AI Engine',
    'scanner.why_summary': 'Why was this flagged?',
    'scanner.highlighted_text': 'Flagged Indicators in Your Message',
    'scanner.indicators_title': 'Detailed Detection Signals',
    'scanner.recommendations_title': 'How to Stay Safe (Recommended Actions)',
    'scanner.feedback_title': 'Was this assessment helpful?',
    'scanner.feedback_yes': 'Accurate 👍',
    'scanner.feedback_no': 'Incorrect / False Alert 👎',
    'scanner.feedback_thanks': 'Thank you! Your feedback helps train our threat detection model.',
    'scanner.image_upload_prompt': 'Upload or drop a screenshot of SMS, WhatsApp, payment receipt or QR code',
    'scanner.image_btn': 'Analyze Screenshot',
    'scanner.ocr_detected': 'Extracted Text from Image',

    // Link Checker
    'links.title': 'Link Checker',
    'links.subtitle': 'Inspect web links for phishing, punycode spoofing, and malicious destinations.',
    'links.input_label': 'Enter the website link to check',
    'links.placeholder': 'https://sbi-kyc-update.xyz/login',
    'links.btn': 'Check Link',
    'links.checking': 'Checking link reputation...',
    'links.result_heading': 'Link Safety Analysis',
    'links.disclaimer': 'HTTPS alone does not mean a website is legitimate. Never enter banking credentials or PINs on unfamiliar links.',

    // Human Review
    'review.title': 'Human Review Queue',
    'review.subtitle': 'Review high-risk scam cases and record verdicts in Supabase.',
    'review.all_caught_up': 'All caught up!',
    'review.no_pending': 'No high or medium-risk cases require moderator assessment.',
    'review.verdict_label': 'Review verdict',
    'review.select_verdict': 'Select a verdict...',
    'review.confirmed_scam': 'Confirmed Scam',
    'review.likely_legit': 'Likely Legitimate',
    'review.inconclusive': 'Inconclusive',
    'review.notes_label': 'Moderator notes (optional)',
    'review.saving': 'Saving verdict to database...',
    'review.disclaimer': 'Verdicts are recorded in Supabase for audit logs and machine learning model fine-tuning.',

    // Case History
    'history.title': 'Case History',
    'history.subtitle': 'Search, filter and export past scam detection records.',
    'history.search_placeholder': 'Search scans by message keyword...',
    'history.export_csv': 'Export CSV',
    'history.print_report': 'Print Incident Report',
    'history.no_records': 'No scan records found.',
    'history.delete_tooltip': 'Delete scan',
    'history.disclaimer': 'Records are securely stored in your cloud database.',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your ScamShield AI preferences and language settings.',
    'settings.profile_section': 'Profile',
    'settings.display_name': 'Display Name',
    'settings.lang_section': 'Language',
    'settings.lang_choose': 'Choose Application Language',
    'settings.appearance_section': 'Appearance',
    'settings.dark_mode': 'Dark Mode',
    'settings.notifications_section': 'Notifications',
    'settings.enable_notifications': 'Enable Safety Notifications',
    'settings.save_btn': 'Save Preferences',
    'settings.saving': 'Saving...',
    'settings.saved_success': 'Preferences saved and synced to database!',
  },

  Hindi: {
    // Brand & Nav
    'brand.title': 'स्कैमशील्ड',
    'brand.subtitle': 'डिजिटल सुरक्षा प्लेटफॉर्म',
    'nav.main_menu': 'मुख्य मेन्यू',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.scam_scanner': 'स्कैम स्कैनर',
    'nav.link_checker': 'लिंक चेकर',
    'nav.human_review': 'मानव समीक्षा',
    'nav.case_history': 'केस इतिहास',
    'nav.settings': 'सेटिंग्स',
    'nav.stay_protected': 'सुरक्षित रहें',
    'nav.stay_protected_desc': 'सावधान रहें। कोई भी व्यक्तिगत या वित्तीय जानकारी साझा करने से पहले पुष्टि अवश्य करें।',
    'nav.demo_mode': 'डेमो मोड',
    'nav.standard_account': 'मानक खाता',
    'footer.copyright': '© 2026 स्कैमशील्ड AI · सुरक्षित डिजिटल कॉमर्स के लिए निर्मित',
    'footer.tagline': 'AI-सहायक स्क्रीनिंग · मानव-सत्यापित सुरक्षा प्रतिक्रिया',

    // Dashboard
    'dashboard.eyebrow': 'आपका डिजिटल सुरक्षा केंद्र',
    'dashboard.welcome': 'स्कैमशील्ड AI में आपका स्वागत है 🛡️',
    'dashboard.subtitle': 'संदिग्ध संदेशों की जांच करें, लिंक सत्यापित करें और ऑनलाइन सुरक्षित निर्णय लें।',
    'dashboard.total_scans': 'कुल स्कैन',
    'dashboard.total_scans_sub': 'डेटाबेस रिकॉर्ड्स',
    'dashboard.high_risk': 'उच्च जोखिम मामले',
    'dashboard.high_risk_sub': 'तत्काल ध्यान आवश्यक',
    'dashboard.pending_reviews': 'लंबित समीक्षाएं',
    'dashboard.pending_reviews_sub': 'समीक्षा की प्रतीक्षा में',
    'dashboard.cases_reviewed': 'समीक्षित मामले',
    'dashboard.cases_reviewed_sub': 'विशेषज्ञों द्वारा सत्यापित',
    'dashboard.quick_actions': 'त्वरित क्रियाएं',
    'dashboard.quick_actions_sub': 'शुरू करने के लिए एक सुरक्षा टूल चुनें।',
    'dashboard.scan_msg_title': 'संदेश स्कैन करें',
    'dashboard.scan_msg_desc': 'संदिग्ध एसएमएस, व्हाट्सएप चैट या भुगतान अनुरोधों की तुरंत जांच करें।',
    'dashboard.scan_msg_btn': 'स्कैन शुरू करें',
    'dashboard.check_link_title': 'वेबसाइट लिंक जांचें',
    'dashboard.check_link_desc': 'धोखाधड़ी वाली वेबसाइट और फ़िशिंग लिंक के संकेतों का विश्लेषण करें।',
    'dashboard.check_link_btn': 'लिंक जांचें',
    'dashboard.human_review_title': 'मानव समीक्षा',
    'dashboard.human_review_desc': 'फ्लैग किए गए संदिग्ध मामलों की जांच करें और मानवीय निर्णय दर्ज करें।',
    'dashboard.human_review_btn': 'मामले देखें',
    'dashboard.safety_tip_title': 'डिजिटल सुरक्षा का सुनहरा नियम',
    'dashboard.safety_tip_desc': 'बैंक और सरकारी विभाग कभी भी एसएमएस या फोन कॉल पर आपका पिन, ओटीपी या पासवर्ड नहीं मांगते।',

    // Scam Scanner
    'scanner.title': 'स्कैम स्कैनर',
    'scanner.subtitle': 'संदिग्ध एसएमएस, व्हाट्सएप चैट, बैंक अलर्ट या भुगतान अनुरोध की जांच करें।',
    'scanner.tab_text': 'टेक्स्ट संदेश',
    'scanner.tab_image': 'स्क्रीनशॉट और छवि',
    'scanner.paste_label': 'जांच के लिए संदेश यहां पेस्ट करें',
    'scanner.placeholder': 'उदा. अर्जेंट: आपका बैंक खाता 2 घंटे में बंद हो जाएगा। ओटीपी सत्यापित करने के लिए तुरंत यहां क्लिक करें...',
    'scanner.voice_listen': 'बोलकर दर्ज करें (आवाज़ इनपुट)',
    'scanner.voice_listening': 'सुन रहा हूं... कृपया बोलें',
    'scanner.scan_btn': 'AI से संदेश स्कैन करें',
    'scanner.scanning': 'AI और सुरक्षा नियमों से जांच हो रही है...',
    'scanner.result_title': 'AI सुरक्षा मूल्यांकन परिणाम',
    'scanner.result_completed': 'बहु-संकेत विश्लेषण पूर्ण हुआ',
    'scanner.listen_verdict': 'आवाज़ में सुनें',
    'scanner.stop_reading': 'बोलना बंद करें',
    'scanner.voice_err_unsupported': 'इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। कृपया गूगल क्रोम का उपयोग करें।',
    'scanner.voice_err_permission': 'माइक्रोफ़ोन की अनुमति अस्वीकृत। बोलकर इनपुट करने के लिए कृपया माइक्रोफ़ोन की अनुमति दें।',
    'scanner.risk_level': 'जोखिम स्तर',
    'scanner.risk_score': 'जोखिम स्कोर',
    'scanner.detection_method': 'पहचान विधि',
    'scanner.ai_model': 'AI मॉडल',
    'scanner.why_summary': 'यह संदिग्ध क्यों पाया गया?',
    'scanner.highlighted_text': 'संदेश में पहचाने गए चेतावनी शब्द',
    'scanner.indicators_title': 'पहचाने गए खतरे के संकेत',
    'scanner.recommendations_title': 'सुरक्षित रहने के उपाय (सलाह)',
    'scanner.feedback_title': 'क्या यह मूल्यांकन सटीक था?',
    'scanner.feedback_yes': 'सटीक है 👍',
    'scanner.feedback_no': 'गलत चेतावनी 👎',
    'scanner.feedback_thanks': 'धन्यवाद! आपकी प्रतिक्रिया हमारे AI मॉडल को और बेहतर बनाती है।',
    'scanner.image_upload_prompt': 'एसएमएस, व्हाट्सएप, पेमेंट रसीद या क्यूआर कोड का स्क्रीनशॉट अपलोड करें',
    'scanner.image_btn': 'स्क्रीनशॉट स्कैन करें',
    'scanner.ocr_detected': 'छवि से निकाला गया टेक्स्ट',

    // Link Checker
    'links.title': 'लिंक चेकर',
    'links.subtitle': 'फ़िशिंग, नकली डोमेन और धोखाधड़ी वाली वेबसाइटों की जांच करें।',
    'links.input_label': 'जांचने के लिए वेबसाइट लिंक दर्ज करें',
    'links.placeholder': 'https://sbi-kyc-update.xyz/login',
    'links.btn': 'लिंक जांचें',
    'links.checking': 'लिंक की जांच की जा रही है...',
    'links.result_heading': 'लिंक सुरक्षा विश्लेषण',
    'links.disclaimer': 'केवल HTTPS होने का मतलब यह नहीं कि वेबसाइट सुरक्षित है। अज्ञात लिंक पर कभी भी बैंक विवरण या पासवर्ड न भरें।',

    // Human Review
    'review.title': 'मानव समीक्षा कतार',
    'review.subtitle': 'उच्च जोखिम वाले स्कैम मामलों की समीक्षा करें और सुरक्षित निर्णय डेटाबेस में दर्ज करें।',
    'review.all_caught_up': 'सभी मामले पूर्ण हैं!',
    'review.no_pending': 'फिलहाल समीक्षा के लिए कोई लंबित मामला नहीं है।',
    'review.verdict_label': 'समीक्षा निर्णय',
    'review.select_verdict': 'निर्णय चुनें...',
    'review.confirmed_scam': 'पुष्ट स्कैम (धोखाधड़ी)',
    'review.likely_legit': 'संभावित सुरक्षित',
    'review.inconclusive': 'अनिर्णायक',
    'review.notes_label': 'समीक्षक टिप्पणी (वैकल्पिक)',
    'review.saving': 'डेटाबेस में सुरक्षित किया जा रहा है...',
    'review.disclaimer': 'समीक्षा निर्णय सुरक्षा ऑडिट और AI को प्रशिक्षित करने के लिए डेटाबेस में सहेजे जाते हैं।',

    // Case History
    'history.title': 'केस इतिहास',
    'history.subtitle': 'पिछले स्कैम स्कैन रिकॉर्ड खोजें, फ़िल्टर करें और रिपोर्ट डाउनलोड करें।',
    'history.search_placeholder': 'संदेश के शब्दों से खोजें...',
    'history.export_csv': 'CSV डाउनलोड करें',
    'history.print_report': 'घटना रिपोर्ट प्रिंट / PDF',
    'history.no_records': 'कोई स्कैन रिकॉर्ड नहीं मिला।',
    'history.delete_tooltip': 'स्कैन हटाएं',
    'history.disclaimer': 'रिकॉर्ड क्लाउड डेटाबेस में सुरक्षित संग्रहीत हैं।',

    // Settings
    'settings.title': 'सेटिंग्स',
    'settings.subtitle': 'अपनी स्कैमशील्ड प्राथमिकताएं और भाषा प्रबंधित करें।',
    'settings.profile_section': 'प्रोफ़ाइल',
    'settings.display_name': 'प्रदर्शित नाम',
    'settings.lang_section': 'भाषा (Language)',
    'settings.lang_choose': 'एप्लिकेशन भाषा चुनें',
    'settings.appearance_section': 'दिखावट (Appearance)',
    'settings.dark_mode': 'डार्क मोड',
    'settings.notifications_section': 'सूचनाएं',
    'settings.enable_notifications': 'सुरक्षा सूचनाएं सक्षम करें',
    'settings.save_btn': 'प्राथमिकताएं सहेजें',
    'settings.saving': 'सहेजा जा रहा है...',
    'settings.saved_success': 'प्राथमिकताएं सहेजी गईं और डेटाबेस से सिंक हो गईं!',
  },

  Marathi: {
    // Brand & Nav
    'brand.title': 'स्कॅमशील्ड',
    'brand.subtitle': 'डिजिटल सुरक्षा व्यासपीठ',
    'nav.main_menu': 'मुख्य मेनू',
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.scam_scanner': 'स्कॅम स्कॅनर',
    'nav.link_checker': 'लिंक चेकर',
    'nav.human_review': 'मानवी पुनरावलोकन',
    'nav.case_history': 'केस इतिहास',
    'nav.settings': 'सेटिंग्ज',
    'nav.stay_protected': 'सुरक्षित राहा',
    'nav.stay_protected_desc': 'सतर्क राहा. कोणतीही वैयक्तिक किंवा आर्थिक माहिती शेअर करण्यापूर्वी खात्री करा.',
    'nav.demo_mode': 'डेमो मोड',
    'nav.standard_account': 'स्टँडर्ड खाते',
    'footer.copyright': '© 2026 स्कॅमशील्ड AI · सुरक्षित डिजिटल व्यवहारांसाठी विकसित',
    'footer.tagline': 'AI-सहाय्यित तपासणी · मानवी पडताळणीसह सुरक्षा प्रतिसाद',

    // Dashboard
    'dashboard.eyebrow': 'तुमचे डिजिटल सुरक्षा केंद्र',
    'dashboard.welcome': 'स्कॅमशील्ड AI मध्ये आपले स्वागत आहे 🛡️',
    'dashboard.subtitle': 'संशयास्पद मेसेज तपासा, लिंक्सची पडताळणी करा आणि ऑनलाइन सुरक्षित निर्णय घ्या.',
    'dashboard.total_scans': 'एकूण स्कॅन',
    'dashboard.total_scans_sub': 'थेट डेटाबेस नोंदी',
    'dashboard.high_risk': 'उच्च जोखीम प्रकरणे',
    'dashboard.high_risk_sub': 'तातडीचे लक्ष आवश्यक',
    'dashboard.pending_reviews': 'प्रलंबित पुनरावलोकने',
    'dashboard.pending_reviews_sub': 'तपासणीच्या प्रतीक्षेत',
    'dashboard.cases_reviewed': 'तपासलेली प्रकरणे',
    'dashboard.cases_reviewed_sub': 'तज्ज्ञांनी प्रमाणित',
    'dashboard.quick_actions': 'जलद क्रिया',
    'dashboard.quick_actions_sub': 'सुरू करण्यासाठी एक सुरक्षा टूल निवडा.',
    'dashboard.scan_msg_title': 'मेसेज स्कॅन करा',
    'dashboard.scan_msg_desc': 'संशयास्पद एसएमएस, व्हॉट्सअ‍ॅप चॅट किंवा पेमेंट विनंती तात्काळ तपासा.',
    'dashboard.scan_msg_btn': 'स्कॅन सुरू करा',
    'dashboard.check_link_title': 'लिंक तपासा',
    'dashboard.check_link_desc': 'फसव्या वेबसाइट्स आणि फिशिंग लिंक्सच्या धोक्यांचे विश्लेषण करा.',
    'dashboard.check_link_btn': 'लिंक तपासा',
    'dashboard.human_review_title': 'मानवी पुनरावलोकन',
    'dashboard.human_review_desc': 'संशयास्पद प्रकरणांचे पुनरावलोकन करा आणि मानवी निर्णय नोंदवा.',
    'dashboard.human_review_btn': 'प्रकरणे पहा',
    'dashboard.safety_tip_title': 'डिजिटल सुरक्षेचा सुवर्ण नियम',
    'dashboard.safety_tip_desc': 'बँका आणि सरकारी संस्था कधीही एसएमएस किंवा फोन कॉलवर तुमचा पिन, ओटीपी किंवा पासवर्ड मागत नाहीत.',

    // Scam Scanner
    'scanner.title': 'स्कॅम स्कॅनर',
    'scanner.subtitle': 'संशयास्पद एसएमएस, व्हॉट्सअ‍ॅप मेसेज, बँक अलर्ट किंवा पेमेंट विनंती तपासा.',
    'scanner.tab_text': 'टेक्स्ट मेसेज',
    'scanner.tab_image': 'स्क्रीनशॉट आणि इमेज',
    'scanner.paste_label': 'तपासण्यासाठी मेसेज येथे पेस्ट करा',
    'scanner.placeholder': 'उदा. तातडीचे: तुमचे बँक खाते 2 तासांत ब्लॉक केले जाईल. ओटीपी पडताळणीसाठी लगेच येथे क्लिक करा...',
    'scanner.voice_listen': 'बोलून मेसेज नोंदवा (व्हॉईस इनपुट)',
    'scanner.voice_listening': 'ऐकत आहे... कृपया बोला',
    'scanner.scan_btn': 'AI द्वारे मेसेज स्कॅन करा',
    'scanner.scanning': 'AI आणि सुरक्षा इंजिनद्वारे तपासणी सुरू आहे...',
    'scanner.result_title': 'AI सुरक्षा मूल्यमापन निष्कर्ष',
    'scanner.result_completed': 'तपशीलवार विश्लेषण पूर्ण झाले',
    'scanner.listen_verdict': 'आवाजात ऐका',
    'scanner.stop_reading': 'वाचन थांबवा',
    'scanner.voice_err_unsupported': 'या ब्राउझरमध्ये स्पीच रेकग्निशन समर्थित नाही. कृपया गुगल क्रोम वापरा.',
    'scanner.voice_err_permission': 'मायक्रोफोन परवानगी नाकारली. व्हॉइस इनपुट वापरण्यासाठी कृपया मायक्रोफोन परवानगी द्या.',
    'scanner.risk_level': 'जोखीम पातळी',
    'scanner.risk_score': 'जोखीम गुण',
    'scanner.detection_method': 'शोध पद्धत',
    'scanner.ai_model': 'AI मॉडेल',
    'scanner.why_summary': 'हा मेसेज संशयास्पद का वाटला?',
    'scanner.highlighted_text': 'मेसेजमधील आढळलेले धोक्याचे शब्द',
    'scanner.indicators_title': 'आढळलेले धोक्याचे संकेत',
    'scanner.recommendations_title': 'सुरक्षित राहण्यासाठी सल्ला (उपाय)',
    'scanner.feedback_title': 'हे मूल्यमापन अचूक होते का?',
    'scanner.feedback_yes': 'अचूक आहे 👍',
    'scanner.feedback_no': 'चुकीचा इशारा 👎',
    'scanner.feedback_thanks': 'धन्यवाद! तुमचा अभिप्राय आमच्या AI मॉडेलला अधिक अचूक बनवण्यास मदत करतो.',
    'scanner.image_upload_prompt': 'एसएमएस, व्हॉट्सअ‍ॅप, पेमेंट पावती किंवा क्यूआर कोडचा स्क्रीनशॉट अपलोड करा',
    'scanner.image_btn': 'स्क्रीनशॉट स्कॅन करा',
    'scanner.ocr_detected': 'इमेजमधून काढलेला मजकूर',

    // Link Checker
    'links.title': 'लिंक चेकर',
    'links.subtitle': 'फिशिंग, बनावट डोमेन आणि धोकादायक वेबसाइट्सची तपासणी करा.',
    'links.input_label': 'तपासण्यासाठी वेबसाइट लिंक प्रविष्ट करा',
    'links.placeholder': 'https://sbi-kyc-update.xyz/login',
    'links.btn': 'लिंक तपासा',
    'links.checking': 'लिंकची तपासणी सुरू आहे...',
    'links.result_heading': 'लिंक सुरक्षा विश्लेषण',
    'links.disclaimer': 'केवळ HTTPS असणे म्हणजे वेबसाइट सुरक्षित आहे असे नाही. अनोळखी लिंकवर कधीही बँक तपशील किंवा पिन भरू नका.',

    // Human Review
    'review.title': 'मानवी पुनरावलोकन रांग',
    'review.subtitle': 'उच्च जोखीम प्रकरणांचे पुनरावलोकन करा आणि थेट डेटाबेसमध्ये निर्णय नोंदवा.',
    'review.all_caught_up': 'सर्व प्रकरणे तपासली आहेत!',
    'review.no_pending': 'सध्या तपासणीसाठी कोणतेही प्रलंबित प्रकरण नाही.',
    'review.verdict_label': 'पुनरावलोकन निर्णय',
    'review.select_verdict': 'निर्णय निवडा...',
    'review.confirmed_scam': 'निश्चित स्कॅम (फसवणूक)',
    'review.likely_legit': 'संभाव्य सुरक्षित',
    'review.inconclusive': 'अनिर्णित',
    'review.notes_label': 'टीप (पर्यायी)',
    'review.saving': 'डेटाबेसमध्ये नोंदवले जात आहे...',
    'review.disclaimer': 'सुरक्षा ऑडिट आणि AI ला प्रशिक्षण देण्यासाठी निर्णय डेटाबेसमध्ये सुरक्षित ठेवले जातात.',

    // Case History
    'history.title': 'केस इतिहास',
    'history.subtitle': 'मागील स्कॅम नोंदी शोधा, फिल्टर करा आणि अहवाल डाउनलोड करा.',
    'history.search_placeholder': 'मेसेजमधील शब्दांनुसार शोधा...',
    'history.export_csv': 'CSV डाउनलोड करा',
    'history.print_report': 'घटना अहवाल प्रिंट / PDF',
    'history.no_records': 'कोणत्याही नोंदी आढळल्या नाहीत.',
    'history.delete_tooltip': 'नोंद हटवा',
    'history.disclaimer': 'नोंदी क्लाउड डेटाबेसमध्ये सुरक्षित ठेवल्या आहेत.',

    // Settings
    'settings.title': 'सेटिंग्ज',
    'settings.subtitle': 'तुमची स्कॅमशील्ड प्राधान्ये आणि भाषा व्यवस्थापित करा.',
    'settings.profile_section': 'प्रोफाइल',
    'settings.display_name': 'प्रदर्शित नाव',
    'settings.lang_section': 'भाषा (Language)',
    'settings.lang_choose': 'अ‍ॅपची भाषा निवडा',
    'settings.appearance_section': 'दिसणे (Appearance)',
    'settings.dark_mode': 'डार्क मोड',
    'settings.notifications_section': 'सूचना',
    'settings.enable_notifications': 'सुरक्षा सूचना सक्षम करा',
    'settings.save_btn': 'प्राधान्ये जतन करा',
    'settings.saving': 'जतन करत आहे...',
    'settings.saved_success': 'प्राधान्ये जतन झाली आणि डेटाबेसशी समक्रमित झाली!',
  },
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => {},
  t: (key: string, defaultVal?: string) => defaultVal || key,
})

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('scamshield-language')
    if (saved === 'Hindi' || saved === 'Marathi' || saved === 'English') {
      return saved
    }
    return 'English'
  })

  function setLanguage(lang: Language) {
    setLanguageState(lang)
    localStorage.setItem('scamshield-language', lang)
    document.documentElement.lang = lang === 'Hindi' ? 'hi' : lang === 'Marathi' ? 'mr' : 'en'
  }

  useEffect(() => {
    document.documentElement.lang = language === 'Hindi' ? 'hi' : language === 'Marathi' ? 'mr' : 'en'
  }, [language])

  function t(key: string, defaultVal?: string): string {
    const langDict = translations[language] || translations.English
    if (langDict && langDict[key]) {
      return langDict[key]
    }
    if (translations.English && translations.English[key]) {
      return translations.English[key]
    }
    return defaultVal || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
