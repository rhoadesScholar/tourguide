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
/**
 * @file Convenience interface for creating TrackableValue instances designed to represent alpha
 * (opacity) values.
 */
import { TrackableValue } from './trackable_value';
import { verifyFloat01 } from './util/json';
export function trackableAlphaValue() {
  var initialValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.5;

  return new TrackableValue(initialValue, verifyFloat01);
}
//# sourceMappingURL=trackable_alpha.js.map