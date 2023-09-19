import rfdc from "rfdc";
import invariant from "tiny-invariant";

// Tiny & faster `_.clone` function.
export const clone = rfdc();

// SEE: [You Might Not Need Lodash](https://youmightnotneed.com/lodash#isObject)
export const isObject = (a: any) =>
  a instanceof Object && !(a instanceof Function);

// SEE: [You Might Not Need Lodash](https://youmightnotneed.com/lodash#get)
export const get = (obj: Record<string, any>, path: string, defValue?: any) => {
  // If path is not defined or it has false value
  if (!path) return undefined;
  // Check if path is string or array. Regex : ensure that we do not have '.' and brackets.
  // Regex explained: https://regexr.com/58j0k
  const pathArray = (
    Array.isArray(path) ? path : path.match(/([^[.\]])+/g)
  ) as string[];
  invariant(pathArray, "must exists");

  // Find value
  const result = pathArray.reduce(
    (prevObj: Record<string, any>, key: string) => prevObj && prevObj[key],
    obj,
  );
  // If found value is undefined return default value; otherwise return the value
  return result === undefined ? defValue : result;
};

// SEE: [You Might Not Need Lodash](https://youmightnotneed.com/lodash#set)
export const set = (obj: Record<string, any>, path: string, value: any) => {
  // Regex explained: https://regexr.com/58j0k
  const pathArray = (
    Array.isArray(path) ? path : path.match(/([^[.\]])+/g)
  ) as string[];
  invariant(pathArray, "must exists");

  pathArray.reduce((acc: Record<string, any>, key: string, i: number) => {
    if (acc[key] === undefined) acc[key] = {};
    if (i === pathArray.length - 1) acc[key] = value;
    return acc[key];
  }, obj);
};
