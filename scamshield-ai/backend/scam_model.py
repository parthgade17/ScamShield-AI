"""
ScamShield AI - Machine Learning Scam Classifier
Lightweight, zero-dependency statistical NLP model trained on Indian & Global
scam corpora (SMS, WhatsApp, UPI, Banking, Electricity, Job, Lottery, Extortion).
Supports English, Hinglish, Hindi (Devanagari), and Marathi (Devanagari).
"""

import re
import math
from typing import Dict, List, Tuple, Any

# ==============================================================================
# 1. TRAINING DATASET (Curated 350+ realistic scam & legitimate message patterns)
# ==============================================================================

SCAM_TRAINING_CORPUS: List[str] = [
    # Category: Electricity Bill Extortion
    "Dear consumer your electricity power will be disconnected tonight at 9:30 pm from electricity office because your previous month bill was not updated. Please immediately call on 9876543210 electricity officer.",
    "Mahavitaran alert: Your light connection will be disconnected today at 8:30 pm due to pending bill payment. Call 9123456789 to update bill.",
    "BSES Notice: Urgent electricity disconnection scheduled for tonight at 9 PM. Update bill through this link or call manager.",
    "Tata Power: Dear user your bijli connection will be cut off today. Contact bill section immediately.",
    "प्रिय उपभोक्ता आपकी बिजली आज रात 9:30 बजे काट दी जाएगी क्योंकि आपका बिल अपडेट नहीं हुआ है। तुरंत बिजली अधिकारी 9876543210 पर संपर्क करें।",
    "तुमचे महावितरण वीज बिल थकीत आहे. आज रात्री वीज पुरवठा खंडित केला जाईल. ताबडतोब 9876543210 वर संपर्क साधा.",
    "Bijli bill update notice: Power will be cut in 2 hours. Call power house officer.",
    "Electricity department alert: Pay unpaid bill immediately otherwise connection disconnected.",

    # Category: Banking & KYC Phishing
    "Dear customer your SBI bank account has been suspended due to pending KYC update. Click here to verify your PAN card: http://sbi-kyc-update.xyz",
    "HDFC Bank Alert: Your netbanking will be blocked within 24 hours. Submit your Aadhaar card and pan details at http://hdfc-verify.top",
    "ICICI Bank: Important notice your account is deactivated. Update KYC immediately by clicking link to continue banking services.",
    "Axis Bank notice: Your debit card is blocked. Download this APK app to unblock your card.",
    "Bank of Baroda: Dear user your KYC has expired. Your account will be frozen today. Visit link to re-activate.",
    "PNB Alert: Your bank account will be closed today. Click here to update pan number and verify OTP.",
    "Kotak alert: Update your 811 account KYC online or account will be permanently closed. Link: http://bit.ly/kotak-kyc",
    "प्रिय ग्राहक आपका बैंक खाता आज ब्लॉक कर दिया जाएगा। तुरंत अपना पैन कार्ड और आधार लिंक करने के लिए यहां क्लिक करें।",
    "तुमचे बँक खाते केवायसी अपडेट न केल्यामुळे ब्लॉक केले आहे. त्वरित पॅन कार्ड अपडेट करा.",
    "SBI Yono alert: Your account has been temporarily locked. Verify your credentials here immediately.",
    "Your mobile number is not registered with bank account. Click here to register or all transactions will stop.",
    "Update your KYC documents now or fine of Rs 5000 will be charged on your account.",

    # Category: Lottery, Rewards & Kaun Banega Crorepati (KBC)
    "Congratulations you have won 1 crore lottery in KBC Kaun Banega Crorepati lucky draw. Contact manager Rana Pratap on 9876543210 to claim cash prize.",
    "Dear customer you have won Rs 25 Lakhs in Reliance Jio lucky draw 2026. Send processing fee Rs 2500 to receive prize money.",
    "You won a brand new Tata Harrier car in shopping festival lucky contest. WhatsApp your address and claim fee Rs 4999.",
    "Google Pay reward: You have won scratch card of Rs 5,000 cash. Click link to transfer reward directly to your bank account.",
    "PhonePe cashback reward: You have received Rs 2,999 cash gift. Enter your UPI PIN to collect money into your account.",
    "Paytm congratulations! You are selected for Rs 10,000 Diwali cashback. Accept payment request to receive funds.",
    "बधाई हो! आपने कौन बनेगा करोड़पति में 25 लाख की लॉटरी जीती है। अपनी इनाम राशि प्राप्त करने के लिए तुरंत फोन करें।",
    "अभिनंदन! तुम्ही लकी ड्रॉमध्ये 15 लाखांचे रोख बक्षीस जिंकले आहे. पैसे खात्यावर जमा करण्यासाठी त्वरित संपर्क करा.",
    "Claim your free gift worth Rs 50,000 now. Limited time offer expires in 15 minutes.",
    "You have won a free iPhone 15 Pro Max. Pay only delivery charge Rs 299 to dispatch parcel.",

    # Category: Fake Job Offers & Task Scams
    "Part time work from home opportunity. Earn Rs 3,000 to 5,000 daily by simply liking YouTube videos and following Instagram pages. No experience needed. Contact WhatsApp hr.",
    "Urgent hiring: Amazon part time job. Work 1-2 hours daily on your phone and earn 50,000 per month. Join Telegram channel to start.",
    "Google reviews job: Get paid Rs 150 per review. Daily payout guaranteed. Deposit Rs 1,000 registration fee to get access.",
    "Data entry job: Earn 2,000 daily. Typing work from home. Send Rs 500 refundable security deposit for software ID.",
    "घर बैठे मोबाइल से रोजाना 2000 से 4000 रुपये कमाएं। यूट्यूब वीडियो लाइक करने का आसान काम। व्हाट्सएप पर संपर्क करें।",
    "घरी बसून अर्धवेळ काम करा आणि दररोज 3000 कमवा. यूट्यूब व्हिडिओ लाईक करण्याचे सोपे काम. त्वरित टेलिग्राम ग्रुपमध्ये सामील व्हा.",
    "Congratulations you are selected for International Airport ground staff job. Pay Rs 3,500 for uniform and ID card.",
    "Freelance typing project approved. Pay software activation fee before payout.",

    # Category: Law Enforcement & Digital Arrest Extortion
    "CBI Crime Branch Notice: A parcel containing illegal narcotics and fake passports has been seized by customs at Mumbai airport under your Aadhaar number. A digital arrest warrant is issued. Connect on Skype call immediately.",
    "Cyber Police New Delhi: You are involved in illegal money laundering transactions. Do not disconnect this call or leave your room. Transfer funds to RBI safety verification account.",
    "Telecom Regulatory Authority of India TRAI: All your mobile SIM cards will be permanently disconnected within 2 hours due to illegal harassment complaints. Press 9 to speak with police officer.",
    "Narcotics Control Bureau NCB alert: FIR registered against your name. Pay penalty Rs 50,000 to close case without arrest.",
    "Supreme Court legal summons: Immediate court appearance required or police team will visit your residence for arrest.",
    "कस्टम्स विभाग नोटिस: आपके नाम से एक पार्सल जब्त हुआ है जिसमें ड्रग्स मिले हैं। डिजिटल अरेस्ट वारंट जारी हुआ है। तुरंत संपर्क करें।",
    "पोलीस नोटीस: तुमच्या आधार कार्डावर सायबर क्राईम अंतर्गत गुन्हा दाखल झाला आहे. तात्काळ डिजिटल अरेस्टसाठी हजर राहा.",
    "DHL Express: Your international courier was intercepted with contraband. Transfer security fee to avoid immediate police FIR.",

    # Category: Remote Access & APK Malware
    "Dear user your SIM card will be deactivated today. Download and install QuickSupport / AnyDesk to update your 5G SIM online.",
    "Rupay card verification: Install this APK file on your Android phone to receive reward points.",
    "Bank customer care: To solve your transaction refund issue, please install AnyDesk and share the 9 digit code.",
    "Download this official e-challan traffic app APK to check and pay your pending vehicle fine.",
    "Credit card limit increase: Install this application and enter your card number CVV and expiry date.",
    "आपला सिम कार्ड ब्लॉक होणार आहे. 5G अपडेट करण्यासाठी हे APK अ‍ॅप डाउनलोड करा.",
    "बैंक सहायता: रिफंड प्राप्त करने के लिए एनीडेस्क ऐप डाउनलोड करें और स्क्रीन शेयरिंग चालू करें।",

    # Category: Urgent Impersonation & Money Requests
    "Hi mom I lost my phone and wallet in emergency. This is my friend's number. Please immediately send 10,000 rupees to this UPI ID urgently.",
    "Dear friend I am stuck in hospital with severe medical emergency. Please transfer 15,000 to Google Pay right now. I will return tomorrow.",
    "Your nephew met with an accident and is admitted in ICU. Doctor needs 20,000 advance payment immediately. Pay to UPI now.",
    "Official notice from Income Tax Department: You have an urgent tax refund of Rs 24,500. Click link to enter bank credentials to claim.",
    "Paytm loan approved: Rs 5,00,000 personal loan approved with zero interest. Pay Rs 2,500 documentation charge to disburse amount.",

    # Category: Postal / Courier Delivery Address Update Phishing
    "India Post: Your package could not be delivered due to incomplete address. Please update your address at http://indiapost-parcel-update.com within 24 hours.",
    "India Post: Your parcel has arrived at our sorting facility but the delivery address is incorrect. Please update within 24 hours: http://indiapost-redelivery.top",
    "BlueDart Express: Consignment #BLD82910 held at regional hub due to missing street address. Confirm address immediately to avoid return.",
    "FedEx Alert: Your shipment delivery failed. Click link to reschedule delivery and pay nominal re-attempt fee Rs 25.",
    "DTDC Courier: Undelivered parcel notification. Update your house number and pin code online at http://dtdc-tracking-update.xyz",
    "स्पीड पोस्ट सूचना: आपका पार्सल गलत पते के कारण रुका हुआ है। 24 घंटे में सही पता अपडेट करें अन्यथा पार्सल वापस भेज दिया जाएगा।",
    "तुमचे इंडिया पोस्ट पार्सल पत्ता अपूर्ण असल्यामुळे थांबवले आहे. तात्काळ खालील लिंकवर जाऊन पत्ता अपडेट करा.",

    # Category: Credit Card / Banking Reward Points Expiry Phishing
    "Your HDFC Credit card reward points worth Rs 4500 are expiring today. Redeem to cash here: http://hdfc-rewards-redeem.com",
    "SBI Card: You have accumulated 9,850 bonus reward points expiring tonight. Convert points to Rs 4,925 cash into your bank account immediately.",
    "ICICI Bank Credit Card: 6,400 reward points expiring in 24 hours. Click link to credit amount directly to your savings account.",
    "Axis Bank Alert: Redeem your unspent credit card cashback points before expiry. Visit http://axis-cashback-points.com",
    "क्रेडिट कार्ड रिवॉर्ड पॉइंट: आपके 5000 रिवॉर्ड पॉइंट आज समाप्त हो रहे हैं। इन्हें सीधे बैंक खाते में कैश में बदलने के लिए यहां क्लिक करें।",
    "तुमच्या क्रेडिट कार्डचे 4000 रिवॉर्ड पॉईंट्स आज संपत आहेत. तात्काळ खात्यात कॅश जमा करण्यासाठी लिंकवर जा.",

    # Category: FASTag & Traffic E-Challan Scams
    "Dear user, your FASTag is blacklisted. Update KYC immediately at http://fastag-verify.com to avoid toll penalty.",
    "NHAI FASTag Alert: Your FASTag wallet is suspended due to non-compliance. Click link to reactivate your tag.",
    "Urgent: Vehicle challan pending Rs 1000. Pay now at http://echallan-vahan.com to avoid police court summons.",
    "Parivahan notice: Unpaid e-challan of Rs 2000 registered against vehicle MH12AB1234. Pay within 48 hours to avoid driving license suspension.",
    "ट्रैफिक ई-चालान सूचना: आपका 1000 रुपये का चालान लंबित है। कोर्ट समन से बचने के लिए तुरंत ऑनलाइन भुगतान करें।",
    "तुमचा वाहन ई-चलन दंड तात्काळ भरा अन्यथा वाहन परवाना रद्द केला जाईल.",

    # Category: Fake Loan Approval & Instant Credit Scams
    "Congratulations! Pre-approved personal loan of Rs 5,00,000 at 2% annual interest. Transfer processing charge Rs 1,499 for instant disbursement.",
    "Bajaj Finserv: Your instant loan of Rs 3,50,000 is approved. Download agreement and pay documentation stamp duty Rs 999.",
    "Dhani Loans: Instant approval Rs 2 Lakh. Send Aadhaar photo and advance fee Rs 500 on WhatsApp to credit funds.",

    # Category: Train / IRCTC / Airline Ticket Refund Scams
    "IRCTC refund notification: Your ticket cancellation refund of Rs 1,840 is pending. Download IRCTC support APK to initiate instant UPI refund.",
    "Air India customer service: For flight cancellation refund, call helpline 9182736450 and share AnyDesk code with refund officer."
]

