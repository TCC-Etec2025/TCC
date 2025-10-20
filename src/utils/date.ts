import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function toDate(input?: Date | string) {
  if (!input) return new Date()
  if (input instanceof Date) return input
  // tenta parsear ISO; se falhar, cria Date diretamente
  try {
    return parseISO(input)
  } catch {
    return new Date(input)
  }
}

/**
 * Retorna data por extenso em português (ex: "Sexta, 17 de outubro de 2025")
 */
export function formatDateLong(input?: Date | string): string {
  const date = toDate(input)
  const formatted = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/**
 * Retorna data apenas com números no formato YYYYMMDD (ex: 20251017)
 */
export function formatDateNumeric(input?: Date | string): string {
  const date = toDate(input)
  return format(date, 'yyyy-MM-dd')
}

export default {
  formatDateLong,
  formatDateNumeric,
}
