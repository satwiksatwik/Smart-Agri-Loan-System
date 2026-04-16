const Loan = require("../models/Loan");
const knowledgeBase = require("../services/knowledgeBase");

// Intent patterns (work across languages via keyword matching)
const intentPatterns = {
  greeting: { en: ["hello","hi","hey","good morning","good evening","how are you","what's up"], te: ["నమస్కారం","హలో","హాయ్","ఎలా ఉన్నారు"], hi: ["नमस्ते","हैलो","हाय","कैसे हो","कैसे हैं"], ta: ["வணக்கம்","ஹலோ","ஹாய்"], kn: ["ನಮಸ್ಕಾರ","ಹಲೋ","ಹಾಯ್"] },
  capabilities: { en: ["what can you do","help me","what do you do","features","capabilities"], te: ["ఏం చేయగలవు","సహాయం","ఏమి చేస్తావు"], hi: ["क्या कर सकते","मदद","क्या करते हो"], ta: ["என்ன செய்ய","உதவி"], kn: ["ಏನು ಮಾಡಬಲ್ಲೆ","ಸಹಾಯ"] },
  loanApply: { en: ["how to apply","apply loan","apply for loan","loan application","want loan","need loan","get loan"], te: ["రుణం ఎలా","దరఖాస్తు ఎలా","రుణం కావాలి"], hi: ["ऋण कैसे","आवेदन कैसे","लोन चाहिए","कर्ज"], ta: ["கடன் எப்படி","விண்ணப்பம் எப்படி","கடன் வேண்டும்"], kn: ["ಸಾಲ ಹೇಗೆ","ಅರ್ಜಿ ಹೇಗೆ","ಸಾಲ ಬೇಕು"] },
  loanStatus: { en: ["loan status","my loan","my application","check status","what is my loan","show loan"], te: ["రుణ స్థితి","నా రుణం","దరఖాస్తు ఏమైంది"], hi: ["ऋण स्थिति","मेरा ऋण","मेरा लोन","स्टेटस"], ta: ["கடன் நிலை","என் கடன்","நிலை என்ன"], kn: ["ಸಾಲ ಸ್ಥಿತಿ","ನನ್ನ ಸಾಲ"] },
  emiInfo: { en: ["emi","emi details","monthly payment","installment","emi schedule","repayment"], te: ["emi","నెలవారీ చెల్లింపు","వాయిదా"], hi: ["emi","मासिक किस्त","किस्त"], ta: ["emi","மாதாந்திர தவணை","தவணை"], kn: ["emi","ಮಾಸಿಕ ಕಂತು","ಕಂತು"] },
  emiCalculate: { en: ["calculate emi","emi calculator","how much emi","emi for"], te: ["emi లెక్కించు","emi ఎంత"], hi: ["emi गणना","emi कितना","emi निकालो"], ta: ["emi கணக்கிடு","emi எவ்வளவு"], kn: ["emi ಲೆಕ್ಕ","emi ಎಷ್ಟು"] },
  documents: { en: ["document","documents required","what documents","papers needed","upload"], te: ["పత్రాలు","ఏ పత్రాలు","డాక్యుమెంట్స్"], hi: ["दस्तावेज़","कौन से कागज़","डॉक्यूमेंट"], ta: ["ஆவணங்கள்","என்ன ஆவணங்கள்"], kn: ["ದಾಖಲೆಗಳು","ಯಾವ ದಾಖಲೆ"] },
  creditScore: { en: ["credit score","cibil","credit rating","score meaning"], te: ["క్రెడిట్ స్కోర్","సిబిల్"], hi: ["क्रेडिट स्कोर","सिबिल"], ta: ["கடன் மதிப்பெண்","கிரெடிட் ஸ்கோர்"], kn: ["ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್"] },
  interestRate: { en: ["interest rate","interest","rate of interest","what rate"], te: ["వడ్డీ రేటు","వడ్డీ ఎంత"], hi: ["ब्याज दर","ब्याज कितना"], ta: ["வட்டி விகிதம்","வட்டி எவ்வளவு"], kn: ["ಬಡ್ಡಿ ದರ","ಬಡ್ಡಿ ಎಷ್ಟು"] },
  eligibility: { en: ["eligible","eligibility","am i eligible","can i get","qualify"], te: ["అర్హత","అర్హతా","నాకు వస్తుందా"], hi: ["पात्रता","पात्र","मिलेगा क्या","योग्य"], ta: ["தகுதி","தகுதியா"], kn: ["ಅರ್ಹತೆ","ನನಗೆ ಸಿಗುತ್ತಾ"] },
  loanTypes: { en: ["loan types","types of loan","which loan","loan category"], te: ["రుణ రకాలు","ఏ రకం రుణాలు"], hi: ["ऋण प्रकार","कौन सा लोन","लोन के प्रकार"], ta: ["கடன் வகைகள்","எந்த கடன்"], kn: ["ಸಾಲ ವಿಧಗಳು","ಯಾವ ಸಾಲ"] },
  navApply: { en: ["where to apply","go to apply","start application"], te: ["ఎక్కడ దరఖాస్తు"], hi: ["कहाँ आवेदन","कैसे जाएं"], ta: ["எங்கே விண்ணப்பம்"], kn: ["ಎಲ್ಲಿ ಅರ್ಜಿ"] },
  navStatus: { en: ["where to check status","where is status","find status"], te: ["స్థితి ఎక్కడ"], hi: ["स्टेटस कहाँ"], ta: ["நிலை எங்கே"], kn: ["ಸ್ಥಿತಿ ಎಲ್ಲಿ"] },
  navEmi: { en: ["where is emi calculator","find calculator","open calculator"], te: ["కాలిక్యులేటర్ ఎక్కడ"], hi: ["कैलकुलेटर कहाँ"], ta: ["கால்குலேட்டர் எங்கே"], kn: ["ಕ್ಯಾಲ್ಕುಲೇಟರ್ ಎಲ್ಲಿ"] },
};

