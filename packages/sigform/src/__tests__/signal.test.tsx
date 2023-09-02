import { DeepObjectSignal, deepSignal, isSignal, setDeepSignal } from "@/.";
import { Signal, effect, signal } from "@preact/signals-react";
import "@testing-library/jest-dom";
import React from "react";

describe("deepSignal", () => {
  describe("factory", () => {
    it("should create deepSignal for string", () => {
      const data = deepSignal("hello");

      expect(isSignal(data)).toEqual(true);
    });

    it("should create deepSignal for object", () => {
      const data = deepSignal({
        hoge: "fuga",
        fuga: "piyo",
      });

      expect(isSignal(data)).toEqual(true);
      expect(isSignal(data.value.hoge)).toEqual(true);
      expect(isSignal(data.value.fuga)).toEqual(true);
    });

    it("should create deepSignal for array", () => {
      const data = deepSignal([1, 2, 3]);

      expect(isSignal(data)).toEqual(true);
      expect(isSignal(data.value[0])).toEqual(true);
    });

    it("should create deepSignal for array in object", () => {
      const data = deepSignal({
        array: [1, 2, 3],
      });

      expect(isSignal(data)).toEqual(true);
      expect(isSignal(data.value.array)).toEqual(true);
      expect(isSignal(data.value.array.value[0])).toEqual(true);
    });

    it("should create deepSignal for object in array", () => {
      const data = deepSignal([{ hoge: "fuga" }]);

      expect(isSignal(data)).toEqual(true);
      expect(isSignal(data.value[0])).toEqual(true);
      expect(isSignal(data.value[0].value["hoge"])).toEqual(true);
    });
  });

  describe("effect", () => {
    it("should detect update of deeply nested value", () => {
      const data = deepSignal([{ hoge: "fuga" }]);

      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      // Update deeply nested value
      expect(setDeepSignal(data, "0.hoge", "piyo")).toEqual(true);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toEqual([{ hoge: "fuga" }]);
      expect(spy.mock.calls[1][0]).toEqual([{ hoge: "piyo" }]);
    });

    it("should detect update of object value", () => {
      const data = deepSignal({ hoge: "fuga" });

      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });
      expect(spy.mock.calls[0][0]).toEqual({ hoge: "fuga" });

      // Update object value
      data.assign({ hoge: "piyo" });
      expect(spy.mock.calls[1][0]).toEqual({ hoge: "piyo" });

      // Add new key
      data.set("fuga", "hoge");
      expect(spy.mock.calls[2][0]).toEqual({ fuga: "hoge", hoge: "piyo" });

      expect(setDeepSignal(data, "fuga", "piyo")).toEqual(true);
      expect(spy.mock.calls[3][0]).toEqual({ fuga: "piyo", hoge: "piyo" });

      data.delete("fuga");
      expect(spy.mock.calls[4][0]).toEqual({ hoge: "piyo" });

      data.remove((v) => v === "piyo");
      expect(spy.mock.calls[5][0]).toEqual({});

      expect(spy).toHaveBeenCalledTimes(6);
    });

    it("should detect update of array operation", () => {
      const data = deepSignal([{ hoge: "fuga" }]);

      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      expect(spy.mock.calls[0][0]).toEqual([{ hoge: "fuga" }]);

      // Push item to array
      data.value = [...data.value, deepSignal({ hoge: "piyo" })];
      expect(spy.mock.calls[1][0]).toEqual([
        { hoge: "fuga" },
        { hoge: "piyo" },
      ]);

      // Update newly added array value
      setDeepSignal(data, "1.hoge", "hoge");
      expect(spy.mock.calls[2][0]).toEqual([
        { hoge: "fuga" },
        { hoge: "hoge" },
      ]);

      // Remove item from array
      data.value = data.dump().filter((data) => {
        return data.hoge === "fuga";
      });
      expect(spy.mock.calls[3][0]).toEqual([{ hoge: "fuga" }]);

      expect(spy).toHaveBeenCalledTimes(4);
    });
  });
});
