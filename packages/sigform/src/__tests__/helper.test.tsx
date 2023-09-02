import { deepSignal, setDeepSignal } from "@/.";
import { effect } from "@preact/signals-react";
import "@testing-library/jest-dom";
import React from "react";

describe("deepSignal", () => {
  describe("helper", () => {
    it("should handle pop", () => {
      const data = deepSignal([1, 2]);
      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      data.pop();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toEqual([1, 2]);
      expect(spy.mock.calls[1][0]).toEqual([1]);
    });

    it("should handle push", () => {
      const data = deepSignal([1]);
      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      data.push(2, 3);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toEqual([1]);
      expect(spy.mock.calls[1][0]).toEqual([1, 2, 3]);
    });

    it("should handle shift", () => {
      const data = deepSignal([1, 2]);
      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      data.shift();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toEqual([1, 2]);
      expect(spy.mock.calls[1][0]).toEqual([2]);
    });

    it("should handle unshift", () => {
      const data = deepSignal([1]);
      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      data.unshift(2, 3);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toEqual([1]);
      expect(spy.mock.calls[1][0]).toEqual([2, 3, 1]);
    });

    it("should handle splice", () => {
      const data = deepSignal([1, 2, 3]);
      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      data.splice(0, 1, 9);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toEqual([1, 2, 3]);
      expect(spy.mock.calls[1][0]).toEqual([9, 2, 3]);
    });

    it("should handle splice with only index", () => {
      const data = deepSignal([1, 2, 3]);
      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      data.splice(0, 1);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toEqual([1, 2, 3]);
      expect(spy.mock.calls[1][0]).toEqual([2, 3]);
    });

    it("should handle reverse", () => {
      const data = deepSignal([1, 2, 3]);
      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      data.reverse();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toEqual([1, 2, 3]);
      expect(spy.mock.calls[1][0]).toEqual([3, 2, 1]);
    });

    it("should handle sort", () => {
      const data = deepSignal([2, 3, 1]);
      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      data.sort();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toEqual([2, 3, 1]);
      expect(spy.mock.calls[1][0]).toEqual([1, 2, 3]);
    });

    it("should handle fill", () => {
      const data = deepSignal([2, 3, 1]);
      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      data.fill("x");

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toEqual([2, 3, 1]);
      expect(spy.mock.calls[1][0]).toEqual(["x", "x", "x"]);
    });

    it("should handle copyWithin", () => {
      const data = deepSignal(["a", "b", "c", "d", "e"]);
      const spy = jest.fn();

      effect(() => {
        spy(data.dump());
      });

      data.copyWithin(0, 3, 4);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toEqual(["a", "b", "c", "d", "e"]);
      expect(spy.mock.calls[1][0]).toEqual(["d", "b", "c", "d", "e"]);
    });
  });
});
