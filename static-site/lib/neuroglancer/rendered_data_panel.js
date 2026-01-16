import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
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
import { getSelectedAnnotation } from './annotation/selection';
import { getAnnotationTypeRenderHandler } from './annotation/type_handler';
import { RenderedPanel } from './display_context';
import { PickIDManager } from './object_picking';
import { AutomaticallyFocusedElement } from './util/automatic_focus';
import { registerActionListener } from './util/event_action_map';
import { AXES_NAMES, kAxes, mat4, vec2, vec3 } from './util/geom';
import { KeyboardEventBinder } from './util/keyboard_bindings';
import { MouseEventBinder } from './util/mouse_bindings';
import { startRelativeMouseDrag } from './util/mouse_drag';
import { TouchEventBinder } from './util/touch_bindings';
import { getWheelZoomAmount } from './util/wheel_zoom';

var tempVec3 = vec3.create();
export var FramePickingData = function FramePickingData() {
    _classCallCheck(this, FramePickingData);

    this.pickIDs = new PickIDManager();
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.invTransform = mat4.create();
    this.frameNumber = -1;
};
export var PickRequest = function PickRequest() {
    _classCallCheck(this, PickRequest);

    this.buffer = null;
    this.glWindowX = 0;
    this.glWindowY = 0;
};
var pickRequestInterval = 30;
export var pickRadius = 12;
export var pickDiameter = 1 + pickRadius * 2;
/**
 * Sequence of offsets into C order (pickDiamater, pickDiamater) array in order of increasing
 * distance from center.
 */
export var pickOffsetSequence = function () {
    var maxDist2 = Math.pow(pickRadius, 2);
    var getDist2 = function getDist2(x, y) {
        return Math.pow(x - pickRadius, 2) + Math.pow(y - pickRadius, 2);
    };
    var offsets = new Uint32Array(pickDiameter * pickDiameter);
    var count = 0;
    for (var x = 0; x < pickDiameter; ++x) {
        for (var y = 0; y < pickDiameter; ++y) {
            if (getDist2(x, y) > maxDist2) continue;
            offsets[count++] = y * pickDiameter + x;
        }
    }
    offsets = offsets.subarray(0, count);
    offsets.sort(function (a, b) {
        var x1 = a % pickDiameter;
        var y1 = (a - x1) / pickDiameter;
        var x2 = b % pickDiameter;
        var y2 = (b - x2) / pickDiameter;
        return getDist2(x1, y1) - getDist2(x2, y2);
    });
    return offsets;
}();
/**
 * Sets array elements to 0 that would be outside the viewport.
 *
 * @param buffer Array view, which contains a C order (pickDiameter, pickDiameter) array.
 * @param baseOffset Offset into `buffer` corresponding to (0, 0).
 * @param stride Stride between consecutive elements of the array.
 * @param glWindowX Center x position, must be integer.
 * @param glWindowY Center y position, must be integer.
 * @param viewportWidth Width of viewport in pixels.
 * @param viewportHeight Width of viewport in pixels.
 */
