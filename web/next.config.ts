import type { NextConfig } from "next";

const config: NextConfig = {
  // Build the workspace SDK before starting Next (the build script does this).
  transpilePackages: ["stello-sdk"],

  /**
   * Every page lives under a language segment so a link can be shared and open
   * in the language it was read in. These two rules catch what arrives without
   * one: the bare domain, and links written before the site had languages.
   *
   * English is the default. This is a developer site reached from npm, from a
   * GitHub README and by coding agents, all of which are English; a Turkish
   * reader is one click away in the header.
   *
   * The agent files (/llms.txt and friends) and the relay stay unprefixed on
   * purpose — they are read by programs, are English only, and their addresses
   * are already quoted in skills and AGENTS.md files elsewhere.
   */
  async redirects() {
    return [
      { source: "/", destination: "/en", permanent: false },
      { source: "/docs/:path*", destination: "/en/docs/:path*", permanent: false },
    ];
  },
};

export default config;
