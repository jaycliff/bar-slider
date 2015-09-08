/*
    Copyright 2015 Jaycliff Arcilla of Eversun Software Philippines Corporation (Davao Branch)

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
/*jslint browser: true, devel: true */
/*global jQuery*/
(function (window, $) {
    "use strict";
    var extend_options;
    function getWindow(elem) {
    	return jQuery.isWindow(elem) ? elem : elem.nodeType === 9 ? elem.defaultView || elem.parentWindow : false;
    }
    function getDOMX(elem) {
        var doc_elem,
            win,
            box,
            doc = elem && elem.ownerDocument;
        if (!doc) {
            return;
        }
        doc_elem = doc.documentElement;
        // Make sure it's not a disconnected DOM node and...
        // If we don't have gBCR, just use 0 rather than error
        // BlackBerry 5, iOS 3 (original iPhone)
        if (!jQuery.contains(doc_elem, elem) || typeof elem.getBoundingClientRect !== "function") {
            return 0;
        }
        box = elem.getBoundingClientRect();
        win = getWindow(doc);
        return box.left + (win.pageXOffset || doc_elem.scrollLeft) - (doc_elem.clientLeft || 0);
    }
    function getDOMY(elem) {
        var doc_elem,
            win,
            box,
            doc = elem && elem.ownerDocument;
        if (!doc) {
            return;
        }
        doc_elem = doc.documentElement;
        // Make sure it's not a disconnected DOM node and...
        // If we don't have gBCR, just use 0 rather than error
        // BlackBerry 5, iOS 3 (original iPhone)
        if (!jQuery.contains(doc_elem, elem) || typeof elem.getBoundingClientRect !== "function") {
            return 0;
        }
        box = elem.getBoundingClientRect();
        win = getWindow(doc);
        return box.top  + (win.pageYOffset || doc_elem.scrollTop) - (doc_elem.clientTop || 0);
    }
    extend_options = {
        getX: function getX() {
            if (this.length > 0) {
                return getDOMX(this[0]);
            }
            return 0;
        },
        getY: function getY() {
            if (this.length > 0) {
                return getDOMY(this[0]);
            }
            return 0;
        }
    };
    // $.fn === $.prototype
    $.fn.extend(extend_options);
    $.getDOMX = getDOMX;
    $.getDOMY = getDOMY;
}(window, (typeof jQuery === "function" && jQuery) || (typeof module === "object" && typeof module.exports === "function" && module.exports)));