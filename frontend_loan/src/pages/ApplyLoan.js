import { useState } from "react";
import API from "../api";

function ApplyLoan() {

  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const res = await API.post("/loan/apply", form);
      setResult(res.data);
    } catch {
      alert("Error submitting loan");
    }
  };

  return (
    <div className="container">
      <h2>Apply for Loan</h2>

      <input name="Age_of_Farmer" placeholder="Age" onChange={handleChange}/>
      <input name="Annual_Income" placeholder="Income" onChange={handleChange}/>
      <input name="Land_Size_Acres" placeholder="Land Size" onChange={handleChange}/>
      <input name="Credit_Score" placeholder="Credit Score" onChange={handleChange}/>
      <input name="Requested_Loan_Amount" placeholder="Requested Amount" onChange={handleChange}/>

      <button onClick={handleSubmit}>Submit</button>

      {result && (
        <div>
          <h3>Status: {result.status}</h3>
          <p>Approved Amount: ₹{result.approvedAmount}</p>
        </div>
      )}
    </div>
  );
}

export default ApplyLoan;
