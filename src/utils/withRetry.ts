import { IBackOffOptions, backOff } from 'exponential-backoff';

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<IBackOffOptions>,
): Promise<T> {
  const defaultOptions = {
    numOfAttempts: 5,
    startingDelay: 1000,
    timeMultiple: 3,
    retry: (_: any, attemptNumber: number) => {
      console.log(
        `awaiting retry ${attemptNumber}/${
          options?.numOfAttempts ?? defaultOptions.numOfAttempts
        }...`,
      );
      return true;
    },
  };

  return (await backOff(fn, { ...defaultOptions, ...options })) as Promise<T>;
}
