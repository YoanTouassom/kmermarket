import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Smartphone,
  ShoppingBag,
  PartyPopper,
  Package,
} from "lucide-react";
import {
  useCartStore,
  useCartSubtotal,
  useCartCount,
} from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { orderService } from "../services/orderService";
import { productService } from "../services/productService";
import {
  Button,
  Field,
  Input,
  Textarea,
  Select,
  EmptyState,
} from "../components/ui/primitives";
import { formatPrice } from "../utils/format";
import { CITIES, PAYMENT_METHODS, formatMobileNumber } from "../utils/constants";
import { IMAGE_PLACEHOLDER, onImageError } from "../utils/images";

const STEPS = ["Informations", "Livraison", "Paiement"];

export default function Checkout() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartSubtotal();
  const user = useAuthStore((s) => s.user);
  const success = useUIStore((s) => s.success);
  const error = useUIStore((s) => s.error);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    email: user?.email || "",
    city: user?.city || "Douala",
    quartier: user?.quartier || "",
    address: user?.address || "",
    note: "",
    payment: "cash",
  });

  const delivery = useMemo(
    () => orderService.computeDelivery(subtotal, form.city),
    [subtotal, form.city],
  );
  const total = subtotal + delivery.fee;

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.firstName.trim()) e.firstName = "Le prénom est requis.";
      if (!form.lastName.trim()) e.lastName = "Le nom est requis.";
      if (!/^[0-9+\s]{8,}$/.test(form.phone.trim()))
        e.phone = "Numéro de téléphone invalide.";
    }
    if (step === 1) {
      if (!form.city) e.city = "Sélectionnez une ville.";
      if (form.quartier.trim().length < 2)
        e.quartier = "Le quartier est requis (2 caractères minimum).";
      if (form.address.trim().length < 5)
        e.address = "L’adresse est requise (5 caractères minimum).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const placeOrder = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const order = await orderService.create({
        // Contrat backend : payload plat (city, neighborhood, address, phone...).
        city: form.city,
        neighborhood: form.quartier.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        paymentMethod: form.payment,
        note: form.note,
      });
      // Le stock est décrémenté côté serveur, dans la transaction de commande.
      clear();
      setPlaced(order);
      success("Votre commande a été enregistrée !");
    } catch (e) {
      error(e.message || "Une erreur est survenue lors de la commande.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length && !placed) {
    return (
      <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
        <EmptyState
          icon={ShoppingBag}
          title="Aucun article à commander"
          text="Ajoutez des produits à votre panier avant de passer commande."
          action={
            <Button variant="primary" onClick={() => navigate("/shop")}>
              Aller à la boutique
            </Button>
          }
        />
      </div>
    );
  }

  if (placed) {
    return (
      <div
        className="container"
        style={{ paddingTop: 40, paddingBottom: 70, maxWidth: 720 }}
      >
        <div className="mf-panel">
          <div
            className="mf-panel-body"
            style={{ textAlign: "center", padding: 44 }}
          >
            <span
              className="mf-empty-icon"
              style={{
                background: "var(--green-50)",
                color: "var(--green-600)",
                margin: "0 auto 18px",
              }}
            >
              <PartyPopper size={30} />
            </span>
            <h1 style={{ fontSize: 26 }}>Merci pour votre commande !</h1>
            <p style={{ color: "var(--ink-600)", marginTop: 10 }}>
              Votre commande <strong>{placed.reference}</strong> a bien été
              enregistrée. Notre équipe vous contactera pour confirmer la
              livraison.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                margin: "26px 0",
                textAlign: "left",
              }}
            >
              <div className="mf-fact">
                <div className="l">Référence</div>
                <div className="v">{placed.reference}</div>
              </div>
              <div className="mf-fact">
                <div className="l">Total</div>
                <div className="v">{formatPrice(placed.total)}</div>
              </div>
              <div className="mf-fact">
                <div className="l">Livraison</div>
                <div className="v">
                  {placed.customer.city}, {placed.customer.quartier}
                </div>
              </div>
              <div className="mf-fact">
                <div className="l">Paiement</div>
                <div className="v">
                  {
                    PAYMENT_METHODS.find(
                      (p) => p.value === placed.paymentMethod,
                    )?.label
                  }
                </div>
              </div>
            </div>

            {(() => {
              const pm = PAYMENT_METHODS.find((p) => p.value === placed.paymentMethod);
              if (!pm?.number) return null;
              return (
                <div className="mf-info-block" style={{ textAlign: "left", marginBottom: 22 }}>
                  <div className="tt">Finalisez votre paiement {pm.label}</div>
                  <div className="ln">
                    Envoyez <strong>{formatPrice(placed.total)}</strong> au{" "}
                    <strong>{formatMobileNumber(pm.number)}</strong> en indiquant la
                    référence <strong>{placed.reference}</strong>. Votre commande sera
                    confirmée dès réception du paiement.
                  </div>
                </div>
              );
            })()}

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link to="/orders" className="btn btn-primary">
                <Package size={17} /> Suivre ma commande
              </Link>
              <Link to="/shop" className="btn btn-outline">
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 26, paddingBottom: 50 }}>
      <div className="mf-sec-head">
        <div>
          <span className="mf-eyebrow">Commande</span>
          <h1 style={{ fontSize: 28 }}>Finaliser ma commande</h1>
        </div>
      </div>

      <div className="mf-steps-bar">
        {STEPS.map((label, i) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: i < 2 ? 1 : 0,
            }}
          >
            <span
              className={`s ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
            >
              <span className="n">
                {i < step ? <Check size={15} /> : i + 1}
              </span>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="line" />}
          </div>
        ))}
      </div>

      <div className="mf-cart-layout">
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--ink-200)",
            borderRadius: "var(--r-lg)",
            padding: 24,
          }}
        >
          {step === 0 && (
            <div className="mf-form-grid">
              <Field label="Prénom" required error={errors.firstName}>
                <Input
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  error={errors.firstName}
                  placeholder="Ex : Nadège"
                />
              </Field>
              <Field label="Nom" required error={errors.lastName}>
                <Input
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  error={errors.lastName}
                  placeholder="Ex : Mbarga"
                />
              </Field>
              <Field label="Téléphone" required error={errors.phone}>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  error={errors.phone}
                  placeholder="+237 6 99 00 00 00"
                />
              </Field>
              <Field label="Email (optionnel)">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="vous@example.com"
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="mf-form-grid">
              <Field label="Ville" required error={errors.city}>
                <Select
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  error={errors.city}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Quartier" required error={errors.quartier}>
                <Input
                  value={form.quartier}
                  onChange={(e) => set("quartier", e.target.value)}
                  error={errors.quartier}
                  placeholder="Ex : Bonapriso"
                />
              </Field>
              <div className="full">
                <Field label="Adresse précise" required error={errors.address}>
                  <Input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    error={errors.address}
                    placeholder="Rue, immeuble, point de repère…"
                  />
                </Field>
              </div>
              <div className="full">
                <Field label="Instructions de livraison (optionnel)">
                  <Textarea
                    value={form.note}
                    onChange={(e) => set("note", e.target.value)}
                    rows={3}
                    placeholder="Ex : appeler avant d’arriver, portail bleu…"
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>
                Mode de paiement
              </h3>
              {PAYMENT_METHODS.map((m) => {
                const Ic = Icons[m.icon] || Wallet;
                return (
                  <label
                    key={m.value}
                    className={`mf-pay-opt ${form.payment === m.value ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={form.payment === m.value}
                      onChange={() => set("payment", m.value)}
                    />
                    <span className="ic">
                      <Ic size={20} />
                    </span>
                    <span>
                      <span className="tt">
                        {m.label}
                      </span>
                      <span className="ds">{m.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 26,
              gap: 12,
            }}
          >
            <Button
              variant="ghost"
              icon={ChevronLeft}
              onClick={prev}
              disabled={step === 0}
            >
              Retour
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="primary" onClick={next}>
                Continuer <ChevronRight size={17} />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                loading={submitting}
                onClick={placeOrder}
              >
                Confirmer la commande · {formatPrice(total)}
              </Button>
            )}
          </div>
        </div>

        <aside className="mf-summary">
          <h3>Votre commande</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxHeight: 280,
              overflowY: "auto",
              marginBottom: 16,
            }}
          >
            {items.map((i) => (
              <div
                key={i.productId}
                style={{ display: "flex", gap: 12, alignItems: "center" }}
              >
                <img
                  src={i.image || IMAGE_PLACEHOLDER}
                  onError={onImageError}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    objectFit: "cover",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                    {i.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>
                    {i.quantity} × {formatPrice(i.price)}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                  {formatPrice(i.price * i.quantity)}
                </div>
              </div>
            ))}
          </div>
          <div className="mf-summary-row">
            <span>Sous-total</span>
            <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>
              {formatPrice(subtotal)}
            </span>
          </div>
          <div className="mf-summary-row">
            <span>
              Livraison{" "}
              <span style={{ color: "var(--ink-400)" }}>({delivery.eta})</span>
            </span>
            <span
              style={{
                fontWeight: 700,
                color: delivery.free ? "var(--green-600)" : "var(--ink-900)",
              }}
            >
              {delivery.free ? "Offerte" : formatPrice(delivery.fee)}
            </span>
          </div>
          <div className="mf-summary-row total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--ink-500)",
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Smartphone size={14} style={{ flexShrink: 0 }} /> Paiement à la
            livraison, par MTN Mobile Money ou Orange Money.
          </div>
        </aside>
      </div>
    </div>
  );
}
