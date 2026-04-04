import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import {
    ChevronRight,
    ChevronLeft,
    User,
    IndianRupee,
    Map,
    FileText,
    Tractor,
    Landmark,
    UploadCloud,
    CheckCircle,
    AlertCircle
} from "lucide-react";

const LoanApplication = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(true);
    const [checkingLoans, setCheckingLoans] = useState(true);
    const [maxLimitReached, setMaxLimitReached] = useState(false);
    const [overdueWarning, setOverdueWarning] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        age: "",
        mobile: "",
        aadhaarNumber: "",
        panNumber: "",
        annualIncome: "",
        existingLoans: "0",
        landSize: "",
        landLocation: "",
        soilHealthCardAvailable: "No",
        ph: "",
        nitrogen: "",
        phosphorus: "",
        potassium: "",
        soilType: "",
        cropYield: "",
        fallbackIrrigation: "",
        irrigation: "",
        ownership: "Owned",
        loanAmount: "",
        purpose: "",
        loanType: "Short_Term",
        tenure: "6",
        history: "First_Time",
    });

    const [files, setFiles] = useState({
        adangal: null,
        incomeCertificate: null,
        aadhaar: null,
        pan: null,
        photo: null,
        soilHealthCard: null
    });

    useEffect(() => {
        const checkUserDocsAndData = async () => {
            try {
                const { data } = await API.get("/auth/profile");
                const userDocs = data.user.documents || {};
                const hasdocs =
                    userDocs.adangal &&
                    userDocs.incomeCertificate &&
                    userDocs.aadhaar &&
                    userDocs.pan &&
                    userDocs.photo;
                setIsFirstTime(!hasdocs);

                const loansRes = await API.get("/loan/my-loans");
                const activeLoans = loansRes.data.filter(l => !["Completed", "Rejected", "COMPLETED", "REJECTED"].includes(l.status));
                if (activeLoans.length >= 2) {
                    setMaxLimitReached(true);
                }

                const alertsRes = await API.get("/emi/alerts");
                const hasOverdue = alertsRes.data.some(a => a.type === "overdue");
                if (hasOverdue) {
                    setOverdueWarning("Please clear pending EMIs before applying for a new loan. Your upcoming application may be rejected due to poor financial standing.");
                }

            } catch {
                setIsFirstTime(true);
            } finally {
                setCheckingLoans(false);
            }
        };
        checkUserDocsAndData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        if (selectedFiles && selectedFiles[0]) {
            setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
        }
    };

    const next = () => setStep((prev) => prev + 1);
    const back = () => setStep((prev) => prev - 1);

    const [reviewData, setReviewData] = useState(null);

    const handleSubmit = async () => {
        if (step < 6) {
            if (step === 5) {
                // Calculate Data for Review Step
                const calculateCreditScore = () => {
                    let score = 600;
                    const incomeBonus = Math.min(Math.floor((Number(formData.annualIncome) || 0) / 10000), 100);
                    score += incomeBonus;
                    const loanPenalty = (Number(formData.existingLoans) || 0) * 30;
                    score -= loanPenalty;
                    const landBonus = Math.min((Number(formData.landSize) || 0) * 10, 80);
                    score += landBonus;
                    if (formData.history === "Repeat") score += 50;
                    const soilBonus = (getDerivedSoilQuality(formData) || 0) * 5;
                    score += soilBonus;
                    const ageNum = Number(formData.age) || 0;
                    if (ageNum >= 35 && ageNum <= 55) score += 20;
                    else if (ageNum < 25 || ageNum > 65) score -= 20;
                    return Math.max(0, Math.min(900, Math.floor(score)));
                };

                const score = calculateCreditScore();
                const isLow = score < 600;
                const reasons = [];
                const positiveReasons = [];

                if (isLow) {
                    if (Number(formData.existingLoans) > 1) reasons.push("Multiple existing loans are active.");
                    if (Number(formData.annualIncome) < 50000) reasons.push("Annual income is below the ideal threshold.");
                    if (Number(formData.age) < 25) reasons.push("Applicant age is below the preferred stable range.");
                    if (formData.ownership === 'Leased') reasons.push("Leased land ownership carries higher risk.");
                    if (Number(formData.landSize) < 2) reasons.push("Land holdings are relatively small.");
                    if (reasons.length === 0) reasons.push("General credit risk assessment factors.");
                } else {
                    if (Number(formData.annualIncome) > 100000) positiveReasons.push("Strong annual income levels.");
                    if (Number(formData.existingLoans) === 0) positiveReasons.push("No existing debt burden.");
                    if (Number(formData.landSize) > 5) positiveReasons.push("Substantial agricultural land assets.");
                    if (formData.history === "Repeat") positiveReasons.push("Excellent past repayment behavior.");
                    if (getDerivedSoilQuality(formData) > 8) positiveReasons.push("High-quality land productivity potential.");
                    if (positiveReasons.length === 0) positiveReasons.push("Stable overall financial profile.");
                }

                // Simulate ML prediction for Review (matches backend math)
                const interestRate = isLow ? 12 : 8;
                const approvedAmount = Math.round(Number(formData.loanAmount) * (score / 900));
                const tenure = Number(formData.tenure) || 12;
                const totalMonthlyRate = (interestRate / 100) / 12;
                const numerator = approvedAmount * totalMonthlyRate * Math.pow(1 + totalMonthlyRate, tenure);
                const denominator = Math.pow(1 + totalMonthlyRate, tenure) - 1;
                const emi = Math.round(numerator / denominator);

                setReviewData({
                    score,
                    reasons: isLow ? reasons : positiveReasons,
                    isLow,
                    interestRate,
                    approvedAmount,
                    tenure,
                    emi
                });
            }
            next();
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'aadhaarNumber') data.append('aadhaar', formData[key]);
                else if (key === 'panNumber') data.append('pan', formData[key]);
                else data.append(key, formData[key]);
            });

            Object.keys(files).forEach(key => {
                if (files[key]) data.append(key, files[key]);
            });

            data.append('creditScore', reviewData.score);
            data.append('soilQuality', getDerivedSoilQuality(formData));
            
            data.append('soilHealthCardAvailable', formData.soilHealthCardAvailable === "Yes");
            if (formData.soilHealthCardAvailable === "Yes") {
                data.append('soilDetails', JSON.stringify({
                    ph: Number(formData.ph),
                    nitrogen: Number(formData.nitrogen),
                    phosphorus: Number(formData.phosphorus),
                    potassium: Number(formData.potassium)
                }));
            } else {
                data.append('fallbackSoilDetails', JSON.stringify({
                    soilType: formData.soilType,
                    cropYield: formData.cropYield,
                    irrigation: formData.fallbackIrrigation === "Yes"
                }));
            }

            await API.post("/loan/apply", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            navigate("/loan-status");
        } catch (error) {
            console.error("Submission error:", error);
            const msg = error.response?.data?.message || "Submission failed";
            const errors = error.response?.data?.errors?.map(e => e.msg).join(", ");
            alert(`${msg} ${errors ? ": " + errors : ""}`);
        }
        setLoading(false);
    };

    if (checkingLoans)
        return <div className="text-center py-20">Checking eligibility...</div>;

    if (maxLimitReached) {
        return (
            <div className="page-bg min-h-[calc(100vh-64px)] py-12 px-4 flex justify-center items-center animate-fadeIn">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-red-100">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={56} />
                    <h2 className="text-2xl font-black text-gray-800 mb-2">Maximum Loan Limit Reached</h2>
                    <p className="text-gray-600 mb-8 font-medium">
                        You already have 2 active loans. Please repay existing loans before applying for a new loan.
                    </p>
                    <button onClick={() => navigate("/dashboard")} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition shadow-md shadow-red-200">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const totalSteps = 6;

    return (
        <div className="page-bg min-h-[calc(100vh-64px)] py-12 px-4 animate-fadeIn">

            <div className="max-w-5xl mx-auto bg-white/90 
                            backdrop-blur-lg rounded-3xl shadow-2xl p-10">

                {/* HEADER */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-green-800 flex justify-center gap-2">
                        <Landmark className="text-yellow-600" />
                        Agricultural Loan Application
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Government Smart Farmer Finance Portal 🌾
                    </p>
                </div>

                {/* OVERDUE WARNING */}
                {overdueWarning && (
                    <div className="bg-red-50 border-l-[6px] border-red-500 p-5 mb-8 rounded-r-2xl flex items-start gap-3 shadow-sm transition-all hover:bg-red-100">
                        <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={24} />
                        <p className="text-red-900 font-bold">{overdueWarning}</p>
                    </div>
                )}

                {/* STEP PROGRESS */}
                <div className="flex justify-between mb-10 overflow-x-auto">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((num) => (
                        <div key={num}
                            className={`flex-1 text-center py-2 rounded-full mx-1 text-sm font-semibold whitespace-nowrap px-2
                                ${step >= num
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-200 text-gray-600"}`}>
                            Step {num}
                        </div>
                    ))}
                </div>

                {/* STEP 1 */}
                {step === 1 && (
                    <Section icon={<User />} title="Personal Information">
                        <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
                        <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
                        <Input label="Mobile" name="mobile" value={formData.mobile} onChange={handleChange} />
                        <Input label="Aadhaar Number" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} />
                        <Input label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} />
                    </Section>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <Section icon={<IndianRupee />} title="Financial Details">
                        <Input label="Annual Income" name="annualIncome" type="number" value={formData.annualIncome} onChange={handleChange} />
                        <Input label="Existing Loans" name="existingLoans" type="number" value={formData.existingLoans} onChange={handleChange} />
                    </Section>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <Section icon={<Map />} title="Land & Farming Details">
                        <Input label="Land Size (Acres)" name="landSize" type="number" value={formData.landSize} onChange={handleChange} />
                        <Select label="Land Location" name="landLocation" value={formData.landLocation} options={["Near_City", "Village", "Remote"]} onChange={handleChange} />
                        
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <Select label="Do you have a Soil Health Card?" name="soilHealthCardAvailable" value={formData.soilHealthCardAvailable} options={["Yes", "No"]} onChange={handleChange} />
                            
                            {formData.soilHealthCardAvailable === "Yes" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <Input label="Soil pH (0-14)" name="ph" type="number" step="0.1" min="0" max="14" value={formData.ph} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <Input label="Nitrogen (kg/ha)" name="nitrogen" type="number" min="0" value={formData.nitrogen} onChange={handleChange} />
                                        {formData.nitrogen && <div className="text-xs text-gray-500 mt-1">Classification: <span className="font-bold">{getNitrogenClass(formData.nitrogen)}</span></div>}
                                    </div>
                                    <div>
                                        <Input label="Phosphorus (kg/ha)" name="phosphorus" type="number" min="0" value={formData.phosphorus} onChange={handleChange} />
                                        {formData.phosphorus && <div className="text-xs text-gray-500 mt-1">Classification: <span className="font-bold">{getPhosphorusClass(formData.phosphorus)}</span></div>}
                                    </div>
                                    <div>
                                        <Input label="Potassium (kg/ha)" name="potassium" type="number" min="0" value={formData.potassium} onChange={handleChange} />
                                        {formData.potassium && <div className="text-xs text-gray-500 mt-1">Classification: <span className="font-bold">{getPotassiumClass(formData.potassium)}</span></div>}
                                    </div>
                                    <div className="md:col-span-2 mt-2">
                                        <FileInput label="Upload Soil Health Card (Optional)" name="soilHealthCard" onChange={handleFileChange} file={files.soilHealthCard} />
                                        <p className="text-xs text-gray-500 mt-1">Enter values exactly as mentioned in your Soil Health Card (kg/ha).</p>
                                    </div>
                                </div>
                            )}

                            {formData.soilHealthCardAvailable === "No" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <Select label="Soil Type" name="soilType" value={formData.soilType} options={["Sandy", "Clay", "Loamy", "Black_Soil"]} onChange={handleChange} />
                                    <Select label="Crop Yield (Last Season)" name="cropYield" value={formData.cropYield} options={["Low", "Medium", "High"]} onChange={handleChange} />
                                    <Select label="Irrigation Availability" name="fallbackIrrigation" value={formData.fallbackIrrigation} options={["Yes", "No"]} onChange={handleChange} />
                                </div>
                            )}
                        </div>

                        <Select label="Irrigation (Main Facility)" name="irrigation" value={formData.irrigation} options={["drip", "canal", "borewell", "rainfed"]} onChange={handleChange} />
                        <Select label="Ownership" name="ownership" value={formData.ownership} options={["Owned", "Leased"]} onChange={handleChange} />
                    </Section>
                )}

                {/* STEP 4: LOAN DETAILS (Swapped logic to keep documents last usually, but 4 was loan details) */}
                {step === 4 && (
                    <Section icon={<Tractor />} title="Loan Details">
                        <Input label="Requested Amount" name="loanAmount" type="number" value={formData.loanAmount} onChange={handleChange} />
                        <Select label="Purpose" name="purpose" value={formData.purpose} options={["Equipment_Purchase", "Seeds", "Irrigation", "Fertilizer", "Other"]} onChange={handleChange} />
                        <Select label="Loan Type" name="loanType" value={formData.loanType} options={["Short_Term", "Long_Term"]} onChange={(e) => { handleChange(e); setFormData(prev => ({ ...prev, tenure: e.target.value === "Short_Term" ? "6" : "24" })); }} />
                        <Select label="EMI Tenure (Months)" name="tenure" value={formData.tenure}
                            options={formData.loanType === "Short_Term"
                                ? ["3", "6", "9", "12"]
                                : ["12", "18", "24", "36", "48", "60"]
                            } onChange={handleChange} />
                        <Select label="Loan History" name="history" value={formData.history} options={["First_Time", "Repeat"]} onChange={handleChange} />
                    </Section>
                )}

                {/* STEP 5: DOCUMENTS (Only if First Time) */}
                {step === 5 && (
                    <Section icon={<UploadCloud />} title="Document Uploads">
                        <div className="col-span-1 md:col-span-2 text-sm text-yellow-700 bg-yellow-50 p-4 rounded-lg mb-4 flex items-start gap-2">
                            <AlertCircle size={20} />
                            <div>
                                <strong>First Time Applicant:</strong> KYC Documents are required.
                                <ul className="list-disc ml-5 mt-1">
                                    <li>Aadhaar Card, PAN Card</li>
                                    <li>Adangal (Land Record)</li>
                                    <li>Income Certificate</li>
                                    <li>Passport Size Photo</li>
                                </ul>
                            </div>
                        </div>

                        <FileInput label="Aadhaar Card" name="aadhaar" onChange={handleFileChange} file={files.aadhaar} />
                        <FileInput label="PAN Card" name="pan" onChange={handleFileChange} file={files.pan} />
                        <FileInput label="Adangal (Land Record)" name="adangal" onChange={handleFileChange} file={files.adangal} />
                        <FileInput label="Income Certificate" name="incomeCertificate" onChange={handleFileChange} file={files.incomeCertificate} />
                        <FileInput label="Passport Photo" name="photo" onChange={handleFileChange} file={files.photo} />
                    </Section>
                )}

                {/* STEP 6: PREMIUM REVIEW PAGE */}
                {step === 6 && reviewData && (
                    <div className="animate-fadeIn">
                        <div className="flex flex-col items-center mb-10">
                            {/* SCORE BADGE */}
                            <div className="relative w-32 h-32 flex items-center justify-center bg-yellow-400 rounded-full shadow-xl border-4 border-yellow-500 mb-6">
                                <div className="text-center">
                                    <div className="text-yellow-900 font-bold text-lg leading-none flex items-center justify-center gap-1">
                                        <CheckCircle size={16} /> SCORE
                                    </div>
                                    <div className="text-4xl font-black text-yellow-950">{reviewData.score}</div>
                                </div>
                                <div className="absolute -bottom-2 bg-yellow-950 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                                    Verified
                                </div>
                            </div>

                            {/* REASONS BOX */}
                            <div className={`w-full max-w-2xl p-6 rounded-2xl mb-8 border-l-4 shadow-sm ${reviewData.isLow ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${reviewData.isLow ? 'text-red-800' : 'text-green-800'}`}>
                                    {reviewData.isLow ? 'Eligibility Notice (Potential Rejection Reasons):' : 'Application Strength (Potential Acceptance Reasons):'}
                                </h3>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {reviewData.reasons.map((reason, idx) => (
                                        <li key={idx} className={`flex items-start gap-2 text-sm font-medium ${reviewData.isLow ? 'text-red-700' : 'text-green-700'}`}>
                                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${reviewData.isLow ? 'bg-red-400' : 'bg-green-400'}`} />
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* MAIN TERMS BOX (Matching Image) */}
                            <div className="w-full max-w-2xl bg-[#D1FADF] rounded-[32px] p-8 text-center shadow-lg border border-[#A3E635]/30">
                                <div className="flex justify-center items-center gap-2 text-green-800/70 mb-2 font-bold text-xs uppercase tracking-widest">
                                    <IndianRupee size={14} /> Approved Amount
                                </div>
                                <h2 className="text-5xl font-black text-[#064E3B] mb-6">
                                    ₹ {reviewData.approvedAmount.toLocaleString()}
                                </h2>
                                
                                <div className="flex justify-center items-center gap-4 text-[#065F46] font-bold text-sm mb-6 pb-6 border-b border-[#065F46]/10">
                                    <span>Interest Rate: {reviewData.interestRate}%</span>
                                    <div className="w-px h-4 bg-[#065F46]/20" />
                                    <span>Tenure: {reviewData.tenure} months</span>
                                </div>

                                <div className="text-[#065F46] mb-8">
                                    <span className="text-sm font-medium opacity-80 uppercase tracking-tighter">Monthly EMI: </span>
                                    <span className="text-2xl font-black">₹{reviewData.emi.toLocaleString()}</span>
                                </div>

                                <div className="bg-white/60 p-4 rounded-2xl border border-white/40 mb-2">
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-[#065F46]/60 uppercase tracking-widest mb-1">
                                        <LinkIcon size={12} /> Blockchain Transaction Preview
                                    </div>
                                    <p className="font-mono text-[9px] text-[#065F46]/40 break-all">
                                        0xbaead d5abe93cae250469fd0f319dd234bc036325ef0d87ca30b935ce6bf948f
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* BUTTONS */}
                <div className="flex justify-between mt-10">
                    {step > 1 && (
                        <button
                            onClick={back}
                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl flex items-center gap-2 font-semibold"
                        >
                            <ChevronLeft size={18} /> Back
                        </button>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`ml-auto px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 
                            ${step === 6 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                    >
                        {loading ? "Processing..." : (step === 6 ? "Confirm & Submit Application" : "Next Step")}
                        {!loading && <ChevronRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ICONS HELPER */
const LinkIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
);

/* COMPONENTS */

const Section = ({ icon, title, children }) => (
    <div>
        <div className="flex items-center gap-3 mb-6 text-green-800 font-bold text-xl border-b pb-2 border-green-100">
            <div className="p-2 bg-green-100 rounded-lg text-green-700">
                {icon}
            </div>
            {title}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
    </div>
);

const Input = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700">
            {label}
        </label>
        <input
            {...props}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none transition-all"
        />
    </div>
);

const Select = ({ label, name, options, value, onChange }) => (
    <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700">
            {label}
        </label>
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none appearance-none transition-all"
            >
                <option value="">Select Option</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt.replace(/_/g, " ")}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                <ChevronRight className="rotate-90" size={16} />
            </div>
        </div>
    </div>
);

const FileInput = ({ label, name, onChange, file }) => (
    <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700">
            {label} <span className="text-red-500">*</span>
        </label>
        <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors p-4 text-center cursor-pointer">
            <input
                type="file"
                name={name}
                onChange={onChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
            />
            <div className="flex flex-col items-center justify-center gap-2">
                {file ? (
                    <>
                        <CheckCircle className="text-green-500" size={24} />
                        <span className="text-sm font-medium text-green-700 truncate max-w-xs">{file.name}</span>
                    </>
                ) : (
                    <>
                        <UploadCloud className="text-gray-400" size={24} />
                        <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                    </>
                )}
            </div>
        </div>
    </div>
);
const getNitrogenClass = (val) => {
    const n = Number(val);
    if (n < 280) return "Low";
    if (n <= 560) return "Medium";
    return "High";
};

const getPhosphorusClass = (val) => {
    const p = Number(val);
    if (p < 10) return "Low";
    if (p <= 25) return "Medium";
    return "High";
};

const getPotassiumClass = (val) => {
    const k = Number(val);
    if (k < 110) return "Low";
    if (k <= 280) return "Medium";
    return "High";
};

const getDerivedSoilQuality = (data) => {
    if (data.soilHealthCardAvailable === "Yes") {
        const mapToScore = { "High": 3, "Medium": 2, "Low": 1 };
        const nScore = mapToScore[getNitrogenClass(data.nitrogen)] || 1;
        const pScore = mapToScore[getPhosphorusClass(data.phosphorus)] || 1;
        const kScore = mapToScore[getPotassiumClass(data.potassium)] || 1;
        return nScore + pScore + kScore;
    } else {
        if (data.cropYield === "High") return 8;
        if (data.cropYield === "Medium") return 5;
        return 3;
    }
};

export default LoanApplication;