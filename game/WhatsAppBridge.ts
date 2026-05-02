/**
 * WhatsApp Integration & Deep Links
 * Estrutura para criar convites dinâmicos via WhatsApp
 */

import * as Linking from 'expo-linking';
import { WhatsAppInvite } from './types';

export class WhatsAppBridge {
  private static readonly WHATSAPP_API_BASE = 'https://api.whatsapp.com/send';
  private static readonly DEEP_LINK_SCHEME = 'festhausgame://room';

  /**
   * Gera um link de convite para WhatsApp com Deep Link
   * @param roomId - ID da sala de jogo
   * @param hostName - Nome do host
   * @param phoneNumbers - Array de números para enviar
   */
  static generateWhatsAppInvite(
    roomId: string,
    hostName: string,
    phoneNumbers: string[] = []
  ): WhatsAppInvite {
    const deepLink = this.generateDeepLink(roomId);
    const message = this.generateInviteMessage(hostName, roomId);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Válido por 24 horas

    // Codificar mensagem para URL
    const encodedMessage = encodeURIComponent(message);

    // Se houver números, criar link direto para o WhatsApp
    let inviteLink = '';
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

  /**
   * Gera um Deep Link para abrir a sala diretamente no app
   */
  static generateDeepLink(roomId: string): string {
    return `${this.DEEP_LINK_SCHEME}/${roomId}`;
  }

  /**
   * Gera a mensagem de convite para WhatsApp
   */
  private static generateInviteMessage(hostName: string, roomId: string): string {
    const deepLink = this.generateDeepLink(roomId);
    return (
      `Hey! 🎮 Que tal jogar uma partida comigo de Fest Haus Game? ` +
      `\n\n` +
      `${hostName} criou uma sala de jogo!\n` +
      `Sala: ${roomId}\n` +
      `\n` +
      `Toque aqui para entrar: ${deepLink}\n` +
      `\n` +
      `Ou baixe em: play.google.com/store/apps/details?id=com.festhausgame`
    );
  }

  /**
   * Abre o WhatsApp com a mensagem de convite pré-preenchida
   */
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

  /**
   * Compartilha o link via sistema de compartilhamento nativo
   */
  static async shareInvite(
    hostName: string,
    roomId: string
  ): Promise<void> {
    const message = this.generateInviteMessage(hostName, roomId);
    const deepLink = this.generateDeepLink(roomId);

    try {
      // Usar o Sharing do Expo (funciona em iOS e Android)
      // Você precisaria importar Share do react-native
      const { Share } = require('react-native');

      await Share.share({
        message: message,
        url: deepLink, // iOS
        title: `Convite - Jogo com ${hostName}`,
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      throw error;
    }
  }

  /**
   * Configura o handler para Deep Links na app
   * Deve ser chamado no layout raiz
   */
  static setupDeepLinkHandler(
    onRoomJoin: (roomId: string) => void
  ): (() => void) {
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
      // Listener para quando o app é aberto via deep link
      const subscription = Linking.addEventListener('url', handleUrl);

      // Também verificar URL inicial quando o app é aberto (com delay para garantir que o contexto está pronto)
      setTimeout(() => {
        try {
          Linking.getInitialURL().then((url: string | null) => {
            if (url != null) {
              handleUrl({ url });
            }
          }).catch((error) => {
            console.warn('Erro ao obter URL inicial:', error);
          });
        } catch (error) {
          console.warn('Erro ao processar URL inicial:', error);
        }
      }, 100);

      return () => subscription.remove();
    } catch (error) {
      console.warn('Erro ao configurar deep link handler:', error);
      return () => {}; // Retorna função vazia se falhar
    }
  }

  /**
   * Valida um convite (verifica se não expirou)
   */
  static isInviteValid(invite: WhatsAppInvite): boolean {
    return new Date() < invite.expiresAt;
  }

  /**
   * Copia o link para a área de transferência
   */
  static async copyLinkToClipboard(deepLink: string): Promise<void> {
    try {
      const { Clipboard } = require('expo-clipboard');
      await Clipboard.setString(deepLink);
    } catch (error) {
      console.error('Erro ao copiar para clipboard:', error);
      throw error;
    }
  }
}

/**
 * Gerenciador de Convites (Persistência)
 */
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
