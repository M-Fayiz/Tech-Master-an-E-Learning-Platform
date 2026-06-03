import { calculateShares } from "../../utils/calculateSplit.util";

describe("calculateShare()", () => {
  it("shoult return 200, 20% of 1000", () => {
    expect(calculateShares(1000, 20)).toBe(200);
  });

  it("it should return 0, for  0% of 1000", () => {
    expect(calculateShares(1000, 0)).toBe(0);
  });
});
