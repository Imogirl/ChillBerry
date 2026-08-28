import { useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
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
      const response = await api.post("/auth/login", formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/");
    } catch (error) {
      setMessage(error.response?.data?.message || "We could not sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div className="auth-form">
        <Link to="/" className="auth-mobile-brand brand-lockup">
          <span className="brand-mark"><Leaf size={18} /></span>
          <span>ChillBerry</span>
        </Link>
        <p className="eyebrow">Welcome back</p>
        <h2 className="mt-3">Open your berry gate.</h2>
        <p>Your garden, streak, and tiny wins are ready when you are.</p>

        {message && <div className="form-message" role="alert"><AlertCircle size={17} /><span>{message}</span></div>}

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="form-group">
            <label htmlFor="login-email">Email address</label>
            <div className="input-wrap">
              <Mail size={18} />
              <input id="login-email" className="field" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-wrap">
              <LockKeyhole size={18} />
              <input id="login-password" className="field" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="button button-primary mt-7 w-full">
            {loading ? <span className="loading-dot" /> : <>Open my garden <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="auth-switch">New to ChillBerry? <Link to="/register">Create your space</Link></p>
        <Link to="/" className="auth-guest-link">Continue on this device without an account</Link>
      </div>
    </AuthLayout>
  );
}

export default Login;
