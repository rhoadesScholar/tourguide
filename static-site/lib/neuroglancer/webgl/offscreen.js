import _get from 'babel-runtime/helpers/get';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
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
import { RefCounted } from '../util/disposable';
import { identityMat4 } from '../util/geom';
import { getObjectId } from '../util/object_id';
import { getSquareCornersBuffer } from './square_corners_buffer';
import { resizeTexture } from './texture';
import { defineCopyFragmentShader, elementWiseTextureShader } from './trivial_shaders';
export var SizeManaged = function (_RefCounted) {
    _inherits(SizeManaged, _RefCounted);

    function SizeManaged() {
        _classCallCheck(this, SizeManaged);

        var _this = _possibleConstructorReturn(this, (SizeManaged.__proto__ || _Object$getPrototypeOf(SizeManaged)).apply(this, arguments));

        _this.width = Number.NaN;
        _this.height = Number.NaN;
        return _this;
    }

    _createClass(SizeManaged, [{
        key: 'hasSize',
        value: function hasSize(width, height) {
            return this.width === width && this.height === height;
        }
    }, {
        key: 'resize',
        value: function resize(width, height) {
            if (this.hasSize(width, height)) {
                return;
            }
            this.width = width;
            this.height = height;
            this.performResize();
        }
    }]);

    return SizeManaged;
}(RefCounted);
export var Renderbuffer = function (_SizeManaged) {
    _inherits(Renderbuffer, _SizeManaged);

    function Renderbuffer(gl, internalformat) {
        _classCallCheck(this, Renderbuffer);

        var _this2 = _possibleConstructorReturn(this, (Renderbuffer.__proto__ || _Object$getPrototypeOf(Renderbuffer)).call(this));

        _this2.gl = gl;
        _this2.internalformat = internalformat;
        _this2.renderbuffer = null;
        _this2.renderbuffer = gl.createRenderbuffer();
        return _this2;
    }

    _createClass(Renderbuffer, [{
        key: 'performResize',
        value: function performResize() {
            var gl = this.gl;

            gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, this.internalformat, this.width, this.height);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.gl.deleteRenderbuffer(this.renderbuffer);
        }
    }, {
        key: 'attachToFramebuffer',
        value: function attachToFramebuffer(attachment) {
            var gl = this.gl;

            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, this.renderbuffer);
        }
    }]);

    return Renderbuffer;
}(SizeManaged);
export var DepthBuffer = function (_Renderbuffer) {
    _inherits(DepthBuffer, _Renderbuffer);

    function DepthBuffer(gl) {
        var includeStencilBuffer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        _classCallCheck(this, DepthBuffer);

        var _this3 = _possibleConstructorReturn(this, (DepthBuffer.__proto__ || _Object$getPrototypeOf(DepthBuffer)).call(this, gl, includeStencilBuffer ? gl.DEPTH_STENCIL : gl.DEPTH_COMPONENT16));

        _this3.gl = gl;
        _this3.includeStencilBuffer = includeStencilBuffer;
        return _this3;
    }

    _createClass(DepthBuffer, [{
        key: 'attachToFramebuffer',
        value: function attachToFramebuffer() {
            var gl = this.gl;

            _get(DepthBuffer.prototype.__proto__ || _Object$getPrototypeOf(DepthBuffer.prototype), 'attachToFramebuffer', this).call(this, this.includeStencilBuffer ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT);
        }
    }]);

    return DepthBuffer;
}(Renderbuffer);
export var DepthStencilBuffer = function (_DepthBuffer) {
    _inherits(DepthStencilBuffer, _DepthBuffer);

    function DepthStencilBuffer(gl) {
        _classCallCheck(this, DepthStencilBuffer);

        return _possibleConstructorReturn(this, (DepthStencilBuffer.__proto__ || _Object$getPrototypeOf(DepthStencilBuffer)).call(this, gl, /*includeStencilBuffer=*/true));
    }

    return DepthStencilBuffer;
}(DepthBuffer);
export var StencilBuffer = DepthStencilBuffer;
export var Framebuffer = function (_RefCounted2) {
    _inherits(Framebuffer, _RefCounted2);

    function Framebuffer(gl) {
        _classCallCheck(this, Framebuffer);

        var _this5 = _possibleConstructorReturn(this, (Framebuffer.__proto__ || _Object$getPrototypeOf(Framebuffer)).call(this));

        _this5.gl = gl;
        _this5.framebuffer = _this5.gl.createFramebuffer();
        return _this5;
    }

    _createClass(Framebuffer, [{
        key: 'disposed',
        value: function disposed() {
            var gl = this.gl;

            gl.deleteFramebuffer(this.framebuffer);
        }
    }, {
        key: 'bind',
        value: function bind() {
            var gl = this.gl;

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        }
    }, {
        key: 'unbind',
        value: function unbind() {
            var gl = this.gl;

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }]);

    return Framebuffer;
}(RefCounted);
export var TextureBuffer = function (_SizeManaged2) {
    _inherits(TextureBuffer, _SizeManaged2);

    function TextureBuffer(gl, internalFormat, format, dataType) {
        _classCallCheck(this, TextureBuffer);

        var _this6 = _possibleConstructorReturn(this, (TextureBuffer.__proto__ || _Object$getPrototypeOf(TextureBuffer)).call(this));

        _this6.gl = gl;
        _this6.internalFormat = internalFormat;
        _this6.format = format;
        _this6.dataType = dataType;
        _this6.texture = gl.createTexture();
        return _this6;
    }

    _createClass(TextureBuffer, [{
        key: 'performResize',
        value: function performResize() {
            resizeTexture(this.gl, this.texture, this.width, this.height, this.internalFormat, this.format, this.dataType);
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.gl.deleteTexture(this.texture);
        }
    }, {
        key: 'attachToFramebuffer',
        value: function attachToFramebuffer(attachment) {
            var gl = this.gl;

            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, this.texture, /*level=*/0);
        }
    }]);

    return TextureBuffer;
}(SizeManaged);
export function makeTextureBuffers(gl, count) {
    var internalFormat = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : WebGL2RenderingContext.RGBA8;
    var format = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : WebGL2RenderingContext.RGBA;
    var dataType = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : WebGL2RenderingContext.UNSIGNED_BYTE;

    var result = new Array();
    for (var i = 0; i < count; ++i) {
        result[i] = new TextureBuffer(gl, internalFormat, format, dataType);
    }
    return result;
}
var tempPixel = new Uint8Array(4);
var tempPixelUint32 = new Uint32Array(1);
var tempPixelFloat32 = new Float32Array(4);
export var FramebufferConfiguration = function (_RefCounted3) {
    _inherits(FramebufferConfiguration, _RefCounted3);

    function FramebufferConfiguration(gl, configuration) {
        _classCallCheck(this, FramebufferConfiguration);

        var _this7 = _possibleConstructorReturn(this, (FramebufferConfiguration.__proto__ || _Object$getPrototypeOf(FramebufferConfiguration)).call(this));

        _this7.gl = gl;
        _this7.width = Number.NaN;
        _this7.height = Number.NaN;
        _this7.fullAttachmentList = new Array();
        _this7.attachmentVerified = false;
        _this7.singleAttachmentList = [_this7.gl.COLOR_ATTACHMENT0];
        var _configuration$frameb = configuration.framebuffer,
            framebuffer = _configuration$frameb === undefined ? new Framebuffer(gl) : _configuration$frameb,
            colorBuffers = configuration.colorBuffers,
            depthBuffer = configuration.depthBuffer;

        _this7.framebuffer = _this7.registerDisposer(framebuffer);
        _this7.colorBuffers = colorBuffers;
        _this7.depthBuffer = depthBuffer;
        if (depthBuffer !== undefined) {
            _this7.registerDisposer(depthBuffer);
        }
        var fullAttachmentList = _this7.fullAttachmentList;

        colorBuffers.forEach(function (buffer, i) {
            _this7.registerDisposer(buffer);
            fullAttachmentList[i] = gl.COLOR_ATTACHMENT0 + i;
        });
        return _this7;
    }

    _createClass(FramebufferConfiguration, [{
        key: 'hasSize',
        value: function hasSize(width, height) {
            return this.width === width && this.height === height;
        }
    }, {
        key: 'bind',
        value: function bind(width, height) {
            this.width = width;
            this.height = height;
            this.framebuffer.bind();
            var gl = this.gl,
                depthBuffer = this.depthBuffer;

            if (depthBuffer !== undefined) {
                depthBuffer.resize(width, height);
                depthBuffer.attachToFramebuffer();
            }
            this.colorBuffers.forEach(function (buffer, i) {
                buffer.resize(width, height);
                buffer.attachToFramebuffer(gl.COLOR_ATTACHMENT0 + i);
            });
            gl.drawBuffers(this.fullAttachmentList);
            this.verifyAttachment();
            gl.viewport(0, 0, width, height);
        }
    }, {
        key: 'bindSingle',
        value: function bindSingle(textureIndex) {
            var gl = this.gl;

            this.framebuffer.bind();
            // If this texture is still be bound to color attachment textureIndex, the attachment will fail
            // (at least on some browsers).  Therefore, if textureIndex is not 0, we clear the attachment.
            // In the case that textureIndex is 0, the attachment will be overridden anyway.
            if (textureIndex !== 0) {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + textureIndex, gl.TEXTURE_2D, null, /*level=*/0);
            }
            gl.bindTexture(gl.TEXTURE_2D, null);
            this.colorBuffers[textureIndex].attachToFramebuffer(gl.COLOR_ATTACHMENT0);
            gl.drawBuffers(this.singleAttachmentList);
        }
    }, {
        key: 'unbind',
        value: function unbind() {
            this.framebuffer.unbind();
        }
        /**
         * Only supports UNSIGNED_BYTE RGBA textures.
         */

    }, {
        key: 'readPixel',
        value: function readPixel(textureIndex, glWindowX, glWindowY) {
            var gl = this.gl;

            try {
                this.bindSingle(textureIndex);
                gl.readPixels(glWindowX, glWindowY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, tempPixel);
            } finally {
                this.framebuffer.unbind();
            }
            return tempPixel;
        }
    }, {
        key: 'readPixelUint32',
        value: function readPixelUint32(textureIndex, glWindowX, glWindowY) {
            var gl = this.gl;

            try {
                this.bindSingle(textureIndex);
                gl.readPixels(glWindowX, glWindowY, 1, 1, WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.UNSIGNED_INT, tempPixelUint32);
            } finally {
                this.framebuffer.unbind();
            }
            return tempPixelUint32[0];
        }
    }, {
        key: 'readPixelFloat32',
        value: function readPixelFloat32(textureIndex, glWindowX, glWindowY) {
            var gl = this.gl;

            try {
                this.bindSingle(textureIndex);
                // Reading just the red channel using a format of RED fails with certain WebGL
                // implementations.  Using RGBA seems to have better compatibility.
                gl.readPixels(glWindowX, glWindowY, 1, 1, WebGL2RenderingContext.RGBA, WebGL2RenderingContext.FLOAT, tempPixelFloat32);
            } finally {
                this.framebuffer.unbind();
            }
            return tempPixelFloat32[0];
        }
    }, {
        key: 'readPixelFloat32IntoBuffer',
        value: function readPixelFloat32IntoBuffer(textureIndex, glWindowX, glWindowY, offset) {
            var width = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
            var height = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
            var gl = this.gl;

            try {
                this.bindSingle(textureIndex);
                // Reading just the red channel using a format of RED fails with certain WebGL
                // implementations.  Using RGBA seems to have better compatibility.
                gl.readPixels(glWindowX, glWindowY, width, height, WebGL2RenderingContext.RGBA, WebGL2RenderingContext.FLOAT, offset);
            } finally {
                this.framebuffer.unbind();
            }
        }
    }, {
        key: 'verifyAttachment',
        value: function verifyAttachment() {
            if (this.attachmentVerified) {
                return;
            }
            var gl = this.gl;

            var framebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (framebufferStatus !== gl.FRAMEBUFFER_COMPLETE) {
                throw new Error('Framebuffer configuration not supported');
            }
            this.attachmentVerified = true;
        }
    }]);

    return FramebufferConfiguration;
}(RefCounted);
export var OffscreenCopyHelper = function (_RefCounted4) {
    _inherits(OffscreenCopyHelper, _RefCounted4);

    function OffscreenCopyHelper(gl, shader) {
        _classCallCheck(this, OffscreenCopyHelper);

        var _this8 = _possibleConstructorReturn(this, (OffscreenCopyHelper.__proto__ || _Object$getPrototypeOf(OffscreenCopyHelper)).call(this));

        _this8.gl = gl;
        _this8.shader = shader;
        _this8.copyVertexPositionsBuffer = getSquareCornersBuffer(_this8.gl);
        _this8.copyTexCoordsBuffer = getSquareCornersBuffer(_this8.gl, 0, 0, 1, 1);
        _this8.registerDisposer(shader);
        return _this8;
    }

    _createClass(OffscreenCopyHelper, [{
        key: 'draw',
        value: function draw() {
            var gl = this.gl,
                shader = this.shader;

            shader.bind();

            for (var _len = arguments.length, textures = Array(_len), _key = 0; _key < _len; _key++) {
                textures[_key] = arguments[_key];
            }

            var numTextures = textures.length;
            for (var i = 0; i < numTextures; ++i) {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            }
            gl.uniformMatrix4fv(shader.uniform('uProjectionMatrix'), false, identityMat4);
            var aVertexPosition = shader.attribute('aVertexPosition');
            this.copyVertexPositionsBuffer.bindToVertexAttrib(aVertexPosition, /*components=*/2);
            var aTexCoord = shader.attribute('aTexCoord');
            this.copyTexCoordsBuffer.bindToVertexAttrib(aTexCoord, /*components=*/2);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
            gl.disableVertexAttribArray(aVertexPosition);
            gl.disableVertexAttribArray(aTexCoord);
            for (var _i = 0; _i < numTextures; ++_i) {
                gl.activeTexture(gl.TEXTURE0 + _i);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
        }
    }], [{
        key: 'get',
        value: function get(gl) {
            var shaderModule = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defineCopyFragmentShader;
            var numTextures = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

            return gl.memoize.get('OffscreenCopyHelper:' + numTextures + ':' + getObjectId(shaderModule), function () {
                return new OffscreenCopyHelper(gl, elementWiseTextureShader(gl, shaderModule, numTextures));
            });
        }
    }]);

    return OffscreenCopyHelper;
}(RefCounted);
//# sourceMappingURL=offscreen.js.map