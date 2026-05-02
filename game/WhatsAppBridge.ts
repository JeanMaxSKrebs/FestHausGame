/**
 * WhatsApp Integration & Deep Links
 * Estrutura para criar convites dinâmicos via WhatsApp
 */

import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Share } from 'react-native';
import { WhatsAppInvite } from './types';

export class WhatsAppBridge {
  private static readonly WHATSAPP_API_BASE = 'https://api.whatsapp.com/send';
  private static readonly DEEP_LINK_SCHEME = 'festhausgame://room';

  static generateWhatsAppInvite(
    roomId: string,
    hostName: string,
    phoneNumbers: string[] = []
  ): WhatsAppInvite {
    const deepLink = this.generateDeepLink(roomId);
    const message = this.generateInviteMessage(hostName, roomId);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const encodedMessage = encodeURIComponent(message);

    let inviteLink = `${this.WHATSAPP_API_BASE}?text=${encodedMessage}`;

    if (phoneNumbers.length > 0) {
      const phone = phoneNumbers[0].replace(/\D/g, '');
      inviteLink = `${this.WHATSAPP_API_BASE}?phone=${phone}&text=${encodedMessage}`;
    }

    return {
      roomId,
      hostName,
      inviteLink,
      expiresAt,
      deepLink,
    };
  }

  static generateDeepLink(roomId: string): string {
    return `${this.DEEP_LINK_SCHEME}/${roomId}`;
  }

  private static generateInviteMessage(hostName: string, roomId: string): string {
    const deepLink = this.generateDeepLink(roomId);

    return (
      `🎮 Bora jogar Fest Haus Game?\n\n` +
      `${hostName} criou uma sala de jogo!\n\n` +
      `Código da sala: ${roomId}\n` +
      `Link para entrar: ${deepLink}\n\n` +
      `Se o link não abrir, copie o código da sala e entre manualmente pelo app.`
    );
  }

  static async sendViaWhatsApp(
    hostName: string,
    roomId: string,
    phoneNumber: string
  ): Promise<void> {
    const invite = this.generateWhatsAppInvite(roomId, hostName, [phoneNumber]);

    try {
      await Linking.openURL(invite.inviteLink);
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      throw new Error('WhatsApp não está instalado');
    }
  }

  static async shareInvite(hostName: string, roomId: string): Promise<void> {
    const message = this.generateInviteMessage(hostName, roomId);

    try {
      await Share.share({
        message,
        title: `Convite - Fest Haus Game`,
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      throw error;
    }
  }

  static setupDeepLinkHandler(onRoomJoin: (roomId: string) => void): () => void {
    const handleUrl = ({ url }: { url: string }) => {
      try {
        const route = url.replace(/.*:\/\/?/, '');
        const roomId = route.split('/')[1];

        if (route.startsWith('room/') && roomId) {
          onRoomJoin(roomId);
        }
      } catch (error) {
        console.warn('Erro ao processar deep link:', error);
      }
    };

    try {
      const subscription = Linking.addEventListener('url', handleUrl);

      setTimeout(() => {
        Linking.getInitialURL()
          .then((url: string | null) => {
            if (url) {
              handleUrl({ url });
            }
          })
          .catch((error) => {
            console.warn('Erro ao obter URL inicial:', error);
          });
      }, 100);

      return () => subscription.remove();
    } catch (error) {
      console.warn('Erro ao configurar deep link handler:', error);
      return () => { };
    }
  }

  static isInviteValid(invite: WhatsAppInvite): boolean {
    return new Date() < invite.expiresAt;
  }

  static async copyLinkToClipboard(deepLink: string): Promise<void> {
    try {
      await Clipboard.setStringAsync(deepLink);
    } catch (error) {
      console.error('Erro ao copiar para clipboard:', error);
      throw error;
    }
  }
}

export class InviteManager {
  private static invites: Map<string, WhatsAppInvite> = new Map();

  static createInvite(
    roomId: string,
    hostName: string,
    phoneNumbers?: string[]
  ): WhatsAppInvite {
    const invite = WhatsAppBridge.generateWhatsAppInvite(
      roomId,
      hostName,
      phoneNumbers
    );

    this.invites.set(roomId, invite);
    return invite;
  }

  static getInvite(roomId: string): WhatsAppInvite | undefined {
    return this.invites.get(roomId);
  }

  static isValidInvite(roomId: string): boolean {
    const invite = this.invites.get(roomId);
    return invite ? WhatsAppBridge.isInviteValid(invite) : false;
  }

  static revokeInvite(roomId: string): void {
    this.invites.delete(roomId);
  }

  static getAllActiveInvites(): WhatsAppInvite[] {
    return Array.from(this.invites.values()).filter((invite) =>
      WhatsAppBridge.isInviteValid(invite)
    );
  }
}