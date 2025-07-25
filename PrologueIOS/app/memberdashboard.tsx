import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MemberDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to your Member Dashboard!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
}); 