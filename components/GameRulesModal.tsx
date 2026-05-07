import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { CardDeck } from './CardDeck';

const RULE_CARDS = [
    {
        value: 1,
        label: 'A',
        title: 'Escolhe um',
        description: 'Escolha alguém para dar 1 gole.',
    },
    {
        value: 2,
        label: '2',
        title: 'Escolhe dois',
        description: 'Escolha duas pessoas para beber ou uma pessoa para beber 2 vezes.',
    },
    {
        value: 3,
        label: '3',
        title: 'Escolhe três',
        description: 'Escolha três pessoas ou distribua 3 goles.',
    },
    {
        value: 4,
        label: '4',
        title: 'Dedo na Mesa',
        description: 'O último que perceber bebe.',
    },
    {
        value: 5,
        label: '5',
        title: 'Cavalheiro',
        description: 'Todos os homens bebem.',
    },
    {
        value: 6,
        label: '6',
        title: 'Damas',
        description: 'Todas as mulheres bebem.',
    },
    {
        value: 7,
        label: '7',
        title: 'Pium',
        description:
            'No 7, múltiplos de 7 ou números com 7, diga “Pium”. Quem errar bebe.',
    },
    {
        value: 8,
        label: '8',
        title: 'Regra Geral',
        description: 'Crie uma regra. Quem descumprir até o fim do jogo bebe.',
    },
    {
        value: 9,
        label: '9',
        title: 'Stop',
        description: 'Escolha um tema. Quem travar ou repetir bebe.',
    },
    {
        value: 10,
        label: '10',
        title: 'Banheiro',
        description: 'Permite ir ao banheiro ou sair da mesa.',
    },
    {
        value: 11,
        label: 'J',
        title: 'Esquerda',
        description: 'Quem está à sua esquerda bebe.',
    },
    {
        value: 12,
        label: 'Q',
        title: 'Direita',
        description: 'Quem está à sua direita bebe.',
    },
    {
        value: 13,
        label: 'K',
        title: 'Rei do Copo',
        description:
            'Os 3 primeiros reis colocam bebida no copo central. O 4º rei vira o copo.',
    },
];

const BONUS_RULES = [
    'Jogadores começam sem cartas.',
    'Na sua vez, você compra uma carta do baralho central.',
    'Você pode usar a carta na hora ou guardar.',
    'Cartas guardadas podem ser usadas depois.',
    'Cartas de beber iguais podem formar combo e multiplicar a dose.',
    'Cartas de jogo, como Pium, Stop e Regra Geral, não entram em combo.',
    'A carta 4 pode cancelar sua derrota no Dedo na Mesa ou dobrar a dose do perdedor.',
    'A carta 10 pode ser negociada com outro jogador.',
];

const JOKER_RULE = {
    value: 0,
    label: 'Coringa',
    title: 'Coringa',
    description:
        'No modo bônus, existe 1 coringa por jogador. Se você tiver um coringa guardado, pode usá-lo no fim da rodada para adicionar +1 dose ao jogador mais votado.',
    isJoker: true,
};

type GameRulesModalProps = {
    visible: boolean;
    isSoloMode?: boolean;
    gameMode?: 'normal' | 'bonus' | string;
    onClose: () => void;
};

export function GameRulesModal({
    visible,
    isSoloMode = false,
    gameMode = 'normal',
    onClose,
}: GameRulesModalProps) {
    const shouldShowBonus = !isSoloMode && gameMode === 'bonus';

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.rulesModal}>
                    <Text style={styles.rulesTitle}>
                        {isSoloMode ? 'Regras' : 'Regras e Bônus'}
                    </Text>

                    <ScrollView
                        style={styles.rulesScroll}
                        showsVerticalScrollIndicator={false}
                    >
                        {RULE_CARDS.map((rule) => (
                            <View key={rule.value} style={styles.ruleCard}>
                                <CardDeck value={rule.label} index={rule.value} />

                                <View style={styles.ruleCardContent}>
                                    <Text style={styles.ruleCardLabel}>
                                        {rule.label} — {rule.title}
                                    </Text>

                                    <Text style={styles.ruleCardDescription}>
                                        {rule.description}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {shouldShowBonus && (
                            <View style={[styles.ruleCard, styles.jokerRuleCard]}>
                                <CardDeck value="Joker" index="0" isJoker />

                                <View style={styles.ruleCardContent}>
                                    <Text style={styles.ruleCardLabel}>Coringa — Bônus</Text>

                                    <Text style={styles.ruleCardDescription}>
                                        No modo bônus, existe 1 coringa por jogador no baralho. Se você guardar um coringa, pode usá-lo no fim da rodada para adicionar +1 dose ao jogador mais votado na votação secreta.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {shouldShowBonus && (<View style={styles.bonusBox}>
                            <Text style={styles.bonusTitle}>Bônus</Text>

                            {BONUS_RULES.map((bonus, index) => (
                                <Text key={`${bonus}-${index}`} style={styles.bonusText}>
                                    • {bonus}
                                </Text>
                            ))}
                        </View>
                        )}
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
        backgroundColor: 'rgba(23, 8, 31, 0.76)',
        justifyContent: 'center',
        padding: 18,
    },

    rulesModal: {
        maxHeight: '88%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 18,
        borderWidth: 2,
        borderColor: '#7c3aed',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
    },

    rulesTitle: {
        fontSize: 25,
        fontWeight: '900',
        color: '#2b1233',
        textAlign: 'center',
        marginBottom: 14,
    },

    rulesScroll: {
        maxHeight: '82%',
    },

    ruleCard: {
        flexDirection: 'row',
        backgroundColor: '#f7f1fb',
        borderRadius: 18,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eadcf5',
        alignItems: 'center',
        gap: 12,
    },

    ruleCardContent: {
        flex: 1,
    },

    ruleCardLabel: {
        fontSize: 17,
        fontWeight: '900',
        color: '#2b1233',
        marginBottom: 5,
    },

    ruleCardDescription: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        fontWeight: '600',
    },

    bonusBox: {
        backgroundColor: '#fff7e6',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#ffd280',
        marginTop: 4,
        marginBottom: 12,
    },

    bonusTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#7a4d00',
        marginBottom: 8,
        textAlign: 'center',
    },

    bonusText: {
        fontSize: 14,
        color: '#6b4700',
        lineHeight: 21,
        fontWeight: '700',
        marginBottom: 5,
    },

    closeButton: {
        backgroundColor: '#7c3aed',
        paddingVertical: 14,
        borderRadius: 14,
        marginTop: 12,
        alignItems: 'center',
    },

    closeButtonText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 15,
    },
    jokerRuleCard: {
        backgroundColor: '#EAF6FF',
        borderColor: '#4D82A9',
    },
});