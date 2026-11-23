# Nocturna · Panel de administración

Panel de administración de la tienda Nocturna. Aplicación React + Vite + Tailwind
independiente, pensada para desplegarse en `admin.tudominio.com`.

La tienda pública y la API viven en [`JPerez991/Tienda-Nocturna`](https://github.com/JPerez991/Tienda-Nocturna).
El contrato de la API es la única fuente de verdad: ver [`docs/API.md`](docs/API.md).

## Desarrollo

```bash
npm install
cp .env.example .env   # opcional; VITE_API_URL se deja vacío a propósito
npm run dev            # http://localhost:5174
```

El backend debe estar en `http://localhost:8080` (`cd backend && npm run dev` en
el repo principal). Vite proxyea `/api` y `/health` al backend para que la cookie
httpOnly de sesión sea **mismo origen**. Para apuntar a otro backend:

```bash
VITE_API_PROXY=http://localhost:8080 npm run dev
```

## Calidad

```bash
npm run lint
npm run build
```

## Variables de entorno

Solo `VITE_*` (se incrustan en el bundle): **nunca** poner secretos aquí.

| Variable | Uso |
| --- | --- |
| `VITE_STORE_URL` | Enlace "Ver la tienda" (local `http://localhost:5173`). |
| `VITE_API_URL` | Vacía: las llamadas van por `/api` (proxy/rewrite de mismo origen). |
| `VITE_API_PROXY` | Solo dev: destino del proxy de Vite (por defecto `http://localhost:8080`). |

## Despliegue

Vercel: importar este repo, Root Directory `/`, Framework *Vite*, build
`npm run build`, output `dist`. Reemplazar la URL de Railway en `vercel.json` y
añadir el dominio `admin.tudominio.com`. La guía completa está en
[`docs/DEPLOY.md`](https://github.com/JPerez991/Tienda-Nocturna/blob/main/docs/DEPLOY.md)
del repo principal.
