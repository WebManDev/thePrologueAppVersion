import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { StatusBar } from "expo-status-bar";
import { auth } from "../firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoggedIn(true);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (loggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.successText}>I logged in</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
      </TouchableOpacity>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 32,
    letterSpacing: 1,
  },
  input: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1e293b",
    color: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  button: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#334155",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  errorText: {
    color: "#f87171",
    marginBottom: 8,
    textAlign: "center",
  },
  successText: {
    color: "#22c55e",
    fontSize: 22,
    fontWeight: "bold",
  },
}); 