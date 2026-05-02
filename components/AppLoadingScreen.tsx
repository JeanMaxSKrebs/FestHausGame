import { useEffect, useRef } from 'react';
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export function AppLoadingScreen() {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.25,
                    duration: 850,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 850,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => {
            animation.stop();
        };
    }, [opacity]);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoWrapper, { opacity }]}>
                <Image
                    source={require('../assets/images/logo/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            <Text style={styles.title}>Fest Haus Game</Text>
            <Text style={styles.subtitle}>Carregando...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    logoWrapper: {
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 160,
        height: 160,
    },
    title: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        color: '#b0b0b0',
        fontSize: 15,
        letterSpacing: 0.5,
    },
});