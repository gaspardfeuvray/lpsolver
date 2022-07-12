
# lpsolver
LP solver written in JS+TS with no dependency (simplex algorithm).

This package currently does one and one thing only: solve linear programming problems expressed in the canonical form.

Mixed Integer LPs are not yet supported.


Find **x**

That maximizes **c<sup>T</sup>⋅x**

Subject to **A⋅x ≤ b**

And **x ≥ 0**


## Install
```sh
npm install lpsolver
```

## Getting started
```js
import { solveLp } from "lpsolver"

A: [
[-1, -1, -3],
[-2, -2, -5],
[-4, -1, -2],
],
b: [30, 24, 36],
c: [3, 1, 2],

const { solutionStatus, variables, objectiveValue } = solveLp(A, b, c)

console.log("Problem is", solutionStatus)
```
