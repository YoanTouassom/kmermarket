import { useState } from "react";
import { Bell, Shield, KeyRound, Save } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { authService } from "../../services/authService";
import { Button, Field, Input } from "../../components/ui/primitives";

function Toggle({ checked, onChange }) {
  return (
    <label className="mf-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="track" />
    </label>
  );
}

export default function Preferences() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const success = useUIStore((s) => s.success);
  const error = useUIStore((s) => s.error);

  const [prefs, setPrefs] = useState(
    user?.preferences || { newsletter: true, sms: false, promos: true },
  );
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);

  const setPref = async (k, v) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    await updateProfile({ preferences: next });
    success("Préférences enregistrées");
  };

  const changePwd = async (e) => {
    e.preventDefault();
    if (pwd.newPassword.length < 6)
      return error("Le nouveau mot de passe doit faire au moins 6 caractères.");
    if (pwd.newPassword !== pwd.confirm)
      return error("Les mots de passe ne correspondent pas.");
    setBusy(true);
    try {
      await authService.changePassword(user.id, {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
      success("Mot de passe modifié");
    } catch (err) {
      error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="mf-panel">
        <div className="mf-panel-head">
          <h3>
            <Bell size={17} style={{ verticalAlign: -3, marginRight: 8 }} />
            Notifications
          </h3>
        </div>
        <div
          className="mf-panel-body"
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          {[
            {
              key: "newsletter",
              label: "Newsletter",
              text: "Actualités et nouveautés KmerMarket.",
            },
            {
              key: "promos",
              label: "Offres promotionnelles",
              text: "Alertes sur les produits en promotion.",
            },
            {
              key: "sms",
              label: "Notifications SMS",
              text: "Suivi de livraison par SMS.",
            },
          ].map((row) => (
            <div
              key={row.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{ fontWeight: 600, fontFamily: "var(--font-display)" }}
                >
                  {row.label}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
                  {row.text}
                </div>
              </div>
              <Toggle
                checked={!!prefs[row.key]}
                onChange={(v) => setPref(row.key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mf-panel">
        <div className="mf-panel-head">
          <h3>
            <Shield size={17} style={{ verticalAlign: -3, marginRight: 8 }} />
            Sécurité
          </h3>
        </div>
        <form className="mf-panel-body" onSubmit={changePwd}>
          <div className="mf-form-grid">
            <div className="full">
              <Field label="Mot de passe actuel" required>
                <Input
                  type="password"
                  value={pwd.currentPassword}
                  onChange={(e) =>
                    setPwd({ ...pwd, currentPassword: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </Field>
            </div>
            <Field label="Nouveau mot de passe" required>
              <Input
                type="password"
                value={pwd.newPassword}
                onChange={(e) =>
                  setPwd({ ...pwd, newPassword: e.target.value })
                }
                placeholder="••••••••"
              />
            </Field>
            <Field label="Confirmer" required>
              <Input
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                placeholder="••••••••"
              />
            </Field>
          </div>
          <div style={{ marginTop: 20 }}>
            <Button
              type="submit"
              variant="primary"
              icon={KeyRound}
              loading={busy}
            >
              Modifier le mot de passe
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
