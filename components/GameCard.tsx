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
            return String(value);
    }
}

function isRedSuit(category: string) {
    return category === 'copas' || category === 'ouro';
}

export function GameCard({ item, selected = false, onPress }: GameCardProps) {
    const suit = getSuit(item.category);
    const displayValue = getDisplayValue(item.value);
    const suitColor = isRedSuit(item.category) ? '#B42318' : '#111827';

    return (
        <TouchableOpacity
            style={[styles.card, selected && styles.cardSelected]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <View style={styles.topCorner}>
                <Text style={[styles.value, { color: suitColor }]}>{displayValue}</Text>
                <Text style={styles.smallNumber}>{item.value}</Text>

                <Image
                    source={require('../assets/images/logo/logo.png')}
                    style={styles.cornerLogo}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.center}>
                <Text style={[styles.centerSuit, { color: suitColor }]}>{suit}</Text>
            </View>

            <View style={styles.bottomCorner}>
                <Image
                    source={require('../assets/images/logo/logo.png')}
                    style={styles.cornerLogo}
                    resizeMode="contain"
                />

                <Text style={styles.smallNumber}>{item.value}</Text>
                <Text style={[styles.value, { color: suitColor }]}>{displayValue}</Text>
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
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.16,
        shadowRadius: 5,
        elevation: 4,
    },
    cardSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#E7F3FF',
        transform: [{ translateY: -4 }],
    },
    topCorner: {
        position: 'absolute',
        top: 8,
        left: 8,
        alignItems: 'center',
        zIndex: 2,
    },
    bottomCorner: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        alignItems: 'center',
        transform: [{ rotate: '180deg' }],
        zIndex: 2,
    },
    value: {
        fontSize: 20,
        fontWeight: '900',
        lineHeight: 20,
    },
    smallNumber: {
        fontSize: 12,
        color: '#777',
        lineHeight: 13,
    },
    cornerLogo: {
        width: 22,
        height: 22,
        marginTop: 2,
        opacity: 0.9,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerSuit: {
        fontSize: 56,
        fontWeight: '900',
    },
});