import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { role } = useLocalSearchParams();

  const isMember = role === "member";
  const isAthlete = role === "athlete";

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

  const handleBack = () => {
    router.back();
  };

  // Instagram-style design for both athletes and members
  return (
    <View style={athleteStyles.instagramBg}>
      <StatusBar style="light" />
      
      {/* Back Button */}
      <TouchableOpacity style={athleteStyles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Instagram-style container */}
      <View style={athleteStyles.instagramContainer}>
        {/* Logo and Title */}
        <View style={athleteStyles.logoTitleContainer}>
          <Image 
            source={require('../assets/p.png')} 
            style={athleteStyles.logoImage}
            resizeMode="contain"
          />
          <Text style={athleteStyles.instagramTitle}>PROLOGUE</Text>
        </View>
        
        {/* Input Fields */}
        <View style={athleteStyles.instagramInputContainer}>
          <TextInput
            style={athleteStyles.instagramInput}
            placeholder="Phone number, username or email"
            placeholderTextColor="#8e8e93"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          
          <TextInput
            style={athleteStyles.instagramInput}
            placeholder="Password"
            placeholderTextColor="#8e8e93"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TextInput
            style={athleteStyles.instagramInput}
            placeholder="Confirm Password"
            placeholderTextColor="#8e8e93"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          
          {error ? <Text style={athleteStyles.instagramError}>{error}</Text> : null}
          
          <TouchableOpacity
            style={[athleteStyles.instagramSignupBtn, loading && athleteStyles.instagramSignupBtnDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={athleteStyles.instagramSignupText}>
              {loading ? "Signing up..." : "Sign up"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={athleteStyles.dividerContainer}>
          <View style={athleteStyles.dividerLine} />
          <Text style={athleteStyles.dividerText}>OR</Text>
          <View style={athleteStyles.dividerLine} />
        </View>

        {/* Continue as Coach */}
        <TouchableOpacity style={athleteStyles.coachBtn}>
          <Text style={athleteStyles.coachBtnText}>Continue as Coach</Text>
        </TouchableOpacity>
      </View>
      
      {/* Bottom login */}
      <View style={athleteStyles.instagramBottomContainer}>
        <Text style={athleteStyles.instagramBottomText}>
          Already have an account? {" "}
          <Text 
            style={athleteStyles.instagramLoginLink} 
            onPress={() => router.replace({ pathname: '/login', params: { role } })}
          >
            Sign in
          </Text>
        </Text>
      </View>
    </View>
  );
}

// Athlete Instagram-style design
const athleteStyles = StyleSheet.create({
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
    marginBottom: 16,
  },
  instagramTitle: {
    fontSize: 28,
    fontWeight: "400",
    color: "#ffffff",
    letterSpacing: 2,
  },
  instagramInputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  instagramInput: {
    backgroundColor: "#1c1c1e",
    borderWidth: 1,
    borderColor: "#38383a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 12,
    fontWeight: "400",
  },
  instagramError: {
    color: "#ff3b30",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "400",
  },
  instagramSignupBtn: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  instagramSignupBtnDisabled: {
    backgroundColor: "#1e3a8a",
    opacity: 0.6,
  },
  instagramSignupText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#38383a",
  },
  dividerText: {
    color: "#8e8e93",
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 20,
  },
  coachBtn: {
    borderWidth: 1,
    borderColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: "100%",
  },
  coachBtnText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "500",
  },
  instagramBottomContainer: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
  },
  instagramBottomText: {
    color: "#8e8e93",
    fontSize: 14,
    fontWeight: "400",
  },
  instagramLoginLink: {
    color: "#3b82f6",
    fontWeight: "500",
  },
});

// Member original design styles
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