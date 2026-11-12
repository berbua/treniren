// Transactional email over SMTP (EMAIL_SERVER_* / EMAIL_FROM env vars, see env.example)
import nodemailer from 'nodemailer'

export const isEmailConfigured = () =>
  Boolean(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD)

const createTransport = () => {
  const port = Number(process.env.EMAIL_SERVER_PORT) || 587
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port,
    secure: port === 465, // 587 upgrades with STARTTLS
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })
}

const RESET_EMAIL_TEXT = {
  pl: {
    subject: 'Reset hasła – Unicorn Climb',
    body: (link: string) =>
      `Ktoś (mamy nadzieję, że Ty) poprosił o reset hasła do Unicorn Climb.\n\n` +
      `Ustaw nowe hasło tutaj (link jest ważny przez godzinę):\n${link}\n\n` +
      `Jeśli to nie Ty, zignoruj tę wiadomość – hasło się nie zmieni.`,
  },
  en: {
    subject: 'Reset your Unicorn Climb password',
    body: (link: string) =>
      `Someone (hopefully you) asked to reset your Unicorn Climb password.\n\n` +
      `Set a new password here (the link is valid for one hour):\n${link}\n\n` +
      `If this wasn't you, ignore this email - your password won't change.`,
  },
}

export async function sendPasswordResetEmail(to: string, resetLink: string, language: 'pl' | 'en') {
  const text = RESET_EMAIL_TEXT[language]
  await createTransport().sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
    to,
    subject: text.subject,
    text: text.body(resetLink),
  })
}
