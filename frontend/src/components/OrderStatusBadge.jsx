import { getOrderStatusMeta } from '../utils/constants'
import { Badge } from './ui/primitives'

/** Badge de statut de commande (libellé + couleur). */
export default function OrderStatusBadge({ status }) {
  const meta = getOrderStatusMeta(status)
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}