function detectIntent(message, lang) {
  const lower = message.toLowerCase();
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    const allPatterns = [...(patterns[lang] || []), ...(patterns.en || [])];
    for (const pattern of allPatterns) {
      if (lower.includes(pattern.toLowerCase())) return intent;
    }
  }
  return "fallback";
}

// Simple EMI extraction from message
function extractEMIParams(message) {
  const amountMatch = message.match(/(\d[\d,]*)\s*(lakh|lac|L)?/i);
  if (!amountMatch) return null;
  let amount = parseInt(amountMatch[1].replace(/,/g, ""));
  if (amountMatch[2] && /lakh|lac|l/i.test(amountMatch[2])) amount *= 100000;
  if (amount < 10000) amount *= 100000; // assume lakh if small number
  return { amount, rate: 8.5, tenure: 12 };
}

const handleMessage = async (req, res) => {
  try {
    const { message, language = "en", currentPage = "/" } = req.body;
    const lang = language || "en";
    const kb = knowledgeBase[lang] || knowledgeBase.en;
    const intent = detectIntent(message, lang);

    let response = "";

    switch (intent) {
      case "greeting":
        response = kb.greetingResponse;
        break;
      case "capabilities":
        response = kb.capabilities;
        break;
      case "loanApply":
        response = kb.loanProcess;
        break;
      case "documents":
        response = kb.documents;
        break;
      case "creditScore":
        response = kb.creditScore;
        break;
      case "interestRate":
        response = kb.interestRate;
        break;
      case "emiInfo":
        response = kb.emiExplanation;
        break;
      case "eligibility":
        response = kb.eligibility;
        break;
      case "loanTypes":
        response = kb.loanTypes;
        break;
      case "navApply":
        response = kb.navigation.apply;
        break;
      case "navStatus":
        response = kb.navigation.status;
        break;
      case "navEmi":
        response = kb.navigation.emi;
        break;

      case "emiCalculate": {
        const params = extractEMIParams(message);
        if (params) {
          const { amount, rate, tenure } = params;
          const r = rate / 12 / 100;
          const emi = amount * r * Math.pow(1 + r, tenure) / (Math.pow(1 + r, tenure) - 1);
          const total = Math.round(emi) * tenure;
          response = `${kb.emiExplanation}\n\n📊 **₹${amount.toLocaleString()}** @ ${rate}% for ${tenure} months:\n💰 Monthly EMI: ₹${Math.round(emi).toLocaleString()}\n💵 Total Payment: ₹${total.toLocaleString()}\n📈 Total Interest: ₹${(total - amount).toLocaleString()}`;
        } else {
          response = kb.emiExplanation;
        }
        break;
      }

      case "loanStatus": {
        if (req.user) {
          try {
            const loans = await Loan.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(3);
            if (loans.length > 0) {
              response = loans.map((loan) =>
                kb.loanStatusResponse
                  .replace("{{applicationNumber}}", loan.applicationNumber)
                  .replace("{{amount}}", (loan.approvedAmount || loan.loanAmount).toLocaleString())
                  .replace("{{status}}", loan.status)
              ).join("\n\n");
            } else {
              response = kb.noLoans;
            }
          } catch (err) {
            response = kb.navigation.status;
          }
        } else {
          response = kb.navigation.status;
        }
        break;
      }

      default:
        // Contextual help based on current page
        if (currentPage.includes("loan-apply")) {
          response = kb.loanProcess;
        } else if (currentPage.includes("loan-status")) {
          response = kb.navigation.status;
        } else {
          response = kb.fallback;
        }
    }

    res.json({ response, intent, language: lang });
  } catch (error) {
    console.error("Chatbot error:", error);
    const kb = knowledgeBase[req.body?.language] || knowledgeBase.en;
    res.json({ response: kb.fallback, intent: "error", language: req.body?.language || "en" });
  }
};

module.exports = { handleMessage };
