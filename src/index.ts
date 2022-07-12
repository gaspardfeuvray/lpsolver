import { LpProblem } from "./LpProblem.js";

// Solve linear programming problems in the canonical form
// Max z = cT x
// Subject to Ax ≤ b, x ≥ 0
export const solveLp = (A: number[][], b: number[], c: number[]) =>
  new LpProblem(A, b, c).solve_simplex();

// module.exports = { solveLp };
