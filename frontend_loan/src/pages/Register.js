import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await API.post("/auth/register", {
        username: form.username,
        mobile: form.mobile,
        email: form.email,
        password: form.password
      });

      alert("Registration Successful");
      navigate("/");

    } catch (error) {
      setError(
        error.response?.data?.message || "Registration failed"
      );
    }

  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Register</h2>

      <input name="username" placeholder="Username" onChange={handleChange} />
      <br /><br />

      <input name="mobile" placeholder="Mobile Number" onChange={handleChange} />
      <br /><br />

      <input name="email" placeholder="Email" onChange={handleChange} />
      <br /><br />

      <input type="password" name="password" placeholder="Password" onChange={handleChange} />
      <br /><br />

      <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} />
      <br /><br />

      <button onClick={handleRegister}>Register</button>

      <p>
        Already have an account?
        <button onClick={() => navigate("/")}>
          Login
        </button>
      </p>
    </div>
  );
}

export default Register;
