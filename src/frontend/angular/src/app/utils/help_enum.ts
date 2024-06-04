import { LogFilter, Logger } from "./debug";

function capitalizeFirst(input: string): string {
  if (input.length === 0) return input; // Handle empty string
  return input[0].toUpperCase() + input.slice(1).toLowerCase();
}


export function toEnum<T extends { [key: string]: string }>(enumObj: T, value: string): T[keyof T] | undefined {
  //value = capitalizeFirst(value) 
  if (Object.values(enumObj).includes(value)) {
    return value as T[keyof T];
  }
  return undefined;
}
export function getNextEnumValue<T extends { [s: string]: T[keyof T]; }>(enumObj: T, currentValue: T[keyof T]): T[keyof T] | undefined{
    const values = Object.values(enumObj) as T[keyof T][];
    const currentIndex = values.indexOf(currentValue);

    if (currentIndex === -1) {
      Logger.error(LogFilter.Others, 'get next enum value: pass a dammed enum, not some ramdom string')
      return
    }

    const nextIndex = (currentIndex + 1) % values.length;
    return values[nextIndex];
}

/*export function getEnumStrings<T extends { [s: string]: T[keyof T]; }>(enumObj : T) : string[]{
  return Object.values(enumObj);
}*/
export function getEnumStrings(enumObj: any): string[] {
  return Object.values(enumObj)
      .filter(val => typeof val === 'string')
      .filter(val => val !== undefined && val !== '') as string[];
}