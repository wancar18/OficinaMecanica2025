# Oficina PWA (fix)
Correções aplicadas:
- `bcryptjs` usando `hashSync/compareSync` (login funcionando).
- `sqljs.exec()` aceita múltiplas instruções (migrations e seed OK).
- `Settings` sem `await` no JSX, e correção de `Blob` para TS 5.6.
- Navegação pós-login com React Router.

## Rodando
```bash
npm i
npm run dev
# build
npm run build && npm run preview
```
Login: **admin / 123** (obrigatória a troca na primeira sessão).
