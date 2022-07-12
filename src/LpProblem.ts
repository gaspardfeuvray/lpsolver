const assert = (expr: boolean, msg: string) => {
  if (!expr) throw new Error(msg);
};

const swap = (a: number, b: number): [number, number] => [b, a];

// export type problemIs = "SOLVED" | "UNBOUNDED" | "INFEASIBLE";

export interface Solution {
  solutionStatus: "SOLVED" | "INFEASIBLE" | "UNBOUNDED";
  variables: number[]; // empty if not solved
  objectiveValue: number; // NaN if not solved
}

export class LpProblem {
  #A: number[][]; // m x n, rows x columns
  #b: number[];
  #c: number[];

  #m: number; // # constraints, rows
  #n: number; // # variables, columns

  #N: number[]; // index of non bas
  #B: number[];

  #v: number;

  constructor(A: number[][], b: number[], c: number[]) {
    this.#A = [...A];
    this.#b = [...b];
    this.#c = [...c];

    this.#m = b.length;
    this.#n = c.length;

    this.#N = new Array(this.#n).fill(0) as number[];
    this.#B = new Array(this.#m).fill(0) as number[];

    this.#v = 0;

    assert(A.length === this.#m, `matrix A does not have ${this.#m} rows`);
    A.forEach((row) => {
      assert(
        row.length === this.#n,
        `matrix A does not have ${this.#n} columns`
      );
      row.forEach((el) => assert(Number.isFinite(el), "invalid number in A"));
    });

    b.forEach((el) => assert(Number.isFinite(el), "invalid number in A"));
    c.forEach((el) => assert(Number.isFinite(el), "invalid number in A"));
  }

  #pivot = (x: number, y: number) => {
    // first rearrange the x-th row
    for (let j = 0; j < this.#n; j++) {
      if (j != y) {
        this.#A[x][j] /= -this.#A[x][y];
      }
    }
    this.#b[x] /= -this.#A[x][y];
    this.#A[x][y] = 1.0 / this.#A[x][y];

    // now rearrange the other rows
    for (let i = 0; i < this.#m; i++) {
      if (i != x) {
        for (let j = 0; j < this.#n; j++) {
          if (j != y) {
            this.#A[i][j] += this.#A[i][y] * this.#A[x][j];
          }
        }
        this.#b[i] += this.#A[i][y] * this.#b[x];
        this.#A[i][y] *= this.#A[x][y];
      }
    }

    // now rearrange the objective function
    for (let j = 0; j < this.#n; j++) {
      if (j != y) {
        this.#c[j] += this.#c[y] * this.#A[x][j];
      }
    }
    this.#v += this.#c[y] * this.#b[x];
    this.#c[y] *= this.#A[x][y];

    // finally, swap the basic & nonbasic variable
    [this.#B[x], this.#N[y]] = swap(this.#B[x], this.#N[y]);
  };

  // Run a single iteration of the simplex algorithm.
  // Returns: 0 if OK, 1 if STOP, -1 if UNBOUNDED
  #iterate_simplex = () => {
    //   console.log("\n--------------------");

    let ind = -1,
      best_var = -1;
    for (let j = 0; j < this.#n; j++) {
      if (this.#c[j] > 0) {
        if (best_var == -1 || this.#N[j] < ind) {
          ind = this.#N[j];
          best_var = j;
        }
      }
    }
    if (ind == -1) return 1;

    let max_constr = Number.POSITIVE_INFINITY;
    let best_constr = -1;
    for (let i = 0; i < this.#m; i++) {
      if (this.#A[i][best_var] < 0) {
        let curr_constr = -this.#b[i] / this.#A[i][best_var];
        if (curr_constr < max_constr) {
          max_constr = curr_constr;
          best_constr = i;
        }
      }
    }
    if (!Number.isFinite(max_constr)) return -1;
    else this.#pivot(best_constr, best_var);

    return 0;
  };

  #initialise_simplex = () => {
    let k = -1;
    let min_b = -1; // dec

    for (let i = 0; i < this.#m; i++) {
      if (k == -1 || this.#b[i] < min_b) {
        k = i;
        min_b = this.#b[i];
      }
    }

