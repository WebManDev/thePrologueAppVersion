import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";

export default function RoleSelectorScreen() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const router = useRouter();

  const roles = [
    {
      key: "member",
      icon: "👤",
      title: "MEMBER",
      desc: "I want to learn from elite athletes and improve my skills through personalized coaching.",
    },
    {
      key: "athlete",
      icon: "🏆",
      title: "ATHLETE",
      desc: "I want to share my expertise and coach others to reach their athletic potential.",
    },
  ];

  const handleContinue = () => {
    if (selectedRole) {
      router.push({ pathname: "/login", params: { role: selectedRole } });
    }
  };

  return (
    <View style={styles.gradientBg}>
      <View style={styles.card}>
        <Image source={require("../assets/p.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.logo}>PROLOGUE</Text>
        <Text style={styles.title}>I AM A...</Text>
        <Text style={styles.subtitle}>
          Choose your role to access the right features and dashboard for your athletic journey.
        </Text>
        <View style={styles.options}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[styles.option, selectedRole === role.key && styles.optionSelected]}
              onPress={() => setSelectedRole(role.key)}
              activeOpacity={0.85}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{role.icon}</Text>
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{role.title}</Text>
                <Text style={styles.optionDesc}>{role.desc}</Text>
              </View>
              {selectedRole === role.key && <View style={styles.selectedDot} />}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.continueBtn, !selectedRole && styles.continueBtnDisabled]}
          disabled={!selectedRole}
          onPress={handleContinue}
        >
          <Text style={styles.continueBtnText}>
            {selectedRole ? `CONTINUE AS ${selectedRole.toUpperCase()}` : "CONTINUE"}
          </Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#0f172a",
  },
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.92)",
    borderRadius: 20,
    padding: 36,
    width: "100%",
    maxWidth: 480,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    width: 56,
    height: 56,
    marginBottom: 10,
  },
  logo: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 22,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 28,
  },
  options: {
    width: "100%",
    marginBottom: 18,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#334155",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    backgroundColor: "rgba(51,65,85,0.5)",
    position: "relative",
  },
  optionSelected: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56,189,248,0.12)",
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },
  icon: {
    fontSize: 28,
    color: "#38bdf8",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  optionDesc: {
    color: "#cbd5e1",
    fontSize: 13,
    maxWidth: 260,
  },
  selectedDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#38bdf8",
    marginLeft: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  continueBtn: {
    marginTop: 8,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "100%",
  },
  continueBtnDisabled: {
    backgroundColor: "#334155",
  },
  continueBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
}); 