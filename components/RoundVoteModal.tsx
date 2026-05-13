import { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type RoundVoteModalProps = {
    visible: boolean;
    players: Array<{
        id: string;
        name: string;
    }>;
    currentUserId: string;
    selectedVote?: string;
    hasJoker: boolean;
    jokerUsed: boolean;
    secondsLeft: number;
    gameMode?: 'normal' | 'bonus';
    result?: {
        targetPlayerIds: string[];
        targetPlayerNames: string[];
        votes: number;
        extraDoses: number;
        totalDoses: number;
        tied: boolean;
    };
    onVote: (targetPlayerId: string) => void;
    onUseJoker: () => void;
};

export function RoundVoteModal({
    visible,
    players,
    currentUserId,
    selectedVote,
    hasJoker,
    jokerUsed,
    secondsLeft,
    onVote,
    onUseJoker,
    gameMode = 'normal',
    result,
}: RoundVoteModalProps) {
    const canUseJoker = gameMode === 'bonus' && hasJoker && !jokerUsed;

    const voteOptions = useMemo(
        () => players.filter((player) => player.id !== currentUserId),
        [players, currentUserId]
    );

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>
                        {gameMode === 'bonus' ? 'Votação bônus' : 'Voto secreto'}
                    </Text>
                    <Text style={styles.timer}>{secondsLeft}s</Text>

                    <Text style={styles.subtitle}>
                        Vote secretamente. O mais votado bebe 1 dose.
                        {gameMode === 'bonus' ? ' Coringas guardados aumentam a dose.' : ''}
                    </Text>

                    <ScrollView style={styles.list}>
                        {voteOptions.map((player) => (
                            <TouchableOpacity
                                key={player.id}
                                style={[
                                    styles.playerButton,
                                    selectedVote === player.id && styles.playerButtonSelected,
                                ]}
                                onPress={() => onVote(player.id)}
                            >
                                <Text
                                    style={[
                                        styles.playerText,
                                        selectedVote === player.id && styles.playerTextSelected,
                                    ]}
                                >
                                    {player.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {gameMode === 'bonus' && hasJoker && (
                        <TouchableOpacity
                            style={[
                                styles.jokerButton,
                                !canUseJoker && styles.disabledButton,
                            ]}
                            onPress={onUseJoker}
                            disabled={!canUseJoker}
                        >
                            <Text style={styles.jokerText}>
                                {jokerUsed ? 'CORINGA USADO' : 'USAR CORINGA (+1 DOSE)'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {result && (
                        <View style={styles.resultBox}>
                            <Text style={styles.resultTitle}>
                                {result.tied ? 'Empate!' : 'Resultado'}
                            </Text>

                            <Text style={styles.resultText}>
                                {result.tied
                                    ? `${result.targetPlayerNames.join(', ')} bebem ${result.totalDoses} dose(s) cada.`
                                    : `${result.targetPlayerNames[0]} bebe ${result.totalDoses} dose(s).`}
                            </Text>

                            {result.extraDoses > 0 && (
                                <Text style={styles.resultBonus}>
                                    +{result.extraDoses} dose(s) por coringa.
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(23,8,31,0.75)',
        justifyContent: 'center',
        padding: 20,
    },

    modal: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 18,
        maxHeight: '86%',
    },

    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#2b1233',
        textAlign: 'center',
    },

    timer: {
        fontSize: 34,
        fontWeight: '900',
        color: '#7c3aed',
        textAlign: 'center',
        marginVertical: 8,
    },

    subtitle: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 14,
        fontSize: 14,
    },

    list: {
        maxHeight: 280,
    },

    playerButton: {
        backgroundColor: '#f7f1fb',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eadcf5',
    },

    playerButtonSelected: {
        backgroundColor: '#7c3aed',
        borderColor: '#7c3aed',
    },

    playerText: {
        color: '#2b1233',
        fontWeight: '900',
        textAlign: 'center',
    },

    playerTextSelected: {
        color: '#fff',
    },

    jokerButton: {
        backgroundColor: '#FF9500',
        borderRadius: 14,
        padding: 14,
        marginTop: 10,
    },

    disabledButton: {
        opacity: 0.5,
    },

    jokerText: {
        color: '#fff',
        fontWeight: '900',
        textAlign: 'center',
    },

    footer: {
        fontSize: 12,
        color: '#777',
        textAlign: 'center',
        marginTop: 12,
    },
    resultBox: {
        backgroundColor: '#fff7e6',
        borderWidth: 1,
        borderColor: '#ffd280',
        borderRadius: 14,
        padding: 12,
        marginTop: 10,
    },

    resultTitle: {
        color: '#7a4d00',
        fontSize: 15,
        fontWeight: '900',
        textAlign: 'center',
    },

    resultText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 6,
    },

    resultBonus: {
        color: '#FF9500',
        fontSize: 13,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 4,
    },
});