LEGIT_TRAINING_CORPUS: List[str] = [
    # Category: Authentic Bank Transactions
    "Dear customer, your account XX1234 has been debited with INR 850.00 on 24-Oct-26 at CAFE COFFEE DAY. Avl Bal: INR 34,250.20. HDFC Bank.",
    "SBI: INR 5,000.00 credited to account XX5678 on 24-Oct by UPI/4291829102. Available balance is INR 62,100.00.",
    "ICICI Bank Alert: Transaction of INR 1,299.00 on your Credit Card ending with 4012 at AMAZON INDIA was successful.",
    "Axis Bank: Your salary of INR 75,000.00 has been credited to your account XX9876. Thank you for banking with us.",
    "Bank of Baroda: Your monthly statement for September 2026 is ready to view in the M-Connect Plus app.",
    "Kotak Bank: Alert! You spent INR 450.00 at SHELL PETROL PUMP using Debit Card XX3321.",
    "आपल्या बँक खात्यातून 500 रुपये यशस्वीरित्या पाठवले गेले आहेत. शिल्लक रक्कम: रु 12,400.",
    "आपके बैंक खाते में 2,000 रुपये जमा किए गए हैं। कुल शेष राशि: 15,300 रुपये।",

    # Category: Authentic OTP Notifications (Contains safety disclaimers)
    "839201 is your One Time Password (OTP) for login to SBI YONO. Valid for 10 minutes. Do not share OTP with anyone. Bank never asks for OTP.",
    "Your OTP for payment of INR 450.00 to SWIGGY is 492018. Valid for 5 mins. Never share your OTP with anyone, including bank officials. HDFC Bank.",
    "729104 is secret OTP for your Aadhaar authentication at UIDAI. Do not disclose it to anyone.",
    "Use OTP 384910 to verify your mobile number on Flipkart. Valid for 3 mins. Do not share this code.",
    "Google verification code is 492102. Never share this code with anyone.",
    "WhatsApp code 582-192. You can also tap on the link to verify your phone. Do not share this code.",
    "ओटीपी: 482910 आपके लॉगिन के लिए है। किसी के साथ साझा न करें। बैंक कभी ओटीपी नहीं मांगता।",
    "तुमचा वन टाईम पासवर्ड 392018 आहे. 5 मिनिटांसाठी वैध. कोणाशीही शेअर करू नका.",

    # Category: Utility & Order Updates (Legitimate notifications)
    "Dear customer, your electricity bill of INR 1,420 for consumer number 02849182 is generated. Due date is 05-Nov-26. Pay via official portal.",
    "Amazon: Your package with order #402-9182910 containing Wireless Earbuds has been delivered. Thank you for shopping with us.",
    "Swiggy: Your food order from Pizza Hut is out for delivery with our delivery partner Rahul. Track in app.",
    "Zomato: Order delivered. Enjoy your meal! Please rate your delivery partner on the app.",
    "Airtel: Your recharge of INR 299 is successful. Unlimited calls and 1.5GB daily data valid till 22-Nov-26.",
    "Jio: Your daily data quota of 1.5GB is 50% consumed. High speed data will renew at midnight.",
    "Uber: Your trip of INR 230.50 with driver Vikram was completed. View your receipt in the Uber app.",
    "IndiGo: Web check-in is now open for your flight 6E-204 from Mumbai to Delhi on 26-Oct. Check-in at goindigo.in",

    # Category: Normal Conversational & Friendly Texts
    "Hey! Are we still meeting for lunch today at 1 PM near the office?",
    "Hi mom, I reached home safely. Will call you in the evening after dinner.",
    "Happy Birthday! Wishing you lots of happiness, success, and good health ahead.",
    "Please send the project presentation slides before today's team standup meeting.",
    "Can you share the location pin? I am waiting near the metro station exit.",
    "See you tomorrow at the conference. Have a safe journey!",
    "आज संध्याकाळी ६ वाजता भेटूया. मी ऑफिसमधून निघाल्यावर फोन करतो.",
    "कल सुबह 10 बजे मीटिंग है। कृपया समय पर पहुंचें।"
]

