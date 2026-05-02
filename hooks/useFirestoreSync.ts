/**
 * Hook para sincronizar GameManager com Firestore em tempo real
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FirestoreManager,
  FirestorePlayerData,
  FirestoreRoomData,
} from '../game/FirestoreManager';
import { GameManager } from '../game/GameManager';

interface UseFirestoreSyncOptions {
  roomId?: string | null;
  gameManager: GameManager | null;
  userId?: string | null;
  enabled?: boolean;
  onRoomUpdate?: (data: FirestoreRoomData) => void;
  onPlayersUpdate?: (players: FirestorePlayerData[]) => void;
  onError?: (error: any) => void;
}

export function useFirestoreSync({
  roomId,
  gameManager,
  userId,
  enabled = true,
  onRoomUpdate,
  onPlayersUpdate,
  onError,
}: UseFirestoreSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  const onRoomUpdateRef = useRef(onRoomUpdate);
  const onPlayersUpdateRef = useRef(onPlayersUpdate);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onRoomUpdateRef.current = onRoomUpdate;
  }, [onRoomUpdate]);

  useEffect(() => {
    onPlayersUpdateRef.current = onPlayersUpdate;
  }, [onPlayersUpdate]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const cleanupListeners = useCallback(() => {
    if (unsubscribersRef.current.length > 0) {
      console.log('🧹 Limpando listeners...');
    }

    unsubscribersRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch (error) {
        console.error('Erro ao limpar listener:', error);
      }
    });

    unsubscribersRef.current = [];
    setIsConnected(false);
  }, []);

  useEffect(() => {
    const canSync = Boolean(enabled && roomId && userId);

    cleanupListeners();

    if (!canSync) {
      return;
    }

    const safeRoomId = String(roomId);

    try {
      console.log('👂 Escutando mudanças na sala:', safeRoomId);

      const roomUnsub = FirestoreManager.listenToRoom(
        safeRoomId,
        (roomData) => {
          console.log('📝 Room atualizada:', roomData);
          onRoomUpdateRef.current?.(roomData);
          setIsConnected(true);
        },
        (error) => {
          console.error('❌ Erro na sincronização da sala:', error);
          onErrorRef.current?.(error);
          setIsConnected(false);
        }
      );

      console.log('👂 Escutando players da sala:', safeRoomId);

      const playersUnsub = FirestoreManager.listenToPlayers(
        safeRoomId,
        (players) => {
          console.log('👥 Players atualizados:', players);
          onPlayersUpdateRef.current?.(players);
          setIsConnected(true);
        },
        (error) => {
          console.error('❌ Erro na sincronização de players:', error);
          onErrorRef.current?.(error);
          setIsConnected(false);
        }
      );

      unsubscribersRef.current = [roomUnsub, playersUnsub];
    } catch (error) {
      console.error('❌ Erro ao inicializar listeners:', error);
      onErrorRef.current?.(error);
      setIsConnected(false);
    }

    return () => {
      cleanupListeners();
    };
  }, [enabled, roomId, userId, cleanupListeners]);

  const disconnect = useCallback(() => {
    cleanupListeners();
  }, [cleanupListeners]);

  return {
    isConnected,
    disconnect,
  };
}