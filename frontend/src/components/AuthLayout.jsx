import { CheckCircle2, Leaf } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import loginImage from "../assets/chillberry-garden.png";
import registerImage from "../assets/register-garden.png";

const benefits = [
  "Keep your mood garden growing",
  "Sync your chill points and streak",
  "Return to your calm space anywhere",
];

function AuthLayout({ children, mode }) {
  const isRegister = mode === "register";
  const previousMode = useMemo(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("chillberry-auth-mode");
  }, []);
  const transitionClass =
    previousMode && previousMode !== mode ? `auth-from-${previousMode}` : "auth-entry";
  const visualImage = isRegister ? registerImage : loginImage;
  const badges = isRegister
    ? ["New sprout", "Fresh start", "Berry pass"]
    : ["Welcome back", "Garden saved", "Soft landing"];

  useEffect(() => {
    sessionStorage.setItem("chillberry-auth-mode", mode);
  }, [mode]);

  return (
    <main className={`auth-shell auth-${mode} ${transitionClass}`}>
      <section className="auth-visual" aria-label="ChillBerry garden">
        <Link to="/" className="brand-lockup">
          <span className="brand-mark"><Leaf size={18} /></span>
          <span>ChillBerry</span>
        </Link>

        <img
          src={visualImage}
          alt="Berry resting in the ChillBerry wellbeing garden"
        />

        <div className="auth-transition-fireworks" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} className={`auth-firework-particle auth-firework-particle-${index + 1}`} />
          ))}
        </div>

        <div className="auth-visual-badges" aria-hidden="true">
          {badges.map((badge, index) => (
            <span key={badge} className={`auth-badge auth-badge-${index + 1}`}>{badge}</span>
          ))}
        </div>

        <div className="auth-copy">
          <p className="eyebrow">A kinder daily rhythm</p>
          <h1 className="mt-3">
            {isRegister ? "Grow a calm space of your own." : "Your garden kept your place."}
          </h1>
          <p>
            Small check-ins, tiny joys, and gentle resets that meet you exactly
            where you are.
          </p>
          <div className="mt-6 grid gap-2">
            {benefits.map((benefit) => (
              <div className="flex items-center gap-2 text-sm font-bold text-[#526458]" key={benefit}>
                <CheckCircle2 size={17} className="text-[#4f8b66]" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-form-wrap">{children}</section>
    </main>
  );
}

export default AuthLayout;
