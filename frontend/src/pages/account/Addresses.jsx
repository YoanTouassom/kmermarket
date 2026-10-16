import { useState } from "react";
import { MapPin, Plus, Trash2, Save, Home, Building2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import {
  Button,
  Field,
  Input,
  Select,
  EmptyState,
} from "../../components/ui/primitives";
import { CITIES } from "../../utils/constants";

const empty = {
  label: "",
  type: "home",
  city: "Douala",
  quartier: "",
  address: "",
  phone: "",
};

export default function Addresses() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const success = useUIStore((s) => s.success);

  const [list, setList] = useState(user?.addresses || []);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const persist = async (next) => {
    setList(next);
    setSaving(true);
    await updateProfile({ addresses: next });
    setSaving(false);
  };

  const add = async (e) => {
    e.preventDefault();
    if (!form.label.trim() || !form.address.trim()) return;
    const item = { ...form, id: `a${Date.now()}` };
    await persist([...list, item]);
    setForm(empty);
    setShow(false);
    success("Adresse ajoutée");
  };

  const remove = async (id) => {
    await persist(list.filter((a) => a.id !== id));
    success("Adresse supprimée");
  };

  return (
    <div className="mf-panel">
      <div className="mf-panel-head">
        <h3>Mes adresses de livraison</h3>
        <Button
          variant="outline"
          icon={Plus}
          onClick={() => setShow((v) => !v)}
        >
          Ajouter une adresse
        </Button>
      </div>

      <div className="mf-panel-body">
        {show && (
          <form
            onSubmit={add}
            style={{
              background: "var(--cream)",
              borderRadius: "var(--r-lg)",
              padding: 18,
              marginBottom: 20,
            }}
          >
            <div className="mf-form-grid">
              <Field label="Libellé" required>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Ex : Maison, Bureau"
                />
              </Field>
              <Field label="Type">
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="home">Domicile</option>
                  <option value="office">Bureau</option>
                </Select>
              </Field>
              <Field label="Ville" required>
                <Select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Quartier" required>
                <Input
                  value={form.quartier}
                  onChange={(e) =>
                    setForm({ ...form, quartier: e.target.value })
                  }
                  placeholder="Ex : Bonapriso"
                />
              </Field>
              <div className="full">
                <Field label="Adresse" required>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Rue, immeuble, repère…"
                  />
                </Field>
              </div>
              <div className="full">
                <Field label="Téléphone">
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="+237 6 99 00 00 00"
                  />
                </Field>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                loading={saving}
              >
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShow(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}

        {list.length === 0 && !show ? (
          <EmptyState
            icon={MapPin}
            title="Aucune adresse enregistrée"
            text="Ajoutez une adresse pour accélérer vos prochaines commandes."
            action={
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShow(true)}
              >
                Ajouter une adresse
              </Button>
            }
          />
        ) : (
          <div className="mf-address-grid">
            {list.map((a) => (
              <div key={a.id} className="mf-address-card">
                <span className={`ic ${a.type}`}>
                  {a.type === "office" ? (
                    <Building2 size={18} />
                  ) : (
                    <Home size={18} />
                  )}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="nm">{a.label}</div>
                  <div className="ad">{a.address}</div>
                  <div className="ad">
                    {a.quartier}, {a.city}
                  </div>
                  {a.phone && <div className="ad">{a.phone}</div>}
                </div>
                <button
                  className="mf-act-btn del"
                  onClick={() => remove(a.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
