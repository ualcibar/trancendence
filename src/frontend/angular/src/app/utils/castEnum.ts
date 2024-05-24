export function toEnum<T extends { [key: string]: string }>(enumObj: T, value: any): T[keyof T] | undefined {
  if (Object.values(enumObj).includes(value)) {
    return value as T[keyof T];
  }
  return undefined;
}
