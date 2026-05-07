import { Image, StyleSheet, Text, View } from 'react-native';

type CardDeckProps = {
    value: string;
    index: string | number;
    isJoker?: boolean;
};

const LETTER_VALUES = ['A', 'J', 'Q', 'K'];

export function CardDeck({ value, index, isJoker = false }: CardDeckProps) {
    const shouldShowIndex = LETTER_VALUES.includes(String(value).toUpperCase());

    if (isJoker) {
        return (
            <View style={[styles.container, styles.jokerContainer]}>
                <Image
                    source={require('../assets/images/cards/joker.png')}
                    style={styles.jokerImage}
                    resizeMode="contain"
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.suit, styles.suitTopLeft]}>♠</Text>
            <Text style={[styles.suit, styles.suitTopRight]}>♥</Text>

            <Text style={[styles.suit, styles.suitBottomLeft]}>♦</Text>
            <Text style={[styles.suit, styles.suitBottomRight]}>♣</Text>

            <View style={styles.centerContent}>
                <Text style={styles.value}>{value}</Text>

                {shouldShowIndex && (
                    <Text style={styles.index}>{index}</Text>
                )}
            </View>

            <View style={styles.logoArea}>
                <Image
                    source={require('../assets/images/fhblack.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 92,
        height: 128,
        backgroundColor: '#E5F3FE',
        borderWidth: 3,
        borderColor: '#4D82A9',
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },

    jokerContainer: {
        backgroundColor: '#E5F3FE',
        borderColor: '#4D82A9',
        padding: 5,
    },

    jokerImage: {
        width: '100%',
        height: '100%',
    },

    suit: {
        position: 'absolute',
        color: '#464B4E',
        fontSize: 18,
        fontWeight: '900',
        lineHeight: 20,
    },

    suitTopLeft: {
        top: 3,
        left: 3,
    },

    suitTopRight: {
        top: 3,
        right: 3,
    },

    suitBottomLeft: {
        bottom: 3,
        left: 3,
    },

    suitBottomRight: {
        bottom: 3,
        right: 3,
    },

    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -14,
    },

    value: {
        color: '#000000',
        fontSize: 36,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 40,
    },

    index: {
        color: '#000000',
        fontSize: 12,
        fontWeight: '800',
        marginTop: -2,
    },

    logoArea: {
        position: 'absolute',
        bottom: 12,
        left: 20,
        right: 20,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },

    logoImage: {
        width: 56,
        height: 34,
    },
});