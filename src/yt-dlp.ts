import { $ } from "bun";

export async function installYtDlp() {
  await $`apk add --no-cache ffmpeg curl python3`.quiet();

  await $`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp`.quiet();
  await $`chmod a+rx /usr/local/bin/yt-dlp`.quiet();

  return await getYtDlpVersion();
}

export async function updateYtDlp(): Promise<{
  updated: boolean;
  version: string;
}> {
  await $`apk update`.quiet();
  await $`apk upgrade ffmpeg curl python3`.quiet();

  const oldVersion = await getYtDlpVersion();
  await $`yt-dlp -U`.quiet();
  const newVersion = await getYtDlpVersion();

  return { updated: oldVersion !== newVersion, version: newVersion };
}

async function getYtDlpVersion() {
  const output = await $`yt-dlp --version`.quiet();
  return output.text().trim();
}
