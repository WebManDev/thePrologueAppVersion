import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function AuthLoadingScreen() {
  const router = useRouter();

  useEffect(() => {
    console.log('AuthLoadingScreen mounted');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user);
      if (user) {
        // Check if athlete profile is complete
        try {
          const userDoc = await getDoc(doc(db, "athletes", user.uid));
          console.log('User doc:', userDoc.exists() ? userDoc.data() : null);
          if (!userDoc.exists() || !userDoc.data().firstName) {
            console.log('Routing to /athlete-onboarding');
            router.replace("/athlete-onboarding");
          } else {
            console.log('Routing to /Dashboard');
            router.replace("/Dashboard");
          }
        } catch (err) {
          console.log('Error fetching user doc, routing to /athlete-onboarding', err);
          router.replace("/athlete-onboarding");
        }
      } else {
        console.log('No user, routing to /login');
        router.replace("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.text}>Checking authentication...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: "#6B7280",
  },
}); 