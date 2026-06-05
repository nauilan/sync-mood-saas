// Middleware de proteção de rotas — re-exporta lógica de proxy.ts como `middleware`
// para que o Next.js reconheça corretamente a função de middleware.
export { proxy as middleware, config } from './proxy'
