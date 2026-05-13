import { useEffect, useRef } from 'react';
import {
    Alert,
    Animated,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { GameCard } from './GameCard';

type CardRevealModalProps = {
    visible: boolean;
    card: any | null;
    savedCard?: any | null;
    isMyTurn: boolean;
    hasSavedCard: boolean;
    onUseNow: () => void;
    onKeep: () => void;
    onTradeBathroom?: () => void;
    onClose?: () => void;
    soloMode?: boolean;
    bathroomName?: string;
    onBathroomNameChange?: (value: string) => void;
    onSaveBathroomName?: () => void;
    gameMode?: 'normal' | 'bonus';
    generalRuleText?: string;
    onGeneralRuleTextChange?: (value: string) => void;
    onSaveGeneralRule?: () => void;
};

function getFallbackRule(value: number) {
    switch (value) {
        case 1:
            return {
                title: 'Escolhe um',
                description: 'Você escolhe alguém para dar 1 gole.',
            };
        case 2:
            return {
                title: 'Escolhe dois',
                description: 'Escolha duas pessoas ou uma pessoa para beber 2 vezes.',
            };
        case 3:
            return {
                title: 'Escolhe três',
                description: 'Escolha três pessoas ou distribua 3 goles.',
            };
        case 4:
            return {
                title: 'Dedo na Mesa',
                description: 'O último que colocar o dedo na mesa bebe.',
            };
        case 5:
            return {
                title: 'Cavalheiro',
                description: 'Todos os homens bebem.',
            };
        case 6:
            return {
                title: 'Damas',
                description: 'Todas as mulheres bebem.',
            };
        case 7:
            return {
                title: 'Pium',
                description: 'No 7, múltiplos de 7 ou números com 7, diga Pium. Quem errar bebe.',
            };
        case 8:
            return {
                title: 'Regra Geral',
                description: 'Crie uma regra. Quem descumprir bebe.',
            };
        case 9:
            return {
                title: 'Stop',
                description: 'Escolha um tema. Quem travar ou repetir bebe.',
            };
        case 10:
            return {
                title: 'Banheiro',
                description: 'Pode ir ao banheiro/sair da mesa. Pode guardar ou negociar.',
            };
        case 11:
            return {
                title: 'O da Esquerda',
                description: 'Quem está à sua esquerda bebe.',
            };
        case 12:
            return {
                title: 'O da Direita',
                description: 'Quem está à sua direita bebe.',
            };
        case 13:
            return {
                title: 'Rei do Copo',
                description: '1º, 2º e 3º reis colocam bebida. O 4º vira o copo.',
            };
        default:
            return {
                title: 'Carta',
                description: 'Cumpra a regra da carta.',
            };
    }
}

export function CardRevealModal({
    visible,
    card,
    savedCard,
    isMyTurn,
    hasSavedCard,
    soloMode = false,
    gameMode = 'normal',

    bathroomName = '',
    onBathroomNameChange,
    onSaveBathroomName,

    generalRuleText = '',
    onGeneralRuleTextChange,
    onSaveGeneralRule,

    onUseNow,
    onKeep,
    onTradeBathroom,
    onClose,
}: CardRevealModalProps) {

    const scaleAnim = useRef(new Animated.Value(0.75)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const flipAnim = useRef(new Animated.Value(0)).current;

    const isBathroomCard = card?.value === 10;
    const isGeneralRuleCard = card?.value === 8;

    const canKeepCard =
        !soloMode &&
        (
            gameMode === 'bonus' ||
            (gameMode === 'normal' && isBathroomCard)
        );
    useEffect(() => {
        if (!visible || !card) {
            scaleAnim.setValue(0.75);
            opacityAnim.setValue(0);
            flipAnim.setValue(0);
            return;
        }

        Animated.sequence([
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 70,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(flipAnim, {
                toValue: 1,
                duration: 360,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible, card, opacityAnim, scaleAnim, flipAnim]);

    if (!card) return null;

    const fallbackRule = getFallbackRule(Number(card?.value || 0));
    const ruleTitle = card?.ruleTitle || fallbackRule.title;
    const ruleDescription = card?.ruleDescription || fallbackRule.description;

    const frontRotateY = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['90deg', '0deg'],
    });

    const handleTradePress = () => {
        Alert.alert(
            'Trocar carta?',
            'Trocar sua carta guardada pela carta revelada?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Trocar',
                    style: 'default',
                    onPress: onTradeBathroom || onKeep,
                },
            ]
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.modalCard,
                        {
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <Text style={styles.label}>Carta revelada</Text>

                    <Animated.View
                        style={[
                            styles.cardWrap,
                            {
                                transform: [{ rotateY: frontRotateY }],
                            },
                        ]}
                    >
                        <GameCard item={card} selected />
                    </Animated.View>

                    {hasSavedCard && savedCard && (
                        <View style={styles.tradePreview}>
                            <Text style={styles.tradeArrow}>⇅</Text>

                            <View style={styles.savedCardMiniBox}>
                                <Text style={styles.savedCardLabel}>Guardada</Text>

                                <View style={styles.savedCardMini}>
                                    <GameCard item={savedCard} />
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={styles.ruleBox}>
                        <Text style={styles.ruleTitle}>{ruleTitle}</Text>
                        <Text style={styles.ruleDescription}>{ruleDescription}</Text>
                    </View>

                    {soloMode && isBathroomCard && (
                        <View style={styles.extraInputBox}>
                            <Text style={styles.extraInputTitle}>Quem pegou banheiro?</Text>

                            <TextInput
                                style={styles.extraInput}
                                value={bathroomName}
                                onChangeText={onBathroomNameChange}
                                placeholder="Nome da pessoa"
                                placeholderTextColor="#999"
                            />

                            <TouchableOpacity
                                style={[styles.actionButton, styles.bathroomButton]}
                                onPress={onSaveBathroomName}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.actionText}>ADICIONAR BANHEIRO</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isGeneralRuleCard && (
                        <View style={styles.extraInputBox}>
                            <Text style={styles.extraInputTitle}>Nova regra geral</Text>

                            <TextInput
                                style={[styles.extraInput, styles.extraTextArea]}
                                value={generalRuleText}
                                onChangeText={onGeneralRuleTextChange}
                                placeholder="Ex: proibido falar a palavra beber"
                                placeholderTextColor="#999"
                                multiline
                            />

                            <TouchableOpacity
                                style={[styles.actionButton, styles.ruleButton]}
                                onPress={onSaveGeneralRule}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.actionText}>ADICIONAR REGRA</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isMyTurn ? (
                        <View style={styles.actions}>
                            {!isGeneralRuleCard && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.useButton]}
                                    onPress={onUseNow}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.actionText}>USAR AGORA</Text>
                                </TouchableOpacity>
                            )}

                            {canKeepCard && !hasSavedCard && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.keepButton]}
                                    onPress={onKeep}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.actionText}>GUARDAR</Text>
                                </TouchableOpacity>
                            )}

                            {!soloMode && hasSavedCard && canKeepCard && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.tradeButton]}
                                    onPress={handleTradePress}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.actionText}>
                                        {gameMode === 'bonus' ? 'GUARDAR E USAR A ANTIGA' : 'TROCAR BANHEIRO'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {!soloMode && !canKeepCard && (
                                <Text style={styles.shortWarning}>
                                    {gameMode === 'normal'
                                        ? 'No modo normal, só cartas Banheiro podem ser guardadas.'
                                        : 'Essa carta não pode ser guardada.'}
                                </Text>
                            )}
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.closeButton]}
                            onPress={onClose}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.actionText}>FECHAR</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(23, 8, 31, 0.72)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    modalCard: {
        width: '100%',
        maxWidth: 390,
        maxHeight: '92%',
        backgroundColor: '#fff',
        borderRadius: 26,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eadcf5',
    },

    label: {
        fontSize: 12,
        color: '#7c3aed',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.9,
        marginBottom: 12,
    },

    cardWrap: {
        marginBottom: 8,
    },

    tradePreview: {
        alignItems: 'center',
        marginBottom: 10,
    },

    tradeArrow: {
        fontSize: 30,
        color: '#7c3aed',
        fontWeight: '900',
        marginVertical: -2,
    },

    savedCardMiniBox: {
        alignItems: 'center',
    },

    savedCardLabel: {
        fontSize: 11,
        color: '#777',
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 4,
    },

    savedCardMini: {
        transform: [{ scale: 0.58 }],
        width: 70,
        height: 92,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
    },

    ruleBox: {
        width: '100%',
        backgroundColor: '#f7f1fb',
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
    },

    ruleTitle: {
        fontSize: 21,
        fontWeight: '900',
        color: '#2b1233',
        textAlign: 'center',
    },

    ruleDescription: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginTop: 6,
        textAlign: 'center',
    },

    actions: {
        width: '100%',
        gap: 10,
    },

    actionButton: {
        width: '100%',
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
    },

    useButton: {
        backgroundColor: '#34C759',
    },

    keepButton: {
        backgroundColor: '#5856D6',
    },

    tradeButton: {
        backgroundColor: '#FF9500',
    },

    closeButton: {
        backgroundColor: '#8E44AD',
    },

    actionText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
        textAlign: 'center',
    },

    shortWarning: {
        color: '#7a4d00',
        backgroundColor: '#fff7e6',
        borderWidth: 1,
        borderColor: '#ffd280',
        borderRadius: 12,
        paddingVertical: 9,
        paddingHorizontal: 10,
        fontSize: 13,
        fontWeight: '900',
        textAlign: 'center',
    },
    extraInputBox: {
        width: '100%',
        backgroundColor: '#fffaf0',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ffdca8',
    },

    extraInputTitle: {
        color: '#2b1233',
        fontWeight: '900',
        fontSize: 15,
        marginBottom: 8,
        textAlign: 'center',
    },

    extraInput: {
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eadcf5',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#333',
        fontSize: 15,
        marginBottom: 10,
    },

    extraTextArea: {
        minHeight: 70,
        textAlignVertical: 'top',
    },

    bathroomButton: {
        backgroundColor: '#00AEEF',
    },

    ruleButton: {
        backgroundColor: '#8E44AD',
    },
});