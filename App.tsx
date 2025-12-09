import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import * as Network from 'expo-network';
import * as Notifications from 'expo-notifications';

export default function App() {
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const prevWasWifi = useRef<boolean | null>(null);

  useEffect(() => {
    // Permission: only ask for notification permission on first run
    const getPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };
    getPermissions();
  }, []);

  useEffect(() => {
    let unsubscribe: () => void | undefined;

    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected ?? null);
      setConnectionType(state.type ?? null);
      prevWasWifi.current = state.type === Network.NetworkStateType.WIFI;
    };

    checkNetwork();

    // Listen for changes in network state
    unsubscribe = Network.addNetworkStateListener(async (state) => {
      setIsConnected(state.isConnected ?? null);
      setConnectionType(state.type ?? null);
      const nowIsWifi = state.type === Network.NetworkStateType.WIFI;
      if (prevWasWifi.current !== null && prevWasWifi.current !== nowIsWifi) {
        if (!nowIsWifi) {
          // Not on wifi anymore
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Wi-Fi Disconnected',
              body: 'You are no longer connected to Wi-Fi.',
            },
            trigger: null,
          });
        } else {
          // Back on wifi
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Wi-Fi Connected',
              body: 'You are now connected to Wi-Fi.',
            },
            trigger: null,
          });
        }
      }
      prevWasWifi.current = nowIsWifi;
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const renderStatus = () => {
    if (isConnected === null) return <Text>Checking network status...</Text>;
    if (!isConnected) return <Text>No internet connection.</Text>;
    if (connectionType === Network.NetworkStateType.WIFI) {
      return <Text>Connected to Wi-Fi.</Text>;
    } else {
      return <Text>Not connected to Wi-Fi (Type: {connectionType})</Text>;
    }
  };

  return (
    <View style={styles.container}>
      {renderStatus()}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
