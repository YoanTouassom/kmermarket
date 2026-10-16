import { useEffect, useState } from 'react'
import { Save, Megaphone, LayoutPanelTop, BadgeCheck, Eye, EyeOff } from 'lucide-react'
import { contentService } from '../../services/contentService'
import { useUIStore } from '../../store/uiStore'
import { Button, Field, Input, Textarea, Spinner } from '../../components/ui/primitives'

export default function Content() {
  const success = useUIStore((s) => s.success)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const c = await contentService.getContent()
      setContent(c)
      setLoading(false)
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    await contentService.updateContent(content)
    setSaving(false)
    success('Contenu enregistré')
  }

  const setHero = (k, v) => setContent((c) => ({ ...c, hero: { ...c.hero, [k]: v } }))
  const setBanner = (id, k, v) =>
    setContent((c) => ({ ...c, banners: c.banners.map((b) => (b.id === id ? { ...b, [k]: v } : b)) }))

  if (loading || !content) return <Spinner label="Chargement du contenu…" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="mf-panel">
        <div className="mf-panel-head"><h3><Megaphone size={17} style={{ verticalAlign: -3, marginRight: 8 }} />Bandeau d’annonce</h3></div>
        <div className="mf-panel-body">
          <Field label="Message affiché en haut du site">
            <Textarea rows={2} value={content.announcement} onChange={(e) => setContent({ ...content, announcement: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="mf-panel">
        <div className="mf-panel-head"><h3><LayoutPanelTop size={17} style={{ verticalAlign: -3, marginRight: 8 }} />Section d’accueil (Hero)</h3></div>
        <div className="mf-panel-body">
          <div className="mf-form-grid">
            <Field label="Sur-titre">
              <Input value={content.hero.eyebrow} onChange={(e) => setHero('eyebrow', e.target.value)} />
            </Field>
            <Field label="Titre principal">
              <Input value={content.hero.title} onChange={(e) => setHero('title', e.target.value)} />
            </Field>
            <div className="full">
              <Field label="Sous-titre">
                <Textarea rows={3} value={content.hero.subtitle} onChange={(e) => setHero('subtitle', e.target.value)} />
              </Field>
            </div>
            <Field label="Bouton principal">
              <Input value={content.hero.primaryCta} onChange={(e) => setHero('primaryCta', e.target.value)} />
            </Field>
            <Field label="Bouton secondaire">
              <Input value={content.hero.secondaryCta} onChange={(e) => setHero('secondaryCta', e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      <div className="mf-panel">
        <div className="mf-panel-head"><h3><BadgeCheck size={17} style={{ verticalAlign: -3, marginRight: 8 }} />Bannières de confiance</h3></div>
        <div className="mf-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {content.banners.map((b) => (
            <div key={b.id} className="mf-form-grid" style={{ alignItems: 'end' }}>
              <Field label="Titre">
                <Input value={b.title} onChange={(e) => setBanner(b.id, 'title', e.target.value)} />
              </Field>
              <Field label="Texte">
                <Input value={b.text} onChange={(e) => setBanner(b.id, 'text', e.target.value)} />
              </Field>
              <div>
                <Button
                  variant={b.enabled ? 'outline' : 'ghost'}
                  icon={b.enabled ? Eye : EyeOff}
                  onClick={() => setBanner(b.id, 'enabled', !b.enabled)}
                >
                  {b.enabled ? 'Visible' : 'Masquée'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" icon={Save} loading={saving} onClick={save}>
          Enregistrer le contenu
        </Button>
      </div>
    </div>
  )
}