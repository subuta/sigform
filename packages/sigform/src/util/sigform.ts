import { SigFormData, SigFormField } from "../context";
import { isProxy } from "../deepSignal";
import { unflatten } from "./index";
import { get } from "./lodash";
import invariant from "tiny-invariant";

export const computeFieldTree = (
  node: HTMLElement | null,
  formId: string,
  acc: string[] = [],
): string[] => {
  invariant(node, "must exists");
  const name = node.dataset.sigform || "";
  if (name === formId) {
    acc.push(formId);
    // Finish recursive call and format fieldName.
    return acc.filter((str) => !!str).reverse();
  }
  // Continue checking parentNodes.
  invariant(
    node.parentNode,
    "Root form not found. You may forgotten to include 'SigForm' component?",
  );
  return computeFieldTree(node.parentNode as HTMLElement, formId, [
    ...acc,
    name,
  ]);
};

// Sort fields by name for consistent behavior.
export const sortFields = (fields: SigFormField<any>[]) => {
  return fields.sort(function (a, b) {
    return ("" + a.name).localeCompare(b.name);
  });
};

export const getFormData = (fields: SigFormField<any>[], key = "") => {
  if (key) {
    fields = fields.filter((f) => f.name.startsWith(key));
  }

  const flatData = fields.reduce((acc, field) => {
    const signal = field.value;
    acc[field.name] = signal.value;
    return acc;
  }, {} as SigFormData);

  const data = unflatten(flatData) as SigFormData;
  if (key) {
    return get(data, key);
  }
  return data;
};
