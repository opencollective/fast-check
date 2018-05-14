import { ArrayArbitrary } from './ArrayArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import { PlaceholderType } from './definition/PlaceholderType';
import Shrinkable from './definition/Shrinkable';

/** @hidden */
function subArrayContains<T>(tab: T[], upperBound: number, includeValue: (v: T) => boolean): boolean {
  for (let idx = 0; idx < upperBound; ++idx) {
    if (includeValue(tab[idx])) return true;
  }
  return false;
}

/** @hidden */
function swap<T>(tab: T[], idx1: number, idx2: number): void {
  const temp = tab[idx1];
  tab[idx1] = tab[idx2];
  tab[idx2] = temp;
}

/** @hidden */
function buildCompareFilter<T>(compare: (a: T, b: T) => boolean): ((tab: Shrinkable<T>[]) => Shrinkable<T>[]) {
  return (tab: Shrinkable<T>[]): Shrinkable<T>[] => {
    let finalLength = tab.length;
    for (let idx = tab.length - 1; idx !== -1; --idx) {
      if (subArrayContains(tab, idx, t => compare(t.value, tab[idx].value))) {
        --finalLength;
        swap(tab, idx, finalLength);
      }
    }
    return tab.slice(0, finalLength);
  };
}

/**
 * For arrays of unique values coming from `arb`
 * @param arb Arbitrary used to generate the values inside the array
 */
function set<T>(arb: Arbitrary<T>): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having an upper bound size
 * @param arb Arbitrary used to generate the values inside the array
 * @param maxLength Upper bound of the generated array size
 */
function set<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having lower and upper bound size
 * @param arb Arbitrary used to generate the values inside the array
 * @param minLength Lower bound of the generated array size
 * @param maxLength Upper bound of the generated array size
 */
function set<T>(
  arb: Arbitrary<T>,
  minLength: number | PlaceholderType,
  maxLength: number | PlaceholderType
): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` - unicity defined by `compare`
 * @param arb Arbitrary used to generate the values inside the array
 * @param compare Return true when the two values are equals
 */
function set<T>(arb: Arbitrary<T>, compare: (a: T, b: T) => boolean): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having an upper bound size - unicity defined by `compare`
 * @param arb Arbitrary used to generate the values inside the array
 * @param maxLength Upper bound of the generated array size
 * @param compare Return true when the two values are equals
 */
function set<T>(arb: Arbitrary<T>, maxLength: number, compare: (a: T, b: T) => boolean): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having lower and upper bound size - unicity defined by `compare`
 * @param arb Arbitrary used to generate the values inside the array
 * @param minLength Lower bound of the generated array size
 * @param maxLength Upper bound of the generated array size
 * @param compare Return true when the two values are equals
 */
function set<T>(
  arb: Arbitrary<T>,
  minLength: number | PlaceholderType,
  maxLength: number | PlaceholderType,
  compare: (a: T, b: T) => boolean
): Arbitrary<T[]>;
function set<T>(
  arb: Arbitrary<T>,
  aLength?: number | PlaceholderType | ((a: T, b: T) => boolean),
  bLength?: number | PlaceholderType | ((a: T, b: T) => boolean),
  compareFn?: (a: T, b: T) => boolean
): Arbitrary<T[]> {
  const isBound = (misc: any) => {
    return misc != null && (typeof misc === 'number' || PlaceholderType.Default.is(misc));
  };
  const minLength: number | PlaceholderType =
    isBound(aLength) && isBound(bLength) ? (aLength as number | PlaceholderType) : PlaceholderType.Default;
  const maxLength: number | PlaceholderType = isBound(aLength)
    ? isBound(bLength)
      ? (bLength as number | PlaceholderType)
      : (aLength as number | PlaceholderType)
    : PlaceholderType.Default;
  const compare =
    compareFn != null
      ? compareFn
      : typeof bLength === 'function'
        ? (bLength as (a: T, b: T) => boolean)
        : typeof aLength === 'function'
          ? (aLength as (a: T, b: T) => boolean)
          : (a: T, b: T) => a === b;

  const arrayArb = ArrayArbitrary.from(arb, minLength, maxLength, buildCompareFilter(compare));
  if (minLength === 0) return arrayArb;
  return arrayArb.filter(tab => tab.length >= minLength);
}

export { set, buildCompareFilter };
