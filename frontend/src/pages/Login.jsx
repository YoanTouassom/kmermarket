import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import AuthShell from "../components/layout/AuthShell";
import { Button, Field, Input } from "../components/ui/primitives";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const success = useUIStore((s) => s.success);
  const error = useUIStore((s) => s.error);

  const [form, setForm] = useState({ email: "", password: "" });
  const [errs, setErrs] = useState({});
  const redirect = location.state?.from || "/";

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.email.trim()) er.email = "Email requis.";
    if (!form.password) er.password = "Mot de passe requis.";
    setErrs(er);
    if (Object.keys(er).length) return;
    try {
      const user = await login(form);
      success(`Bienvenue, ${user.firstName || user.name} !`);
      navigate(user.role === "admin" ? "/admin" : redirect, { replace: true });
    } catch (e2) {
      error(e2.message);
    }
  };

  return (
    <AuthShell
      title="Content de vous revoir"
      subtitle="Connectez-vous pour retrouver votre panier et vos commandes."
      footer={
        <p style={{ marginTop: 22, fontSize: 14, color: "var(--ink-600)" }}>
          Pas encore de compte ?{" "}
          <Link
            to="/register"
            style={{ color: "var(--green-700)", fontWeight: 700 }}
          >
            Créer un compte
          </Link>
        </p>
      }
    >
      <form
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <Field label="Email" required error={errs.email} htmlFor="email">
          <div style={{ position: "relative" }}>
            <Mail
              size={17}
              style={{
                position: "absolute",
                left: 14,
                top: 13,
                color: "var(--ink-400)",
              }}
            />
            <Input
              id="email"
              type="email"
              style={{ paddingLeft: 42 }}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="vous@example.com"
              error={errs.email}
            />
          </div>
        </Field>
        <Field
          label="Mot de passe"
          required
          error={errs.password}
          htmlFor="password"
        >
          <div style={{ position: "relative" }}>
            <Lock
              size={17}
              style={{
                position: "absolute",
                left: 14,
                top: 13,
                color: "var(--ink-400)",
              }}
            />
            <Input
              id="password"
              type="password"
              style={{ paddingLeft: 42 }}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              error={errs.password}
            />
          </div>
        </Field>
        <Link
          to="/forgot-password"
          style={{ fontSize: 13.5, color: "var(--green-700)", fontWeight: 600 }}
        >
          Mot de passe oublié ?
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="btn-block"
        >
          Se connecter <ArrowRight size={17} />
        </Button>
      </form>
    </AuthShell>
  );
}
