const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

async function sendMail(to, subject, templateName, variables) {
  try {
    // Lire le template
    const templatePath = path.resolve(__dirname, "../templates", templateName);
    let htmlContent = fs.readFileSync(templatePath, "utf-8");

    // Remplacer les variables
    for (const key in variables) {
      const regex = new RegExp(`{{${key}}}`, "g");
      htmlContent = htmlContent.replace(regex, variables[key]);
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // Use true for port 465, false for port 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: htmlContent,
    });

    console.log("Mail envoyé :", info.messageId);
  } catch (error) {
    console.log(to, subject);
    console.error("Erreur lors de l'envoi du mail :", error);
  }
}

module.exports = sendMail;
