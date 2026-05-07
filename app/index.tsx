import { Redirect } from 'expo-router';
import { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AuthUserContext } from '../context/AuthUserProvider';

export default function RootIndex() {
  const { user, loading } = useContext(AuthUserContext);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/screens/Home" />;
  }

  return <Redirect href="/screens/SignIn" />;
}