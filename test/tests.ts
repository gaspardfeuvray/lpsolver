import { LpProblem, Solution } from "../src/LpProblem.js";

interface Problem {
  A: number[][];
  b: number[];
  c: number[];
}

// interface Solution {}

interface TestCase {
  name: string;
  problem: Problem;
  solution: Solution;
}

const cases: TestCase[] = [
  {
    name: "Basic solution feasible 1",
    problem: {
      A: [
        [-1, 1],
        [-2, -1],
      ],
      b: [1, 2],
      c: [5, -3],
    },
    solution: { is: "SOLVED", variables: [1, 0], objectiveValue: 5 },
  },
  {
    name: "Basic solution feasible 2",
    problem: {
      A: [
        [-1, -1, -3],
        [-2, -2, -5],
        [-4, -1, -2],
      ],
      b: [30, 24, 36],
      c: [3, 1, 2],
    },
    solution: { is: "SOLVED", variables: [8, 4, 0], objectiveValue: 28 },
  },
  {
    name: "Basic solution feasible 3",
    problem: {
      A: [
        [2, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 1],
      ],
      b: [-2, -1, -1],
      c: [-4, -2, -4, -1],
    },
    solution: { is: "SOLVED", variables: [1, 1, 0, 1], objectiveValue: -7 },
  },
  {
    name: "Basic solution infeasible",
    problem: {
      A: [[1], [-1]],
      b: [1, -1],
      c: [1],
    },
    solution: { is: "INFEASIBLE", variables: [], objectiveValue: Number.NaN },
  },
  {
    name: "LP infeasible",
    problem: {
      A: [
        [-1, -1],
        [2, 2],
      ],
      b: [2, -10],
      c: [3, -2],
    },
    solution: { is: "INFEASIBLE", variables: [], objectiveValue: Number.NaN },
  },
  {
    name: "LP unbounded",
    problem: {
      A: [
        [2, -1],
        [1, 2],
      ],
      b: [-1, -2],
      c: [1, -1],
    },
    solution: { is: "UNBOUNDED", variables: [], objectiveValue: Number.NaN },
  },
];

const executeTest = (tCase: TestCase) => {
  console.log("\n");
  const solution = new LpProblem(
    tCase.problem.A,
    tCase.problem.b,
    tCase.problem.c
  ).solve_simplex();

  const passedOrFail = (s: boolean) =>
    "\u001b[" + (s ? "32" : "31") + "m" + (s ? "passed" : "fail") + "\u001b[0m";
  // console.log("tCase.problem.c", tCase.problem.c);
  console.log(
    passedOrFail(solution.is === tCase.solution.is),
    "*** Test:",
    tCase.name,
    `| num variables: ${tCase.problem.c.length}`,
    solution.is === "SOLVED"
      ? `| values: ${solution.variables} | obj value: ${solution.objectiveValue}`
      : ""
  );
};

cases.map(executeTest);

console.log("tests passed");
