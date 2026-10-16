import { useState } from "react";
import { User, Mail, Phone, Save } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { Button, Field, Input } from "../../components/ui/primitives";
import { CITIES } from "../../utils/constants";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const success = useUIStore((s) => s.success);
  const error = useUIStore((s) => s.error);

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    city: user?.city || "",
    quartier: user?.quartier || "",
    address: user?.address || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        ...form,
        name: `${form.firstName} ${form.lastName}`.trim(),
      });
      success("Profil mis à jour");
    } catch (err) {
      error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mf-panel">
      <div className="mf-panel-head">
        <h3>Mes informations</h3>
        <span className="mf-role-badge">
          {user?.role === "admin" ? "Administrateur" : "Client"}
        </span>
      </div>
      <form className="mf-panel-body" onSubmit={save}>
        <div className="mf-form-grid">
          <Field label="Prénom">
            <Input
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </Field>
          <Field label="Nom">
            <Input
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </Field>
          <Field
            label="Email"
            hint="L’email de connexion ne peut pas être modifié ici."
          >
            <Input value={user?.email || ""} disabled />
          </Field>
          <Field label="Téléphone">
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Ville">
            <select
              className="select"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            >
              <option value="">— Choisir —</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quartier">
            <Input
              value={form.quartier}
              onChange={(e) => set("quartier", e.target.value)}
            />
          </Field>
          <div className="full">
            <Field label="Adresse">
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Rue, immeuble, repère…"
              />
            </Field>
          </div>
        </div>
        <div style={{ marginTop: 22 }}>
          <Button type="submit" variant="primary" icon={Save} loading={saving}>
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
