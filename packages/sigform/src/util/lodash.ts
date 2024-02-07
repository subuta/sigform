import { produce } from "immer";
import invariant from "tiny-invariant";

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

// set values into obj accepts flatten "dot notation"(eg: "hoge.fuga") key.
export const mergeFlatten = (
  obj: Record<string, any>,
  flattenValues: Record<string, any>,
) =>
  produce(obj, (draft) => {
    const keys = Object.keys(flattenValues);
    keys.forEach((field) => {
      set(draft, field, flattenValues[field]);
    });
  });
