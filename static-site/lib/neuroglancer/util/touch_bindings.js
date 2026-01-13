import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
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
 * @file Facility for triggering named actions in response to touch events.
 */
import throttle from 'lodash/throttle';
import { RefCounted } from './disposable';
import { dispatchEvent, EventActionMap, registerActionListener } from './event_action_map';
/**
 * Minimum number of pixels in x and y that a touch point must move to trigger a
 * translate/rotate/pinch action.  This helps filter out spurious tiny movements that are hard to
 * avoid, especially with one finger touches.
 **/
var moveThreshold = 10;
/**
 * Number of milliseconds that a set of touch points must be held without moving (per moveThreshold)
 * to trigger a touchhold action.
 **/
var holdThreshold = 1000;
/**
 * Maximum duration of a tap.
 */
var maxTapDuration = 400;
/**
 * Maximum number of milliseconds delay between two taps to trigger a multitap action.
 */
var multiTapMaxInterval = 500;
var rotateThreshold = Math.PI / 20;
var pinchThreshold = 20;
var translateThreshold = 10;
function norm2(deltaX, deltaY) {
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}
function getTwoFingerDistanceAndAngle(touches) {
    var _touches = _slicedToArray(touches, 2),
        t0 = _touches[0],
        t1 = _touches[1];

    if (t0.identifier > t1.identifier) {
        var _ref = [t0, t1];
        t1 = _ref[0];
        t0 = _ref[1];
    }
    var offsetX = t0.clientX - t1.clientX;
    var offsetY = t0.clientY - t1.clientY;
    var distance = norm2(offsetX, offsetY);
    var angle = Math.atan2(offsetX, offsetY);
    return { distance: distance, angle: angle };
}
function getAngleDifference(x, y) {
    var TAU = Math.PI * 2;
    var d = Math.abs(x - y) % TAU;
    return Math.min(d, TAU - d);
}
export var TouchEventBinder = function (_RefCounted) {
    _inherits(TouchEventBinder, _RefCounted);

    function TouchEventBinder(target, eventMap) {
        _classCallCheck(this, TouchEventBinder);

        var _this = _possibleConstructorReturn(this, (TouchEventBinder.__proto__ || _Object$getPrototypeOf(TouchEventBinder)).call(this));

        _this.target = target;
        _this.eventMap = eventMap;
        _this.prevTouches = new _Map();
        _this.moved = false;
        /**
         * Initial angle for two-finger touch.  Once the difference between this ange the current angle
         * exceeds `rotateThreshold`, `touchrotate` events are dispatched.
         **/
        _this.prevAngle = 0;
        _this.rotated = false;
        /**
         * Initial distance for two-finger touch.  Once the difference between this ange the current
         * distance exceeds `pinchThreshold`, `touchpinich` events are dispatched.
         **/
        _this.prevDistance = 0;
        _this.pinched = false;
        _this.prevCenterX = 0;
        _this.prevCenterY = 0;
        _this.translated = false;
        _this.startHold = _this.registerCancellable(throttle(function (event, eventPhase, centerX, centerY) {
            var info = { event: event, centerX: centerX, centerY: centerY };
            _this.dispatch('touchhold' + event.targetTouches.length, event, info, eventPhase);
        }, holdThreshold, { leading: false, trailing: true }));
        _this.numPriorTaps = 0;
        _this.priorTapNumTouches = 0;
        _this.tapStartTime = 0;
        _this.tapEndTime = 0;
        _this.curTapNumTouches = 0;
        _this.registerEventListener(target, 'touchstart', function (event) {
            _this.handleTouchEvent(event);
        });
        _this.registerEventListener(target, 'touchmove', function (event) {
            _this.handleTouchEvent(event);
        });
        _this.registerEventListener(target, 'touchend', function (event) {
            _this.handleTouchEvent(event);
        });
        return _this;
    }

    _createClass(TouchEventBinder, [{
        key: 'dispatch',
        value: function dispatch(eventIdentifier, event, detail) {
            var eventPhase = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : event.eventPhase;

            dispatchEvent(eventIdentifier, event, eventPhase, detail, this.eventMap);
        }
    }, {
        key: 'handleTouchEvent',
        value: function handleTouchEvent(event) {
            if (event.target === this.target) {
                event.preventDefault();
            } else {
                return;
            }
            var newTouches = new _Map();
            var prevTouches = this.prevTouches,
                prevEvent = this.prevEvent;
            // Compute average movement.

            var centerX = 0,
                centerY = 0;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(event.targetTouches), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var touch = _step.value;

                    newTouches.set(touch.identifier, touch);
                    centerX += touch.clientX;
                    centerY += touch.clientY;
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

            centerX /= newTouches.size;
            centerY /= newTouches.size;
            // Remove touches that are no longer matched.
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(prevTouches.entries()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _ref2 = _step2.value;

                    var _ref3 = _slicedToArray(_ref2, 2);

                    var key = _ref3[0];
                    var _touch = _ref3[1];

                    var newTouch = newTouches.get(key);
                    if (newTouch === undefined) {
                        prevTouches.delete(key);
                    } else {
                        var _deltaX = newTouch.clientX - _touch.clientX;
                        var _deltaY = newTouch.clientY - _touch.clientY;
                        if (Math.abs(_deltaX) >= moveThreshold || Math.abs(_deltaY) >= moveThreshold) {
                            this.moved = true;
                        }
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            if (prevEvent === undefined || prevEvent.targetTouches.length !== newTouches.size || newTouches.size == 0) {
                this.moved = false;
                if (event.type === 'touchstart') {
                    this.startHold(event, event.eventPhase, centerX, centerY);
                    if (prevEvent === undefined || prevEvent.targetTouches.length === 0) {
                        this.tapStartTime = Date.now();
                        this.curTapNumTouches = 0;
                    }
                    this.curTapNumTouches = Math.max(this.curTapNumTouches, event.targetTouches.length);
                } else {
                    if (event.type == 'touchend') {
                        var now = Date.now();
                        if (event.targetTouches.length === 0 && now - this.tapStartTime < maxTapDuration) {
                            if (this.curTapNumTouches !== this.priorTapNumTouches || now - this.tapEndTime >= multiTapMaxInterval) {
                                this.numPriorTaps = 0;
                            }
                            ++this.numPriorTaps;
                            this.tapEndTime = now;
                            this.priorTapNumTouches = this.curTapNumTouches;
                            var info = { event: event, centerX: centerX, centerY: centerY };
                            this.dispatch('touchtap' + this.curTapNumTouches + 'x' + this.numPriorTaps, event, info);
                        }
                    }
                    this.startHold.cancel();
                }
                // Number of touches has changed.  Don't dispatch any events.
                // TODO: handle tap events
                this.prevTouches = newTouches;
                this.prevEvent = event;
                this.prevCenterX = centerX;
                this.prevCenterY = centerY;
                this.translated = false;
                if (newTouches.size === 2) {
                    var _getTwoFingerDistance = getTwoFingerDistanceAndAngle(newTouches.values()),
                        distance = _getTwoFingerDistance.distance,
                        angle = _getTwoFingerDistance.angle;

                    this.prevDistance = distance;
                    this.prevAngle = angle;
                    this.rotated = false;
                    this.pinched = false;
                }
                return;
            }
            if (!this.moved) {
                return;
            }
            this.tapStartTime = 0;
            this.startHold.cancel();
            this.prevTouches = newTouches;
            this.prevEvent = event;
            var prevCenterX = this.prevCenterX,
                prevCenterY = this.prevCenterY,
                translated = this.translated;

            var deltaX = centerX - prevCenterX;
            var deltaY = centerY - prevCenterY;
            if (translated === false && norm2(deltaX, deltaY) >= translateThreshold) {
                translated = this.translated = true;
            }
            if (translated === true && (deltaX !== 0 || deltaY !== 0)) {
                this.prevCenterX = centerX;
                this.prevCenterY = centerY;
                var _info = { event: event, deltaX: deltaX, deltaY: deltaY, centerX: centerX, centerY: centerY };
                this.dispatch('touchtranslate' + newTouches.size, event, _info);
            }
            if (newTouches.size === 2) {
                var _getTwoFingerDistance2 = getTwoFingerDistanceAndAngle(newTouches.values()),
                    _distance = _getTwoFingerDistance2.distance,
                    _angle = _getTwoFingerDistance2.angle;

                var pinched = this.pinched,
                    rotated = this.rotated,
                    prevDistance = this.prevDistance,
                    prevAngle = this.prevAngle;

                if (pinched === false && Math.abs(_distance - prevDistance) >= pinchThreshold) {
                    this.pinched = pinched = true;
                }
                var angleDiff = getAngleDifference(_angle, prevAngle);
                if (rotated === false && angleDiff >= rotateThreshold) {
                    this.rotated = rotated = true;
                }
                if (pinched === true && _distance != prevDistance) {
                    this.prevDistance = _distance;
                    var _info2 = { event: event, distance: _distance, prevDistance: prevDistance, centerX: centerX, centerY: centerY };
                    this.dispatch('touchpinch', event, _info2);
                }
                if (rotated === true && _angle !== prevAngle) {
                    this.prevAngle = _angle;
                    this.dispatch('touchrotate', event, { event: event, centerX: centerX, centerY: centerY, angle: _angle, prevAngle: prevAngle });
                }
            }
        }
    }]);

    return TouchEventBinder;
}(RefCounted);
export { EventActionMap, registerActionListener };
//# sourceMappingURL=touch_bindings.js.map