/**
 * 화면에 보여줄 값의 표시 형식을 한곳에서 관리한다.
 */

// 서버와 브라우저의 시간대가 달라도 같은 문자열이 되도록 시간대를 고정한다.
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** ISO 시각 문자열을 `2026. 08. 26. 15:04` 형태로 바꾼다. 값이 잘못되면 빈 문자열이다. */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return DATE_TIME_FORMATTER.format(date);
}
