/**
 * @license
 * Copyright 2016 Google Inc.
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
export function colormaps() {
  return "vec3 colormapJet(float x) {\n  vec3 result;\n  result.r = x < 0.89 ? ((x - 0.35) / 0.31) : (1.0 - (x - 0.89) / 0.11 * 0.5);\n  result.g = x < 0.64 ? ((x - 0.125) * 4.0) : (1.0 - (x - 0.64) / 0.27);\n  result.b = x < 0.34 ? (0.5 + x * 0.5 / 0.11) : (1.0 - (x - 0.34) / 0.31);\n  return clamp(result, 0.0, 1.0);\n}\n\n/*\n * Adapted from http://www.mrao.cam.ac.uk/~dag/CUBEHELIX/CubeHelix.m\n * which is licensed under http://unlicense.org/\n */\nvec3 colormapCubehelix(float x) {\n  float xclamp = clamp(x, 0.0, 1.0);\n  float angle = 2.0 * 3.1415926 * (4.0 / 3.0 + xclamp);\n  float amp = xclamp * (1.0 - xclamp) / 2.0;\n  vec3 result;\n  float cosangle = cos(angle);\n  float sinangle = sin(angle);\n  result.r = -0.14861 * cosangle + 1.78277 * sinangle;\n  result.g = -0.29227 * cosangle + -0.90649 * sinangle;\n  result.b = 1.97294 * cosangle;\n  result = clamp(xclamp + amp * result, 0.0, 1.0);\n  return result;\n}";
}
//# sourceMappingURL=colormaps.js.map