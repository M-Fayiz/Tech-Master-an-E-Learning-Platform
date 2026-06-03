import { successResponse } from "../../utils/response.util";

describe("successResponse()", () => {
  it("should return true as success response", () => {
    const result = successResponse("OK", { email: "example.com" });
    expect(result.success).toBe(true);
  });

  it("it should include provided message", () => {
    const result = successResponse("Loggin Successfully", { name: "example" });
    expect(result.message).toBe("Loggin Successfully");
  });

  it("it should work in empty object", () => {
    const result = successResponse("OK", {});
    expect(result).toEqual({ success: true, message: "OK" });
  });
});
