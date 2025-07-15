import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// TODO: Integrate with chatService and navigation

const ChatScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Chat Channels & Direct Messages</Text>
    {/* TODO: Render ChatList and navigation to direct messages */}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', margin: 16 },
});

export default ChatScreen;
