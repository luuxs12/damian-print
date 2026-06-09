import nodemailer from "nodemailer";
const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT) || 587;
const secure = process.env.SMTP_SECURE === "true";
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
});
/**
 * Sends a secure email to the specified recipient.
 */
export const sendMail = async (to, subject, html) => {
    if (!user || !pass) {
        console.warn(`\n⚠️ SMTP no configurado en el archivo .env. No se pudo enviar el correo real a: ${to}`);
        console.warn(`Por favor, añade SMTP_USER y SMTP_PASS en backend/.env para habilitar el envío real.\n`);
        return false;
    }
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Damian Print" <${user}>`,
            to,
            subject,
            html,
        });
        console.log(`✉️ Correo enviado exitosamente a: ${to}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Error al enviar correo a ${to}:`, error);
        throw new Error("No se pudo enviar el correo de verificación. Por favor, contacte al soporte.");
    }
};
