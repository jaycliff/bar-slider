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
    NOTES:
        Tries to emulate some of the natural behaviours of Chrome's default range input.
*/
/*global Boolean, Math, Number, document, window, jQuery, module*/
/*jslint bitwise: false, unparam: true*/
/*jshint bitwise: false, unused: false*/
if (typeof Number.toInteger !== "function") {
    Number.toInteger = function (arg) {
        "use strict";
        // ToInteger conversion
        arg = Number(arg);
        return (arg !== arg) ? 0 : (arg === 0 || arg === Infinity || arg === -Infinity) ? arg : (arg > 0) ? Math.floor(arg) : Math.ceil(arg);
    };
}
if (typeof String.prototype.trim !== "function") {
    String.prototype.trim = function () {
        "use strict";
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
}
(function (window, $, undef) {
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
    if (typeof $.fn.getY !== "function") {
        $.fn.getY = function () {
            return this.offset().top;
        };
    }
    $.createBarSlider = function (options) {
        var is_options_valid = $.type(options) === 'object',
            $bs_wrap = $(document.createElement('span')),
            $bs_range_base = $(document.createElement('span')),
            $bs_range_bar = $(document.createElement('span')),
            $bs_range_cover = $(document.createElement('span')),
            $hot_swap_dummy = $(document.createElement('span')),
            trigger_param_list = [],
            $_proto = $.fn,
            default_tab_index = (is_options_valid && Number.toInteger(options.tabIndex)) || 0,
            tab_index = default_tab_index,
            type = (is_options_valid && String(options.type).trim().toLowerCase() === 'vertical') ? 'vertical' : 'horizontal',
            type_class = (type === 'vertical') ? 'bs-vertical-type' : 'bs-horizontal-type',
            css_dimension_prop = (type === 'vertical') ? 'height' : 'width',
            active = false,
            disabled = true,
            transition_class_added = false,
            default_min_val = (is_options_valid && Number(options.min)) || 0,
            default_max_val = 100,
            default_val,
            min_value = default_min_val,
            max_value = default_max_val,
            max_sub,
            value,
            user_set_value = false,
            prev_input_value,
            prev_change_value,
            bar_slider_object,
            $bar_slider_object;
        if (is_options_valid && Object.prototype.hasOwnProperty.call(options, 'max')) {
            default_max_val = Number(options.max) || 0;
            max_value = default_max_val;
        }
        // getComputedMax is used to get the cured max value if the user didn't enter any specific value ->
        // this is part of the default chrome range input behaviour simulation
        function getComputedMax() {
            var max = max_value;
            if ((max < min_value) && (min_value < 100)) {
                max = 100;
            }
            return max;
        }
        if (is_options_valid && Object.prototype.hasOwnProperty.call(options, 'value')) {
            max_sub = getComputedMax();
            default_val = Number(options.value) || 0;
            if (default_val > max_sub) {
                default_val = max_sub;
            }
            if (default_val < min_value) {
                default_val = min_value;
            }
        } else {
            default_val = (min_value >= max_value) ? min_value : (min_value + ((max_value - min_value) / 2));
        }
        value = default_val;
        prev_input_value = value;
        prev_change_value = value;
        function initializeParts() {
            $bs_wrap
                .addClass('bar-slider')
                .addClass(type_class)
                .addClass('bs-wrap')
                .attr('tabindex', tab_index);
            $bs_range_base.addClass('bs-range-base');
            $bs_range_bar.addClass('bs-range-bar');
            $bs_range_cover.addClass('bs-range-cover');
            // Connect the parts
            $bs_wrap.append($bs_range_base);
            $bs_range_base.append($bs_range_bar, $bs_range_cover);
        }
        initializeParts();
        // Some utilities
        function removeTransitionClass() {
            //console.log('removeTransitionClass');
            $bs_range_base
                .removeClass('bs-transition')
                .off('transitionend', removeTransitionClass);
            transition_class_added = false;
        }
        function addTransitionClass() {
            //console.log('addTransitionClass');
            $bs_range_base
                .addClass('bs-transition')
                .on('transitionend', removeTransitionClass);
            transition_class_added = true;
        }
        // getComputedValue is used to get the cured value if the user didn't enter any specific value ->
        // -> either via direct ui input or the value method (both of which sets user_set_value to true) ->
        // this is part of the default chrome range input behaviour simulation
        function getComputedValue(computed_max) {
            var val = value;
            if (computed_max === undef) {
                computed_max = getComputedMax();
            }
            if (val > computed_max) {
                val = computed_max;
            }
            if (val < min_value) {
                val = min_value;
            }
            return val;
        }
        // Updates the slider UI
        function refreshControls(animate) {
            var rate;
            if ($bs_wrap[0].parentNode === null) {
                return; // Bail out since it's not attached to the DOM
            }
            max_sub = getComputedMax();
            if (max_sub <= min_value) {
                rate = 0;
            } else {
                rate = ((value - min_value) / (max_sub - min_value));
            }
            if (!!animate && (disabled === false) && (transition_class_added === false)) {
                addTransitionClass();
            }
            $bs_range_bar.css(css_dimension_prop, (rate * 100) + '%');
            return bar_slider_object;
        }
        $bar_slider_object = $({
            tabIndex: function (index) {
                if (arguments.length > 0) {
                    $bs_wrap.attr('tabindex', Number.toInteger(index));
                    return bar_slider_object;
                }
                return tab_index;
            },
            min: function (val) {
                if (arguments.length > 0) {
                    min_value = Number(val) || 0;
                    if (user_set_value) {
                        max_sub = getComputedMax();
                        if (value > max_sub) {
                            value = max_sub;
                        }
                        if (value < min_value) {
                            value = min_value;
                        }
                    }
                    refreshControls(true);
                    return bar_slider_object;
                }
                return min_value;
            },
            max: function (val) {
                if (arguments.length > 0) {
                    max_value = Number(val) || 0;
                    if (user_set_value) {
                        max_sub = getComputedMax();
                        if (value > max_sub) {
                            value = max_sub;
                        }
                        if (value < min_value) {
                            value = min_value;
                        }
                    }
                    refreshControls(true);
                    return bar_slider_object;
                }
                return max_value;
            },
            value: function (val, animate) {
                max_sub = getComputedMax();
                if (arguments.length > 0) {
                    val = Number(val) || 0;
                    if (val > max_sub) {
                        val = max_sub;
                    }
                    if (val < min_value) {
                        val = min_value;
                    }
                    value = val;
                    prev_input_value = val;
                    prev_change_value = val;
                    user_set_value = true;
                    refreshControls(Boolean(animate));
                    return bar_slider_object;
                }
                return (user_set_value) ? value : getComputedValue(max_sub);
            },
            val: function (val, animate) {
                max_sub = getComputedMax();
                if (arguments.length > 0) {
                    val = Number(val) || 0;
                    if (val > max_sub) {
                        val = max_sub;
                    }
                    if (val < min_value) {
                        val = min_value;
                    }
                    value = val;
                    prev_input_value = val;
                    prev_change_value = val;
                    user_set_value = true;
                    refreshControls(Boolean(animate));
                    return bar_slider_object;
                }
                return (user_set_value) ? value : getComputedValue(max_sub);
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
                $bs_wrap.data('bs:swapped-element', $target.replaceWith($bs_wrap));
                removeTransitionClass();
                refreshControls();
                return bar_slider_object;
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
                The nowX-nowY-prevX-prevY tandem is a hack for browsers with stupid mousemove event implementation (Chrome, I'm looking at you!).
                What is this stupidity you're talking about?
                    Some browsers fire a single mousemove event of an element everytime a mousedown event of that same element fires.
                LINK(S):
                    http://stackoverflow.com/questions/24670598/why-does-chrome-raise-a-mousemove-on-mousedown
            */
            mouseDownMouseMoveHandler = function (event) {
                var nowX, nowY, base, dimension, rate, calculated_value;
                event.preventDefault(); // This somehow disables text-selection
                switch (event.type) {
                case 'touchstart':
                    //console.log('touchstart');
                    // http://stackoverflow.com/questions/4780837/is-there-an-equivalent-to-e-pagex-position-for-touchstart-event-as-there-is-fo
                    event.pageX = event.originalEvent.touches[0].pageX;
                    event.pageY = event.originalEvent.touches[0].pageY;
                    /* falls through */
                case 'mousedown':
                    // Disable right-click
                    if (event.which === 3) {
                        return;
                    }
                    active = true;
                    nowX = event.pageX;
                    nowY = event.pageY;
                    if (transition_class_added === false) {
                        addTransitionClass();
                        //console.log('Hey');
                    }
                    $bs_range_bar.addClass('active');
                    prevX = nowX;
                    prevY = nowY;
                    $document
                        .on('mousemove touchmove', mouseDownMouseMoveHandler)
                        .on('mouseup touchend', docWinEventHandler);
                    $window.on('blur', docWinEventHandler);
                    break;
                case 'touchmove':
                    //console.log('touchmove');
                    event.pageX = event.originalEvent.touches[0].pageX;
                    event.pageY = event.originalEvent.touches[0].pageY;
                    /* falls through */
                case 'mousemove':
                    nowX = event.pageX;
                    nowY = event.pageY;
                    if (nowX === prevX && nowY === prevY) {
                        return; // Bail out, since it's a faux mousemove event
                    }
                    if (transition_class_added === true) {
                        removeTransitionClass();
                    }
                    break;
                }
                dimension = $bs_range_base[css_dimension_prop]();
                switch (type) {
                case 'horizontal':
                    base = Math.floor(nowX - $bs_range_bar.getX());
                    break;
                case 'vertical':
                    base = dimension - Math.floor(nowY - ($bs_range_base.getY() + parseInt($bs_range_base.css('border-top-width'), 10)));
                    break;
                }
                if (base > dimension) {
                    base = dimension;
                } else if (base < 0) {
                    base = 0;
                }
                rate = base / dimension;
                //$bs_range_bar.css(css_dimension_prop, (rate * 100) + '%');
                max_sub = getComputedMax();
                if (max_sub >= min_value) {
                    prev_input_value = (user_set_value) ? value : getComputedValue(max_sub);
                    calculated_value = min_value + (rate * (max_sub - min_value));
                    if (disabled === false) {
                        if (calculated_value !== prev_input_value) {
                            user_set_value = true;
                            value = calculated_value;
                            trigger_param_list.push(value);
                            $bar_slider_object.triggerHandler('input', trigger_param_list);
                            trigger_param_list.length = 0;
                        }
                    }
                }
                refreshControls(true);
            };
            docWinEventHandler = function () {
                //console.log('docWinEventHandler');
                var value_sub = (user_set_value) ? value : getComputedValue();
                active = false;
                if (disabled === false) {
                    trigger_param_list.push(value_sub);
                    // 'seek' event is like a forced-change event
                    $bar_slider_object.triggerHandler('seek', trigger_param_list);
                    if (prev_change_value !== value_sub) {
                        $bar_slider_object.triggerHandler('change', trigger_param_list);
                        prev_change_value = value_sub;
                    }
                    trigger_param_list.length = 0;
                }
                $bs_range_bar.removeClass('active');
                $window.off('blur', docWinEventHandler);
                $document
                    .off('mousemove touchmove', mouseDownMouseMoveHandler)
                    .off('mouseup touchend', docWinEventHandler);
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
                    //$bs_wrap.detach();
                    $bs_wrap.replaceWith($hot_swap_dummy);
                }
                $bs_wrap
                    .removeAttr('class')
                    .removeAttr('style')
                    .removeAttr('tabindex');
                $bs_range_base
                    .removeAttr('class')
                    .removeAttr('style');
                $bs_range_bar
                    .removeAttr('class')
                    .removeAttr('style');
                $bs_range_cover
                    .removeAttr('class')
                    .removeAttr('style');
                initializeParts();
                if (parentNode !== null) {
                    //$bs_wrap.appendTo(parentNode);
                    $hot_swap_dummy.replaceWith($bs_wrap);
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
                }
                min_value = default_min_val;
                max_value = default_max_val;
                value = default_val;
                prev_input_value = value;
                prev_change_value = value;
                $bs_wrap.attr('tabindex', default_tab_index);
                refreshControls(true);
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
