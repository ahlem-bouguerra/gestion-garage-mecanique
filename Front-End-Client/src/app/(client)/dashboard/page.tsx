export default function ClientDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <h1 className="text-2xl font-bold">Bienvenue dans votre espace client</h1>
        <p className="mt-2 text-blue-100">
          Gérez vos réservations, véhicules et factures en toute simplicité
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900">Réservations actives</h3>
          <p className="text-3xl font-bold text-blue-600">2</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900">Véhicules</h3>
          <p className="text-3xl font-bold text-blue-600">1</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900">Factures en attente</h3>
          <p className="text-3xl font-bold text-orange-600">1</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900">Total dépensé</h3>
          <p className="text-3xl font-bold text-green-600">1,250€</p>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dernières activités</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <span>Révision - Toyota Corolla</span>
            <span className="text-sm text-gray-500">Il y a 2 jours</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span>Paiement facture #FAC-001</span>
            <span className="text-sm text-gray-500">Il y a 5 jours</span>
          </div>
        </div>
      </div>
    </div>
  );
}