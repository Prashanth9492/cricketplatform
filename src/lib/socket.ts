import { io, Socket } from 'socket.io-client';

// Remove /api from the socket URL since Socket.IO connects to the base server
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const SOCKET_URL = API_BASE.replace('/api', '');

// Check if running on Vercel (Socket.IO not supported)
const isProduction = SOCKET_URL.includes('vercel.app');

class SocketService {
  private socket: Socket | null = null;

  connect() {
    // Disable Socket.IO in production (Vercel doesn't support it)
    if (isProduction) {
      console.log('⚠️ Socket.IO disabled in production (using polling instead)');
      return null;
    }

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  // Join a specific match room
  joinMatch(matchId: string) {
    if (this.socket) {
      this.socket.emit('joinMatch', matchId);
      console.log(`📡 Joined match room: ${matchId}`);
    }
  }

  // Leave a specific match room
  leaveMatch(matchId: string) {
    if (this.socket) {
      this.socket.emit('leaveMatch', matchId);
      console.log(`📡 Left match room: ${matchId}`);
    }
  }

  // Listen for ball updates
  onBallUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('ballUpdate', callback);
    }
  }

  // Listen for match started
  onMatchStarted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('matchStarted', callback);
    }
  }

  // Listen for match ended
  onMatchEnded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('matchEnded', callback);
    }
  }

  // Listen for score updates
  onScoreUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('scoreUpdate', callback);
    }
  }

  // Remove listeners
  offBallUpdate(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('ballUpdate', callback);
    }
  }

  offMatchStarted(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('matchStarted', callback);
    }
  }

  offMatchEnded(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('matchEnded', callback);
    }
  }

  offScoreUpdate(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('scoreUpdate', callback);
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();
