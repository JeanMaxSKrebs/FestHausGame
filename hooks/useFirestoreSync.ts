/**
 * Hook para sincronizar GameManager com Firestore em tempo real
 */

import { useCallback, useEffect, useState } from 'react';
import { FirestoreManager, FirestorePlayerData, FirestoreRoomData } from '../game/FirestoreManager';
import { GameManager } from '../game/GameManager';

interface UseFirestoreSyncOptions {
  roomId: string;
  gameManager: GameManager | null;
  userId: string;
  onRoomUpdate?: (data: FirestoreRoomData) => void;
  onPlayersUpdate?: (players: FirestorePlayerData[]) => void;
  onError?: (error: any) => void;
}

export function useFirestoreSync({
  roomId,
  gameManager,
  userId,
  onRoomUpdate,
  onPlayersUpdate,
  onError,
}: UseFirestoreSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [unsubscribers, setUnsubscribers] = useState<Array<() => void>>([]);

  // Inicializar listeners
  useEffect(() => {
    const subs: Array<() => void> = [];

    try {
      // Listener para a sala
      const roomUnsub = FirestoreManager.listenToRoom(
        roomId,
        (roomData) => {
          console.log('📝 Room atualizada:', roomData);
          onRoomUpdate?.(roomData);
          setIsConnected(true);
        },
        (error) => {
          console.error('❌ Erro na sincronização da sala:', error);
          onError?.(error);
          setIsConnected(false);
        }
      );
      subs.push(roomUnsub);

      // Listener para players
      const playersUnsub = FirestoreManager.listenToPlayers(
        roomId,
        (players) => {
          console.log('👥 Players atualizados:', players);
          onPlayersUpdate?.(players);
          setIsConnected(true);
        },
        (error) => {
          console.error('❌ Erro na sincronização de players:', error);
          onError?.(error);
          setIsConnected(false);
        }
      );
      subs.push(playersUnsub);

      setUnsubscribers(subs);
    } catch (error) {
      console.error('❌ Erro ao inicializar listeners:', error);
      onError?.(error);
    }

    // Cleanup
    return () => {
      console.log('🧹 Limpando listeners...');
      subs.forEach((unsub) => {
        try {
          unsub();
        } catch (e) {
          console.error('Erro ao limpar listener:', e);
        }
      });
    };
  }, [roomId, onRoomUpdate, onPlayersUpdate, onError]);

  const disconnect = useCallback(() => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        console.error('Erro ao desconectar:', e);
      }
    });
    setUnsubscribers([]);
    setIsConnected(false);
  }, [unsubscribers]);

  return {
    isConnected,
    disconnect,
  };
}