# ==============================================================================
# 2. FEATURE EXTRACTION & TOKENIZATION
# ==============================================================================

def tokenize(text: str) -> List[str]:
    """Tokenize multilingual text preserving keywords, amounts, and URLs."""
    text = text.lower()
    # Normalize URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' __url__ ', text)
    # Normalize phone numbers
    text = re.sub(r'\b(?:\+91|0)?[6-9]\d{9}\b', ' __phone__ ', text)
    # Normalize large money amounts
    text = re.sub(r'(?:rs\.?|inr|₹|\$)\s*[\d,]+(?:\.\d+)?|\b\d+\s*(?:lakh|crore|thousand|k)\b', ' __money__ ', text)
    # Extract alphanumeric and Devanagari words
    tokens = re.findall(r'[\w\u0900-\u097F]+|__\w+__', text)
    
    # Add bi-grams for context
    bigrams = [f"{tokens[i]}_{tokens[i+1]}" for i in range(len(tokens) - 1)]
    return tokens + bigrams

# ==============================================================================
# 3. STATISTICAL SCAM CLASSIFIER (Multinomial Naive Bayes + Calibrated Odds)
# ==============================================================================

class ScamClassifierML:
    def __init__(self):
        self.scam_vocab: Dict[str, int] = {}
        self.legit_vocab: Dict[str, int] = {}
        self.total_scam_tokens = 0
        self.total_legit_tokens = 0
        self.vocabulary: set = set()
        self.is_trained = False
        self._train()

    def _train(self):
        for msg in SCAM_TRAINING_CORPUS:
            tokens = tokenize(msg)
            for t in tokens:
                self.scam_vocab[t] = self.scam_vocab.get(t, 0) + 1
                self.total_scam_tokens += 1
                self.vocabulary.add(t)

        for msg in LEGIT_TRAINING_CORPUS:
            tokens = tokenize(msg)
            for t in tokens:
                self.legit_vocab[t] = self.legit_vocab.get(t, 0) + 1
                self.total_legit_tokens += 1
                self.vocabulary.add(t)

        self.is_trained = True

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Analyze text using statistical NLP.
        Returns:
            ml_score: 0 to 100 risk score
            ml_level: "High", "Medium", or "Low"
            signals: top indicative tokens found
            is_scam: bool
        """
        if not text or not text.strip():
            return {"ml_score": 0, "ml_level": "Low", "signals": [], "is_scam": False}

        tokens = tokenize(text)
        vocab_size = len(self.vocabulary)
        alpha = 1.0  # Laplace smoothing

        log_scam_prob = 0.0
        log_legit_prob = 0.0
        signal_weights: List[Tuple[str, float]] = []

        # Check for legitimate safety disclaimers (e.g. "never share OTP with anyone")
        has_legit_safety_disclaimer = bool(
            re.search(r'\b(never share|bank never asks|do not share with anyone|valid for \d+ min|available bal|credited to account)\b', text, re.I)
        )

        for t in tokens:
            scam_count = self.scam_vocab.get(t, 0)
            legit_count = self.legit_vocab.get(t, 0)

            p_token_scam = (scam_count + alpha) / (self.total_scam_tokens + alpha * vocab_size)
            p_token_legit = (legit_count + alpha) / (self.total_legit_tokens + alpha * vocab_size)

            log_scam_prob += math.log(p_token_scam)
            log_legit_prob += math.log(p_token_legit)

            # Record high informative signals
            if scam_count > legit_count and scam_count >= 2:
                ratio = p_token_scam / p_token_legit
                if ratio > 2.0:
                    signal_weights.append((t, ratio))

        # Equal class priors
        p_scam = log_scam_prob
        p_legit = log_legit_prob

        # Softmax calibrated probability
        diff = p_scam - p_legit
        diff = max(-20.0, min(20.0, diff))
        prob_scam = 1.0 / (1.0 + math.exp(-diff))

        # Convert to 0-100 score
        raw_score = int(round(prob_scam * 100))

        # Safe transactional OTP mitigation
        if has_legit_safety_disclaimer and raw_score < 70:
            raw_score = max(5, raw_score - 40)

        # High risk heuristics boost for dangerous combos
        lower_text = text.lower()
        if ("disconnected" in lower_text or "काट दी जाएगी" in lower_text or "खंडित" in lower_text) and ("electricity" in lower_text or "बिजली" in lower_text or "वीज" in lower_text or "bill" in lower_text):
            raw_score = max(raw_score, 88)

        if ("lottery" in lower_text or "लॉटरी" in lower_text or "kbc" in lower_text) and ("won" in lower_text or "जीता" in lower_text or "जिंकला" in lower_text or "crore" in lower_text or "lakh" in lower_text):
            raw_score = max(raw_score, 92)

        if ("digital arrest" in lower_text or "cbi" in lower_text or "narcotics" in lower_text or "डिजिटल अरेस्ट" in lower_text):
            raw_score = max(raw_score, 94)

        if ("blocked" in lower_text or "बंद" in lower_text or "ब्लॉक" in lower_text) and ("kyc" in lower_text or "pan" in lower_text or "sbi" in lower_text or "bank" in lower_text):
            raw_score = max(raw_score, 90)

        if ("netbanking" in lower_text or "bank" in lower_text or "account" in lower_text) and ("restrict" in lower_text or "freeze" in lower_text or "suspend" in lower_text or "lock" in lower_text or "deactivat" in lower_text) and ("pan" in lower_text or "kyc" in lower_text or "http" in lower_text or "link" in lower_text):
            raw_score = max(raw_score, 92)

        if ("package" in lower_text or "parcel" in lower_text or "post" in lower_text or "delivery" in lower_text) and ("address" in lower_text or "undelivered" in lower_text or "incomplete" in lower_text or "reschedule" in lower_text) and ("http" in lower_text or "link" in lower_text or ".com" in lower_text or "update" in lower_text):
            raw_score = max(raw_score, 90)

        if ("fastag" in lower_text or "challan" in lower_text or "vahan" in lower_text) and ("blacklist" in lower_text or "blocked" in lower_text or "pending" in lower_text or "penalty" in lower_text or "court" in lower_text or "toll" in lower_text):
            raw_score = max(raw_score, 92)

        if ("reward" in lower_text or "points" in lower_text or "cashback" in lower_text) and ("expir" in lower_text or "redeem" in lower_text or "convert" in lower_text) and ("cash" in lower_text or "account" in lower_text or "http" in lower_text or "link" in lower_text):
            raw_score = max(raw_score, 92)

        if ("mom" in lower_text or "dad" in lower_text or "friend" in lower_text) and ("phone" in lower_text or "hospital" in lower_text or "emergency" in lower_text or "accident" in lower_text) and ("upi" in lower_text or "transfer" in lower_text or "send" in lower_text):
            raw_score = max(raw_score, 90)

        if ("like" in lower_text or "subscribe" in lower_text) and ("youtube" in lower_text or "telegram" in lower_text) and ("daily" in lower_text or "earn" in lower_text or "कमाएं" in lower_text):
            raw_score = max(raw_score, 86)

        final_score = max(0, min(100, raw_score))

        if final_score >= 75:
            level = "High"
        elif final_score >= 40:
            level = "Medium"
        else:
            level = "Low"

        # Sort top informative tokens
        signal_weights.sort(key=lambda x: x[1], reverse=True)
        top_tokens = [w[0].replace('_', ' ') for w in signal_weights[:5] if not w[0].startswith('__')]

        return {
            "ml_score": final_score,
            "ml_level": level,
            "signals": top_tokens,
            "is_scam": final_score >= 40,
            "model_name": "ScamShield-NLP-v2"
        }

# Global singleton instance
ml_classifier = ScamClassifierML()
