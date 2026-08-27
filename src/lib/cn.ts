export type ClassValue = string | number | false | null | undefined | ClassValue[];

/**
 * 조건부 className을 안전하게 합친다.
 * Tailwind 클래스 충돌까지 해결하지는 않으므로, 변형별 클래스는 서로 겹치지 않게 정의한다.
 */
export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];

  for (const value of values) {
    if (!value && value !== 0) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) classes.push(nested);
      continue;
    }
    classes.push(String(value));
  }

  return classes.join(" ");
}
