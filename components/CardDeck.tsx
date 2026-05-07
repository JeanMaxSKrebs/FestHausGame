import { Image, StyleSheet, Text, View } from 'react-native';

type CardDeckProps = {
    value: string;
    index: string | number;
};

const LETTER_VALUES = ['A', 'J', 'Q', 'K'];

export function CardDeck({ value, index }: CardDeckProps) {
    const shouldShowIndex = LETTER_VALUES.includes(String(value).toUpperCase());

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

    suit: {
        position: 'absolute',
        color: '#464B4E',
        fontSize: 17,
        fontWeight: '900',
    },

    suitTopLeft: {
        top: 5,
        left: 3,
    },

    suitTopRight: {
        top: 5,
        right: 3,
    },

    suitBottomLeft: {
        bottom: 5,
        left: 3,
    },

    suitBottomRight: {
        bottom: 5,
        right: 3,
    },

    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -12,
    },

    value: {
        color: '#000000',
        fontSize: 34,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 38,
    },

    index: {
        color: '#000000',
        fontSize: 12,
        fontWeight: '800',
        marginTop: -1,
    },

    logoArea: {
        position: 'absolute',
        bottom: 11,
        left: 24,
        right: 24,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },

    logoImage: {
        width: 48,
        height: 28,
    },
});