    if (this.#b[k] >= 0) {
      // basic solution feasible!

      for (let j = 0; j < this.#n; j++) {
        this.#N[j] = j;
      }

      for (let i = 0; i < this.#m; i++) {
        this.#B[i] = this.#n + i;
      }
      return 0;
    }

    // generate auxiliary LP
    this.#n++;
    for (let j = 0; j < this.#n; j++) this.#N[j] = j;
    for (let i = 0; i < this.#m; i++) this.#B[i] = this.#n + i;

    // store the objective function
    let c_old: number[] = [];
    for (let j = 0; j < this.#n - 1; j++) c_old[j] = this.#c[j];
    let v_old = this.#v;

    // aux. objective function
    this.#c[this.#n - 1] = -1;
    for (let j = 0; j < this.#n - 1; j++) this.#c[j] = 0;
    this.#v = 0;
    // aux. coefficients
    for (let i = 0; i < this.#m; i++) this.#A[i][this.#n - 1] = 1;

    // perform initial pivot
    this.#pivot(k, this.#n - 1);

    // now solve aux. LP
    let code;
    while (!(code = this.#iterate_simplex()));

    if (this.#v != 0) return -1; // infeasible!

    let z_basic = -1;
    for (let i = 0; i < this.#m; i++) {
      if (this.#B[i] == this.#n - 1) {
        z_basic = i;
        break;
      }
    }

    // if x_n basic, perform one degenerate pivot to make it nonbasic
    if (z_basic != -1) this.#pivot(z_basic, this.#n - 1);

    let z_nonbasic = -1;
    for (let j = 0; j < this.#n; j++) {
      if (this.#N[j] == this.#n - 1) {
        z_nonbasic = j;
        break;
      }
    }

    for (let i = 0; i < this.#m; i++) {
      this.#A[i][z_nonbasic] = this.#A[i][this.#n - 1];
    }
    [this.#N[z_nonbasic], this.#N[this.#n - 1]] = swap(
      this.#N[z_nonbasic],
      this.#N[this.#n - 1]
    );

    this.#n--;
    for (let j = 0; j < this.#n; j++) if (this.#N[j] > this.#n) this.#N[j]--;
    for (let i = 0; i < this.#m; i++) if (this.#B[i] > this.#n) this.#B[i]--;

    for (let j = 0; j < this.#n; j++) this.#c[j] = 0;
    this.#v = v_old;

    for (let j = 0; j < this.#n; j++) {
      let ok = false;
      for (let jj = 0; jj < this.#n; jj++) {
        if (j == this.#N[jj]) {
          this.#c[jj] += c_old[j];
          ok = true;
          break;
        }
      }
      if (ok) continue;
      for (let i = 0; i < this.#m; i++) {
        if (j == this.#B[i]) {
          for (let jj = 0; jj < this.#n; jj++) {
            this.#c[jj] += c_old[j] * this.#A[i][jj];
          }
          this.#v += c_old[j] * this.#b[i];
          break;
        }
      }
    }

    return 0;
  };

  // Runs the simplex algorithm to optimise the LP.
  // Returns a vector of -1s if unbounded, -2s if infeasible.
  solve_simplex = (): Solution => {
    if (this.#initialise_simplex() == -1)
      return {
        solutionStatus: "INFEASIBLE",
        variables: [],
        objectiveValue: Number.NaN,
      };

    let code;
    while (!(code = this.#iterate_simplex()));

    if (code == -1)
      return {
        solutionStatus: "UNBOUNDED",
        variables: [],
        objectiveValue: Number.NaN,
      };

    // console.log("this.#N:::", this.#N);
    // console.log("this.#B:::", this.#B);

    // console.log("this.#b:::", this.#b);
    // console.log("this.#c:::", this.#c);

    const x = new Array(this.#m + this.#n).fill(0) as number[];

    for (let j = 0; j < this.#n; j++) x[this.#N[j]] = 0;
    for (let i = 0; i < this.#m; i++) x[this.#B[i]] = this.#b[i];

    return {
      solutionStatus: "SOLVED",
      variables: x.slice(0, this.#n),
      objectiveValue: this.#v,
    };
  };
}
