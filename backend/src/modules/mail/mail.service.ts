import nodemailer from "nodemailer";
import { getSettings } from "../settings/settings.service";

/**
 * Sends a secure email to the specified recipient.
 */
export const sendMail = async (to: string, subject: string, html: string) => {
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
    console.warn(`\n⚠️ SMTP no configurado. No se pudo enviar el correo real a: ${to}`);
    console.warn(`Por favor, configure las credenciales SMTP en el panel de configuración o en el archivo backend/.env para habilitar el envío.\n`);
    return false;
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
      from: process.env.SMTP_FROM || `"Damian Print" <${smtpUser}>`,
      to,
      subject,
      html,
    });
    console.log(`✉️ Correo enviado exitosamente a: ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al enviar correo a ${to}:`, error);
    throw new Error("No se pudo enviar el correo de verificación. Por favor, contacte al soporte.");
  }
};
