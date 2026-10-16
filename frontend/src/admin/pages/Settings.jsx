import { useEffect, useState } from 'react'
import { Save, Store, Share2, Truck } from 'lucide-react'
import { contentService } from '../../services/contentService'
import { useUIStore } from '../../store/uiStore'
import { Button, Field, Input, Spinner } from '../../components/ui/primitives'

export default function Settings() {
  const success = useUIStore((s) => s.success)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const s = await contentService.getSettings()
      setSettings(s)
      setLoading(false)
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    await contentService.updateSettings(settings)
    setSaving(false)
    success('Paramètres enregistrés')
  }

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }))
  const setSocial = (k, v) => setSettings((s) => ({ ...s, social: { ...s.social, [k]: v } }))

  if (loading || !settings) return <Spinner label="Chargement des paramètres…" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="mf-panel">
        <div className="mf-panel-head"><h3><Store size={17} style={{ verticalAlign: -3, marginRight: 8 }} />Identité de la boutique</h3></div>
        <div className="mf-panel-body">
          <div className="mf-form-grid">
            <Field label="Nom de la boutique">
              <Input value={settings.storeName} onChange={(e) => set('storeName', e.target.value)} />
            </Field>
            <Field label="Email de contact">
              <Input type="email" value={settings.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Téléphone">
              <Input value={settings.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="WhatsApp">
              <Input value={settings.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            </Field>
            <div className="full">
              <Field label="Adresse">
                <Input value={settings.address} onChange={(e) => set('address', e.target.value)} />
              </Field>
            </div>
            <div className="full">
              <Field label="Horaires d’ouverture">
                <Input value={settings.hours} onChange={(e) => set('hours', e.target.value)} />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="mf-panel">
        <div className="mf-panel-head"><h3><Truck size={17} style={{ verticalAlign: -3, marginRight: 8 }} />Livraison</h3></div>
        <div className="mf-panel-body">
          <Field label="Seuil de livraison offerte (FCFA)" hint="Les commandes au-dessus de ce montant bénéficient de la livraison gratuite dans les zones éligibles.">
            <Input type="number" value={settings.freeDeliveryThreshold} onChange={(e) => set('freeDeliveryThreshold', Number(e.target.value))} />
          </Field>
        </div>
      </div>

      <div className="mf-panel">
        <div className="mf-panel-head"><h3><Share2 size={17} style={{ verticalAlign: -3, marginRight: 8 }} />Réseaux sociaux</h3></div>
        <div className="mf-panel-body">
          <div className="mf-form-grid">
            <Field label="Facebook">
              <Input value={settings.social.facebook} onChange={(e) => setSocial('facebook', e.target.value)} />
            </Field>
            <Field label="Instagram">
              <Input value={settings.social.instagram} onChange={(e) => setSocial('instagram', e.target.value)} />
            </Field>
            <Field label="X (Twitter)">
              <Input value={settings.social.x} onChange={(e) => setSocial('x', e.target.value)} />
            </Field>
            <Field label="TikTok">
              <Input value={settings.social.tiktok} onChange={(e) => setSocial('tiktok', e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" icon={Save} loading={saving} onClick={save}>
          Enregistrer les paramètres
        </Button>
      </div>
    </div>
  )
}