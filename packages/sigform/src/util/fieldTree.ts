import { get } from "./lodash";

export type Field<T> = {
  value: T;
  name: string | number | "root";
  parent?: Field<any>;
};

export type FieldTree = (string | number)[];

export const dig = (
  parent: Field<any>,
  name: string | number,
  defaultValue?: any,
): Field<any> => {
  const parentValue = parent.value;
  return {
    value: parentValue ? get(parentValue, String(name)) : defaultValue,
    name,
    parent,
  };
};

export const getTree = (f: Field<any>) => {
  let tree: FieldTree = [];

  let parent = f.parent;
  while (parent) {
    if (parent.name && parent.name !== "root") {
      tree.push(parent.name);
    }
    parent = parent.parent;
  }

  tree.reverse();

  return [...tree, f.name];
};
