// src/components/dashboard/components/AlertsSection.tsx
import React from 'react';
import { AlertTriangle, Clock, Users, TrendingUp } from 'lucide-react';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  timestamp?: string;
}

interface AlertsSectionProps {
  alerts?: Alert[];
}

// Alertes par défaut (à remplacer par des données dynamiques)
const defaultAlerts: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Ordres en retard',
    message: '2 ordres de travail accusent un retard de plus de 24h',
    icon: Clock,
    timestamp: '2024-09-09T10:30:00Z'
  },
  {
    id: '2',
    type: 'error',
    title: 'Surcharge prévue',
    message: 'Charge élevée prévue pour la semaine prochaine (>100h). Planification recommandée.',
    icon: TrendingUp,
    timestamp: '2024-09-09T09:15:00Z'
  },
  {
    id: '3',
    type: 'info',
    title: 'Mécanicien absent',
    message: 'Ahmed Mili sera absent demain. Réaffectation des tâches nécessaire.',
    icon: Users,
    timestamp: '2024-09-09T08:45:00Z'
  }
];

const AlertsSection: React.FC<AlertsSectionProps> = ({ alerts = defaultAlerts }) => {
  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-l-4 border-red-400',
          icon: 'text-red-400',
          title: 'text-red-800',
          message: 'text-red-700'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-l-4 border-yellow-400',
          icon: 'text-yellow-400',
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-l-4 border-blue-400',
          icon: 'text-blue-400',
          title: 'text-blue-800',
          message: 'text-blue-700'
        };
      default:
        return {
          container: 'bg-gray-50 border-l-4 border-gray-400',
          icon: 'text-gray-400',
          title: 'text-gray-800',
          message: 'text-gray-700'
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="mt-8 bg-green-50 border-l-4 border-green-400 p-4 rounded">
        <div className="flex">
          <TrendingUp className="h-5 w-5 text-green-400 mr-3" />
          <div>
            <p className="text-sm text-green-700">
              <strong>Aucune alerte:</strong> Tous les indicateurs sont au vert !
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Alertes & Notifications ({alerts.length})
      </h3>
      
      {alerts.map((alert) => {
        const styles = getAlertStyles(alert.type);
        const IconComponent = alert.icon;
        
        return (
          <div key={alert.id} className={`${styles.container} p-4 rounded-lg`}>
            <div className="flex items-start">
              <IconComponent className={`h-5 w-5 ${styles.icon} mr-3 mt-0.5 flex-shrink-0`} />
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${styles.title}`}>
                    {alert.title}
                  </h4>
                  {alert.timestamp && (
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${styles.message}`}>
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertsSection;