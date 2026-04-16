const knowledgeBase = {
  en: {
    greetings: ["hello", "hi", "hey", "good morning", "good evening", "how are you"],
    greetingResponse: "Hello! 👋 I'm your Agri-Loan Assistant. How can I help you today?",
    capabilities: "I can help you with:\n• Loan application process\n• EMI calculations\n• Document requirements\n• Loan status\n• Credit score info\n• Interest rates\n\nJust ask me anything!",
    loanProcess: "To apply for a loan:\n1️⃣ Register with your email & verify OTP\n2️⃣ Go to 'Apply for Loan'\n3️⃣ Fill personal, financial & land details\n4️⃣ Upload documents (Aadhaar, PAN, Income Certificate, Adangal, Photo, Soil Health Card)\n5️⃣ Submit — our AI will assess your application\n6️⃣ Bank manager reviews and approves",
    documents: "Documents required:\n📄 Aadhaar Card\n📄 PAN Card\n📄 Income Certificate\n📄 Adangal (Land Record)\n📄 Passport Photo\n📄 Soil Health Card\n\nAll files should be JPG, PNG or PDF, under 5MB each.",
    creditScore: "Credit Score is a number (300-900) showing your creditworthiness.\n• 750+ = Excellent\n• 650-750 = Good\n• 500-650 = Average\n• Below 500 = Poor\n\nHigher score = better chance of approval & lower interest rate.",
    interestRate: "Interest rates depend on your risk profile:\n• Low Risk: 7.0% - 8.0%\n• Medium Risk: 9.5%\n• High Risk: 11.5%\n\nThe AI model suggests a rate based on your credit score, income, and land details.",
    emiExplanation: "EMI (Equated Monthly Installment) is your monthly loan payment.\n\nFormula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)\nWhere P = loan amount, r = monthly interest rate, n = number of months.\n\nYou can use our EMI Calculator to see exact amounts!",
    eligibility: "Loan eligibility depends on:\n• Age (18-65 years)\n• Annual income\n• Credit score\n• Land ownership\n• Existing loans\n• Soil quality\n\nApply and our AI will instantly assess your eligibility!",
    loanTypes: "We offer:\n🌾 Crop Loan\n🚜 Farm Equipment Loan\n🏗️ Land Development Loan\n🐄 Dairy Farming Loan\n🌿 Horticulture Loan\n💧 Irrigation Loan",
    navigation: {
      apply: "Go to Dashboard → Click 'Apply for Loan' to start your application.",
      status: "Go to 'My Loans' in the menu to check your loan status.",
      emi: "Go to 'EMI Calculator' in the menu to calculate your EMI.",
      profile: "Go to 'Profile' in the menu to update your details.",
      repayment: "Go to 'My Loans' → Click on an approved loan to see the repayment schedule."
    },
    fallback: "I'm not sure I understood that. Could you try asking in a different way? I can help with loans, EMI, documents, and credit scores.",
    loanStatusResponse: "Your loan details:\n📋 Application: {{applicationNumber}}\n💰 Amount: ₹{{amount}}\n📊 Status: {{status}}",
    noLoans: "You don't have any loan applications yet. Would you like to apply for one?"
  },
  te: {
    greetings: ["నమస్కారం", "హలో", "హాయ్", "శుభోదయం", "శుభ సాయంత్రం", "ఎలా ఉన్నారు"],
    greetingResponse: "నమస్కారం! 👋 నేను మీ వ్యవసాయ రుణ సహాయకుడిని. ఈ రోజు నేను మీకు ఎలా సహాయం చేయగలను?",
    capabilities: "నేను మీకు ఈ విషయాలలో సహాయం చేయగలను:\n• రుణ దరఖాస్తు ప్రక్రియ\n• EMI లెక్కింపులు\n• పత్రాల అవసరాలు\n• రుణ స్థితి\n• క్రెడిట్ స్కోర్ సమాచారం\n\nఏదైనా అడగండి!",
    loanProcess: "రుణం కోసం దరఖాస్తు:\n1️⃣ ఇమెయిల్ & OTP తో రిజిస్టర్ చేయండి\n2️⃣ 'రుణం కోసం దరఖాస్తు' కు వెళ్ళండి\n3️⃣ వ్యక్తిగత, ఆర్థిక & భూమి వివరాలు నమోదు చేయండి\n4️⃣ పత్రాలు అప్‌లోడ్ చేయండి\n5️⃣ సమర్పించండి — AI మీ దరఖాస్తును మూల్యాంకనం చేస్తుంది\n6️⃣ బ్యాంక్ మేనేజర్ సమీక్షించి ఆమోదిస్తారు",
    documents: "అవసరమైన పత్రాలు:\n📄 ఆధార్ కార్డ్\n📄 PAN కార్డ్\n📄 ఆదాయ ధృవీకరణ పత్రం\n📄 అడంగల్ (భూ రికార్డు)\n📄 పాస్‌పోర్ట్ ఫోటో\n📄 నేల ఆరోగ్య కార్డ్",
    creditScore: "క్రెడిట్ స్కోర్ అనేది మీ ఆర్థిక విశ్వసనీయతను చూపే సంఖ్య (300-900).\n• 750+ = అద్భుతం\n• 650-750 = మంచి\n• 500-650 = సగటు\n• 500 కంటే తక్కువ = తక్కువ",
    interestRate: "వడ్డీ రేట్లు మీ రిస్క్ ప్రొఫైల్ పై ఆధారపడి ఉంటాయి:\n• తక్కువ రిస్క్: 7.0% - 8.0%\n• మధ్యస్థ రిస్క్: 9.5%\n• అధిక రిస్క్: 11.5%",
    emiExplanation: "EMI అంటే సమాన నెలవారీ వాయిదా. ఇది మీరు ప్రతి నెల చెల్లించే మొత్తం.\n\nEMI కాలిక్యులేటర్ ఉపయోగించి ఖచ్చితమైన మొత్తాలను చూడండి!",
    eligibility: "రుణ అర్హత ఆధారాలు:\n• వయస్సు (18-65 సంవత్సరాలు)\n• వార్షిక ఆదాయం\n• క్రెడిట్ స్కోర్\n• భూమి యాజమాన్యం\n• ఉన్న రుణాలు\n• నేల నాణ్యత",
    loanTypes: "మేము అందించే రుణాలు:\n🌾 పంట రుణం\n🚜 వ్యవసాయ పరికరాల రుణం\n🏗️ భూమి అభివృద్ధి రుణం\n🐄 పాడి పరిశ్రమ రుణం\n🌿 ఉద్యానవన రుణం\n💧 నీటిపారుదల రుణం",
    navigation: {
      apply: "డ్యాష్‌బోర్డ్ కు వెళ్ళి → 'రుణం కోసం దరఖాస్తు' క్లిక్ చేయండి.",
      status: "మెనూలో 'నా రుణాలు' కు వెళ్ళి మీ రుణ స్థితిని చూడండి.",
      emi: "మెనూలో 'EMI కాలిక్యులేటర్' కు వెళ్ళండి.",
      profile: "మెనూలో 'ప్రొఫైల్' కు వెళ్ళి మీ వివరాలను అప్‌డేట్ చేయండి.",
      repayment: "'నా రుణాలు' కు వెళ్ళి → ఆమోదించిన రుణంపై క్లిక్ చేసి చెల్లింపు షెడ్యూల్ చూడండి."
    },
    fallback: "క్షమించండి, నేను అర్థం చేసుకోలేదు. దయచేసి వేరే విధంగా అడగగలరా?",
    loanStatusResponse: "మీ రుణ వివరాలు:\n📋 దరఖాస్తు: {{applicationNumber}}\n💰 మొత్తం: ₹{{amount}}\n📊 స్థితి: {{status}}",
    noLoans: "మీకు ఇంకా రుణ దరఖాస్తులు లేవు. ఒకటి దరఖాస్తు చేయాలనుకుంటున్నారా?"
  },
  hi: {
    greetings: ["नमस्ते", "हैलो", "हाय", "सुप्रभात", "शुभ संध्या", "कैसे हो"],
    greetingResponse: "नमस्ते! 👋 मैं आपका कृषि ऋण सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
    capabilities: "मैं इन विषयों में मदद कर सकता हूँ:\n• ऋण आवेदन प्रक्रिया\n• EMI गणना\n• दस्तावेज़ आवश्यकताएं\n• ऋण स्थिति\n• क्रेडिट स्कोर जानकारी\n\nकुछ भी पूछें!",
    loanProcess: "ऋण के लिए आवेदन:\n1️⃣ ईमेल और OTP से रजिस्टर करें\n2️⃣ 'ऋण के लिए आवेदन' पर जाएं\n3️⃣ व्यक्तिगत, वित्तीय और भूमि विवरण भरें\n4️⃣ दस्तावेज़ अपलोड करें\n5️⃣ जमा करें — AI मूल्यांकन करेगा\n6️⃣ बैंक मैनेजर समीक्षा और अनुमोदन करेंगे",
    documents: "आवश्यक दस्तावेज़:\n📄 आधार कार्ड\n📄 PAN कार्ड\n📄 आय प्रमाण पत्र\n📄 अदंगल (भू-अभिलेख)\n📄 पासपोर्ट फोटो\n📄 मृदा स्वास्थ्य कार्ड",
    creditScore: "क्रेडिट स्कोर (300-900) आपकी वित्तीय विश्वसनीयता दर्शाता है।\n• 750+ = उत्कृष्ट\n• 650-750 = अच्छा\n• 500-650 = औसत\n• 500 से कम = कमज़ोर",
    interestRate: "ब्याज दरें जोखिम प्रोफ़ाइल पर आधारित:\n• कम जोखिम: 7.0% - 8.0%\n• मध्यम जोखिम: 9.5%\n• उच्च जोखिम: 11.5%",
    emiExplanation: "EMI यानी समान मासिक किस्त। यह आपका हर महीने का भुगतान है।\n\nEMI कैलकुलेटर का उपयोग करके सटीक राशि जानें!",
    eligibility: "ऋण पात्रता:\n• उम्र (18-65 वर्ष)\n• वार्षिक आय\n• क्रेडिट स्कोर\n• भूमि स्वामित्व\n• मौजूदा ऋण\n• मिट्टी की गुणवत्ता",
    loanTypes: "उपलब्ध ऋण:\n🌾 फसल ऋण\n🚜 कृषि उपकरण ऋण\n🏗️ भूमि विकास ऋण\n🐄 डेयरी फ़ार्मिंग ऋण\n🌿 बागवानी ऋण\n💧 सिंचाई ऋण",
    navigation: {
      apply: "डैशबोर्ड → 'ऋण के लिए आवेदन' पर क्लिक करें।",
      status: "मेनू में 'मेरे ऋण' पर जाएं।",
      emi: "मेनू में 'EMI कैलकुलेटर' पर जाएं।",
      profile: "मेनू में 'प्रोफ़ाइल' पर जाएं।",
      repayment: "'मेरे ऋण' → स्वीकृत ऋण पर क्लिक करें।"
    },
    fallback: "क्षमा करें, मैं समझ नहीं पाया। कृपया दूसरे तरीके से पूछें?",
    loanStatusResponse: "आपके ऋण विवरण:\n📋 आवेदन: {{applicationNumber}}\n💰 राशि: ₹{{amount}}\n📊 स्थिति: {{status}}",
    noLoans: "आपके पास अभी कोई ऋण आवेदन नहीं है। क्या आप एक आवेदन करना चाहेंगे?"
  },
  ta: {
    greetings: ["வணக்கம்", "ஹலோ", "ஹாய்", "காலை வணக்கம்", "மாலை வணக்கம்"],
    greetingResponse: "வணக்கம்! 👋 நான் உங்கள் விவசாய கடன் உதவியாளர். இன்று நான் எப்படி உதவ முடியும்?",
    capabilities: "நான் இவற்றில் உதவ முடியும்:\n• கடன் விண்ணப்ப செயல்முறை\n• EMI கணக்கீடுகள்\n• ஆவண தேவைகள்\n• கடன் நிலை\n• கடன் மதிப்பெண் தகவல்\n\nஎதையும் கேளுங்கள்!",
    loanProcess: "கடன் விண்ணப்பம்:\n1️⃣ மின்னஞ்சல் & OTP மூலம் பதிவு செய்யுங்கள்\n2️⃣ 'கடன் விண்ணப்பம்' பக்கத்திற்குச் செல்லுங்கள்\n3️⃣ தனிப்பட்ட, நிதி & நில விவரங்களை நிரப்புங்கள்\n4️⃣ ஆவணங்களை பதிவேற்றுங்கள்\n5️⃣ சமர்ப்பிக்கவும்\n6️⃣ வங்கி மேலாளர் ஆய்வு செய்வார்",
    documents: "தேவையான ஆவணங்கள்:\n📄 ஆதார் அட்டை\n📄 PAN அட்டை\n📄 வருமான சான்றிதழ்\n📄 அடங்கல்\n📄 பாஸ்போர்ட் புகைப்படம்\n📄 மண் ஆரோக்கிய அட்டை",
    creditScore: "கடன் மதிப்பெண் (300-900):\n• 750+ = சிறப்பு\n• 650-750 = நல்லது\n• 500-650 = சராசரி\n• 500க்கு கீழ் = குறைவு",
    interestRate: "வட்டி விகிதங்கள்:\n• குறைந்த ஆபத்து: 7.0% - 8.0%\n• நடுத்தர ஆபத்து: 9.5%\n• அதிக ஆபத்து: 11.5%",
    emiExplanation: "EMI என்பது சம மாதாந்திர தவணை. இது நீங்கள் ஒவ்வொரு மாதமும் செலுத்தும் தொகை.\n\nEMI கால்குலேட்டரை பயன்படுத்தி சரியான தொகையை கணக்கிடுங்கள்!",
    eligibility: "கடன் தகுதி:\n• வயது (18-65)\n• ஆண்டு வருமானம்\n• கடன் மதிப்பெண்\n• நில உரிமை\n• இருக்கும் கடன்கள்\n• மண் தரம்",
    loanTypes: "கடன் வகைகள்:\n🌾 பயிர் கடன்\n🚜 விவசாய உபகரண கடன்\n🏗️ நிலம் மேம்பாட்டு கடன்\n🐄 பால் பண்ணை கடன்\n🌿 தோட்டக்கலை கடன்\n💧 நீர்ப்பாசன கடன்",
    navigation: { apply: "டாஷ்போர்டு → 'கடன் விண்ணப்பம்' கிளிக் செய்யுங்கள்.", status: "'எனது கடன்கள்' செல்லுங்கள்.", emi: "'EMI கால்குலேட்டர்' செல்லுங்கள்.", profile: "'சுயவிவரம்' செல்லுங்கள்.", repayment: "'எனது கடன்கள்' → ஒப்புதல் பெற்ற கடனை கிளிக் செய்யுங்கள்." },
    fallback: "மன்னிக்கவும், புரியவில்லை. வேறு விதமாக கேளுங்கள்?",
    loanStatusResponse: "கடன் விவரங்கள்:\n📋 விண்ணப்பம்: {{applicationNumber}}\n💰 தொகை: ₹{{amount}}\n📊 நிலை: {{status}}",
    noLoans: "உங்களிடம் கடன் விண்ணப்பங்கள் இல்லை. விண்ணப்பிக்க விரும்புகிறீர்களா?"
  },
  kn: {
    greetings: ["ನಮಸ್ಕಾರ", "ಹಲೋ", "ಹಾಯ್", "ಶುಭೋದಯ", "ಶುಭ ಸಂಜೆ"],
    greetingResponse: "ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಸಾಲ ಸಹಾಯಕ. ಇಂದು ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    capabilities: "ನಾನು ಇವುಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n• ಸಾಲ ಅರ್ಜಿ ಪ್ರಕ್ರಿಯೆ\n• EMI ಲೆಕ್ಕಾಚಾರ\n• ದಾಖಲೆ ಅವಶ್ಯಕತೆಗಳು\n• ಸಾಲ ಸ್ಥಿತಿ\n• ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್ ಮಾಹಿತಿ\n\nಏನನ್ನೂ ಕೇಳಿ!",
    loanProcess: "ಸಾಲಕ್ಕೆ ಅರ್ಜಿ:\n1️⃣ ಇಮೇಲ್ & OTP ಮೂಲಕ ನೋಂದಣಿ\n2️⃣ 'ಸಾಲಕ್ಕೆ ಅರ್ಜಿ' ಪುಟಕ್ಕೆ ಹೋಗಿ\n3️⃣ ವೈಯಕ್ತಿಕ, ಹಣಕಾಸು & ಭೂಮಿ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ\n4️⃣ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ\n5️⃣ ಸಲ್ಲಿಸಿ\n6️⃣ ಬ್ಯಾಂಕ್ ಮ್ಯಾನೇಜರ್ ಪರಿಶೀಲಿಸುತ್ತಾರೆ",
    documents: "ಅಗತ್ಯ ದಾಖಲೆಗಳು:\n📄 ಆಧಾರ್ ಕಾರ್ಡ್\n📄 PAN ಕಾರ್ಡ್\n📄 ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ\n📄 ಅಡಂಗಲ್\n📄 ಪಾಸ್‌ಪೋರ್ಟ್ ಫೋಟೋ\n📄 ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್",
    creditScore: "ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್ (300-900):\n• 750+ = ಅತ್ಯುತ್ತಮ\n• 650-750 = ಉತ್ತಮ\n• 500-650 = ಸಾಮಾನ್ಯ\n• 500 ಕ್ಕಿಂತ ಕಡಿಮೆ = ದುರ್ಬಲ",
    interestRate: "ಬಡ್ಡಿ ದರಗಳು:\n• ಕಡಿಮೆ ಅಪಾಯ: 7.0% - 8.0%\n• ಮಧ್ಯಮ ಅಪಾಯ: 9.5%\n• ಹೆಚ್ಚಿನ ಅಪಾಯ: 11.5%",
    emiExplanation: "EMI ಎಂದರೆ ಸಮಾನ ಮಾಸಿಕ ಕಂತು. ಇದು ಪ್ರತಿ ತಿಂಗಳು ನೀವು ಪಾವತಿಸುವ ಮೊತ್ತ.\n\nEMI ಕ್ಯಾಲ್ಕುಲೇಟರ್ ಬಳಸಿ ನಿಖರ ಮೊತ್ತ ತಿಳಿಯಿರಿ!",
    eligibility: "ಸಾಲ ಅರ್ಹತೆ:\n• ವಯಸ್ಸು (18-65)\n• ವಾರ್ಷಿಕ ಆದಾಯ\n• ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್\n• ಭೂಮಿ ಮಾಲೀಕತ್ವ\n• ಅಸ್ತಿತ್ವದ ಸಾಲಗಳು\n• ಮಣ್ಣಿನ ಗುಣಮಟ್ಟ",
    loanTypes: "ಸಾಲ ವಿಧಗಳು:\n🌾 ಬೆಳೆ ಸಾಲ\n🚜 ಕೃಷಿ ಉಪಕರಣ ಸಾಲ\n🏗️ ಭೂಮಿ ಅಭಿವೃದ್ಧಿ ಸಾಲ\n🐄 ಡೈರಿ ಫಾರ್ಮಿಂಗ್ ಸಾಲ\n🌿 ತೋಟಗಾರಿಕೆ ಸಾಲ\n💧 ನೀರಾವರಿ ಸಾಲ",
    navigation: { apply: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ → 'ಸಾಲಕ್ಕೆ ಅರ್ಜಿ' ಕ್ಲಿಕ್ ಮಾಡಿ.", status: "'ನನ್ನ ಸಾಲಗಳು' ಗೆ ಹೋಗಿ.", emi: "'EMI ಕ್ಯಾಲ್ಕುಲೇಟರ್' ಗೆ ಹೋಗಿ.", profile: "'ಪ್ರೊಫೈಲ್' ಗೆ ಹೋಗಿ.", repayment: "'ನನ್ನ ಸಾಲಗಳು' → ಅನುಮೋದಿತ ಸಾಲವನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ." },
    fallback: "ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ರೀತಿಯಲ್ಲಿ ಕೇಳಿ?",
    loanStatusResponse: "ಸಾಲ ವಿವರಗಳು:\n📋 ಅರ್ಜಿ: {{applicationNumber}}\n💰 ಮೊತ್ತ: ₹{{amount}}\n📊 ಸ್ಥಿತಿ: {{status}}",
    noLoans: "ನಿಮ್ಮ ಬಳಿ ಸಾಲ ಅರ್ಜಿಗಳಿಲ್ಲ. ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಬಯಸುವಿರಾ?"
  }
};

module.exports = knowledgeBase;
