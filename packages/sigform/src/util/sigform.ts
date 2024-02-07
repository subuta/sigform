import invariant from "tiny-invariant";

export const computeFieldTree = (
  node: HTMLElement | null,
  formId: string,
  acc: string[] = [],
): string[] => {
  invariant(node, "must exists");
  const name = node.dataset.sigform || "";
  if (name === formId) {
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
