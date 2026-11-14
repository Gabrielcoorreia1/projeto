import './globals.css'

export const metadata = {
  title: 'Tarefas · Supabase + Vercel',
  description: 'Demo de deploy integrado Supabase + Vercel',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
