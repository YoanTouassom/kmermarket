import { useEffect, useState } from 'react'

/**
 * Retourne une version « retardée » d'une valeur.
 *
 * Utile pour ne pas déclencher une recherche ou une requête à chaque frappe :
 * la valeur ne se met à jour qu'après `delay` ms sans nouvelle modification.
 *
 * @param {*} value — valeur à observer
 * @param {number} delay — délai d'attente en ms
 * @returns {*} la valeur retardée
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export default useDebounce
