import { ExpoRoot } from "expo-router";

const ctx = require.context(
  "./frontend/app",
  true,
  /^(?:\.\/)(?!(?:(?:.*\+api)|(?:\+html))\.[tj]sx?$).*\.[tj]sx?$/
);

export default function App() {
  return <ExpoRoot context={ctx} />;
}
