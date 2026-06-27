/**
 * Carrega .env.local antes dos testes de isolamento.
 * Em CI/CD, variáveis devem ser injetadas diretamente no ambiente.
 */
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    path: require('path').resolve(process.cwd(), '.env.local'),
    override: false, // não sobrescreve variáveis já definidas no ambiente
  })
} catch {
  // dotenv não disponível — usar variáveis de ambiente do sistema
}
