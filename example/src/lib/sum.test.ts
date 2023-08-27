import { add } from "./sum";

describe("test", () => {
  it("should test the truth", () => {
    expect(add(1, 2)).toEqual(3);
  });
});
