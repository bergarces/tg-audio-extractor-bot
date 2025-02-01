import { botStartWithPolling } from "./bot";
import { getConfig } from "./config";
import { logger } from "./logger";
import { installYtDlp, updateYtDlp } from "./yt-dlp";
import { setInterval } from "node:timers";

try {
  const version = await installYtDlp();
  logger.info({ version }, "yt-dlp installed");
} catch (error) {
  logger.error({ error }, "Error installing yt-dlp");
  process.exit(1);
}

setInterval(
  async () => {
    try {
      const updateDetails = await updateYtDlp();
      logger.info({ ...updateDetails }, "yt-dlp updated");
    } catch (error) {
      logger.error({ error }, "Error updating yt-dlp");
    }
  },
  24 * 60 * 60 * 1000, // Update every 24 hours
);

const { botToken, allowList, socks5Flag } = getConfig();

botStartWithPolling(botToken, allowList, socks5Flag);
