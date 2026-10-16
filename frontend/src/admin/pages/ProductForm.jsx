import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, ImageOff } from 'lucide-react'
import { productService } from '../../services/productService'
import { useCatalogStore } from '../../store/catalogStore'
import { useUIStore } from '../../store/uiStore'
import { Button, Field, Input, Textarea, Select, Spinner } from '../../components/ui/primitives'
import { SELL_UNITS } from '../../utils/constants'

const EMPTY = {
  name: '', categoryId: '', price: '', oldPrice: '', unit: '1 kg', stock: '',
  origin: 'Cameroun', tagline: '', description: '', image: '', tags: '',
  featured: false, isNew: false, available: true,
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { categories, refresh, loaded, load } = useCatalogStore()
  const success = useUIStore((s) => s.success)
  const error = useUIStore((s) => s.error)

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errs, setErrs] = useState({})

  useEffect(() => { if (!loaded) load() }, [loaded, load])

  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      const p = await productService.getById(id)
      if (!p) {
        error('Produit introuvable')
        navigate('/admin/products')
        return
      }
      setForm({
        ...EMPTY,
        ...p,
        price: p.price ?? '',
        oldPrice: p.oldPrice ?? '',
        stock: p.stock ?? '',
        tags: (p.tags || []).join(', '),
      })
      setLoading(false)
    })()
  }, [id, isEdit, navigate, error])

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrs((e) => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Le nom est requis.'
    if (!form.categoryId) e.categoryId = 'Choisissez une catégorie.'
    if (!(Number(form.price) > 0)) e.price = 'Prix invalide.'
    if (form.stock === '' || Number(form.stock) < 0) e.stock = 'Stock invalide.'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        unit: form.unit,
        stock: Number(form.stock),
        origin: form.origin,
        tagline: form.tagline,
        description: form.description,
        image: form.image,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        featured: !!form.featured,
        isNew: !!form.isNew,
        available: !!form.available,
      }
      if (isEdit) await productService.update(id, payload)
      else await productService.create(payload)
      await refresh()
      success(isEdit ? 'Produit mis à jour' : 'Produit créé')
      navigate('/admin/products')
    } catch (e2) {
      error(e2.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Chargement…" />

  return (
    <>
      <Link to="/admin/products" className="mf-back-link"><ArrowLeft size={16} /> Retour aux produits</Link>
      <form onSubmit={submit} className="mf-panel" style={{ marginTop: 16 }}>
        <div className="mf-panel-head">
          <h3>{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h3>
        </div>
        <div className="mf-panel-body">
          <div className="mf-form-grid">
            <div className="full">
              <Field label="Nom du produit" required error={errs.name}>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex : Tomates fraîches" error={errs.name} />
              </Field>
            </div>
            <Field label="Catégorie" required error={errs.categoryId}>
              <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} error={errs.categoryId}>
                <option value="">— Choisir —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Unité de vente">
              <Select value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                {SELL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </Field>
            <Field label="Prix (FCFA)" required error={errs.price}>
              <Input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="1500" error={errs.price} />
            </Field>
            <Field label="Ancien prix (promo)" hint="Laisser vide si pas de promotion.">
              <Input type="number" value={form.oldPrice} onChange={(e) => set('oldPrice', e.target.value)} placeholder="2000" />
            </Field>
            <Field label="Stock" required error={errs.stock}>
              <Input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="50" error={errs.stock} />
            </Field>
            <Field label="Origine">
              <Input value={form.origin} onChange={(e) => set('origin', e.target.value)} placeholder="Ex : Ouest, Cameroun" />
            </Field>
            <div className="full">
              <Field label="Accroche courte">
                <Input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Fraîchement récoltées le matin même" />
              </Field>
            </div>
            <div className="full">
              <Field label="Description">
                <Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Décrivez le produit, son goût, son usage en cuisine…" />
              </Field>
            </div>
            <div className="full">
              <Field label="URL de l’image" hint="Vous pourrez remplacer par des images locales dans src/assets.">
                <Input value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="https://…" />
              </Field>
            </div>
            <div className="full">
              <Field label="Tags (séparés par des virgules)">
                <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="frais, local, cuisine" />
              </Field>
            </div>
            <div>
              {form.image ? (
                <img src={form.image} alt="" className="mf-img-preview" />
              ) : (
                <div className="mf-img-preview mf-img-placeholder"><ImageOff size={30} /></div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
              <label className="mf-toggle">
                <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
                <span className="track" /><span className="lbl">Produit vedette</span>
              </label>
              <label className="mf-toggle">
                <input type="checkbox" checked={form.isNew} onChange={(e) => set('isNew', e.target.checked)} />
                <span className="track" /><span className="lbl">Nouveauté</span>
              </label>
              <label className="mf-toggle">
                <input type="checkbox" checked={form.available} onChange={(e) => set('available', e.target.checked)} />
                <span className="track" /><span className="lbl">Disponible à la vente</span>
              </label>
            </div>
          </div>
        </div>
        <div className="mf-panel-body" style={{ borderTop: '1px solid var(--ink-200)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Link to="/admin/products" className="btn btn-ghost">Annuler</Link>
          <Button type="submit" variant="primary" icon={Save} loading={saving}>
            {isEdit ? 'Enregistrer' : 'Créer le produit'}
          </Button>
        </div>
      </form>
    </>
  )
}