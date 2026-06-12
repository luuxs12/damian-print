import nodemailer from "nodemailer";
import { getSettings } from "../settings/settings.service";

/**
 * Sends a secure email to the specified recipient.
 */
export const sendMail = async (to: string, subject: string, html: string): Promise<{ sent: boolean; previewUrl?: string }> => {
  let smtpUser = process.env.SMTP_USER;
  let smtpPass = process.env.SMTP_PASS;

  try {
    const sysSettings = await getSettings();
    if (sysSettings.smtpUser?.trim() && sysSettings.smtpPass?.trim()) {
      smtpUser = sysSettings.smtpUser.trim();
      smtpPass = sysSettings.smtpPass.trim();
    }
  } catch (error) {
    console.error("⚠️ Error al leer credenciales SMTP desde la base de datos:", error);
  }

  if (!smtpUser || !smtpPass) {
    console.warn(`\n⚠️ SMTP no configurado. Iniciando fallback con Ethereal Email para: ${to}...`);
    try {
      const testAccount = await nodemailer.createTestAccount();
      const host = "smtp.ethereal.email";
      const port = 587;
      const secure = false;
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const info = await transporter.sendMail({
        from: `"Industria Gráfica Damian (Pruebas)" <${testAccount.user}>`,
        to,
        subject,
        html,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      console.log(`✉️ [FALLBACK] Correo de prueba enviado exitosamente a: ${to}`);
      if (previewUrl) {
        console.log(`🔗 Vista previa del correo: ${previewUrl}\n`);
      }
      return { sent: true, previewUrl };
    } catch (err) {
      console.error("❌ Fallback de Ethereal Email falló:", err);
      return { sent: false };
    }
  }

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: smtpUser, pass: smtpPass },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Industria Gráfica Damian" <${smtpUser}>`,
      to,
      subject,
      html,
    });
    console.log(`✉️ Correo enviado exitosamente a: ${to}`);
    return { sent: true };
  } catch (error) {
    console.error(`❌ Error al enviar correo a ${to}:`, error);
    throw new Error("No se pudo enviar el correo. Por favor, verifique la configuración SMTP.");
  }
};
