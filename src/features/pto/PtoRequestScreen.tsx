import React from 'react';
import { View, Button } from 'react-native';
import PtoRequestForm from './PtoRequestForm';
import { useNavigation } from '@react-navigation/native';

// TODO: Replace with real userId from auth context
const USER_ID = 'user-demo';

const PtoRequestScreen = () => {
  const navigation = useNavigation();
  return (
    <View style={{ flex: 1 }}>
      <PtoRequestForm userId={USER_ID} />
      <Button title="View My PTO Requests" onPress={() => navigation.navigate('PtoRequestList', { userId: USER_ID })} />
    </View>
  );
};

export default PtoRequestScreen;
