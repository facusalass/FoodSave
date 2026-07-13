import { useRouter } from "expo-router";
import {
  CircleHelp,
  ExternalLink,
  Info,
  Mail,
  MessageCircle,
  Store,
  Utensils
} from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import {
  ClientSideMenu,
  type ClientMenuRoute
} from "../../src/components/ClientSideMenu";
import { ClientTopBar } from "../../src/components/ClientTopBar";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { LANDING_URL, SUPPORT_EMAIL } from "../../src/config/links";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

const steps = [
  "Explora ofertas cercanas.",
  "Reserva una Mystery Box u oferta.",
  "Avisa el pago por WhatsApp.",
  "Espera la confirmacion del comercio.",
  "Retira tu pedido en el horario indicado."
];

const faqs = [
  {
    answer:
      "Es una caja sorpresa con productos en buen estado que el comercio ofrece a menor precio.",
    question: "¿Que es una Mystery Box?"
  },
  {
    answer:
      "Tenes 25 minutos desde que creas la reserva para avisar el pago.",
    question: "¿Cuanto tiempo tengo para avisar el pago?"
  },
  {
    answer:
      "Avisas el pago por WhatsApp y el comercio confirma manualmente la reserva.",
    question: "¿Como confirmo mi reserva?"
  },
  {
    answer:
      "Si no retiras el pedido, el comercio puede cancelar la reserva segun disponibilidad.",
    question: "¿Que pasa si no retiro mi pedido?"
  }
];

export default function ClientHelpScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  function handleNavigate(route: ClientMenuRoute) {
    setIsMenuVisible(false);
    router.push(route);
  }

  async function handleLogout() {
    await logout();
    setIsMenuVisible(false);
    router.replace("/(auth)/login");
  }

  async function handleLandingPress() {
    if (!LANDING_URL) {
      setLinkError(
        "Proximamente vas a poder sumar tu comercio desde la landing."
      );
      return;
    }

    try {
      setLinkError(null);
      await Linking.openURL(LANDING_URL);
    } catch {
      setLinkError(
        "Proximamente vas a poder sumar tu comercio desde la landing."
      );
    }
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <ClientTopBar onMenuPress={() => setIsMenuVisible(true)} />
      <ClientSideMenu
        onClose={() => setIsMenuVisible(false)}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        visible={isMenuVisible}
      />

      <Text style={styles.title}>Ayuda</Text>

      <HelpCard
        icon={<Info color={theme.primary} size={20} />}
        title="¿Que es FoodSave?"
      >
        <Text style={styles.bodyText}>
          FoodSave conecta comercios gastronomicos con personas que quieren
          rescatar comida en buen estado a menor precio, ayudando a reducir el
          desperdicio.
        </Text>
      </HelpCard>

      <HelpCard
        icon={<Utensils color={theme.secondaryDark} size={20} />}
        title="¿Como funciona?"
      >
        <View style={styles.stepsList}>
          {steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </HelpCard>

      <HelpCard
        icon={<Store color={theme.primary} size={20} />}
        title="Quiero sumar mi comercio"
      >
        <Text style={styles.bodyText}>
          Si tenes un comercio gastronomico, podes solicitar formar parte de
          FoodSave desde nuestra landing.
        </Text>
        {linkError ? <Text style={styles.errorText}>{linkError}</Text> : null}
        <PrimaryButton
          icon={<ExternalLink color="#FFFFFF" size={18} />}
          label="SUMAR MI COMERCIO"
          onPress={() => {
            void handleLandingPress();
          }}
        />
      </HelpCard>

      <HelpCard
        icon={<CircleHelp color={theme.secondaryDark} size={20} />}
        title="Preguntas frecuentes"
      >
        <View style={styles.faqList}>
          {faqs.map((faq) => (
            <View key={faq.question} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>
      </HelpCard>

      <HelpCard
        icon={<MessageCircle color={theme.primary} size={20} />}
        title="Contacto"
      >
        <View style={styles.contactRow}>
          <Mail color={theme.mutedText} size={18} />
          <Text style={styles.bodyText}>{SUPPORT_EMAIL}</Text>
        </View>
        <Text style={styles.helperText}>
          Si necesitas ayuda, escribinos a este correo y te respondemos a la
          brevedad.
        </Text>
      </HelpCard>
    </ScreenContainer>
  );
}

function HelpCard({
  children,
  icon,
  title
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  bodyText: {
    color: theme.mutedText,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20
  },
  card: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  cardTitle: {
    color: theme.text,
    flex: 1,
    fontSize: 17,
    fontWeight: "900"
  },
  contactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  content: {
    gap: spacing.lg
  },
  errorText: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "700"
  },
  faqAnswer: {
    color: theme.mutedText,
    fontSize: 13,
    lineHeight: 19
  },
  faqItem: {
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingBottom: spacing.sm
  },
  faqList: {
    gap: spacing.sm
  },
  faqQuestion: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  helperText: {
    color: theme.mutedText,
    fontSize: 13,
    lineHeight: 18
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: `${theme.primary}14`,
    borderRadius: radii.md,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  stepNumber: {
    alignItems: "center",
    backgroundColor: `${theme.secondary}1A`,
    borderRadius: 13,
    height: 26,
    justifyContent: "center",
    width: 26
  },
  stepNumberText: {
    color: theme.secondaryDark,
    fontSize: 12,
    fontWeight: "900"
  },
  stepRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  stepText: {
    color: theme.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  stepsList: {
    gap: spacing.sm
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "900"
  }
  });
}
