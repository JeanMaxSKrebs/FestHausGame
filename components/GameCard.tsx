import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type GameCardProps = {
    item: {
        id: string;
        name: string;
        category: string;
        value: number;
        rarity?: string;
        isTrump?: boolean;
    };
    selected?: boolean;
    onPress?: () => void;
};

function getSuit(category: string) {
    switch (category) {
        case 'espadas':
            return '♠';
        case 'copas':
            return '♥';
        case 'ouro':
            return '♦';
        case 'paus':
            return '♣';
        default:
            return '★';
    }
}

function getDisplayValue(value: number) {
    switch (value) {
        case 1:
            return 'A';
        case 11:
            return 'J';
        case 12:
            return 'Q';
        case 13:
            return 'K';
        default:
            return value.toString();
    }
}

export function GameCard({ item, selected = false, onPress }: GameCardProps) {
    const suit = getSuit(item.category);
    const displayValue = getDisplayValue(item.value);

    return (
        <TouchableOpacity
            style={[styles.card, selected && styles.cardSelected]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            {/* 🔼 TOP LEFT */}
            <View style={styles.corner}>
                <Text style={styles.value}>{displayValue}</Text>
                <Text style={styles.smallNumber}>{item.value}</Text>

                <Image
                    source={require('../assets/images/logo/logo.png')}
                    style={styles.cornerLogo}
                    resizeMode="contain"
                />
            </View>

            {/* 🔽 BOTTOM RIGHT (invertido) */}
            <View style={[styles.corner, styles.bottomCorner]}>
                <Image
                    source={require('../assets/images/logo/logo.png')}
                    style={styles.cornerLogo}
                    resizeMode="contain"
                />

                <Text style={styles.smallNumber}>{item.value}</Text>
                <Text style={styles.value}>{displayValue}</Text>
            </View>

            {/* 🧠 CENTRO */}
            <View style={styles.center}>
                <Text style={styles.centerSuit}>{suit}</Text>
            </View>
        </TouchableOpacity>
    );
}
const styles = StyleSheet.create({
    card: {
        width: 118,
        height: 158,
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 10,
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 5,
        elevation: 4,
    },

    cardSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#E7F3FF',
        transform: [{ translateY: -4 }],
    },

    /* 🔲 CANTOS */
    corner: {
        position: 'absolute',
        top: 8,
        left: 8,
        alignItems: 'center',
    },

    bottomCorner: {
        bottom: 8,
        right: 8,
        top: undefined,
        left: undefined,
        transform: [{ rotate: '180deg' }],
    },

    value: {
        fontSize: 20,
        fontWeight: '900',
        color: '#222',
        lineHeight: 20,
    },

    smallNumber: {
        fontSize: 12,
        color: '#777',
    },

    cornerLogo: {
        width: 22,
        height: 22,
        marginTop: 2,
        opacity: 0.9,
    },

    /* 🎯 CENTRO */
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    centerSuit: {
        fontSize: 56,
        fontWeight: '900',
        color: '#222',
    },
});