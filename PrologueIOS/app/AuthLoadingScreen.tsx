import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import RoleSelectorScreen from "./RoleSelectorScreen";

export default function AuthLoadingScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is an athlete
          const athleteDoc = await getDoc(doc(db, "athletes", user.uid));
          if (athleteDoc.exists()) {
            if (!athleteDoc.data().firstName) {
              router.replace("/athlete-onboarding");
            } else {
              router.replace("/Dashboard");
            }
            return;
          }

          // Check if user is a member
          const memberDoc = await getDoc(doc(db, "members", user.uid));
          if (memberDoc.exists()) {
            if (!memberDoc.data().onboardingCompleted) {
              router.replace("/member-onboarding");
            } else {
              router.replace("/member-dashboard");
            }
            return;
          }

          // If no profile found, show role selection
          setShowRoleSelector(true);
        } catch (err) {
          setShowRoleSelector(true);
        }
      } else {
        setShowRoleSelector(true);
      }
      setChecking(false);
    });
    return () => unsubscribe();
  }, []);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.text}>Checking authentication...</Text>
      </View>
    );
  }

  if (showRoleSelector) {
    return <RoleSelectorScreen />;
  }

  return null;
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