const ONE_MINUTE = 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;

function getMonthDuration(start: Date, end: Date) {
  const diffInYears = end.getFullYear() - start.getFullYear();

  if (diffInYears < 1) {
    return end.getMonth() - start.getMonth();
  }

  if (diffInYears === 1) {
    return end.getMonth() + (12 - start.getMonth());
  }

  return 12 * (diffInYears - 1) + (end.getMonth() + (12 - start.getMonth()));
}

type FriendlyDurationOptions = {
  pastRelation?: string;
  futureRelation?: string;
};

export function friendlyDuration(
  start: Date,
  end: Date,
  options: FriendlyDurationOptions = {},
) {
  const { pastRelation = 'ago', futureRelation = 'from now' } = options;
  const relation = end > start ? pastRelation : futureRelation;
  const diffInSeconds = Math.round(
    Math.abs(end.getTime() - start.getTime()) / 1000,
  );

  const diffInYears = Math.abs(end.getFullYear() - start.getFullYear());
  const diffInMonths =
    end > start ? getMonthDuration(start, end) : getMonthDuration(end, start);

  if (diffInSeconds < ONE_MINUTE) {
    return end > start ? 'just now' : 'soon';
  }
  if (diffInSeconds < ONE_HOUR) {
    const minutes = Math.floor(diffInSeconds / ONE_MINUTE);
    return minutes < 2
      ? `a minute ${relation}`
      : `${minutes} minutes ${relation}`;
  }
  if (diffInSeconds < ONE_DAY) {
    const hours = Math.floor(diffInSeconds / ONE_HOUR);
    return hours < 2 ? `an hour ${relation}` : `${hours} hours ${relation}`;
  }
  if (diffInSeconds < ONE_WEEK) {
    const days = Math.floor(diffInSeconds / ONE_DAY);
    return days < 2 ? `a day ${relation}` : `${days} days ${relation}`;
  }

  if (diffInSeconds < 4 * ONE_WEEK && diffInMonths < 2) {
    const weeks = Math.floor(diffInSeconds / ONE_WEEK);
    return weeks < 2 ? `a week ${relation}` : `${weeks} weeks ${relation}`;
  }

  if (diffInMonths < 12) {
    return diffInMonths < 2
      ? `a month ${relation}`
      : `${diffInMonths} months ${relation}`;
  }

  return diffInYears < 2
    ? `a year ${relation}`
    : `${diffInYears} years ${relation}`;
}
