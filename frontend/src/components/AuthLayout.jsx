import { CheckCircle2, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import gardenImage from "../assets/chillberry-garden.png";

const benefits = [
  "Keep your mood garden growing",
  "Sync your chill points and streak",
  "Return to your calm space anywhere",
];

function AuthLayout({ children, mode }) {
  const isRegister = mode === "register";

  return (
    <main className="auth-shell">
      <section className="auth-visual" aria-label="ChillBerry garden">
        <Link to="/" className="brand-lockup">
          <span className="brand-mark"><Leaf size={18} /></span>
          <span>ChillBerry</span>
        </Link>

        <img
          src={gardenImage}
          alt="Berry resting in the ChillBerry wellbeing garden"
        />

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
