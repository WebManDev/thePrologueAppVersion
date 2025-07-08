import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { StatusBar } from "expo-status-bar";
import { auth } from "../firebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { role } = useLocalSearchParams();

  const isAthlete = role === "athlete";
  const isMember = role === "member";

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (role === "athlete") {
        router.replace("/Dashboard");
      } else if (role === "member") {
        router.replace({ pathname: '/memberdashboard' });
      } else {
        setLoggedIn(true);
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (loggedIn) {
    return (
      <View style={styles.bg}>
        <View style={styles.card}>
          <Text style={styles.successText}>You are logged in!</Text>
        </View>
        <StatusBar style="light" />
      </View>
    );
  }

  // Instagram-style dark theme for both athletes and members
  return (
    <View style={styles.instagramBg}>
      <StatusBar style="light" />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      
      {/* Instagram-style container */}
      <View style={styles.instagramContainer}>
        {/* Logo and Title */}
        <View style={styles.logoTitleContainer}>
          <Image 
            source={require("../assets/p.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.instagramTitle}>PROLOGUE</Text>
        </View>
        
        {/* Input Fields */}
        <View style={styles.instagramInputContainer}>
          <TextInput
            style={styles.instagramInput}
            placeholder="Phone number, username or email"
            placeholderTextColor="#8e8e93"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          
          <TextInput
            style={styles.instagramInput}
            placeholder="Password"
            placeholderTextColor="#8e8e93"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          {error ? <Text style={styles.instagramError}>{error}</Text> : null}
          
          <TouchableOpacity
            style={[styles.instagramLoginBtn, loading && styles.instagramLoginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.instagramLoginText}>
              {loading ? "Logging in..." : "Log In"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
        
        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>
        
        {/* Continue with Facebook/Google */}
        <TouchableOpacity style={styles.facebookBtn}>
          <Text style={styles.facebookBtnText}>Continue as Coach</Text>
        </TouchableOpacity>
      </View>
      
      {/* Bottom signup */}
      <View style={styles.instagramBottomContainer}>
        <Text style={styles.instagramBottomText}>
          Don't have an account? {" "}
          <Text 
            style={styles.instagramSignupLink} 
            onPress={() => router.push({ pathname: '/signup', params: { role } })}
          >
            Sign up
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Instagram-style dark theme for athletes
  instagramBg: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  instagramContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoTitleContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoImage: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
  instagramTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "400",
    letterSpacing: 1,
    textAlign: "center",
  },
  instagramLogo: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 60,
    textAlign: "center",
  },
  instagramInputContainer: {
    width: "100%",
    maxWidth: 350,
  },
  instagramInput: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "400",
    color: "#fff",
    marginBottom: 12,
  },
  instagramError: {
    color: "#ff3b30",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  instagramLoginBtn: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  instagramLoginBtnDisabled: {
    backgroundColor: "#2563eb",
    opacity: 0.6,
  },
  instagramLoginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  forgotPassword: {
    alignItems: "center",
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "400",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 350,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#38383a",
  },
  dividerText: {
    color: "#8e8e93",
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 16,
  },
  facebookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 350,
    paddingVertical: 14,
  },
  facebookBtnText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "400",
  },
  instagramBottomContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  instagramBottomText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
  },
  instagramSignupLink: {
    color: "#3b82f6",
    fontWeight: "400",
  },

  // Original styles for members
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
  successText: {
    color: "#22c55e",
    fontSize: 22,
    fontWeight: "bold",
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
  buttonMember: {
    backgroundColor: '#2563eb', // blue
    shadowColor: '#2563eb',
  },
}); 