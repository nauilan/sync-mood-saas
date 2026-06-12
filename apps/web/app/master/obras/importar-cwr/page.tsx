// Rota legada — redirecionada para o novo módulo CWR
import { redirect } from 'next/navigation'

export default function ImportarCwrLegado() {
  redirect('/master/cwr')
}
