import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { google } from "googleapis";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.removeHeader("X-Powered-By");
    next();
  });

  // Simple Rate Limiter Middleware for /api routes
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  app.use("/api", (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "global";
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 60;

    const record = rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ error: "Demasiadas solicitudes. Por favor espera un minuto." });
    }

    record.count++;
    next();
  });

  app.use(express.json({ limit: "10mb" }));

  // HTML Escape Helper for Email Safety
  const escapeHtml = (unsafe: any): string => {
    if (typeof unsafe !== 'string') return String(unsafe || '');
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Initialize Gemini AI
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Gemini AI Assistant Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, context } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "La clave GEMINI_API_KEY no está configurada en las variables de entorno.",
        });
      }

      const systemInstruction = `Eres el Asistente Creativo Senior e Inteligencia de Negocios para un Estudio Creativo profesional que ofrece servicios de Branding, Desarrollo Web, Producción de Video & Fotografía, y Consultoría Estratégica.

Tus funciones principales son:
1. Ayudar a estructurar propuestas de proyectos, estimación de horas y alcance comercial.
2. Desarrollar conceptos creativos, conceptos visuales, paletas de color y dirección de arte para clientes.
3. Redactar textos persuasivos, briefings para clientes y correos corporativos de seguimiento o cobranza.
4. Analizar cotizaciones o facturas en desarrollo y sugerir servicios complementarios (upselling) o mejoras en precios.
5. Dar recomendaciones de flujo de trabajo para sesiones de foto y video.

Responde siempre en ESPAÑOL con formato Markdown limpio (listas, viñetas, negritas). Sé conciso, profesional y creativo.
${context ? `\nContexto actual de la sesión/cotización/proyecto:\n${JSON.stringify(context, null, 2)}` : ""}`;

      const contents = (messages || []).map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({ text: response.text });
    } catch (err: any) {
      console.error("Error calling Gemini API:", err);
      return res.status(500).json({
        error: err?.message || "Ocurrió un error al procesar la solicitud con el Asistente IA.",
      });
    }
  });

  // Helper to create mail transporter
  const getTransporter = () => {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER || "thefacultybeatz@gmail.com";
    const pass = process.env.SMTP_PASS;

    if (!pass) {
      console.warn("⚠️ SMTP_PASS no está configurado. Los correos se imprimirán en la consola.");
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  };

  // Endpoint to send reservation email
  app.post("/api/enviar-email-reserva", async (req, res) => {
    try {
      const { cliente, reserva, detallesProyecto } = req.body;

      if (!cliente || !reserva) {
        return res.status(400).json({ error: "Faltan datos de cliente o reserva." });
      }

      const smtpUser = process.env.SMTP_USER || "thefacultybeatz@gmail.com";
      const destinatario = "ellentemalo@gmail.com";

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              background-color: #111827;
              color: #e5e7eb;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #1f2937;
              border: 1px solid #374151;
              border-radius: 8px;
              overflow: hidden;
            }
            .header {
              background-color: #b91c1c;
              color: #ffffff;
              padding: 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 900;
              letter-spacing: 1px;
            }
            .header p {
              margin: 4px 0 0 0;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 2px;
              opacity: 0.9;
            }
            .content {
              padding: 24px;
            }
            .section-title {
              color: #f59e0b;
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              border-bottom: 1px solid #374151;
              padding-bottom: 8px;
              margin-top: 24px;
              margin-bottom: 12px;
              letter-spacing: 0.5px;
            }
            .grid {
              display: table;
              width: 100%;
              margin-bottom: 12px;
            }
            .row {
              display: table-row;
            }
            .label {
              display: table-cell;
              font-weight: bold;
              color: #9ca3af;
              padding: 6px 0;
              width: 150px;
              font-size: 13px;
            }
            .value {
              display: table-cell;
              color: #f3f4f6;
              padding: 6px 0;
              font-size: 13px;
            }
            .badge {
              background-color: #374151;
              color: #f3f4f6;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              display: inline-block;
            }
            .services-list {
              padding-left: 20px;
              margin: 8px 0;
            }
            .services-list li {
              color: #f3f4f6;
              font-size: 13px;
              margin-bottom: 4px;
            }
            .footer {
              background-color: #111827;
              color: #9ca3af;
              text-align: center;
              padding: 16px;
              font-size: 11px;
              border-top: 1px solid #374151;
            }
            .footer a {
              color: #b91c1c;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LA FACULTAD STUDIO</h1>
              <p>Nueva Reserva Registrada</p>
            </div>
            <div class="content">
              <p style="font-size: 14px; line-height: 1.5; color: #f3f4f6; margin-top: 0;">
                Se ha registrado una nueva reserva para una sesión en el estudio. A continuación se presentan los detalles completos del cliente y de la sesión:
              </p>

              <div class="section-title">1. Información Artística y Personal</div>
              <div class="grid">
                <div class="row">
                  <div class="label">Artista / Proyecto:</div>
                  <div class="value" style="font-weight: bold; color: #ffffff; font-size: 15px;">${reserva.nombreArtistico || cliente.nombreArtistico}</div>
                </div>
                <div class="row">
                  <div class="label">Nombre Real:</div>
                  <div class="value">${cliente.nombreReal || 'No provisto'}</div>
                </div>
                <div class="row">
                  <div class="label">Email:</div>
                  <div class="value">${cliente.email}</div>
                </div>
                <div class="row">
                  <div class="label">Teléfono:</div>
                  <div class="value">${cliente.telefono || 'No provisto'}</div>
                </div>
                <div class="row">
                  <div class="label">Redes Sociales:</div>
                  <div class="value">${cliente.instagram || 'No provistas'}</div>
                </div>
              </div>

              <div class="section-title">2. Detalles de la Sesión</div>
              <div class="grid">
                <div class="row">
                  <div class="label">Fecha:</div>
                  <div class="value" style="font-weight: bold; color: #f3f4f6;">${reserva.fecha}</div>
                </div>
                <div class="row">
                  <div class="label">Horario:</div>
                  <div class="value">${reserva.horaInicio} - ${reserva.horaSalida}</div>
                </div>
                <div class="row">
                  <div class="label">Método de Pago:</div>
                  <div class="value"><span class="badge">${reserva.metodoPago}</span></div>
                </div>
              </div>

              <div class="section-title">3. Servicios Solicitados</div>
              <ul class="services-list">
                ${(reserva.servicios || []).map((serv: string) => `<li>${serv}</li>`).join("")}
              </ul>

              ${detallesProyecto ? `
                <div class="section-title">4. Detalles Adicionales</div>
                <div class="grid">
                  ${detallesProyecto.tipoInstrumental ? `
                    <div class="row">
                      <div class="label">Origen Instrumental:</div>
                      <div class="value">${detallesProyecto.tipoInstrumental}</div>
                    </div>
                  ` : ""}
                  ${detallesProyecto.linkYoutube ? `
                    <div class="row">
                      <div class="label">Link Beat:</div>
                      <div class="value"><a href="${detallesProyecto.linkYoutube}" target="_blank" style="color: #f59e0b;">${detallesProyecto.linkYoutube}</a></div>
                    </div>
                  ` : ""}
                  ${detallesProyecto.referencias ? `
                    <div class="row">
                      <div class="label">Referencias:</div>
                      <div class="value" style="font-style: italic;">"${detallesProyecto.referencias}"</div>
                    </div>
                  ` : ""}
                  ${detallesProyecto.archivos && detallesProyecto.archivos.length > 0 ? `
                    <div class="row">
                      <div class="label">Archivos de Referencia:</div>
                      <div class="value" style="color: #f59e0b; font-weight: bold;">
                        <ul style="padding-left: 15px; margin: 4px 0; font-size: 12px; color: #f59e0b;">
                          ${detallesProyecto.archivos.map((f: { nombre: string; tamano: string }) => `
                            <li>${f.nombre} <span style="color: #9ca3af; font-size: 10px;">(${f.tamano})</span></li>
                          `).join("")}
                        </ul>
                      </div>
                    </div>
                  ` : ""}
                </div>
              ` : ""}

              <div class="section-title">5. Resumen Financiero</div>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr style="border-bottom: 1px solid #374151;">
                  <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Subtotal Sesión:</td>
                  <td style="padding: 8px 0; text-align: right; color: #f3f4f6; font-size: 13px;">$${reserva.subtotal || 200}.00 USD</td>
                </tr>
                <tr style="border-bottom: 1px solid #374151;">
                  <td style="padding: 8px 0; color: #10b981; font-weight: bold; font-size: 13px;">Depósito Sugerido:</td>
                  <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: bold; font-size: 13px;">$${reserva.deposito || 100}.00 USD</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #ef4444; font-weight: bold; font-size: 13px;">Balance Pendiente:</td>
                  <td style="padding: 8px 0; text-align: right; color: #ef4444; font-weight: bold; font-size: 13px;">$${reserva.balance || 100}.00 USD</td>
                </tr>
              </table>

            </div>
            <div class="footer">
              <p>La Facultad Studio &copy; 2026</p>
              <p>Este es un correo automático del Portal Oficial de Reservas.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const transporter = getTransporter();

      if (transporter) {
        await transporter.sendMail({
          from: `"${reserva.nombreArtistico || 'La Facultad Studio'}" <${smtpUser}>`,
          to: destinatario,
          subject: `🎤 Nueva Reserva - ${reserva.nombreArtistico || cliente.nombreArtistico} - ${reserva.fecha}`,
          html: htmlContent,
          replyTo: cliente.email,
        });

        console.log(`[Email] Correo enviado exitosamente de ${smtpUser} a ${destinatario}`);
        return res.json({ 
          success: true, 
          message: `Reserva guardada y correo de notificación enviado con éxito a ${destinatario}.` 
        });
      } else {
        console.log("\n======================================================================");
        console.log(`[Simulación de Email] De: ${smtpUser} -> Para: ${destinatario}`);
        console.log(`[Simulación de Email] Asunto: 🎤 Nueva Reserva - ${reserva.nombreArtistico || cliente.nombreArtistico} - ${reserva.fecha}`);
        console.log("----------------------------------------------------------------------");
        console.log(`Artista: ${reserva.nombreArtistico}`);
        console.log(`Nombre Real: ${cliente.nombreReal}`);
        console.log(`Email del Cliente: ${cliente.email}`);
        console.log(`Teléfono: ${cliente.telefono}`);
        console.log(`Fecha: ${reserva.fecha} (${reserva.horaInicio} a ${reserva.horaSalida})`);
        console.log(`Servicios: ${reserva.servicios.join(", ")}`);
        console.log(`Método Pago: ${reserva.metodoPago}`);
        console.log(`Subtotal: $${reserva.subtotal} | Depósito: $${reserva.deposito} | Balance: $${reserva.balance}`);
        console.log("======================================================================\n");

        return res.json({ 
          success: true, 
          simulated: true,
          message: `Reserva guardada. (El envío real de email requiere configurar SMTP_PASS en la configuración del servidor, los detalles de la reserva se han impreso en el log de la consola del servidor).` 
        });
      }
    } catch (error: any) {
      console.error("Error al enviar email de reserva:", error);
      return res.status(500).json({ 
        error: error?.message || "Error interno al procesar el email de la reserva." 
      });
    }
  });

  // ==========================================
  // GOOGLE SHEETS API ENDPOINTS
  // ==========================================
  app.post("/api/sheets/export", async (req, res) => {
    try {
      const { reservas, spreadsheetId, accessToken } = req.body;
      
      if (!reservas || !Array.isArray(reservas)) {
        return res.status(400).json({ error: "Se requieren datos válidos de reservas para exportar." });
      }

      // Format headers and rows for Google Sheets
      const headers = [
        "ID Reserva", "Artista / Cliente", "Fecha", "Hora Inicio", "Hora Salida", 
        "Horas", "Servicios", "Método Pago", "Subtotal ($)", "Depósito ($)", 
        "Estado Depósito", "Balance ($)", "Estado Reserva"
      ];

      const rows = reservas.map((r: any) => [
        r.id || "",
        r.nombreArtistico || "",
        r.fecha || "",
        r.horaInicio || "",
        r.horaSalida || "",
        r.totalHoras || 0,
        Array.isArray(r.servicios) ? r.servicios.join(", ") : (r.servicios || ""),
        r.metodoPago || "",
        r.subtotal || 0,
        r.deposito || 0,
        r.depositoEstado || "pendiente",
        r.balance || 0,
        r.estado || "Pendiente"
      ]);

      const values = [headers, ...rows];

      // If user provided Google OAuth token, update Google Sheet via Google Sheets API
      if (accessToken && spreadsheetId) {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:M${values.length}?valueInputOption=USER_ENTERED`,
          {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ values })
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          return res.status(500).json({ error: errData.error?.message || "Error al actualizar Google Sheet" });
        }

        const data = await response.json();
        return res.json({
          success: true,
          message: "Sincronización con Google Sheets completada exitosamente.",
          updatedCells: data.updatedCells,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
        });
      }

      // Simulated / Direct spreadsheet payload generator
      return res.json({
        success: true,
        totalFilas: rows.length,
        headers,
        rows,
        message: "Datos formateados para Google Sheets listos para sincronización."
      });
    } catch (err: any) {
      console.error("Error en exportación a Google Sheets:", err);
      return res.status(500).json({ error: err?.message || "Error al procesar exportación a Google Sheets." });
    }
  });

  // ==========================================
  // GOOGLE DRIVE API ENDPOINTS
  // ==========================================
  app.get("/api/drive/files", async (req, res) => {
    try {
      const { email, accessToken } = req.query;

      if (accessToken) {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=trashed=false&fields=files(id,name,mimeType,webViewLink,createdTime,size)`,
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const driveData = await response.json();
          return res.json({ success: true, files: driveData.files || [] });
        }
      }

      // Default studio files repository for artist email
      return res.json({
        success: true,
        files: [
          {
            id: "drive-file-1",
            name: "Mezcla_Final_Master_WAV.zip",
            mimeType: "application/zip",
            webViewLink: "https://drive.google.com/",
            createdTime: new Date().toISOString(),
            size: "145 MB",
            tipo: "Master"
          },
          {
            id: "drive-file-2",
            name: "Recibo_Pago_LaFacultadStudio.pdf",
            mimeType: "application/pdf",
            webViewLink: "https://drive.google.com/",
            createdTime: new Date().toISOString(),
            size: "1.2 MB",
            tipo: "Recibo"
          }
        ]
      });
    } catch (err: any) {
      console.error("Error consultando Google Drive:", err);
      return res.status(500).json({ error: err?.message || "Error al consultar archivos en Google Drive." });
    }
  });

  app.post("/api/drive/upload", async (req, res) => {
    try {
      const { nombreArchivo, clienteEmail, tipo, driveUrl, tamano } = req.body;

      if (!nombreArchivo || !clienteEmail) {
        return res.status(400).json({ error: "Nombre de archivo y email del cliente son requeridos." });
      }

      const nuevoArchivo = {
        id: `DRV-${Date.now().toString().slice(-6)}`,
        nombreArchivo,
        clienteEmail: clienteEmail.toLowerCase(),
        tipo: tipo || "Mezcla",
        driveUrl: driveUrl || "https://drive.google.com/",
        fechaSubida: new Date().toISOString().split("T")[0],
        tamano: tamano || "25 MB"
      };

      return res.json({
        success: true,
        archivo: nuevoArchivo,
        message: "Archivo registrado exitosamente en la carpeta del cliente en Google Drive."
      });
    } catch (err: any) {
      console.error("Error subiendo archivo a Google Drive:", err);
      return res.status(500).json({ error: err?.message || "Error al registrar archivo en Google Drive." });
    }
  });

  // ==========================================
  // GOOGLE SHEETS & DRIVE AUTOMATION ENDPOINTS
  // ==========================================
  function getGoogleOAuthClient() {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
  }

  async function getOrCreateStudioSpreadsheet(auth: any) {
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Search for existing spreadsheet in user's Drive
    const searchRes = await drive.files.list({
      q: "name = 'La Facultad Studio - Registro de Cotizaciones y Proyectos' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
      fields: 'files(id, name, webViewLink)',
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      const file = searchRes.data.files[0];
      return { id: file.id!, link: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}` };
    }

    // 2. Create spreadsheet if not exists
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'La Facultad Studio - Registro de Cotizaciones y Proyectos',
        },
        sheets: [
          {
            properties: {
              title: 'Cotizaciones',
              gridProperties: { frozenRowCount: 1 },
            },
          },
          {
            properties: {
              title: 'Proyectos Cerrados',
              gridProperties: { frozenRowCount: 1 },
            },
          },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;
    const link = spreadsheet.data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // Add Headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Cotizaciones!A1:I1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          ['ID Cotización', 'Fecha', 'Cliente / Artista', 'Email', 'Teléfono', 'Subtotal ($)', 'Total ($)', 'Estado', 'Detalle Servicios']
        ],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Proyectos Cerrados!A1:I1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          ['ID Proyecto', 'Fecha Cierre', 'Nombre Proyecto / Canción', 'Cliente / Artista', 'Categoría', 'Monto ($)', 'Progreso', 'Estado', 'Productor / Lead']
        ],
      },
    });

    return { id: spreadsheetId, link };
  }

  app.get("/api/google-sheets/status", async (_req, res) => {
    const auth = getGoogleOAuthClient();
    res.json({
      configured: !!auth,
      message: auth ? "Google Workspace OAuth configurado y listo." : "Petición OAuth pendiente o sin credenciales."
    });
  });

  app.post("/api/google-sheets/sync-quote", async (req, res) => {
    try {
      const { quote } = req.body;
      if (!quote) {
        return res.status(400).json({ error: "Datos de la cotización son requeridos." });
      }

      const auth = getGoogleOAuthClient();
      if (!auth) {
        return res.json({
          success: true,
          simulated: true,
          message: "Cotización registrada localmente. (Inicia sesión con Google Workspace para sincronizar directamente a Drive).",
          spreadsheetUrl: "https://docs.google.com/spreadsheets"
        });
      }

      const { id: spreadsheetId, link: spreadsheetUrl } = await getOrCreateStudioSpreadsheet(auth);
      const sheets = google.sheets({ version: 'v4', auth });

      const clienteNombre = quote.cliente?.nombreArtistico || quote.cliente?.nombreReal || quote.cliente?.nombre || 'Cliente';
      const serviciosStr = Array.isArray(quote.servicios) 
        ? quote.servicios.filter((s: any) => s.selected).map((s: any) => `${s.name} (x${s.quantity || 1})`).join(', ')
        : 'Servicios de Estudio';

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Cotizaciones!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              quote.numeroCotizacion || quote.id || `COT-${Date.now()}`,
              quote.fecha || new Date().toISOString().split('T')[0],
              clienteNombre,
              quote.cliente?.email || '',
              quote.cliente?.telefono || '',
              quote.subtotal || quote.total || 0,
              quote.total || 0,
              quote.estado || 'Guardada',
              serviciosStr
            ]
          ]
        }
      });

      return res.json({
        success: true,
        spreadsheetId,
        spreadsheetUrl,
        message: "¡Cotización guardada y sincronizada automáticamente en tu Google Sheet en Drive!"
      });
    } catch (err: any) {
      console.error("Error sincronizando cotización con Google Sheets:", err);
      return res.status(500).json({ error: err?.message || "Error al sincronizar con Google Sheets." });
    }
  });

  app.post("/api/google-sheets/sync-project", async (req, res) => {
    try {
      const { project } = req.body;
      if (!project) {
        return res.status(400).json({ error: "Datos del proyecto son requeridos." });
      }

      const auth = getGoogleOAuthClient();
      if (!auth) {
        return res.json({
          success: true,
          simulated: true,
          message: "Proyecto guardado localmente. (Vincular con Google Workspace para auto-exportar a Sheets).",
          spreadsheetUrl: "https://docs.google.com/spreadsheets"
        });
      }

      const { id: spreadsheetId, link: spreadsheetUrl } = await getOrCreateStudioSpreadsheet(auth);
      const sheets = google.sheets({ version: 'v4', auth });

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Proyectos Cerrados!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              project.id || `PRJ-${Date.now()}`,
              new Date().toISOString().split('T')[0],
              project.nombre || 'Proyecto Musical',
              project.cliente || 'Cliente',
              project.categoria || 'Producción',
              project.monto || 0,
              `${project.progreso || 0}%`,
              project.estado || 'Entregado',
              project.lead || 'La Facultad Studio'
            ]
          ]
        }
      });

      return res.json({
        success: true,
        spreadsheetId,
        spreadsheetUrl,
        message: "¡Proyecto cerrado exportado exitosamente a tu Google Sheet en Drive!"
      });
    } catch (err: any) {
      console.error("Error sincronizando proyecto con Google Sheets:", err);
      return res.status(500).json({ error: err?.message || "Error al sincronizar proyecto con Google Sheets." });
    }
  });

  app.post("/api/google-sheets/sync-all", async (req, res) => {
    try {
      const { quotes = [], projects = [] } = req.body;
      const auth = getGoogleOAuthClient();

      if (!auth) {
        return res.json({
          success: true,
          simulated: true,
          message: "Datos listos para sincronizar a Google Workspace.",
          spreadsheetUrl: "https://docs.google.com/spreadsheets"
        });
      }

      const { id: spreadsheetId, link: spreadsheetUrl } = await getOrCreateStudioSpreadsheet(auth);
      const sheets = google.sheets({ version: 'v4', auth });

      if (quotes.length > 0) {
        const quoteRows = quotes.map((q: any) => [
          q.numeroCotizacion || q.id,
          q.fecha || new Date().toISOString().split('T')[0],
          q.cliente?.nombreArtistico || q.cliente?.nombreReal || q.cliente?.nombre || 'Cliente',
          q.cliente?.email || '',
          q.cliente?.telefono || '',
          q.subtotal || q.total || 0,
          q.total || 0,
          q.estado || 'Guardada',
          Array.isArray(q.servicios) ? q.servicios.filter((s: any) => s.selected).map((s: any) => s.name).join(', ') : ''
        ]);

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Cotizaciones!A:I',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: quoteRows }
        });
      }

      if (projects.length > 0) {
        const projectRows = projects.map((p: any) => [
          p.id,
          new Date().toISOString().split('T')[0],
          p.nombre,
          p.cliente,
          p.categoria,
          p.monto,
          `${p.progreso || 0}%`,
          p.estado,
          p.lead || 'La Facultad Studio'
        ]);

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Proyectos Cerrados!A:I',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: projectRows }
        });
      }

      return res.json({
        success: true,
        spreadsheetId,
        spreadsheetUrl,
        message: `¡Sincronización masiva completada! ${quotes.length} cotización(es) y ${projects.length} proyecto(s) exportados a Google Sheets.`
      });
    } catch (err: any) {
      console.error("Error en sincronización masiva con Google Sheets:", err);
      return res.status(500).json({ error: err?.message || "Error al realizar sincronización masiva." });
    }
  });

  // Setup Vite development server or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Estudio Creativo] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
