import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AuthShell from "../components/layout/AuthShell";
import { Button, Field, Input } from "../components/ui/primitives";
import { authService } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr("Email invalide.");
      return;
    }
    setErr("");
    setLoading(true);
    await authService.requestPasswordReset(email);
    setLoading(false);
    setSent(true);
  };

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Nous vous enverrons un lien pour réinitialiser votre mot de passe."
      footer={
        <p style={{ marginTop: 22, fontSize: 14 }}>
          <Link
            to="/login"
            style={{
              color: "var(--green-700)",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowLeft size={15} /> Retour à la connexion
          </Link>
        </p>
      }
    >
      {sent ? (
        <div
          className="mf-auth-note"
          style={{
            background: "var(--green-50)",
            borderColor: "var(--green-300)",
          }}
        >
          <strong>Email envoyé</strong>
          <p style={{ marginTop: 6 }}>
            Si un compte correspond à <strong>{email}</strong>, un lien de
            réinitialisation vient d’être envoyé. Pensez à vérifier vos spams.
          </p>
        </div>
      ) : (
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <Field label="Email" required error={err}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              error={err}
            />
          </Field>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="btn-block"
          >
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
