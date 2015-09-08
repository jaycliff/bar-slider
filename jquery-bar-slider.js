/*
    Copyright 2015 Jaycliff Arcilla of Eversun Software Philippines Corporation

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
/*
    DEPENDENCIES:
        jQuery library
        domxy
*/
/*jshint bitwise: false*/
if (typeof Number.toInteger !== "function") {
    Number.toInteger = function (arg) {
        "use strict";
        // ToInteger conversion
        arg = Number(arg);
        return (arg !== arg) ? 0 : (arg === 0 || arg === Infinity || arg === -Infinity) ? arg : (arg > 0) ? Math.floor(arg) : Math.ceil(arg);
    };
}
(function (window, $, undefined) {
    "use strict";
    var $document = $(document),
        $window = $(window),
        applier = (function () {
            var list = [];
            return function (func, obj, args) {
                var i, length = args.length, result;
                list.length = 0;
                for (i = 0; i < length; i += 1) {
                    list.push(args[i]);
                }
                result = func.apply(obj, list);
                list.length = 0;
                return result;
            };
        }());
    if (typeof $.fn.getX !== "function") {
        $.fn.getX = function () {
            return this.offset().left;
        };
    }
    $.createBarSlider = function () {
        var $bs_wrap = $(document.createElement('span')),
            $bs_range_base = $(document.createElement('span')),
            $bs_range_bar = $(document.createElement('span')),
            $bs_range_cover = $(document.createElement('span')),
            tab_index = 0,
            trigger_param_list = [],
            $_proto = $.fn,
            active = false,
            disabled = true,
            transition_class_added = false,
            min_value = 0,
            max_value = 100,
            value = (min_value >= max_value) ? min_value : (min_value + ((max_value - min_value) / 2)),
            prev_input_value = value,
            prev_change_value = value,
            bar_slider_object,
            $bar_slider_object;
        function initializeParts() {
            $bs_wrap.addClass('bar-slider').addClass('bs-horizontal-type').addClass('bs-wrap').attr('tabindex', tab_index);
            $bs_range_base.addClass('bs-range-base');
            $bs_range_bar.addClass('bs-range-bar');
            $bs_range_cover.addClass('bs-range-cover');
            // Connect the parts
            $bs_wrap.append($bs_range_base);
            $bs_range_base.append($bs_range_bar, $bs_range_cover);
        }
        initializeParts();
        // Some utilities
        function addTransitionClass() {
            //console.log('addTransitionClass');
            $bs_range_base.addClass('bs-transition').on('transitionend', removeTransitionClass);
            transition_class_added = true;
        }
        function removeTransitionClass() {
            //console.log('removeTransitionClass');
            $bs_range_base.removeClass('bs-transition').off('transitionend', removeTransitionClass);
            transition_class_added = false;
        }
        // Updates the slider UI
        function refreshControls(animate) {
            var left_rate;
            if ($bs_wrap[0].parentNode === null) {
                return; // Bail out since it's not attached to the DOM
            }
            left_rate = ((value - min_value) / (max_value - min_value));
            if (!!animate && (disabled === false) && (transition_class_added === false)) {
                addTransitionClass();
            }
            $bs_range_bar.css('width', (left_rate * 100) + '%');
            return bar_slider_object;
        }
        $bar_slider_object = $({
            setTabIndex: function (index) {
                index = Number.toInteger(index);
                $bs_wrap.attr('tabindex', index);
                return bar_slider_object;
            },
            setMinValue: function (val) {
                val = Number(val) || 0;
                min_value = val;
                return bar_slider_object;
            },
            setMaxValue: function (val) {
                val = Number(val) || 0;
                max_value = val;
                return bar_slider_object;
            },
            val: function (val) {
                if (arguments.length > 0) {
                    val = Number(val) || 0;
                    if (val > max_value) {
                        val = max_value;
                    }
                    if (val < min_value) {
                        val = min_value;
                    }
                    value = val;
                    prev_input_value = val;
                    prev_change_value = val;
                    refreshControls(true);
                    return bar_slider_object;
                }
                return value;
            },
            attachTo: function (arg) {
                $bs_wrap.appendTo(arg);
                removeTransitionClass();
                refreshControls();
                return bar_slider_object;
            },
            switchTo: function (arg) {
                var $target;
                if (arg instanceof $) {
                    $target = arg;
                } else {
                    $target = $(arg);
                }
                $target = $target.replaceWith($bs_wrap);
                removeTransitionClass();
                refreshControls();
                return $target;
            },
            refresh: refreshControls,
            getElement: function () {
                return $bs_wrap;
            }
        });
        bar_slider_object = $bar_slider_object[0];
        // Event-handling setup
        (function () {
            var mouseDownMouseMoveHandler, docWinEventHandler, prevX = 0, prevY = 0;
            /*
                The nowX-prevX-prevY tandem is a hack for browsers with stupid mousemove event implementation (Chrome, I'm looking at you!).
                What is this stupidity you're talking about?
                    Some browsers fire a single mousemove event of an element everytime a mousedown event of that same element fires.
                LINK(S):
                    http://stackoverflow.com/questions/24670598/why-does-chrome-raise-a-mousemove-on-mousedown
            */
            mouseDownMouseMoveHandler = function (event) {
                var nowX, left, width, left_rate;
                switch (event.type) {
                case 'touchstart':
                    //console.log('touchstart');
                    // http://stackoverflow.com/questions/4780837/is-there-an-equivalent-to-e-pagex-position-for-touchstart-event-as-there-is-fo
                    event.pageX = event.originalEvent.touches[0].pageX;
                    event.pageY = event.originalEvent.touches[0].pageY;
                    /* falls through */
                case 'mousedown':
                    event.preventDefault(); // This somehow disables text-selection
                    if (event.which === 3) {
                        return;
                    }
                    active = true;
                    nowX = event.pageX;
                    if (transition_class_added === false) {
                        addTransitionClass();
                    }
                    $bs_range_bar.addClass('active');
                    prevX = nowX;
                    prevY = event.pageY;
                    $document.on('mousemove touchmove', mouseDownMouseMoveHandler).on('mouseup touchend', docWinEventHandler);
                    $window.on('blur', docWinEventHandler);
                    break;
                case 'touchmove':
                    //console.log('touchmove');
                    event.pageX = event.originalEvent.touches[0].pageX;
                    event.pageY = event.originalEvent.touches[0].pageY;
                    /* falls through */
                case 'mousemove':
                    nowX = event.pageX;
                    if (nowX === prevX && event.pageY === prevY) {
                        return; // Bail out, since it's a faux mousemove event
                    }
                    if (transition_class_added === true) {
                        removeTransitionClass();
                    }
                    break;
                }
                width = $bs_range_base.width();
                left = Math.floor(nowX - $bs_range_bar.getX());
                if (left > width) {
                    left = width;
                } else if (left < 0) {
                    left = 0;
                }
                left_rate = left / width;
                $bs_range_bar.css('width', (left_rate * 100) + '%');
                prev_input_value = value;
                value = min_value + (left_rate * (max_value - min_value));
                if (disabled === false) {
                    if (value !== prev_input_value) {
                        trigger_param_list.push(value);
                        $bar_slider_object.triggerHandler('input', trigger_param_list);
                        trigger_param_list.length = 0;
                    }
                }
            };
            docWinEventHandler = function () {
                //console.log('docWinEventHandler');
                active = false;
                if (disabled === false) {
                    if (prev_change_value !== value) {
                        trigger_param_list.push(value);
                        $bar_slider_object.triggerHandler('change', trigger_param_list);
                        trigger_param_list.length = 0;
                        prev_change_value = value;
                    }
                }
                $bs_range_bar.removeClass('active');
                $window.off('blur', docWinEventHandler);
                $document.off('mousemove touchmove', mouseDownMouseMoveHandler).off('mouseup touchend', docWinEventHandler);
            };
            function enableDisableAid(event) {
                switch (event.type) {
                case 'touchstart':
                    /* falls through */
                case 'mousedown':
                    event.preventDefault();
                    break;
                }
            }
            bar_slider_object.enable = function () {
                if (disabled === true) {
                    disabled = false;
                    $bs_wrap
                        .removeClass('disabled')
                        .attr('tabindex', tab_index)
                        .off('mousedown', enableDisableAid)
                        .on('mousedown touchstart', mouseDownMouseMoveHandler);
                }
                return bar_slider_object;
            };
            bar_slider_object.disable = function () {
                if (disabled === false) {
                    disabled = true;
                    if (active) {
                        docWinEventHandler(); // Manually trigger the 'mouseup / window blur' event handler
                    }
                    $bs_wrap
                        .addClass('disabled')
                        .removeAttr('tabindex')
                        .off('mousedown touchstart', mouseDownMouseMoveHandler)
                        .on('mousedown', enableDisableAid);
                    removeTransitionClass();
                }
                return bar_slider_object;
            };
            bar_slider_object.on = function () {
                applier($_proto.on, $bar_slider_object, arguments);
                return bar_slider_object;
            };
            bar_slider_object.one = function () {
                applier($_proto.one, $bar_slider_object, arguments);
                return bar_slider_object;
            };
            bar_slider_object.off = function () {
                applier($_proto.off, $bar_slider_object, arguments);
                return bar_slider_object;
            };
            function resetStructure() {
                var parentNode = $bs_wrap[0].parentNode;
                if (parentNode !== null) {
                    $bs_wrap.detach();
                }
                $bs_wrap.removeAttr('class').removeAttr('style').removeAttr('tabindex');
                $bs_range_base.removeAttr('class').removeAttr('style');
                $bs_range_bar.removeAttr('class').removeAttr('style');
                $bs_range_cover.removeAttr('class').removeAttr('style');
                initializeParts();
                if (parentNode !== null) {
                    $bs_wrap.appendTo(parentNode);
                }
            }
            bar_slider_object.reset = function (hard) {
                bar_slider_object.disable();
                $bar_slider_object.off();
                if (Boolean(hard) === true) {
                    resetStructure();
                    $bs_wrap.off();
                    $bs_range_base.off();
                    $bs_range_bar.off();
                    $bs_range_cover.off();
                    min_value = 0;
                    max_value = 100;
                    value = (min_value >= max_value) ? min_value : (min_value + ((max_value - min_value) / 2));
                    $bs_wrap.removeClass('disabled').attr('tabindex', tab_index);
                    refreshControls(true);
                }
                bar_slider_object.enable();
                return bar_slider_object;
            };
        }());
        //$bs_toggle_neck.on('transitionend', function () { alert('END'); });
        $bs_wrap.data('bs:host-object', bar_slider_object).data('bar-slider-object', bar_slider_object);
        bar_slider_object.enable();
        return bar_slider_object;
    };
}(window, (typeof jQuery === "function" && jQuery) || (typeof module === "object" && typeof module.exports === "function" && module.exports)));