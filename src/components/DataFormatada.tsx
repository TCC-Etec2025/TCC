import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function DataFormatada() {
  const hoje = new Date()

  const dataFormatada = format(
    hoje,
    "EEEE, d 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  )

  const formatadaComMaiuscula =
    dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)

  return formatadaComMaiuscula
}

export default DataFormatada
