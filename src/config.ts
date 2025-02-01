import { logger } from "./logger";

export function getConfig(): {
  botToken: string;
  allowList: string[];
  socks5Flag: string;
} {
  const botToken = process.env.TELEGRAM_TOKEN;
  if (!botToken) {
    logger.error("TELEGRAM_TOKEN is required");
    process.exit(1);
  }

  const usernameListRegex = /^([a-zA-Z0-9_]{5,32})(,([a-zA-Z0-9_]{5,32}))*$/;
  if (
    !process.env.ALLOW_LIST ||
    !usernameListRegex.test(process.env.ALLOW_LIST)
  ) {
    logger.error(
      "ALLOW_LIST is required and must be a comma-separated list of Telegram usernames",
    );
    process.exit(1);
  }

  const socks5Flag =
    process.env.SOCKS5_URL && process.env.SOCKS5_CREDENTIALS
      ? `--proxy socks5://${process.env.SOCKS5_CREDENTIALS}@${process.env.SOCKS5_URL}`
      : "";

  return {
    botToken,
    allowList: process.env.ALLOW_LIST.split(","),
    socks5Flag,
  };
}
