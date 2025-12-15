// components/ConfirmDialog.tsx
import { AlertTriangle, X } from 'lucide-react';
import React from 'react';


interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  requireTextConfirm?: boolean;
  textToConfirm?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'warning',
  requireTextConfirm = false,
  textToConfirm = ''
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = React.useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireTextConfirm && inputValue !== textToConfirm) {
      return;
    }
    onConfirm();
    setInputValue('');
  };

  const colors = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${
              type === 'danger' ? 'bg-red-100' : 
              type === 'warning' ? 'bg-yellow-100' : 
              'bg-blue-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                type === 'danger' ? 'text-red-600' : 
                type === 'warning' ? 'text-yellow-600' : 
                'text-blue-600'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-lg text-gray-600 whitespace-pre-line">{message}</p>
              
              {requireTextConfirm && (
                <div className="mt-4">
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Tapez "{textToConfirm}" pour confirmer
                  </label>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={textToConfirm}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={requireTextConfirm && inputValue !== textToConfirm}
            className={`px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${colors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}