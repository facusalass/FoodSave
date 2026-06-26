import { Redirect } from "expo-router";
import { SplashLoading } from "../src/components/SplashLoading";
import { useAuth } from "../src/context/AuthContext";

export default function IndexRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <SplashLoading />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session.user.role === "business") {
    return <Redirect href="/(business)/dashboard" />;
  }

  return <Redirect href="/(client)/home" />;
}
