import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: ["functions/lib/**", "playground/**"],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default config;
