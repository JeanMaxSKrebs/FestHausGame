import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GAME_RULES_TEXT } from '../game/gameRules';

type GameRulesModalProps = {
    visible: boolean;
    onClose: () => void;
};

export function GameRulesModal({ visible, onClose }: GameRulesModalProps) {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.rulesModal}>
                    <Text style={styles.rulesTitle}>Regras e bônus</Text>

                    <ScrollView>
                        <Text style={styles.rulesText}>{GAME_RULES_TEXT}</Text>
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.closeButtonText}>FECHAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        padding: 20,
    },

    rulesModal: {
        maxHeight: '85%',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 18,
    },

    rulesTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },

    rulesText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 21,
        marginBottom: 15,
    },

    closeButton: {
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },

    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});