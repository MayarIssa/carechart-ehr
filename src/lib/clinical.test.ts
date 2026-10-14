import { describe, expect, it } from "vitest";
import { ageOn, bloodPressureCategory, bmi, bmiCategory, vitalFlags } from "./clinical";

describe("ageOn", () => {
  it("counts a birthday that has already happened this year", () => {
    expect(ageOn("1990-03-10", new Date("2026-10-14T12:00:00"))).toBe(36);
  });

  it("doesn't count a birthday later this year", () => {
    expect(ageOn("1990-12-25", new Date("2026-10-14T12:00:00"))).toBe(35);
  });

  it("counts the birthday itself", () => {
    expect(ageOn("2000-10-14", new Date("2026-10-14T12:00:00"))).toBe(26);
  });
});

describe("bmi", () => {
  it("calculates and rounds to one decimal", () => {
    expect(bmi(70, 175)).toBe(22.9);
  });

  it("puts values in the right category", () => {
    expect(bmiCategory(17)).toBe("Underweight");
    expect(bmiCategory(22.9)).toBe("Healthy");
    expect(bmiCategory(27)).toBe("Overweight");
    expect(bmiCategory(31)).toBe("Obese");
  });
});

describe("bloodPressureCategory", () => {
  it.each([
    [115, 75, "Normal"],
    [125, 78, "Elevated"],
    [132, 82, "Stage 1 hypertension"],
    [118, 85, "Stage 1 hypertension"],
    [150, 95, "Stage 2 hypertension"],
    [185, 100, "Hypertensive crisis"],
  ] as const)("%i/%i is %s", (sys, dia, expected) => {
    expect(bloodPressureCategory(sys, dia)).toBe(expected);
  });
});

describe("vitalFlags", () => {
  it("returns nothing for normal readings", () => {
    expect(vitalFlags({ systolic: 115, diastolic: 75, heartRate: 70, temperatureC: 36.8 })).toEqual([]);
  });

  it("flags fever and fast heart rate", () => {
    const flags = vitalFlags({ systolic: 118, diastolic: 76, heartRate: 104, temperatureC: 38.4 });
    expect(flags.map((f) => f.level)).toEqual(["warning", "warning"]);
  });

  it("marks a hypertensive crisis as critical", () => {
    const flags = vitalFlags({ systolic: 190, diastolic: 110, heartRate: 80, temperatureC: 37 });
    expect(flags[0]).toEqual({ label: "Hypertensive crisis", level: "critical" });
  });
});
