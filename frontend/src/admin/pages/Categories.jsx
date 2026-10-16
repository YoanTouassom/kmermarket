import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react'
import { categoryService } from '../../services/categoryService'
import { useCatalogStore } from '../../store/catalogStore'
import { useUIStore } from '../../store/uiStore'
import AdminToolbar from '../components/AdminToolbar'
import { Button, Field, Input, Textarea, Modal, EmptyState, ConfirmDialog, Spinner } from '../../components/ui/primitives'

const EMPTY = { name: '', description: '', image: '' }

export default function Categories() {
  const refresh = useCatalogStore((s) => s.refresh)
  const success = useUIStore((s) => s.success)
  const error = useUIStore((s) => s.error)

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [ask, setAsk] = useState(null)

  const load = async () => {
    setLoading(true)
    const data = await categoryService.listWithCounts()
    setList(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing('new'); setForm(EMPTY) }
  const openEdit = (c) => { setEditing(c.id); setForm({ name: c.name, description: c.description || '', image: c.image || '' }) }
  const close = () => { setEditing(null); setForm(EMPTY) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editing === 'new') await categoryService.create(form)
      else await categoryService.update(editing, form)
      await load()
      await refresh()
      success(editing === 'new' ? 'Catégorie créée' : 'Catégorie mise à jour')
      close()
    } catch (e2) {
      error(e2.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await categoryService.remove(ask.id)
      await load()
      await refresh()
      success('Catégorie supprimée')
    } catch (e2) {
      error(e2.message)
    } finally {
      setAsk(null)
    }
  }

  const filtered = list.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher une catégorie…"
        action={<Button variant="primary" icon={Plus} onClick={openNew}>Nouvelle catégorie</Button>}
      />

      <div className="mf-panel">
        {loading ? (
          <Spinner label="Chargement…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FolderTree} title="Aucune catégorie" text="Créez des catégories pour organiser votre catalogue." />
        ) : (
          <div className="mf-table-wrap">
            <table className="mf-table">
              <thead>
                <tr><th>Catégorie</th><th>Description</th><th>Produits</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-prod">
                        {c.image ? <img src={c.image} alt="" /> : <span className="mf-cat-ic"><FolderTree size={18} /></span>}
                        <div className="nm">{c.name}</div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--ink-600)', fontSize: 13 }}>{c.description || '—'}</td>
                    <td><span className="mf-count-pill">{c.productCount}</span></td>
                    <td>
                      <div className="mf-table-actions">
                        <button className="mf-act-btn edit" onClick={() => openEdit(c)} title="Modifier"><Pencil size={16} /></button>
                        <button className="mf-act-btn del" onClick={() => setAsk(c)} title="Supprimer"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={close}
        title={editing === 'new' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
        footer={
          <>
            <Button variant="ghost" onClick={close}>Annuler</Button>
            <Button variant="primary" loading={saving} onClick={save}>Enregistrer</Button>
          </>
        }
      >
        <form className="mf-form-grid" onSubmit={save}>
          <div className="full">
            <Field label="Nom" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex : Légumes" />
            </Field>
          </div>
          <div className="full">
            <Field label="Description">
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
          <div className="full">
            <Field label="URL de l’image">
              <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!ask}
        onClose={() => setAsk(null)}
        onConfirm={remove}
        title="Supprimer cette catégorie ?"
        message={ask?.productCount ? `« ${ask.name} » contient ${ask.productCount} produit(s). Supprimez-les d’abord.` : `La catégorie « ${ask?.name} » sera supprimée.`}
        confirmLabel="Supprimer"
      />
    </>
  )
}