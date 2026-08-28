import { useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      const response = await api.post("/auth/register", formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/");
    } catch (error) {
      setMessage(error.response?.data?.message || "We could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="register">
      <div className="auth-form">
        <Link to="/" className="auth-mobile-brand brand-lockup">
          <span className="brand-mark"><Leaf size={18} /></span>
          <span>ChillBerry</span>
        </Link>
        <p className="eyebrow">Start your garden</p>
        <h2 className="mt-3">Claim your berry pass.</h2>
        <p>Create an account to keep your progress close, wherever the day takes you.</p>

        {message && <div className="form-message" role="alert"><AlertCircle size={17} /><span>{message}</span></div>}

        <form onSubmit={handleSubmit} className="mt-7">
          <div className="form-group">
            <label htmlFor="register-name">Your name</label>
            <div className="input-wrap">
              <UserRound size={18} />
              <input id="register-name" className="field" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="What should Berry call you?" autoComplete="name" minLength="2" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email address</label>
            <div className="input-wrap">
              <Mail size={18} />
              <input id="register-email" className="field" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <div className="input-wrap">
              <LockKeyhole size={18} />
              <input id="register-password" className="field" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="At least 6 characters" autoComplete="new-password" minLength="6" required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="button button-primary mt-7 w-full">
            {loading ? <span className="loading-dot" /> : <>Create berry pass <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="auth-switch">Already growing with us? <Link to="/login">Log in</Link></p>
        <Link to="/" className="auth-guest-link">Continue on this device without an account</Link>
      </div>
    </AuthLayout>
  );
}

export default Register;
