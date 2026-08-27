/** 사용자가 내려받을 PDF 파일 이름과 응답 헤더를 만든다. */

/** 파일 이름에 쓸 수 없는 문자를 정리한다. 빈 이름이 되면 기본값을 쓴다. */
export function pdfFileName(title: string): string {
  const cleaned = title
    // 경로 구분자와 제어 문자는 파일 이름에 쓸 수 없다.
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `${cleaned === "" ? "presentation" : cleaned}.pdf`;
}

/**
 * 한글 제목도 그대로 내려받을 수 있게 `filename*`을 함께 넣는다.
 * 옛 브라우저를 위한 `filename`에는 ASCII만 남긴다.
 */
export function pdfContentDisposition(title: string): string {
  const fileName = pdfFileName(title);
  const asciiName = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");

  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
