import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface MatchStartNotificationProps {
  matchTitle: string;
  team1: string;
  team2: string;
  onDismiss: () => void;
}

export function MatchStartNotification({ matchTitle, team1, team2, onDismiss }: MatchStartNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-[9998] animate-in slide-in-from-top-5 duration-500">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-2xl border-2 border-red-400 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 bg-white rounded-full p-2">
            <Activity className="h-5 w-5 text-red-600 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <h4 className="font-bold text-sm">MATCH STARTED!</h4>
            </div>
            <p className="text-xs font-semibold mb-2">{matchTitle}</p>
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between bg-white/20 rounded px-2 py-1">
                <span>{team1}</span>
                <span className="text-yellow-300">vs</span>
                <span>{team2}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="text-white/80 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
