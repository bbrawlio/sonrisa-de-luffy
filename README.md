# Sonrisa de Luffy — landing page

Sitio estático de una sola página para agendar horas. Sin build, sin dependencias:
`index.html` lleva el CSS y el JS dentro.

```
index.html     la página completa (HTML + CSS + JS)
favicon.svg    marca de la clínica
robots.txt     indexación abierta
sitemap.xml    una sola URL
```

## Antes de publicar: datos que hay que cambiar

Todos los datos de contacto son de ejemplo. Busca y reemplaza en `index.html`:

| Dato | Valor actual | Dónde aparece |
|---|---|---|
| Teléfono | `+56 9 1234 5678` | cabecera, pie, JSON-LD |
| WhatsApp | `56912345678` | constante `WHATSAPP` en el script, enlaces `wa.me`, JSON-LD |
| Correo | `hola@sonrisadeluffy.cl` | pie, JSON-LD |
| Dirección | `Av. Los Alerces 1420, oficina 302` | franja de datos, pie, JSON-LD |
| Dominio | `https://sonrisadeluffy.cl/` | `canonical`, `og:url`, `robots.txt`, `sitemap.xml`, JSON-LD |
| Horarios | `9:00–19:00` / `9:00–14:00` | franja de datos, pie, JSON-LD |

El número de WhatsApp va en formato internacional sin `+` ni espacios: `56912345678`.

## Desplegar en Vercel

Es un sitio estático sin build, así que Vercel lo sirve sin configuración:
no hace falta `vercel.json` ni un framework preset. En los ajustes del proyecto,
Framework Preset queda en **Other** y los campos de build, vacíos.

**Opción A — desde GitHub (no requiere Node instalado)**

1. Sube esta carpeta a un repositorio de GitHub.
2. En [vercel.com/new](https://vercel.com/new), importa el repositorio.
3. Deja el preset en *Other* y pulsa Deploy.

Cada `git push` vuelve a desplegar.

**Opción B — desde la terminal (requiere Node)**

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Dominio propio

En el proyecto de Vercel: Settings → Domains → añade `sonrisadeluffy.cl` y apunta
los DNS del registrador a los que indique Vercel. El certificado HTTPS es automático.
Después de conectar el dominio, actualiza las URLs de la tabla de arriba.

## El formulario

El formulario no envía nada a un servidor: valida los campos, muestra un resumen
y arma un mensaje de WhatsApp prellenado que el paciente confirma. Si más adelante
quieres que las solicitudes queden registradas, el punto de conexión es el manejador
`submit` al final de `index.html`.
