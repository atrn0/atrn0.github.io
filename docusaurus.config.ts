import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Arata Sato",
  tagline: "",
  favicon: "img/favicon.ico",
  url: "https://atrn0.github.io",
  baseUrl: "/",
  organizationName: "atrn0", // Usually your GitHub org/user name.
  projectName: "atrn0.github.io", // Usually your repo name.
  trailingSlash: false,
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  i18n: {
    defaultLocale: "ja",
    locales: ["ja", "en"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/atrn0/atrn0.github.io/edit/main",
          routeBasePath: "/",
          showLastUpdateTime: true,
        },
        blog: {
          showReadingTime: true,
          editUrl: "https://github.com/atrn0/atrn0.github.io/edit/main",
          showLastUpdateAuthor: false,
          routeBasePath: "p",
          feedOptions: { type: "all" },
          showLastUpdateTime: true,
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/img/avatar.png",
    navbar: {
      title: "Arata Sato",
      logo: {
        alt: "Arata Sato",
        src: "atrn0.svg",
        style: { borderRadius: "50%" },
      },
      items: [
        { to: "/p", label: "Articles", position: "left" },
        { to: "/misc", label: "Misc", position: "right" },
      ],
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
