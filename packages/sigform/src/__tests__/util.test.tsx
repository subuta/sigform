import { SigFormField } from "../context";
import { getFormData, sortFields } from "../util";
import { signal } from "@preact/signals-react";

const fields: SigFormField<any>[] = [
  { name: "obj", value: signal({ propA: "empty", propB: "value" }) },
  { name: "obj.propA", value: signal("hello") },
  { name: "obj.propB", value: signal("world!") },
  { name: "otherObj", value: signal({ hoge: "fuga" }) },
  { name: "otherObj.hoge", value: signal("piyo") },
  { name: "array", value: signal([{ name: "Taro Yamada" }]) },
  { name: "array.0", value: signal({ name: "Jiro Yamada" }) },
  { name: "array.0.name", value: signal("Saburo Yamada") },
];

describe("util", () => {
  describe("sortFields", () => {
    it("should fix inconsistent behavior if fields sorted differently", async () => {
      expect(
        getFormData(
          sortFields([
            { name: ":Rm:.obj.propA", value: signal("helloa") },
            { name: ":Rm:.obj", value: signal({ propA: "hello" }) },
          ] as SigFormField<any>[]),
        ),
      ).toEqual({ ":Rm:": { obj: { propA: "helloa" } } });

      expect(
        getFormData(
          sortFields([
            { name: ":Rm:.obj", value: signal({ propA: "hello" }) },
            { name: ":Rm:.obj.propA", value: signal("helloa") },
          ] as SigFormField<any>[]),
        ),
      ).toEqual({ ":Rm:": { obj: { propA: "helloa" } } });

      // Should apply "short -> long" name sorting.
      expect(
        sortFields([
          { name: ":Rm:.obj.propA", value: signal("helloa") },
          { name: ":Rm:.obj", value: signal({ propA: "hello" }) },
        ] as SigFormField<any>[]),
      ).toEqual([
        {
          name: ":Rm:.obj",
          value: expect.any(Object),
        },
        {
          name: ":Rm:.obj.propA",
          value: expect.any(Object),
        },
      ]);
    });
  });

  describe("getFormData", () => {
    it("should get all data", async () => {
      expect(getFormData(fields)).toEqual({
        array: [{ name: "Saburo Yamada" }],
        obj: { propA: "hello", propB: "world!" },
        otherObj: { hoge: "piyo" },
      });
    });

    it("should get partial data which matches key", async () => {
      expect(getFormData(fields, "obj")).toEqual({
        propA: "hello",
        propB: "world!",
      });
    });
  });
});
