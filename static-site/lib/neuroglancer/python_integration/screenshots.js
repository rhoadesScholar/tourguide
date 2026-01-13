import _getIterator from 'babel-runtime/core-js/get-iterator';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
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
import debounce from 'lodash/debounce';
import { TrackableValue } from '../trackable_value';
import { RefCounted } from '../util/disposable';
import { verifyOptionalString } from '../util/json';
import { Signal } from '../util/signal';
import { getCachedJson } from '../util/trackable';
export var ScreenshotHandler = function (_RefCounted) {
    _inherits(ScreenshotHandler, _RefCounted);

    function ScreenshotHandler(viewer) {
        _classCallCheck(this, ScreenshotHandler);

        var _this = _possibleConstructorReturn(this, (ScreenshotHandler.__proto__ || _Object$getPrototypeOf(ScreenshotHandler)).call(this));

        _this.viewer = viewer;
        _this.sendScreenshotRequested = new Signal();
        _this.requestState = new TrackableValue(undefined, verifyOptionalString);
        /**
         * To reduce the risk of taking a screenshot while deferred code is still registering layers,
         * require that the viewer be in a ready state once, and still remain ready while all pending
         * events are handled, before a screenshot is taken.
         */
        _this.wasAlreadyVisible = false;
        _this.previousRequest = undefined;
        _this.debouncedMaybeSendScreenshot = _this.registerCancellable(debounce(function () {
            return _this.maybeSendScreenshot();
        }, 0));
        _this.requestState.changed.add(_this.debouncedMaybeSendScreenshot);
        _this.registerDisposer(viewer.display.updateFinished.add(_this.debouncedMaybeSendScreenshot));
        return _this;
    }

    _createClass(ScreenshotHandler, [{
        key: 'maybeSendScreenshot',
        value: function maybeSendScreenshot() {
            var requestState = this.requestState.value;
            var previousRequest = this.previousRequest;
            var layerSelectedValues = this.viewer.layerSelectedValues;

            if (requestState === undefined || requestState === previousRequest) {
                this.wasAlreadyVisible = false;
                return;
            }
            var viewer = this.viewer;

            if (!viewer.display.isReady()) {
                this.wasAlreadyVisible = false;
                return;
            }
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(viewer.layerManager.managedLayers), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var layer = _step.value;

                    if (!layer.isReady()) {
                        this.wasAlreadyVisible = false;
                        return;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            if (!this.wasAlreadyVisible) {
                this.wasAlreadyVisible = true;
                this.debouncedMaybeSendScreenshot();
                return;
            }
            this.wasAlreadyVisible = false;
            this.previousRequest = requestState;
            viewer.display.draw();
            var screenshotData = viewer.display.canvas.toDataURL();
            var prefix = 'data:image/png;base64,';
            var imageType = void 0;
            var image = void 0;
            if (!screenshotData.startsWith(prefix)) {
                imageType = '';
                image = '';
            } else {
                imageType = 'image/png';
                image = screenshotData.substring(prefix.length);
            }
            var actionState = {
                viewerState: JSON.parse(_JSON$stringify(getCachedJson(this.viewer.state).value)),
                selectedValues: JSON.parse(_JSON$stringify(layerSelectedValues)),
                screenshot: { id: requestState, image: image, imageType: imageType }
            };
            this.sendScreenshotRequested.dispatch(actionState);
        }
    }]);

    return ScreenshotHandler;
}(RefCounted);
//# sourceMappingURL=screenshots.js.map