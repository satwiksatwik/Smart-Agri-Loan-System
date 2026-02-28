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
        soilQuality: "",
        irrigation: "",
        ownership: "Owned",
        loanAmount: "",
        purpose: "",
        loanType: "Short_Term",
        history: "First_Time",
    });

    const [files, setFiles] = useState({
        adangal: null,
        incomeCertificate: null,
        aadhaar: null,
        pan: null,
        photo: null
    });

    useEffect(() => {
        const checkUserDocs = async () => {
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
            } catch {
                setIsFirstTime(true);
            } finally {
                setCheckingLoans(false);
            }
        };
        checkUserDocs();
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

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data = new FormData();

            // Append Text Fields
            Object.keys(formData).forEach(key => {
                // Map frontend keys to backend expectations if needed
                // Backend expects 'aadhaar', 'pan' (files) vs 'aadhaarNumber', 'panNumber' (text)?
                // Checking loanController.js:
                // Text: aadhaar, pan (these seem to be the numbers based on regex validation)
                // Files: aadhaar, pan (these are file fields in upload.fields)
                // Wait, backend loanRoutes.js uses:
                // body("aadhaar").matches(...) -> Text
                // upload.fields([{ name: "aadhaar" }]) -> File
                // This conflict might be an issue. Let's send text as 'aadhaar' and file as 'aadhaarDoc' if backend allowed, 
                // BUT backend uses same key.
                // Actually, in Express, req.body.aadhaar comes from text field, req.files.aadhaar comes from file.
                // So we can send both with same name in FormData.

                // However, let's look at controller:
                // const { aadhaar, pan } = req.body; -> Text
                // uploadedFiles['aadhaar'] -> File
                // So yes, we can send both.

                // Mapping:
                if (key === 'aadhaarNumber') data.append('aadhaar', formData[key]);
                else if (key === 'panNumber') data.append('pan', formData[key]);
                else data.append(key, formData[key]);
            });

            // Append Files (always upload documents)
            Object.keys(files).forEach(key => {
                if (files[key]) {
                    data.append(key, files[key]);
                }
            });

            // Calculate Logical Credit Score instead of random
            const calculateCreditScore = () => {
                let score = 600; // Base Score

                // Income: +1 per ₹10,000 (max +100)
                const incomeBonus = Math.min(Math.floor(Number(formData.annualIncome) / 10000), 100);
                score += incomeBonus;

                // Existing Loans: -30 per loan
                const loanPenalty = Number(formData.existingLoans) * 30;
                score -= loanPenalty;

                // Land Size: +10 per acre (max +80)
                const landBonus = Math.min(Number(formData.landSize) * 10, 80);
                score += landBonus;

                // Loan History: +50 for Repeat
                if (formData.history === "Repeat") {
                    score += 50;
                }

                // Soil Quality: +5 per point (1-10)
                const soilBonus = Number(formData.soilQuality) * 5;
                score += soilBonus;

                // Age: +20 for 35-55, -20 for <25 or >65
                const ageNum = Number(formData.age);
                if (ageNum >= 35 && ageNum <= 55) {
                    score += 20;
                } else if (ageNum < 25 || ageNum > 65) {
                    score -= 20;
                }

                // Final Clamp between 300 and 900
                return Math.max(300, Math.min(900, score));
            };

            const creditScore = calculateCreditScore();
            data.append('creditScore', creditScore);

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
        return <div className="text-center py-20">Checking...</div>;

    const totalSteps = 5;

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
                        <Input label="Soil Quality (1-10)" name="soilQuality" type="number" value={formData.soilQuality} onChange={handleChange} />
                        <Select label="Irrigation" name="irrigation" value={formData.irrigation} options={["drip", "canal", "borewell", "rainfed"]} onChange={handleChange} />
                        <Select label="Ownership" name="ownership" value={formData.ownership} options={["Owned", "Leased"]} onChange={handleChange} />
                    </Section>
                )}

                {/* STEP 4: LOAN DETAILS (Swapped logic to keep documents last usually, but 4 was loan details) */}
                {step === 4 && (
                    <Section icon={<Tractor />} title="Loan Details">
                        <Input label="Requested Amount" name="loanAmount" type="number" value={formData.loanAmount} onChange={handleChange} />
                        <Select label="Purpose" name="purpose" value={formData.purpose} options={["Equipment_Purchase", "Seeds", "Irrigation", "Fertilizer", "Other"]} onChange={handleChange} />
                        <Select label="Loan Type" name="loanType" value={formData.loanType} options={["Short_Term", "Long_Term"]} onChange={handleChange} />
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

                    {step < totalSteps ? (
                        <button
                            onClick={next}
                            className="ml-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-green-200"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="ml-auto px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold shadow-lg shadow-yellow-200 flex items-center gap-2"
                        >
                            {loading ? "Submitting..." : "Submit Application"}
                            {!loading && <CheckCircle size={18} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

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

export default LoanApplication;