import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type GameCardProps = {
    item: {
        id: string;
        name: string;
        category: string;
        value: number;
        isTrump?: boolean;
        ruleTitle?: string;
        ruleDescription?: string;
        actionType?: string;
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

function shouldShowSmallNumber(value: number) {
    return value === 11 || value === 12 || value === 13;
}

export function GameCard({ item, selected = false, onPress }: GameCardProps) {
    const suit = getSuit(item.category);
    const displayValue = getDisplayValue(item.value);
    const showSmallNumber = shouldShowSmallNumber(item.value);

    return (
        <TouchableOpacity
            style={[styles.card, selected && styles.cardSelected]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            {/* TOPO: valor esquerda + logo direita */}
            <View style={styles.topRow}>
                <View style={styles.valueBlock}>
                    <Text style={styles.value}>{displayValue}</Text>

                    {showSmallNumber && (
                        <Text style={styles.smallNumber}>{item.value}</Text>
                    )}
                </View>

                <Image
                    source={require('../assets/images/fhblack.png')}
                    style={styles.cornerLogo}
                    resizeMode="contain"
                />
            </View>

            {/* CENTRO */}
            <View style={styles.center}>
                <Text style={styles.centerSuit}>{suit}</Text>
            </View>

            {/* BAIXO: logo esquerda + valor direita */}
            <View style={styles.bottomRow}>
                <Image
                    source={require('../assets/images/fhblack.png')}
                    style={styles.cornerLogo}
                    resizeMode="contain"
                />

                <Text style={styles.value}>{displayValue}</Text>
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

    topRow: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    bottomRow: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },

    valueBlock: {
        alignItems: 'center',
        minWidth: 20,
    },

    value: {
        fontSize: 20,
        fontWeight: '900',
        color: '#222',
        lineHeight: 20,
    },

    smallNumber: {
        fontSize: 10,
        color: '#777',
        lineHeight: 11,
        marginTop: 1,
    },

    cornerLogo: {
        width: 25,
        height: 25,
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
        color: '#222',
    },
});