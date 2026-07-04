import { ExpoRoot } from "expo-router";

const ctx = require.context(
  "./app",
  true,
  /^(?:\.\/)(?!(?:(?:.*\+api)|(?:\+html))\.[tj]sx?$).*\.[tj]sx?$/
);

export default function App() {
  return <ExpoRoot context={ctx} />;
}
