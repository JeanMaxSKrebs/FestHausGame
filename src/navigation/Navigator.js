import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import SignIn from '../screens/SignIn';
import SignUp from '../screens/SignUp';
import Home from '../screens/Home';
import { AuthUserContext } from '../context/AuthUserProvider';

const Stack = createNativeStackNavigator();

const Navigator = () => {
  const { user, loading } = useContext(AuthUserContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        <Stack.Screen name="HomeStack" component={Home} />
      ) : (
        <>
          <Stack.Screen
            name="SignIn"
            component={SignIn}
            options={{ animationEnabled: false }}
          />
          <Stack.Screen name="SignUp" component={SignUp} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default Navigator;