export function clearOutOfBoundsPickData(buffer, baseOffset, stride, glWindowX, glWindowY, viewportWidth, viewportHeight) {
    var startX = glWindowX - pickRadius;
    var startY = glWindowY - pickRadius;
    if (startX >= 0 && startY >= 0 && startX + pickDiameter <= viewportWidth && startY + pickDiameter <= viewportHeight) {
        return;
    }
    for (var relativeY = 0; relativeY < pickDiameter; ++relativeY) {
        for (var relativeX = 0; relativeX < pickDiameter; ++relativeX) {
            var x = startX + relativeX;
            var y = startY + relativeY;
            if (x < 0 || y < 0 || x >= viewportWidth || y >= viewportHeight) {
                buffer[baseOffset + (y * pickDiameter + x) * stride] = 0;
            }
        }
    }
}
export var RenderedDataPanel = function (_RenderedPanel) {
    _inherits(RenderedDataPanel, _RenderedPanel);

    function RenderedDataPanel(context, element, viewer) {
        _classCallCheck(this, RenderedDataPanel);

        var _this = _possibleConstructorReturn(this, (RenderedDataPanel.__proto__ || _Object$getPrototypeOf(RenderedDataPanel)).call(this, context, element, viewer.visibility));

        _this.viewer = viewer;
        /**
         * Current mouse position within the viewport, or -1 if the mouse is not in the viewport.
         */
        _this.mouseX = -1;
        _this.mouseY = -1;
        /**
         * If `false`, either the mouse is not within the viewport, or a picking request was already
         * issued for the current mouseX and mouseY after the most recent frame was rendered; when the
         * current pick requests complete, no additional pick requests will be issued.
         *
         * If `true`, a picking request was not issued for the current mouseX and mouseY due to all pick
         * buffers being in use; when a pick buffer becomes available, an additional pick request will be
         * issued.
         */
        _this.pickRequestPending = false;
        _this.mouseStateForcer = function () {
            return _this.blockOnPickRequest();
        };
        _this.pickingData = [new FramePickingData(), new FramePickingData()];
        _this.pickRequests = [new PickRequest(), new PickRequest()];
        _this.pickBufferContents = new Float32Array(2 * 4 * pickDiameter * pickDiameter);
        /**
         * Timer id for checking if outstanding pick requests have completed.
         */
        _this.pickTimerId = -1;
        _this.nextPickRequestTime = 0;
        _this.pendingPickRequestTimerId = -1;
        _this.pendingPickRequestTimerExpired = function () {
            _this.pendingPickRequestTimerId = -1;
            if (!_this.pickRequestPending) return;
            _this.attemptToIssuePickRequest();
        };
        _this.inputEventMap = viewer.inputEventMap;
        element.classList.add('neuroglancer-rendered-data-panel');
        element.classList.add('neuroglancer-panel');
        element.classList.add('neuroglancer-noselect');
        _this.registerDisposer(new AutomaticallyFocusedElement(element));
        _this.registerDisposer(new KeyboardEventBinder(element, _this.inputEventMap));
        _this.registerDisposer(new MouseEventBinder(element, _this.inputEventMap));
        _this.registerDisposer(new TouchEventBinder(element, _this.inputEventMap));
        _this.registerEventListener(element, 'mousemove', _this.onMousemove.bind(_this));
        _this.registerEventListener(element, 'touchstart', _this.onTouchstart.bind(_this));
        _this.registerEventListener(element, 'mouseleave', _this.onMouseout.bind(_this));
        registerActionListener(element, 'snap', function () {
            _this.navigationState.pose.snap();
        });
        registerActionListener(element, 'zoom-in', function () {
            _this.navigationState.zoomBy(0.5);
        });
        registerActionListener(element, 'zoom-out', function () {
            _this.navigationState.zoomBy(2.0);
        });
        registerActionListener(element, 'highlight', function () {
            _this.viewer.layerManager.invokeAction('highlight');
        });

        var _loop = function _loop(axis) {
            var axisName = AXES_NAMES[axis];

            var _loop3 = function _loop3(sign) {
                var signStr = sign < 0 ? '-' : '+';
                registerActionListener(element, 'rotate-relative-' + axisName + signStr, function () {
                    _this.navigationState.pose.rotateRelative(kAxes[axis], sign * 0.1);
                });
                var tempOffset = vec3.create();
                registerActionListener(element, '' + axisName + signStr, function () {
                    var navigationState = _this.navigationState;

                    var offset = tempOffset;
                    offset[0] = 0;
                    offset[1] = 0;
                    offset[2] = 0;
                    offset[axis] = sign;
                    navigationState.pose.translateVoxelsRelative(offset);
                });
            };

            var _arr2 = [-1, +1];
            for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
                var sign = _arr2[_i2];
                _loop3(sign);
            }
        };

        for (var axis = 0; axis < 3; ++axis) {
            _loop(axis);
        }
        registerActionListener(element, 'zoom-via-wheel', function (event) {
            var e = event.detail;
            _this.onMousemove(e);
            _this.zoomByMouse(getWheelZoomAmount(e));
        });
        registerActionListener(element, 'translate-via-mouse-drag', function (e) {
            startRelativeMouseDrag(e.detail, function (_event, deltaX, deltaY) {
                _this.translateByViewportPixels(deltaX, deltaY);
            });
        });
        registerActionListener(element, 'translate-in-plane-via-touchtranslate', function (e) {
            var detail = e.detail;

            _this.translateByViewportPixels(detail.deltaX, detail.deltaY);
        });
        registerActionListener(element, 'translate-z-via-touchtranslate', function (e) {
            var detail = e.detail;
            var navigationState = _this.navigationState;

            var offset = tempVec3;
            offset[0] = 0;
            offset[1] = 0;
            offset[2] = detail.deltaY + detail.deltaX;
            navigationState.pose.translateVoxelsRelative(offset);
        });

        var _loop2 = function _loop2(amount) {
            registerActionListener(element, 'z+' + amount + '-via-wheel', function (event) {
                var e = event.detail;
                var navigationState = _this.navigationState;

                var offset = tempVec3;
                var delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
                offset[0] = 0;
                offset[1] = 0;
                offset[2] = (delta > 0 ? -1 : 1) * amount;
                navigationState.pose.translateVoxelsRelative(offset);
            });
        };

        var _arr = [1, 10];
        for (var _i = 0; _i < _arr.length; _i++) {
            var amount = _arr[_i];
            _loop2(amount);
        }
        registerActionListener(element, 'move-to-mouse-position', function () {
            var mouseState = _this.viewer.mouseState;

            if (mouseState.updateUnconditionally()) {
                var position = _this.navigationState.pose.position;
                vec3.copy(position.spatialCoordinates, mouseState.position);
                position.changed.dispatch();
            }
        });
        registerActionListener(element, 'snap', function () {
            return _this.navigationState.pose.snap();
        });
        registerActionListener(element, 'select-annotation', function () {
            var _this$viewer = _this.viewer,
                mouseState = _this$viewer.mouseState,
                layerManager = _this$viewer.layerManager;

            var state = getSelectedAnnotation(mouseState, layerManager);
            if (state === undefined) {
                return;
            }
            var userLayer = state.layer.layer;
            if (userLayer !== null) {
                _this.viewer.selectedLayer.layer = state.layer;
                _this.viewer.selectedLayer.visible = true;
                userLayer.tabs.value = 'annotations';
                userLayer.selectedAnnotation.value = {
                    id: state.id,
                    partIndex: state.partIndex
                };
            }
        });
        registerActionListener(element, 'move-annotation', function (e) {
            var mouseState = _this.viewer.mouseState;

            var selectedAnnotationId = mouseState.pickedAnnotationId;
            var annotationLayer = mouseState.pickedAnnotationLayer;
            if (annotationLayer !== undefined) {
                if (selectedAnnotationId !== undefined) {
                    e.stopPropagation();
                    var annotationRef = annotationLayer.source.getReference(selectedAnnotationId);
                    var ann = annotationRef.value;
                    var handler = getAnnotationTypeRenderHandler(ann.type);
                    var pickedOffset = mouseState.pickedOffset;
                    var repPoint = handler.getRepresentativePoint(annotationLayer.objectToGlobal, ann, mouseState.pickedOffset);
                    var totDeltaVec = vec2.set(vec2.create(), 0, 0);
                    if (mouseState.updateUnconditionally()) {
                        startRelativeMouseDrag(e.detail, function (_event, deltaX, deltaY) {
                            vec2.add(totDeltaVec, totDeltaVec, [deltaX, deltaY]);
                            var newRepPt = _this.translateDataPointByViewportPixels(vec3.create(), repPoint, totDeltaVec[0], totDeltaVec[1]);
                            var newAnnotation = handler.updateViaRepresentativePoint(ann, newRepPt, annotationLayer.globalToObject, pickedOffset);
                            annotationLayer.source.update(annotationRef, newAnnotation);
                        }, function (_event) {
                            annotationRef.dispose();
                        });
                    }
                }
            }
        });
        registerActionListener(element, 'delete-annotation', function () {
            var mouseState = _this.viewer.mouseState;

            var selectedAnnotationId = mouseState.pickedAnnotationId;
            var annotationLayer = mouseState.pickedAnnotationLayer;
            if (annotationLayer !== undefined && !annotationLayer.source.readonly && selectedAnnotationId !== undefined) {
                var ref = annotationLayer.source.getReference(selectedAnnotationId);
                try {
                    annotationLayer.source.delete(ref);
                } finally {
                    ref.dispose();
                }
            }
        });
        registerActionListener(element, 'zoom-via-touchpinch', function (e) {
            var detail = e.detail;

            _this.handleMouseMove(detail.centerX, detail.centerY);
            var ratio = detail.prevDistance / detail.distance;
            if (ratio > 0.1 && ratio < 10) {
                _this.zoomByMouse(ratio);
            }
        });
        return _this;
    }

    _createClass(RenderedDataPanel, [{
        key: 'cancelPickRequests',
        value: function cancelPickRequests() {
            var gl = this.gl;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.pickRequests), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var request = _step.value;
                    var sync = request.sync;

                    if (sync !== null) {
                        gl.deleteSync(sync);
                    }
                    request.sync = null;
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

            clearTimeout(this.pickTimerId);
            this.pickTimerId = -1;
        }
    }, {
        key: 'checkForResize',
        value: function checkForResize() {
            var _element = this.element,
                clientWidth = _element.clientWidth,
                clientHeight = _element.clientHeight;

            if (clientWidth !== this.width || clientHeight !== this.height) {
                this.width = clientWidth;
                this.height = clientHeight;
                this.panelSizeChanged();
            }
        }
    }, {
        key: 'issuePickRequestInternal',
        value: function issuePickRequestInternal(pickRequest) {
            var gl = this.gl;
            var buffer = pickRequest.buffer;

            if (buffer === null) {
                buffer = pickRequest.buffer = gl.createBuffer();
                gl.bindBuffer(WebGL2RenderingContext.PIXEL_PACK_BUFFER, buffer);
                gl.bufferData(WebGL2RenderingContext.PIXEL_PACK_BUFFER, 2 * 4 * 4 * pickDiameter * pickDiameter, WebGL2RenderingContext.STREAM_READ);
            } else {
                gl.bindBuffer(WebGL2RenderingContext.PIXEL_PACK_BUFFER, buffer);
            }
            var glWindowX = this.mouseX;
            var glWindowY = this.height - this.mouseY;
            this.issuePickRequest(glWindowX, glWindowY);
            pickRequest.sync = gl.fenceSync(WebGL2RenderingContext.SYNC_GPU_COMMANDS_COMPLETE, 0);
            pickRequest.frameNumber = this.context.frameNumber;
            pickRequest.glWindowX = glWindowX;
            pickRequest.glWindowY = glWindowY;
            gl.flush();
            // TODO(jbms): maybe call gl.flush to ensure fence is submitted
            gl.bindBuffer(WebGL2RenderingContext.PIXEL_PACK_BUFFER, null);
            if (this.pickTimerId === -1) {
                this.scheduleCheckForPickRequestCompletion();
            }
            this.pickRequestPending = false;
            var pickRequests = this.pickRequests;

            if (pickRequest !== pickRequests[0]) {
                pickRequests[1] = pickRequests[0];
                pickRequests[0] = pickRequest;
            }
            this.nextPickRequestTime = Date.now() + pickRequestInterval;
        }
    }, {
        key: 'completePickInternal',
        value: function completePickInternal(pickRequest) {
            var gl = this.gl;
            var pickBufferContents = this.pickBufferContents;

            gl.bindBuffer(WebGL2RenderingContext.PIXEL_PACK_BUFFER, pickRequest.buffer);
            gl.getBufferSubData(WebGL2RenderingContext.PIXEL_PACK_BUFFER, 0, pickBufferContents);
            gl.bindBuffer(WebGL2RenderingContext.PIXEL_PACK_BUFFER, null);
            var pickingData = this.pickingData;
            var frameNumber = pickRequest.frameNumber;

            this.completePickRequest(pickRequest.glWindowX, pickRequest.glWindowY, pickBufferContents, pickingData[0].frameNumber === frameNumber ? pickingData[0] : pickingData[1]);
        }
    }, {
        key: 'scheduleCheckForPickRequestCompletion',
        value: function scheduleCheckForPickRequestCompletion() {
            var _this2 = this;

            this.pickTimerId = setTimeout(function () {
                _this2.pickTimerId = -1;
                _this2.checkForPickRequestCompletion();
            }, 0);
        }
    }, {
        key: 'checkForPickRequestCompletion',
        value: function checkForPickRequestCompletion() {
            var checkingBeforeDraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
            var block = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            var currentFrameNumber = this.context.frameNumber;
            var cancelIfNotReadyFrameNumber = -1;
            if (checkingBeforeDraw) {
                --currentFrameNumber;
                cancelIfNotReadyFrameNumber = currentFrameNumber - 1;
            }
            var pickRequests = this.pickRequests;
            var gl = this.gl;

            var remaining = false;
            var cancelRemaining = false;
            var available = void 0;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(pickRequests), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var pickRequest = _step2.value;
                    var sync = pickRequest.sync;

                    if (sync === null) continue;
                    var frameNumber = pickRequest.frameNumber;

                    if (!cancelRemaining && frameNumber >= currentFrameNumber - 1) {
                        if (block || gl.getSyncParameter(sync, WebGL2RenderingContext.SYNC_STATUS) === WebGL2RenderingContext.SIGNALED) {
                            this.completePickInternal(pickRequest);
                            cancelRemaining = true;
                        } else if (frameNumber !== cancelIfNotReadyFrameNumber) {
                            remaining = true;
                            continue;
                        }
                    }
                    gl.deleteSync(sync);
                    pickRequest.sync = null;
                    available = pickRequest;
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

            var pickTimerId = this.pickTimerId;

            if (remaining && pickTimerId === -1) {
                this.scheduleCheckForPickRequestCompletion();
            } else if (!remaining && pickTimerId !== -1) {
                clearTimeout(pickTimerId);
                this.pickTimerId = -1;
            }
            if (!checkingBeforeDraw && available !== undefined && this.pickRequestPending && this.canIssuePickRequest()) {
                this.issuePickRequestInternal(available);
            }
        }
    }, {
        key: 'blockOnPickRequest',
        value: function blockOnPickRequest() {
            if (this.pickRequestPending) {
                this.cancelPickRequests();
                this.nextPickRequestTime = 0;
                this.attemptToIssuePickRequest();
            }
            this.checkForPickRequestCompletion( /*checkingBeforeDraw=*/false, /*block=*/true);
        }
    }, {
        key: 'draw',
        value: function draw() {
            this.checkForResize();
            var width = this.width,
                height = this.height;

            if (width === 0 || height === 0) return;
            this.checkForPickRequestCompletion(true);
            var pickingData = this.pickingData;

            pickingData[0] = pickingData[1];
            var currentFrameNumber = this.context.frameNumber;
            var newPickingData = pickingData[1];
            newPickingData.frameNumber = currentFrameNumber;
            newPickingData.viewportWidth = width;
            newPickingData.viewportHeight = height;
            newPickingData.pickIDs.clear();
            if (!this.drawWithPicking(newPickingData)) {
                newPickingData.frameNumber = -1;
                return;
            }
            // For the new frame, allow new pick requests regardless of interval since last request.
            this.nextPickRequestTime = 0;
            if (this.mouseX > 0) {
                this.attemptToIssuePickRequest();
            }
        }
    }, {
        key: 'canIssuePickRequest',
        value: function canIssuePickRequest() {
            var time = Date.now();
            var nextPickRequestTime = this.nextPickRequestTime,
                pendingPickRequestTimerId = this.pendingPickRequestTimerId;

            if (time < nextPickRequestTime) {
                if (pendingPickRequestTimerId == -1) {
                    this.pendingPickRequestTimerId = setTimeout(this.pendingPickRequestTimerExpired, nextPickRequestTime - time);
                }
                return false;
            }
            return true;
        }
    }, {
        key: 'attemptToIssuePickRequest',
        value: function attemptToIssuePickRequest() {
            if (!this.canIssuePickRequest()) return;
            var currentFrameNumber = this.context.frameNumber;
            var gl = this.gl;
            var pickRequests = this.pickRequests;
            // Try to find an available PickRequest object.

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(pickRequests), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var pickRequest = _step3.value;
                    var sync = pickRequest.sync;

                    if (sync !== null) {
                        if (pickRequest.frameNumber < currentFrameNumber - 1) {
                            gl.deleteSync(sync);
                        } else {
                            continue;
                        }
                    }
                    this.issuePickRequestInternal(pickRequest);
                    return;
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }
        }
        /**
         * Called each time the mouse position relative to the top level of the rendered viewport changes.
         */

    }, {
        key: 'updateMousePosition',
        value: function updateMousePosition(mouseX, mouseY) {
            if (mouseX === this.mouseX && mouseY === this.mouseY) {
                return;
            }
            this.mouseX = mouseX;
            this.mouseY = mouseY;
            if (mouseX < 0) {
                // Mouse moved out of the viewport.
                this.pickRequestPending = false;
                this.cancelPickRequests();
                return;
            }
            var currentFrameNumber = this.context.frameNumber;
            var pickingData = this.pickingData[1];
            if (pickingData.frameNumber !== currentFrameNumber || this.width !== pickingData.viewportWidth || this.height !== pickingData.viewportHeight) {
                // Viewport size has changed since the last frame, which means a redraw is pending.  Don't
                // issue pick request now.  Once will be issued automatically after the redraw.
                return;
            }
            this.pickRequestPending = true;
            this.attemptToIssuePickRequest();
        }
    }, {
        key: 'onMouseout',
        value: function onMouseout(_event) {
            this.updateMousePosition(-1, -1);
            this.viewer.mouseState.setForcer(undefined);
        }
    }, {
        key: 'handleMouseMove',
        value: function handleMouseMove(clientX, clientY) {
            var element = this.element;

            var bounds = element.getBoundingClientRect();
            var mouseX = clientX - bounds.left;
            var mouseY = clientY - bounds.top;
            var mouseState = this.viewer.mouseState;

            mouseState.pageX = clientX + window.scrollX;
            mouseState.pageY = clientY + window.scrollY;
            mouseState.setForcer(this.mouseStateForcer);
            this.updateMousePosition(mouseX, mouseY);
        }
    }, {
        key: 'onMousemove',
        value: function onMousemove(event) {
            var element = this.element;

            if (event.target !== element) {
                return;
            }
            this.handleMouseMove(event.clientX, event.clientY);
        }
    }, {
        key: 'onTouchstart',
        value: function onTouchstart(event) {
            var element = this.element;

            if (event.target !== element || event.targetTouches.length !== 1) {
                return;
            }
            var _event$targetTouches$ = event.targetTouches[0],
                clientX = _event$targetTouches$.clientX,
                clientY = _event$targetTouches$.clientY;

            this.handleMouseMove(clientX, clientY);
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var mouseState = this.viewer.mouseState;

            mouseState.removeForcer(this.mouseStateForcer);
            var gl = this.gl;

            this.cancelPickRequests();
            var pendingPickRequestTimerId = this.pendingPickRequestTimerId;

            if (pendingPickRequestTimerId !== -1) {
                clearTimeout(pendingPickRequestTimerId);
            }
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(this.pickRequests), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var request = _step4.value;

                    gl.deleteBuffer(request.buffer);
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            _get(RenderedDataPanel.prototype.__proto__ || _Object$getPrototypeOf(RenderedDataPanel.prototype), 'disposed', this).call(this);
        }
    }]);

    return RenderedDataPanel;
}(RenderedPanel);
//# sourceMappingURL=rendered_data_panel.js.map