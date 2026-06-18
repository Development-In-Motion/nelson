import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppText,
  Body,
  Button,
  Caption,
  DotMatrixText,
  Input,
} from "@/components/ui";
import { Palette, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { formatBgPhone, isValidBgMobile, normalizeBgPhone } from "@/lib/phone";
import { sendOtp, verifyOtp } from "@/lib/otp-api";

export default function AuthScreen() {
  const [phone, setPhone] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handlePhoneChange = (value: string) => {
    setPhone(formatBgPhone(value));
  };

  const handleRequestOtp = async () => {
    if (!isValidBgMobile(phone)) {
      Alert.alert(
        "Невалиден номер",
        "Въведете валиден български мобилен номер, например +359 88 123 4567.",
      );
      return;
    }

    const normalizedPhone = normalizeBgPhone(phone);

    setIsLoading(true);
    try {
      await sendOtp(normalizedPhone);
      setIsOtpSent(true);
      Alert.alert("Кодът е изпратен", "Изпратихме код за потвърждение на телефона ви.");
    } catch (error) {
      Alert.alert(
        "Кодът не можа да бъде изпратен",
        error instanceof Error ? error.message : "Моля, опитайте отново.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const normalizedPhone = normalizeBgPhone(phone);
    const normalizedOtp = otpCode.replace(/\D/g, "");

    if (normalizedOtp.length !== 6) {
      Alert.alert("Невалиден код", "Въведете 6-цифрения код за потвърждение.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyOtp(normalizedPhone, normalizedOtp);

      if (!result.verified) {
        Alert.alert("Грешен код", "Въведеният код е грешен. Моля, опитайте отново.");
        return;
      }

      signIn(result.user ?? { name: "Член на семейството", phone: normalizedPhone });
      router.replace("/(tabs)/home");
    } catch (error) {
      Alert.alert(
        "Неуспешна проверка",
        error instanceof Error ? error.message : "Моля, опитайте отново.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtpCode(value.replace(/\D/g, "").slice(0, 6));
  };

  const handleChangePhone = () => {
    setIsOtpSent(false);
    setOtpCode("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.hero}>
            <DotMatrixText text="Nelson." dotSize={6} gap={3} />
            <Body style={styles.tagline}>Едно телефонно обаждане.</Body>
            <Body style={styles.tagline}>Целият ви живот — под контрол.</Body>
          </View>

          <View style={styles.card}>
            <AppText variant="h2">
              {isOtpSent ? "Потвърдете кода" : "Вход"}
            </AppText>
            <Body style={styles.cardText}>
              {isOtpSent
                ? `Въведете 6-цифрения код, изпратен до ${formatBgPhone(phone)}.`
                : "Въведете свързания телефонен номер, за да получите еднократен код."}
            </Body>

            {!isOtpSent ? (
              <Input
                label="Телефонен номер"
                placeholder="+359 88 123 4567"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                value={phone}
                onChangeText={handlePhoneChange}
                accessibilityLabel="Телефонен номер"
              />
            ) : (
              <View style={styles.fieldBlock}>
                <Input
                  label="Код за потвърждение"
                  placeholder="123456"
                  keyboardType="number-pad"
                  value={otpCode}
                  onChangeText={handleOtpChange}
                  accessibilityLabel="Код за потвърждение"
                />
                <Pressable onPress={handleChangePhone} style={styles.changePhone}>
                  <Caption style={styles.changePhoneText}>Смени телефона</Caption>
                </Pressable>
              </View>
            )}

            <Button
              label={isOtpSent ? "Потвърди и продължи" : "Изпрати код"}
              loading={isLoading}
              disabled={isLoading}
              onPress={() => void (isOtpSent ? handleVerifyOtp() : handleRequestOtp())}
            />

            {isOtpSent ? (
              <Button
                label="Изпрати кода отново"
                variant="ghost"
                disabled={isLoading}
                onPress={() => void handleRequestOtp()}
              />
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.bg,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: Spacing.xxl,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  hero: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  tagline: {
    color: Palette.inkMuted,
    textAlign: "center",
  },
  card: {
    borderColor: Palette.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  cardText: {
    color: Palette.inkMuted,
  },
  fieldBlock: {
    gap: Spacing.md,
  },
  changePhone: {
    alignSelf: "flex-end",
  },
  changePhoneText: {
    color: Palette.ink,
    fontWeight: "700",
  },
});
