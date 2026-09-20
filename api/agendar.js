// Recibe las solicitudes de hora del formulario y las envia por correo con Resend.
// Funcion serverless de Vercel (CommonJS, sin dependencias: usa el fetch global).
//
// Variables de entorno necesarias:
//   RESEND_API_KEY  clave de https://resend.com/api-keys
//   AGENDA_TO       correo donde la clinica recibe las solicitudes
//   AGENDA_FROM     remitente verificado en Resend
//                   (por defecto "Sonrisa de Luffy <onboarding@resend.dev>",
//                    que solo puede enviar al correo dueno de la cuenta)

var MAX_BODY = 8000;

function limpiar(valor, max) {
  if (typeof valor !== "string") return "";
  return valor.trim().slice(0, max);
}

function escapar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "metodo_no_permitido" });
  }

  var cuerpo = req.body;
  if (typeof cuerpo === "string") {
    if (cuerpo.length > MAX_BODY) {
      return res.status(413).json({ error: "cuerpo_demasiado_grande" });
    }
    try {
      cuerpo = JSON.parse(cuerpo);
    } catch (e) {
      return res.status(400).json({ error: "json_invalido" });
    }
  }
  if (!cuerpo || typeof cuerpo !== "object") {
    return res.status(400).json({ error: "cuerpo_invalido" });
  }

  // Campo trampa: es invisible para las personas, asi que si viene lleno es un bot.
  // Respondemos 200 para no darle pistas y descartamos el envio.
  if (limpiar(cuerpo.empresa, 100)) {
    return res.status(200).json({ ok: true });
  }

  var nombre = limpiar(cuerpo.nombre, 120);
  var telefono = limpiar(cuerpo.telefono, 40);
  var email = limpiar(cuerpo.email, 160);
  var motivo = limpiar(cuerpo.motivo, 80);
  var fecha = limpiar(cuerpo.fecha, 40);
  var bloque = limpiar(cuerpo.bloque, 60);
  var mensaje = limpiar(cuerpo.mensaje, 2000);
  var primera = cuerpo.primera === true;

  var digitos = telefono.replace(/[^0-9]/g, "");
  if (nombre.length < 2 || digitos.length < 8 || !fecha) {
    return res.status(400).json({ error: "datos_incompletos" });
  }

  var apiKey = process.env.RESEND_API_KEY;
  var destino = process.env.AGENDA_TO;
  var remitente = process.env.AGENDA_FROM || "Sonrisa de Luffy <onboarding@resend.dev>";

  if (!apiKey || !destino) {
    console.error("Faltan RESEND_API_KEY o AGENDA_TO en las variables de entorno.");
    return res.status(500).json({ error: "correo_no_configurado" });
  }

  var filas = [
    ["Paciente", nombre],
    ["Telefono", telefono],
    ["Motivo", motivo || "No indicado"],
    ["Fecha preferida", fecha],
    ["Bloque horario", bloque || "No indicado"]
  ];
  if (email) filas.push(["Correo", email]);
  filas.push(["Primera visita", primera ? "Si" : "No"]);
  if (mensaje) filas.push(["Comentario", mensaje]);

  var texto = filas
    .map(function (f) { return f[0] + ": " + f[1]; })
    .join("\n");

  var html =
    '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#16211F">' +
    '<h2 style="margin:0 0 4px;font-size:18px">Nueva solicitud de hora</h2>' +
    '<p style="margin:0 0 16px;color:#5E6F6A;font-size:13px">Enviada desde el formulario del sitio.</p>' +
    '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">' +
    filas
      .map(function (f) {
        return (
          '<tr><td style="padding:6px 16px 6px 0;color:#5E6F6A;vertical-align:top;white-space:nowrap">' +
          escapar(f[0]) +
          '</td><td style="padding:6px 0;vertical-align:top">' +
          escapar(f[1]) +
          "</td></tr>"
        );
      })
      .join("") +
    "</table></div>";

  var correo = {
    from: remitente,
    to: [destino],
    subject: "Solicitud de hora: " + nombre + " - " + fecha + (bloque ? " (" + bloque + ")" : ""),
    text: texto,
    html: html
  };
  // Para que "Responder" en el cliente de correo le escriba al paciente.
  if (email) correo.reply_to = email;

  try {
    var respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(correo)
    });

    if (!respuesta.ok) {
      var detalle = await respuesta.text();
      console.error("Resend respondio " + respuesta.status + ": " + detalle);
      return res.status(502).json({ error: "envio_fallido" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("No se pudo contactar a Resend:", e && e.message);
    return res.status(502).json({ error: "envio_fallido" });
  }
};
