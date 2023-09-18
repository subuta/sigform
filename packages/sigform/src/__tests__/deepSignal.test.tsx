import { deepSignal, isProxy } from "../deepSignal";
import { clone } from "../util";
import { jest } from "@jest/globals";
import { effect } from "@preact/signals-react";

const dataOfMockCall = (fn: jest.Mock | undefined, nth: number) => {
  if (!fn) return null;
  const args = fn.mock.calls[nth - 1];
  return args[0];
};

describe("sigform", () => {
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

      array.value.push({ hoge: { fuga: "piyo" } });

      // SEE: [Util | Node.js v20.6.1 Documentation](https://nodejs.org/docs/latest-v20.x/api/util.html#utiltypesisproxyvalue)
      expect(isProxy(array.value[0].hoge)).toEqual(true);

      array.value[0].hoge.fuga = "foo";

      expect(onChange).toHaveBeenCalledTimes(3);

      expect(dataOfMockCall(onChange, 1)).toEqual([]);
      expect(dataOfMockCall(onChange, 2)).toEqual([{ hoge: { fuga: "piyo" } }]);
      expect(dataOfMockCall(onChange, 3)).toEqual([{ hoge: { fuga: "foo" } }]);
    });

    it("should create signal for array of objects as default value", async () => {
      const array = deepSignal<{ hoge: { fuga: string } }[]>([
        { hoge: { fuga: "piyo" } },
      ]);

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(array.value));
      });

      // SEE: [Util | Node.js v20.6.1 Documentation](https://nodejs.org/docs/latest-v20.x/api/util.html#utiltypesisproxyvalue)
      expect(isProxy(array.value[0].hoge)).toEqual(true);

      array.value[0].hoge.fuga = "foo";

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

      array.value.push("a");

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(dataOfMockCall(onChange, 2)).toEqual(["a"]);

      array.value.push("b");

      expect(onChange).toHaveBeenCalledTimes(3);
      expect(dataOfMockCall(onChange, 3)).toEqual(["a", "b"]);

      array.value.pop();

      expect(onChange).toHaveBeenCalledTimes(4);
      expect(dataOfMockCall(onChange, 4)).toEqual(["a"]);

      array.value.splice(0, 1);

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

      array.value.shift();

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(dataOfMockCall(onChange, 2)).toEqual([2, 3]);
    });

    it("should create signal for array with mixed style", async () => {
      const array = deepSignal<string[]>([]);

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(array.value));
      });

      array.value = [...array.value, "a"];
      array.value.push("b");

      array.value.pop();

      expect(onChange).toHaveBeenCalledTimes(4);

      expect(dataOfMockCall(onChange, 1)).toEqual([]);
      expect(dataOfMockCall(onChange, 2)).toEqual(["a"]);
      expect(dataOfMockCall(onChange, 3)).toEqual(["a", "b"]);
      expect(dataOfMockCall(onChange, 4)).toEqual(["a"]);
    });

    it("should create signal for object", async () => {
      const obj = deepSignal<Record<string, any>>({});

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(obj.value));
      });

      obj.value = { fuga: "piyo" };

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

      obj.value.fuga = "piyo";

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

      obj.value = { fuga: "piyo" };
      obj.value = { ...obj.value, piyo: "foo" };

      delete obj.value.piyo;

      expect(onChange).toHaveBeenCalledTimes(4);

      expect(dataOfMockCall(onChange, 1)).toEqual({});
      expect(dataOfMockCall(onChange, 2)).toEqual({ fuga: "piyo" });
      expect(dataOfMockCall(onChange, 3)).toEqual({
        fuga: "piyo",
        piyo: "foo",
      });
      expect(dataOfMockCall(onChange, 4)).toEqual({
        fuga: "piyo",
      });
    });

    it("should create signal for object with watching deep changes", async () => {
      const obj = deepSignal<Record<string, any>>({});

      const onChange = jest.fn();

      effect(() => {
        onChange(clone(obj.value));
      });

      obj.value = { hoge: { fuga: "piyo" } };
      obj.value.hoge.fuga = "foo";

      // delete obj.value.hoge.fuga;

      expect(onChange).toHaveBeenCalledTimes(3);

      expect(dataOfMockCall(onChange, 1)).toEqual({});
      expect(dataOfMockCall(onChange, 2)).toEqual({ hoge: { fuga: "piyo" } });
      expect(dataOfMockCall(onChange, 3)).toEqual({ hoge: { fuga: "foo" } });
    });
  });
});
