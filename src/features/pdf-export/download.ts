/** 브라우저에서 응답을 파일로 내려받는 데 필요한 작은 도우미들. */

const UTF8_FILE_NAME = /filename\*=UTF-8''([^;]+)/i;
const PLAIN_FILE_NAME = /filename="([^"]+)"/i;

/** `Content-Disposition` 헤더에서 파일 이름을 읽는다. 없으면 null이다. */
export function fileNameFromDisposition(header: string | null): string | null {
  if (!header) return null;

  const utf8 = UTF8_FILE_NAME.exec(header);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      // 인코딩이 깨졌으면 아래의 단순 이름을 쓴다.
    }
  }

  return PLAIN_FILE_NAME.exec(header)?.[1] ?? null;
}

/**
 * 받은 데이터를 파일로 저장한다.
 *
 * 임시 URL은 브라우저가 다운로드를 시작한 뒤에 해제해야 한다.
 * 그래서 클릭 직후가 아니라 다음 작업 차례에 정리한다.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
