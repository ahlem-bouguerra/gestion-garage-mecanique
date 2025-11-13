import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirection automatique vers /dashboard au lieu de la page d'accueil
  redirect('/dashboard-reservation')
}