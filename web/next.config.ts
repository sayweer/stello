import type { NextConfig } from "next";

const config: NextConfig = {
  // Build the workspace SDK before starting Next (the root scripts do this).
  transpilePackages: ["stello-sdk"],
};

export default config;
