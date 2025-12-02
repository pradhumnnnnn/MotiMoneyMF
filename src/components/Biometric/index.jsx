import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  StatusBar
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setBiometricEnabled } from "../../store/slices/loginSlice";
import { heightToDp, widthToDp } from "../../helpers/Responsive";
import * as Config from "../../helpers/Config";
import SInfoSvg from "../../presentation/svgs";
import { SafeAreaView } from "react-native-safe-area-context";

const Biometric = ({ navigation }) => {
  const dispatch = useDispatch();
  const isBiometricEnabled = useSelector((state) => state.login.enabled);

  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isBiometricEnabled ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isBiometricEnabled]);

  const toggleSwitch = () => {
    dispatch(setBiometricEnabled(!isBiometricEnabled));
  };

  const handleSubmit = () => {
    alert("Biometric setting updated.");
    navigation.navigate("Profile");
  };

  return (
<SafeAreaView style={styles.safeArea}>
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.select({ ios: "padding", android: null })}
  >
  {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

    <View style={styles.headerSection}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <SInfoSvg.BackButton />
      </TouchableOpacity>
      <Text style={styles.header}>Biometric Settings</Text>
    </View>

    <View style={styles.card}>
      <View style={styles.toggleContainer}>
        <Text style={styles.label}>Enable Biometric</Text>
        <Switch value={isBiometricEnabled} onValueChange={toggleSwitch} />
      </View>

      <Text style={styles.status}>
        Current Status: {isBiometricEnabled ? "ON" : "OFF"}
      </Text>

      <Pressable style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Save</Text>
      </Pressable>
    </View>
  </KeyboardAvoidingView>
</SafeAreaView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  safeArea: {
  flex: 1,
  backgroundColor: "#ffffff", // or Config.Colors.cyan_blue if needed
},
androidStatusBar: {
  height: StatusBar.currentHeight,
  backgroundColor: "transparent",
},
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: "transparent",
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: widthToDp(2.5),
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightToDp(1.8),
  },
  header: {
    fontSize: widthToDp(5),
    fontWeight: "bold",
    textAlign: "center",
    color: "#1F2D3D",
    marginBottom: heightToDp(3),
    marginTop: heightToDp(1),
  },
  card: {
    backgroundColor: "white",
    borderRadius: widthToDp(3),
    padding: widthToDp(5),
    elevation: 5,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: heightToDp(2),
  },
  label: {
    fontSize: widthToDp(4.5),
    fontWeight: "500",
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: heightToDp(1.5),
    borderRadius: widthToDp(2),
    alignItems: "center",
    marginTop: heightToDp(2),
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: widthToDp(4.5),
  },
  status: {
    marginTop: heightToDp(2),
    textAlign: "center",
    fontSize: widthToDp(4.5),
    color: "#555",
  },
});

export default Biometric;
