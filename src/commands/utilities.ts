const MAX_TRIES = 5;

export function sleep(timeToSleep: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeToSleep);
  });
}

interface GetCommandHandlerElementOptions {
  openTaskpane?: boolean;
}

export async function getCommandHandlerElement(
  options?: GetCommandHandlerElementOptions,
) {
  const { openTaskpane = true } = options ?? {};
  await Office.onReady();

  if (openTaskpane) {
    await Office.addin.showAsTaskpane();
  }

  let timeToSleep = 100;
  let tries = 0;
  let commandHandlerElement;
  while (!commandHandlerElement && tries < MAX_TRIES) {
    if (tries > 0) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(timeToSleep);
      timeToSleep *= 1.5;
    }

    commandHandlerElement = window.document.getElementById(
      'command-handler-element',
    );
    tries += 1;
  }

  return commandHandlerElement;
}
