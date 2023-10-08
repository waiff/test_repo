import { sleep } from '../commands/utilities';
import { SpellbookError } from '../common/SpellbookError';

const TEN_SECONDS = 10_000;

let token: string;
let isLocked = false;

export async function getSsoAccessToken(): Promise<string> {
  try {
    while (isLocked) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(100);
    }

    if (token) {
      return token;
    }

    isLocked = true;
    token = await Office.auth.getAccessToken({
      allowSignInPrompt: true,
      allowConsentPrompt: true,
    });
    setTimeout(() => {
      // @ts-ignore FIX-ME
      token = undefined;
    }, TEN_SECONDS);

    if (!token) {
      throw new SpellbookError('received null access token');
    }

    return token;
  } finally {
    isLocked = false;
  }
}
