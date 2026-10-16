import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AuthShell from "../components/layout/AuthShell";
import { Button, Field, Input } from "../components/ui/primitives";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const success = useUIStore((s) => s.success);
  const error = useUIStore((s) => s.error);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [errs, setErrs] = useState({});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.firstName.trim()) er.firstName = "Prénom requis.";
    if (!form.lastName.trim()) er.lastName = "Nom requis.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = "Email invalide.";
    if (!/^[0-9+\s]{8,}$/.test(form.phone)) er.phone = "Téléphone invalide.";
    if (form.password.length < 6) er.password = "Au moins 6 caractères.";
    if (form.password !== form.confirm)
      er.confirm = "Les mots de passe diffèrent.";
    setErrs(er);
    if (Object.keys(er).length) return;
    try {
      const user = await register(form);
      success(`Compte créé. Bienvenue ${user.firstName} !`);
      navigate("/", { replace: true });
    } catch (e2) {
      error(e2.message);
    }
  };

  return (
    <AuthShell
      title="Créer votre compte"
      subtitle="Quelques secondes suffisent pour commencer à commander."
      footer={
        <p style={{ marginTop: 22, fontSize: 14, color: "var(--ink-600)" }}>
          Vous avez déjà un compte ?{" "}
          <Link
            to="/login"
            style={{ color: "var(--green-700)", fontWeight: 700 }}
          >
            Se connecter
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="mf-form-grid">
        <Field label="Prénom" required error={errs.firstName}>
          <Input
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            placeholder="Nadège"
            error={errs.firstName}
          />
        </Field>
        <Field label="Nom" required error={errs.lastName}>
          <Input
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            placeholder="Mbarga"
            error={errs.lastName}
          />
        </Field>
        <div className="full">
          <Field label="Email" required error={errs.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="vous@example.com"
              error={errs.email}
            />
          </Field>
        </div>
        <div className="full">
          <Field label="Téléphone" required error={errs.phone}>
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+237 6 99 00 00 00"
              error={errs.phone}
            />
          </Field>
        </div>
        <Field label="Mot de passe" required error={errs.password}>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="••••••••"
            error={errs.password}
          />
        </Field>
        <Field label="Confirmer" required error={errs.confirm}>
          <Input
            type="password"
            value={form.confirm}
            onChange={(e) => set("confirm", e.target.value)}
            placeholder="••••••••"
            error={errs.confirm}
          />
        </Field>
        <div className="full">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="btn-block"
          >
            Créer mon compte <ArrowRight size={17} />
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
