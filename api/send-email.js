import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, config } = req.body;

  if (!config || !config.host || !config.user || !config.pass) {
    return res.status(400).json({ error: 'Missing SMTP configuration' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: Number(config.port),
      secure: config.secure, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"RRHH CHS" <${config.user}>`,
      to: to,
      subject: subject,
      html: html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('SMTP Error:', error);
    return res.status(500).json({ error: error.message });
  }
}