import { deepSignal, isProxy, mutate } from "../deepSignal";
import { clone } from "../util";
import { jest } from "@jest/globals";
import { effect, signal } from "@preact/signals-react";
import { produceWithPatches } from "immer";

const dataOfMockCall = (fn: jest.Mock | undefined, nth: number) => {
  if (!fn) return null;
  const args = fn.mock.calls[nth - 1];
  return args[0];
};

describe("deepSignal", () => {
  describe("immer integration", () => {
    it("should produceWithPatches works well with deepSignal", async () => {
      const tryProduceWithPatches = (base: any, recipe: any) => {
        const [next, patches] = produceWithPatches(base, recipe) as any;
        return [next, patches];
      };

      expect(tryProduceWithPatches({}, () => {})).toEqual([{}, []]);
      expect(tryProduceWithPatches([], () => [])).toEqual([
        [],
        [{ op: "replace", path: [], value: [] }],
      ]);

      expect(tryProduceWithPatches(signal({}).value, () => {})).toEqual([
        {},
        [],
      ]);
      expect(tryProduceWithPatches(signal([]).value, () => [])).toEqual([
        [],
        [{ op: "replace", path: [], value: [] }],
      ]);

      expect(tryProduceWithPatches(deepSignal({}).value, () => {})).toEqual([
        {},
        [],
      ]);
      expect(tryProduceWithPatches(deepSignal([]).value, () => [])).toEqual([
        [],
        [{ op: "replace", path: [], value: [] }],
      ]);
    });
  });

  describe("partial mutation", () => {
    it("should allow mutate nested property", async () => {
      const test = deepSignal([{ hoge: { fuga: { piyo: "foo" } } }]);
      expect(isProxy(test.value)).toEqual(true);

      const onChange = jest.fn();
      effect(() => {
        onChange(clone(test.value));
      });

      mutate(test.value[0].hoge.fuga, (draft) => {
        draft.piyo = "baz";
      });

      mutate(test.value[0].hoge, (draft) => {
        draft.fuga = { piyo: "baa" };
      });

      expect(onChange).toHaveBeenCalledTimes(3);
      expect(dataOfMockCall(onChange, 1)).toEqual([
        { hoge: { fuga: { piyo: "foo" } } },
      ]);
      expect(dataOfMockCall(onChange, 2)).toEqual([
        { hoge: { fuga: { piyo: "baz" } } },
      ]);
      expect(dataOfMockCall(onChange, 3)).toEqual([
        { hoge: { fuga: { piyo: "baa" } } },
      ]);
    });

    it("should allow mutate nested array destructive operation", async () => {
      const test = deepSignal([{ id: 1, value: "hoge" }]);
      expect(isProxy(test.value)).toEqual(true);

      const onChange = jest.fn();
      effect(() => {
        onChange(clone(test.value));
      });

      mutate(test.value, (draft) => {
        draft.push({ id: 2, value: "fuga" });
      });

      mutate(test.value, (draft) => {
        return draft.filter((item) => item.id !== 1);
      });

      mutate(test.value[0], (draft) => {
        draft.value = "piyo";
      });

      expect(onChange).toHaveBeenCalledTimes(4);
      expect(dataOfMockCall(onChange, 1)).toEqual([{ id: 1, value: "hoge" }]);
      expect(dataOfMockCall(onChange, 2)).toEqual([
        { id: 1, value: "hoge" },
        { id: 2, value: "fuga" },
      ]);
      expect(dataOfMockCall(onChange, 3)).toEqual([{ id: 2, value: "fuga" }]);
      expect(dataOfMockCall(onChange, 4)).toEqual([{ id: 2, value: "piyo" }]);
    });
  });

  describe("onChange", () => {
    it("should create signal for array", async () => {
      const array = deepSignal<string[]>([]);

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(array.value));
      });

      array.value = [...array.value, "a"];

      expect(onChange).toHaveBeenCalledTimes(2);

      expect(dataOfMockCall(onChange, 1)).toEqual([]);
      expect(dataOfMockCall(onChange, 2)).toEqual(["a"]);
    });

    it("should create signal for array of objects", async () => {
      const array = deepSignal<{ hoge: { fuga: string } }[]>([]);

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(array.value));
      });

      mutate(array.value, (array) => {
        array.push({ hoge: { fuga: "piyo" } });
        array[0].hoge.fuga = "foo";
      });

      expect(onChange).toHaveBeenCalledTimes(2);

      expect(dataOfMockCall(onChange, 1)).toEqual([]);
      expect(dataOfMockCall(onChange, 2)).toEqual([{ hoge: { fuga: "foo" } }]);
    });

    it("should create signal for array of objects as default value", async () => {
      const array = deepSignal<{ hoge: { fuga: string } }[]>([
        { hoge: { fuga: "piyo" } },
      ]);

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(array.value));
      });

      mutate(array.value, (array) => {
        array[0].hoge.fuga = "foo";
      });

      expect(onChange).toHaveBeenCalledTimes(2);

      expect(dataOfMockCall(onChange, 1)).toEqual([{ hoge: { fuga: "piyo" } }]);
      expect(dataOfMockCall(onChange, 2)).toEqual([{ hoge: { fuga: "foo" } }]);
    });

    it("should create signal for array with reactive style", async () => {
      const array = deepSignal<string[]>([]);

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(array.value));
      });

      expect(dataOfMockCall(onChange, 1)).toEqual([]);

      mutate(array.value, (array) => {
        array.push("a");
      });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(dataOfMockCall(onChange, 2)).toEqual(["a"]);

      mutate(array.value, (array) => {
        array.push("b");
      });

      expect(onChange).toHaveBeenCalledTimes(3);
      expect(dataOfMockCall(onChange, 3)).toEqual(["a", "b"]);

      mutate(array.value, (array) => {
        array.pop();
      });

      expect(onChange).toHaveBeenCalledTimes(4);
      expect(dataOfMockCall(onChange, 4)).toEqual(["a"]);

      mutate(array.value, (array) => {
        array.splice(0, 1);
      });

      expect(onChange).toHaveBeenCalledTimes(5);
      expect(dataOfMockCall(onChange, 5)).toEqual([]);
    });

    it("should create signal for array with reactive style and 'delete' operation", async () => {
      const array = deepSignal<number[]>([1, 2, 3]);

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(array.value));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(dataOfMockCall(onChange, 1)).toEqual([1, 2, 3]);

      mutate(array.value, (array) => {
        array.shift();
      });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(dataOfMockCall(onChange, 2)).toEqual([2, 3]);
    });

    it("should create signal for array with mixed style", async () => {
      const array = deepSignal<string[]>([]);

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(array.value));
      });

      mutate(array.value, (array) => {
        array = [...array, "a"];
        array.push("b");
        array.pop();
        // Must return new array if draft is 'replaced' to new array.
        return array;
      });

      expect(onChange).toHaveBeenCalledTimes(2);

      expect(dataOfMockCall(onChange, 1)).toEqual([]);
      expect(dataOfMockCall(onChange, 2)).toEqual(["a"]);
    });

    it("should create signal for object", async () => {
      const obj = deepSignal<Record<string, any>>({});

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(obj.value));
      });

      mutate(obj.value, (obj) => {
        // Allow directly return new value.
        return { fuga: "piyo" };
      });

      expect(onChange).toHaveBeenCalledTimes(2);

      expect(dataOfMockCall(onChange, 1)).toEqual({});
      expect(dataOfMockCall(onChange, 2)).toEqual({ fuga: "piyo" });
    });

    it("should create signal for object with reactive style", async () => {
      const obj = deepSignal<Record<string, any>>({});

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(obj.value));
      });

      mutate(obj.value, (obj) => {
        obj.fuga = "piyo";
      });

      expect(onChange).toHaveBeenCalledTimes(2);

      expect(dataOfMockCall(onChange, 1)).toEqual({});
      expect(dataOfMockCall(onChange, 2)).toEqual({ fuga: "piyo" });
    });

    it("should create signal for object with mixed style", async () => {
      const obj = deepSignal<Record<string, any>>({});

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(obj.value));
      });

      mutate(obj.value, (obj) => {
        obj = { fuga: "piyo" };
        obj = { ...obj, piyo: "foo" };
        delete obj.piyo;
        return obj;
      });

      expect(onChange).toHaveBeenCalledTimes(2);

      expect(dataOfMockCall(onChange, 1)).toEqual({});
      expect(dataOfMockCall(onChange, 2)).toEqual({ fuga: "piyo" });
    });

    it("should create signal for object with watching deep changes", async () => {
      const obj = deepSignal<Record<string, any>>({});

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(obj.value));
      });

      mutate(obj.value, (obj) => {
        obj = { hoge: { fuga: "piyo" } };
        obj.hoge.fuga = "foo";
        delete obj.hoge.fuga;
        return obj;
      });

      expect(onChange).toHaveBeenCalledTimes(2);

      expect(dataOfMockCall(onChange, 1)).toEqual({});
      expect(dataOfMockCall(onChange, 2)).toEqual({ hoge: {} });
    });
  });
});
