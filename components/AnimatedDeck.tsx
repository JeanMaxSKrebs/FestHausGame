import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type AnimatedDeckProps = {
    disabled?: boolean;
    isMyTurn: boolean;
    hasDrawnCard: boolean;
    cardsLeft: number;
    onDraw: () => void;
};

function getDeckLevel(cardsLeft: number) {
    if (cardsLeft >= 50) return '50+';
    if (cardsLeft >= 40) return '40+';
    if (cardsLeft >= 30) return '30+';
    if (cardsLeft >= 20) return '20+';
    if (cardsLeft >= 10) return '10+';
    return String(cardsLeft);
}

function getDeckSpread(cardsLeft: number) {
    if (cardsLeft >= 50) return 5;
    if (cardsLeft >= 40) return 4;
    if (cardsLeft >= 30) return 3;
    if (cardsLeft >= 20) return 2;
    return 1;
}

export function AnimatedDeck({
    disabled = false,
    isMyTurn,
    hasDrawnCard,
    cardsLeft,
    onDraw,
}: AnimatedDeckProps) {
    const [animating, setAnimating] = useState(false);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const flyAnim = useRef(new Animated.Value(0)).current;
    const flipAnim = useRef(new Animated.Value(0)).current;

    const canDraw = isMyTurn && !hasDrawnCard && !disabled && !animating;
    const level = getDeckLevel(cardsLeft);
    const spread = getDeckSpread(cardsLeft);

    useEffect(() => {
        if (!canDraw) {
            pulseAnim.setValue(1);
            return;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.045,
                    duration: 720,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 720,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => animation.stop();
    }, [canDraw, pulseAnim]);

    const handlePress = () => {
        if (!canDraw) return;

        setAnimating(true);
        flyAnim.setValue(0);
        flipAnim.setValue(0);

        Animated.sequence([
            Animated.parallel([
                Animated.timing(flyAnim, {
                    toValue: 1,
                    duration: 520,
                    useNativeDriver: true,
                }),
                Animated.timing(flipAnim, {
                    toValue: 1,
                    duration: 520,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            onDraw();
            flyAnim.setValue(0);
            flipAnim.setValue(0);
            setAnimating(false);
        });
    };

    const flyTranslateY = flyAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -138],
    });

    const flyTranslateX = flyAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 18],
    });

    const flyScale = flyAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.12],
    });

    const flyRotate = flyAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '4deg'],
    });

    const flyRotateY = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['0deg', '90deg', '180deg'],
    });

    const flyOpacity = flyAnim.interpolate({
        inputRange: [0, 0.08, 0.88, 1],
        outputRange: [0, 1, 1, 0],
    });

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                activeOpacity={0.88}
                onPress={handlePress}
                disabled={!canDraw}
                style={styles.touchArea}
            >
                <Animated.View
                    style={[
                        styles.deckArea,
                        canDraw && styles.deckAreaActive,
                        !canDraw && styles.deckAreaDisabled,
                        { transform: [{ scale: pulseAnim }] },
                    ]}
                >
                    {spread >= 5 && (
                        <Image
                            source={require('../assets/images/cards/cardverso.png')}
                            style={[styles.deckBackCard, styles.deckLayerFive]}
                            resizeMode="cover"
                        />
                    )}

                    {spread >= 4 && (
                        <Image
                            source={require('../assets/images/cards/cardverso.png')}
                            style={[styles.deckBackCard, styles.deckLayerFour]}
                            resizeMode="cover"
                        />
                    )}

                    {spread >= 3 && (
                        <Image
                            source={require('../assets/images/cards/cardverso.png')}
                            style={[styles.deckBackCard, styles.deckLayerThree]}
                            resizeMode="cover"
                        />
                    )}

                    {spread >= 2 && (
                        <Image
                            source={require('../assets/images/cards/cardverso.png')}
                            style={[styles.deckBackCard, styles.deckLayerTwo]}
                            resizeMode="cover"
                        />
                    )}

                    <Image
                        source={require('../assets/images/cards/cardverso.png')}
                        style={styles.cardBack}
                        resizeMode="cover"
                    />

                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{level}</Text>
                    </View>

                    <Animated.Image
                        source={require('../assets/images/cards/cardverso.png')}
                        style={[
                            styles.flyingCard,
                            {
                                opacity: flyOpacity,
                                transform: [
                                    { translateY: flyTranslateY },
                                    { translateX: flyTranslateX },
                                    { rotate: flyRotate },
                                    { rotateY: flyRotateY },
                                    { scale: flyScale },
                                ],
                            },
                        ]}
                        resizeMode="cover"
                    />
                </Animated.View>
            </TouchableOpacity>

            <View style={styles.deckInfo}>
                <Text style={styles.deckTitle}>
                    {canDraw
                        ? 'Toque para comprar'
                        : hasDrawnCard
                            ? 'Carta comprada'
                            : 'Aguardando turno'}
                </Text>

                <Text style={styles.deckSubtitle}>
                    {cardsLeft} carta{cardsLeft === 1 ? '' : 's'} no monte
                </Text>
            </View>
        </View>
    );
}

const CARD_WIDTH = 118;
const CARD_HEIGHT = 160;

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        marginBottom: 22,
    },

    touchArea: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    deckArea: {
        width: 162,
        height: 212,
        alignItems: 'center',
        justifyContent: 'center',
    },

    deckAreaActive: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.26,
        shadowRadius: 12,
        elevation: 8,
    },

    deckAreaDisabled: {
        opacity: 0.72,
    },

    deckBackCard: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#fff',
    },

    deckLayerFive: {
        transform: [{ rotate: '-12deg' }, { translateX: -18 }, { translateY: 5 }],
    },

    deckLayerFour: {
        transform: [{ rotate: '10deg' }, { translateX: 17 }, { translateY: 4 }],
    },

    deckLayerThree: {
        transform: [{ rotate: '-7deg' }, { translateX: -10 }, { translateY: -2 }],
    },

    deckLayerTwo: {
        transform: [{ rotate: '6deg' }, { translateX: 10 }, { translateY: -1 }],
    },

    cardBack: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#fff',
    },

    flyingCard: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#fff',
        backfaceVisibility: 'hidden',
    },

    countBadge: {
        position: 'absolute',
        right: 10,
        bottom: 12,
        minWidth: 42,
        height: 30,
        borderRadius: 999,
        backgroundColor: '#2b1233',
        borderWidth: 2,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },

    countBadgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
    },

    deckInfo: {
        marginTop: 12,
        alignItems: 'center',
    },

    deckTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#2b1233',
    },

    deckSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 3,
    },
});