import { StyleSheet, Text, View } from 'react-native';

type GameStatusPanelProps = {
    round?: number;
    mode?: 'normal' | 'bonus' | string;
    currentPlayerName: string;
    isMyTurn: boolean;
    cardsLeft: number;
    kingCupCount: number;
};

export function GameStatusPanel({
    round = 1,
    mode = 'normal',
    currentPlayerName,
    isMyTurn,
    cardsLeft,
    kingCupCount,
}: GameStatusPanelProps) {
    return (
        <View style={styles.panel}>
            <View style={styles.topRow}>
                <View>
                    <Text style={styles.label}>Rodada</Text>
                    <Text style={styles.roundText}>{round}</Text>
                </View>

                <View style={styles.modeBadge}>
                    <Text style={styles.modeText}>
                        {mode === 'bonus' ? 'Bônus' : 'Normal'}
                    </Text>
                </View>
            </View>

            <View style={styles.turnBox}>
                <Text style={styles.label}>Vez de</Text>
                <Text style={styles.playerName}>
                    {isMyTurn ? 'Você' : currentPlayerName}
                </Text>
                <Text style={[styles.turnHint, isMyTurn && styles.turnHintActive]}>
                    {isMyTurn ? 'Sua vez de comprar uma carta' : 'Aguardando o jogador comprar'}
                </Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{cardsLeft}</Text>
                    <Text style={styles.statLabel}>no monte</Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{kingCupCount}/4</Text>
                    <Text style={styles.statLabel}>reis</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 18,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#eadcf5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },

    label: {
        fontSize: 12,
        color: '#777',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    roundText: {
        fontSize: 34,
        fontWeight: '900',
        color: '#2b1233',
        lineHeight: 38,
    },

    modeBadge: {
        backgroundColor: '#2b1233',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },

    modeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
    },

    turnBox: {
        backgroundColor: '#f7f1fb',
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
    },

    playerName: {
        fontSize: 23,
        fontWeight: '900',
        color: '#7c3aed',
        marginTop: 2,
    },

    turnHint: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },

    turnHintActive: {
        color: '#169b4f',
        fontWeight: '800',
    },

    statsRow: {
        flexDirection: 'row',
        gap: 10,
    },

    statCard: {
        flex: 1,
        backgroundColor: '#fafafa',
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },

    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#2b1233',
    },

    statLabel: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },
});