import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function RoleSelectorScreen() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const router = useRouter();

  const roles = [
    {
      key: "member",
      icon: "💪",
      title: "MEMBER",
      desc: "Train with elite coaches",
      gradient: ["#3b82f6", "#1d4ed8"] as const,
      accentGradient: ["#60a5fa", "#3b82f6"] as const,
      stats: "2.1k athletes training",
    },
    {
      key: "athlete",
      icon: "🏆",
      title: "ATHLETE", 
      desc: "Share your expertise",
      gradient: ["#f59e0b", "#d97706"] as const,
      accentGradient: ["#fbbf24", "#f59e0b"] as const,
      stats: "847 coaches active",
    },
  ];

  const handleContinue = () => {
    if (selectedRole) {
      router.push({ pathname: "/login", params: { role: selectedRole } });
    }
  };

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      <View style={styles.container}>
        {/* Athletic Logo Section */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={["#3b82f6", "#f59e0b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.athleticRing}
          >
            <View style={styles.logoContainer}>
              <Image source={require("../assets/p.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
          <Text style={styles.logo}>PROLOGUE</Text>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Choose Your Path</Text>
        </View>

        {/* Athletic Cards */}
        <View style={styles.options}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[
                styles.option,
                selectedRole === role.key && styles.optionSelected
              ]}
              onPress={() => setSelectedRole(role.key)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  selectedRole === role.key
                    ? role.gradient
                    : ["rgba(51,65,85,0.4)", "rgba(30,41,59,0.6)"] as const
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionBorder}
              >
                <View style={styles.optionContent}>
                  {/* Subtle background glow for selected */}
                  {selectedRole === role.key && (
                    <LinearGradient
                      colors={[`${role.gradient[0]}15`, `${role.gradient[1]}08`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.selectedGlow}
                    />
                  )}
                  
                  {/* Athletic Icon */}
                  <LinearGradient
                    colors={role.accentGradient}
                    style={styles.iconContainer}
                  >
                    <Text style={styles.icon}>{role.icon}</Text>
                  </LinearGradient>
                  
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>{role.title}</Text>
                    <Text style={styles.optionDesc}>{role.desc}</Text>
                    
                    {/* Athletic Stats */}
                    <View style={styles.statsRow}>
                      <View style={styles.statsBadge}>
                        <Text style={styles.statsText}>{role.stats}</Text>
                      </View>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  </View>
                  
                  {/* Selection Indicator */}
                  {selectedRole === role.key && (
                    <View style={styles.checkContainer}>
                      <LinearGradient
                        colors={["#ffffff", "#f8fafc"]}
                        style={styles.checkmark}
                      >
                        <Text style={styles.checkText}>✓</Text>
                      </LinearGradient>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Athletic CTA Button */}
        <TouchableOpacity
          style={[styles.continueBtn, !selectedRole && styles.continueBtnDisabled]}
          disabled={!selectedRole}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={
              selectedRole
                ? ["#3b82f6", "#f59e0b"]
                : ["#334155", "#475569"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtnGradient}
          >
            <Text style={styles.continueBtnText}>
              {selectedRole ? `START AS ${selectedRole.toUpperCase()} →` : "SELECT YOUR ROLE"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Subtle Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.progressDots}>
            <LinearGradient
              colors={["#3b82f6", "#f59e0b"]}
              style={[styles.progressDot, styles.progressActive]}
            />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>
        </View>
      </View>
      <StatusBar style="light" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  athleticRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 3,
    marginBottom: 18,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0f172a",
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  logo: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 28,
    letterSpacing: 3,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  options: {
    width: "100%",
    marginBottom: 40,
  },
  option: {
    marginBottom: 20,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  optionSelected: {
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    transform: [{ scale: 1.01 }],
  },
  optionBorder: {
    borderRadius: 18,
    padding: 2,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.85)",
    borderRadius: 16,
    padding: 24,
    position: "relative",
    overflow: "hidden",
  },
  selectedGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  icon: {
    fontSize: 26,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  optionTextContainer: {
    flex: 1,
    zIndex: 1,
  },
  optionTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: "#fff",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  optionDesc: {
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 10,
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsBadge: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
  },
  statsText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
    marginLeft: 8,
    marginRight: 4,
  },
  liveText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  checkContainer: {
    zIndex: 2,
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  checkText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  continueBtn: {
    width: "100%",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  continueBtnDisabled: {
    shadowOpacity: 0.1,
  },
  continueBtnGradient: {
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  continueBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressSection: {
    marginTop: 20,
    alignItems: "center",
  },
  progressDots: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#334155",
    marginHorizontal: 4,
  },
  progressActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
}); 