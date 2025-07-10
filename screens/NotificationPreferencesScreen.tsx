import React, { useEffect, useState } from 'react';
import { View, Text, Switch, ActivityIndicator, Alert } from 'react-native';
import styled from 'styled-components/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const Container = styled.View`
  flex: 1;
  background-color: #F5F3EC;
  padding: 24px;
`;
const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
  color: #44291A;
`;
const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;
const Label = styled.Text`
  font-size: 18px;
  color: #2D4F4A;
`;

export default function NotificationPreferencesScreen() {
  const user = auth().currentUser;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    push: true,
    reminder1h: true,
    reminder30m: true,
  });

  useEffect(() => {
    if (!user) return;
    const ref = firestore().collection('users').doc(user.uid);
    ref.get().then(doc => {
      const data = doc.data();
      if (data && data.notificationPreferences) {
        setPrefs({
          push: data.notificationPreferences.push ?? true,
          reminder1h: data.notificationPreferences.reminder1h ?? true,
          reminder30m: data.notificationPreferences.reminder30m ?? true,
        });
      }
      setLoading(false);
    });
  }, [user]);

  const updatePref = (key: string, value: boolean) => {
    if (!user) return;
    setSaving(true);
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    firestore()
      .collection('users')
      .doc(user.uid)
      .update({ notificationPreferences: newPrefs })
      .then(() => setSaving(false))
      .catch(e => {
        setSaving(false);
        Alert.alert('Error', 'Failed to save preferences.');
      });
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <Container>
      <Title>Notification Preferences</Title>
      <Row>
        <Label>Push Notifications</Label>
        <Switch
          value={prefs.push}
          onValueChange={v => updatePref('push', v)}
          disabled={saving}
        />
      </Row>
      <Row>
        <Label>1 Hour Before Shift</Label>
        <Switch
          value={prefs.reminder1h}
          onValueChange={v => updatePref('reminder1h', v)}
          disabled={saving}
        />
      </Row>
      <Row>
        <Label>30 Minutes Before Shift</Label>
        <Switch
          value={prefs.reminder30m}
          onValueChange={v => updatePref('reminder30m', v)}
          disabled={saving}
        />
      </Row>
    </Container>
  );
} 