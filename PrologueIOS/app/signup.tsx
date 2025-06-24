import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { role } = useLocalSearchParams();

  const isMember = role === "member";
  const gradientColors = isMember
    ? ["#1e293b", "#274472", "#3b82f6", "#1e293b"]
    : ["#2d1a47", "#274472", "#ff784e", "#1e293b"];
  const gradientLocations = [0, 0.4, 0.65, 1];
  const buttonStyle = [styles.button, isMember && styles.buttonMember, loading && styles.buttonDisabled];
  const logoText = "PROLOGUE";
  const titleText = isMember ? "Create your member account" : "Create your account";
  const subtitleText = isMember ? "Sign up to start your training" : "Sign up to start your journey";
  const buttonText = loading ? "Signing up..." : "SIGN UP";
  const googleBtnText = "Continue with Google";
  const footerText = isMember ? "Already have a member account? " : "Already have an account? ";
  const loginLinkText = "Sign in";

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    // TODO: Implement Firebase signup logic
    setTimeout(() => {
      setLoading(false);
      // On success, navigate to login
      router.replace({ pathname: '/login', params: { role } });
    }, 1000);
  };

  return (
    <LinearGradient colors={gradientColors as [string, string, string, string]} locations={gradientLocations as [number, number, number, number]} style={styles.bg} start={{x:0, y:0}} end={{x:1, y:1}}>
      <View style={styles.card}>
        <Text style={styles.logo}>{logoText}</Text>
        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>
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
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={buttonStyle}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.googleBtn}>
          <Text style={styles.googleBtnText}>{googleBtnText}</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>
          {footerText}
          <Text style={styles.link} onPress={() => router.replace({ pathname: '/login', params: { role } })}>{loginLinkText}</Text>
        </Text>
      </View>
      <StatusBar style="light" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  logo: {
    color: "#334155",
    fontWeight: "bold",
    fontSize: 22,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#f1f5f9",
    color: "#1e293b",
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  button: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#f97316",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#fdba74",
  },
  buttonMember: {
    backgroundColor: '#2563eb', // blue
    shadowColor: '#2563eb',
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  googleBtn: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  googleBtnText: {
    color: "#1e293b",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "#f87171",
    marginBottom: 8,
    textAlign: "center",
  },
  footerText: {
    color: "#64748b",
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  link: {
    color: "#f97316",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
}); 