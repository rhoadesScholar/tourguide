/**
 * @license
 * Copyright 2018 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @file Ellipse-related shader functions.
 */
import { vec2 } from '../util/geom';
/**
 * Specifies the parameters of an ellipse in quadratic form.
 */
export var glsl_EllipseQuadraticForm = '\nstruct EllipseQuadraticForm {\n  highp float A;  // x*x coefficient\n  highp float B;  // x*y coefficient\n  highp float C;  // y*y coefficient\n  highp float D;  // x coefficient\n  highp float E;  // y coefficient\n  highp float F;  // 1 coefficient\n};\n';
/**
 * Given a 3-d ellipsoid, finds the ellipse corresponding to the z=0 cross-section.
 * @param A The positive semi-definite matrix defining the ellipsoid shape.
 * @param c The centroid.
 */
export var glsl_computeCrossSectionEllipse = [glsl_EllipseQuadraticForm, '\nEllipseQuadraticForm computeCrossSectionEllipse(mat3 A, vec3 c) {\n  EllipseQuadraticForm p;\n  p.A = A[0][0];\n  p.B = A[0][1] + A[1][0];\n  p.C = A[1][1];\n  p.D = -2.0 * c[0] * A[0][0] - c[1] * (A[0][1] + A[1][0]) +\n        c[2] * (A[0][2] + A[2][0]);\n  p.E = -c[0] * (A[0][1] + A[1][0]) - 2.0 * c[1] * A[1][1] +\n        c[2] * (A[1][2] + A[2][1]);\n  p.F = c[0] * c[0] * A[0][0] + c[0] * c[1] * (A[0][1] + A[1][0]) -\n        c[0] * c[2] * (A[0][2] + A[2][0]) + c[1] * c[1] * A[1][1] -\n        c[1] * c[2] * (A[1][2] + A[2][1]) + c[2] * c[2] * A[2][2] - 1.0;\n  return p;\n}\n'];
export function computeCrossSectionEllipseDebug(Ao, c) {
  var A = [[Ao[0], Ao[1], Ao[2]], [Ao[3], Ao[4], Ao[5]], [Ao[6], Ao[7], Ao[8]]];
  return {
    A: A[0][0],
    B: A[0][1] + A[1][0],
    C: A[1][1],
    D: -2.0 * c[0] * A[0][0] - c[1] * (A[0][1] + A[1][0]) + c[2] * (A[0][2] + A[2][0]),
    E: -c[0] * (A[0][1] + A[1][0]) - 2.0 * c[1] * A[1][1] + c[2] * (A[1][2] + A[2][1]),
    F: c[0] * c[0] * A[0][0] + c[0] * c[1] * (A[0][1] + A[1][0]) - c[0] * c[2] * (A[0][2] + A[2][0]) + c[1] * c[1] * A[1][1] - c[1] * c[2] * (A[1][2] + A[2][1]) + c[2] * c[2] * A[2][2] - 1.0
  };
}
export var glsl_CenterOrientEllipse = '\nstruct CenterOrientEllipse {\n  vec2 k;   // center\n  vec2 u1;  // minor axis direction\n  vec2 u2;  // major axis direction\n  float a;  // semimajor axis\n  float b;  // semiminor axis\n  bool valid; // indicates if the ellipse is valid\n};\n';
/**
 * Compute the center-orient parameterization of an ellipse from the quadratic parameterization.
 *
 * See: https://www.geometrictools.com/Documentation/InformationAboutEllipses.pdf
 */
export var glsl_computeCenterOrientEllipse = [glsl_EllipseQuadraticForm, glsl_CenterOrientEllipse, '\nCenterOrientEllipse computeCenterOrientEllipse(EllipseQuadraticForm p) {\n  CenterOrientEllipse r;\n  float a11 = p.A;\n  float a12 = p.B / 2.0;\n  float a22 = p.C;\n  float b1 = p.D;\n  float b2 = p.E;\n  float c = p.F;\n  float kdenom = 2.0 * (a12 * a12 - a11 * a22);\n  float k1 = r.k.x = (a22 * b1 - a12 * b2) / kdenom;\n  float k2 = r.k.y = (a11 * b2 - a12 * b1) / kdenom;\n  float mu = 1.0 / (a11 * k1 * k1 + 2.0 * a12 * k1 * k2 + a22 * k2 * k2 - c);\n  float m11 = mu * a11;\n  float m12 = mu * a12;\n  float m22 = mu * a22;\n  float lambdaTerm1 = m11 + m22;\n  float lambdaTerm2 = sqrt((m11 - m22) * (m11 - m22) + 4.0 * m12 * m12);\n  float lambda1 = ((lambdaTerm1 + lambdaTerm2) / 2.0);\n  float lambda2 = ((lambdaTerm1 - lambdaTerm2) / 2.0);\n  r.a = 1.0 / sqrt(lambda1);\n  r.b = 1.0 / sqrt(lambda2);\n  r.valid = lambda1 > 0.0 && lambda2 > 0.0;\n  if (abs(m12) < 1e-10) {\n    r.u1 = vec2(1.0, 0.0);\n  } else if (m11 >= m22) {\n    r.u1 = normalize(vec2(lambda1 - m22, m12));\n  } else {\n    r.u1 = normalize(vec2(m12, lambda1 - m11));\n  }\n  r.u2 = vec2(-r.u1.y, r.u1.x);\n  return r;\n}\n'];
export function computeCenterOrientEllipseDebug(p) {
  var a11 = p.A;
  var a12 = p.B / 2.0;
  var a22 = p.C;
  var b1 = p.D;
  var b2 = p.E;
  var c = p.F;
  var kdenom = 2.0 * (a12 * a12 - a11 * a22);
  var k1 = (a22 * b1 - a12 * b2) / kdenom;
  var k2 = (a11 * b2 - a12 * b1) / kdenom;
  var mu = 1.0 / (a11 * k1 * k1 + 2.0 * a12 * k1 * k2 + a22 * k2 * k2 - c);
  var m11 = mu * a11;
  var m12 = mu * a12;
  var m22 = mu * a22;
  var lambdaTerm1 = m11 + m22;
  var lambdaTerm2 = Math.sqrt((m11 - m22) * (m11 - m22) + 4.0 * m12 * m12);
  var lambda1 = (lambdaTerm1 + lambdaTerm2) / 2.0;
  var lambda2 = (lambdaTerm1 - lambdaTerm2) / 2.0;
  var a = 1.0 / Math.sqrt(lambda1);
  var b = 1.0 / Math.sqrt(lambda2);
  var u1 = void 0;
  if (Math.abs(m12) < 1e-10) {
    u1 = vec2.fromValues(1, 0);
  } else if (m11 >= m22) {
    u1 = vec2.fromValues(lambda1 - m22, m12);
  } else {
    u1 = vec2.fromValues(m12, lambda1 - m11);
  }
  vec2.normalize(u1, u1);
  var u2 = vec2.fromValues(-u1[1], u1[0]);
  return { k: vec2.fromValues(k1, k2), u1: u1, u2: u2, a: a, b: b, lambda1: lambda1, lambda2: lambda2, m11: m11, m12: m12, m22: m22 };
}
//# sourceMappingURL=ellipse.js.map