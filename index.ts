import { exec } from "node:child_process";
import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { promisify } from "node:util";
import filenamify from "filenamify";
import TelegramBot from "node-telegram-bot-api";
import pino from "pino";

const execPromise = promisify(exec);

const logger = pino();

const { botToken, allowList, socks5Flag } = parseEnvironmentVariables();

botStartWithPolling(botToken, allowList);

function botStartWithPolling(botToken: string, allowList: string[]) {
  const bot = new TelegramBot(botToken, {
    polling: {
      autoStart: true,
      interval: 1000,
      params: {
        timeout: 10,
      },
    },
  });

  bot.on("message", async (message, metadata) => {
    if (metadata.type !== "text") {
      return;
    }

    if (!message.chat.username || !allowList.includes(message.chat.username)) {
      bot.sendMessage(
        message.chat.id,
        `User ${message.chat.username} not allowed to use this bot.`,
      );
      logger.error(
        {
          username: message.chat.username,
        },
        "Unauthorized user",
      );
      return;
    }

    const youtubeRegex =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|.+\?v=)?([^\&\?]{11})/;
    const match = youtubeRegex.exec(message.text || "");
    const videoId = match?.[1];

    if (!match || !videoId) {
      bot.sendMessage(
        message.chat.id,
        "Error: The message is not a valid YouTube link.",
      );

      if (match && !videoId) {
        logger.error(
          { message: message.text },
          "No video id found in valid regex",
        );
      }

      return;
    }

    bot.sendMessage(message.chat.id, "Extracting audio. Please wait...");

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      const title = await getVideoTitle(videoUrl, socks5Flag);
      const fileName = await downloadAudio(videoUrl, title, socks5Flag);
      const mp3Stream = createReadStream(fileName);

      bot.sendAudio(
        message.chat.id,
        mp3Stream,
        {},
        { filename: fileName, contentType: "audio/mpeg" },
      );

      logger.info(
        {
          user: message.chat.username,
          videoUrl,
          fileName,
          originalMessage: message.text,
        },
        "Audio file sent",
      );

      try {
        await unlink(fileName);
      } catch (error) {
        logger.error(
          {
            user: message.chat.username,
            videoUrl,
            fileName,
            originalError: error,
          },
          "Error deleting file",
        );
      }
    } catch (error) {
      bot.sendMessage(message.chat.id, "Error downloading audio.");
      logger.error({ originalError: error }, "Error downloading audio");
    }
  });

  bot.on("polling_error", (error) => {
    logger.error({ originalError: error }, "Polling error");
  });

  logger.info({ allowList }, "Bot started");
}

function parseEnvironmentVariables(): {
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

async function getVideoTitle(
  videoUrl: string,
  socks5Flag: string,
): Promise<string> {
  const command = `yt-dlp ${videoUrl} -j ${socks5Flag}`;

  const { stdout, stderr } = await execPromise(command);

  if (stderr) {
    logger.error({ videoUrl }, "Error getting video title");
  }

  const info = JSON.parse(stdout);
  return info.title;
}

async function downloadAudio(
  videoUrl: string,
  title: string,
  socks5Flag: string,
): Promise<string> {
  const sanitizedTitle = filenamify(title);
  const fileName = `${sanitizedTitle}.mp3`;

  const command = `yt-dlp ${videoUrl} -x --audio-format mp3 --force-overwrites -o "${fileName}" ${socks5Flag}`;

  const { stderr } = await execPromise(command);

  if (stderr) {
    logger.error({ stderr, videoUrl }, "Error downloading audio");
  }

  return fileName;
}
