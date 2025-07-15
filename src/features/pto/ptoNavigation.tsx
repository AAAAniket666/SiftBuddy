import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PtoRequestScreen from './PtoRequestScreen';
import PtoRequestList from './PtoRequestList';
import PtoApprovalScreen from './PtoApprovalScreen';

const Stack = createStackNavigator();

const PtoStackNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="PtoRequest" component={PtoRequestScreen} options={{ title: 'Request PTO' }} />
    <Stack.Screen name="PtoRequestList" component={PtoRequestList} options={{ title: 'My PTO Requests' }} />
    <Stack.Screen name="PtoApproval" component={PtoApprovalScreen} options={{ title: 'PTO Approval (Admin)' }} />
  </Stack.Navigator>
);

export default PtoStackNavigator;
