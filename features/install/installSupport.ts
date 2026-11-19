export function installInstructions(userAgent: string, touchPoints = 0) {
  if (/iPad|iPhone|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && touchPoints > 1)) {
    return {
      title: "Install on iPhone or iPad",
      steps: [
        "Open CAP Mastery in Safari. If you are inside an email or another app, open this page in Safari first.",
        "Tap Share, then Add to Home Screen (you may need to scroll through the menu).",
        "If shown, keep Open as Web App on. Tap Add, then launch CAP Mastery from its new icon.",
      ],
    };
  }
  if (/Android/i.test(userAgent)) {
    return {
      title: "Install on Android",
      steps: [
        "Open CAP Mastery in Chrome or Edge.",
        "Choose Install below when available, or open the browser menu and choose Install app or Add to Home screen.",
        "Confirm the installation, then open CAP Mastery from its new icon.",
      ],
    };
  }
  return {
    title: "Install on your computer",
    steps: [
      "In Chrome or Edge, use Install below when available, or the Install app icon in the address bar or browser menu.",
      "On a Mac using Safari, choose File → Add to Dock when available.",
      "If your browser does not offer app installation, open this website in a supported browser. Browser or device policies may restrict installation.",
    ],
  };
}
