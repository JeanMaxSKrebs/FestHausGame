import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AuthUserProvider} from './src/context/AuthUserProvider';
import Navigator from './src/navigation/Navigator';

const App = () => {
  return (
    <AuthUserProvider>
      <NavigationContainer>
        <Navigator />
      </NavigationContainer>
    </AuthUserProvider>
  );
};

export default App;
