import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AlertMessagesProps {
  error: string;
  success: string;
}

export const AlertMessages: React.FC<AlertMessagesProps> = ({ error, success }) => (
  <>
    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
        <AlertCircle className="h-4 w-4 mr-2" />
        {error}
      </div>
    )}

    {success && (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
        <CheckCircle className="h-4 w-4 mr-2" />
        {success}
      </div>
    )}
  </>
);