import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type GameMode = 'normal' | 'bonus';

type GameModeSelectorProps = {
    gameMode: GameMode;
    onChange: (mode: GameMode) => void;
};

export function GameModeSelector({ gameMode, onChange }: GameModeSelectorProps) {
    return (
        <View style={styles.modeBox}>
            <Text style={styles.modeTitle}>Modo de jogo</Text>

            <View style={styles.modeButtons}>
                <TouchableOpacity
                    style={[
                        styles.modeButton,
                        gameMode === 'normal' && styles.modeButtonActive,
                    ]}
                    onPress={() => onChange('normal')}
                    activeOpacity={0.8}
                >
                    <Text
                        style={[
                            styles.modeButtonText,
                            gameMode === 'normal' && styles.modeButtonTextActive,
                        ]}
                    >
                        Normal
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.modeButton,
                        gameMode === 'bonus' && styles.modeButtonActive,
                    ]}
                    onPress={() => onChange('bonus')}
                    activeOpacity={0.8}
                >
                    <Text
                        style={[
                            styles.modeButtonText,
                            gameMode === 'bonus' && styles.modeButtonTextActive,
                        ]}
                    >
                        Com bônus
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    modeBox: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
    },

    modeTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },

    modeButtons: {
        flexDirection: 'row',
        gap: 10,
    },

    modeButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },

    modeButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },

    modeButtonText: {
        color: '#333',
        fontWeight: 'bold',
    },

    modeButtonTextActive: {
        color: '#fff',
    },
});