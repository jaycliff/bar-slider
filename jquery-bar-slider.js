/*
    Copyright 2016 Jaycliff Arcilla of Eversun Software Philippines Corporation

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
if (typeof Number.isFinite !== "function") {
    Number.isFinite = function isFinite(value) {
        "use strict";
        return typeof value === "number" && isFinite(value);
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
    function decimalDigitsLength(num) {
        var string, dot_index;
        if (typeof num !== "number") {
            throw new TypeError('parameter must be a number');
        }
        string = String(num);
        dot_index = string.indexOf('.');
        if (dot_index < 0) {
            return 0;
        }
        return string.length - (dot_index + 1);
    }
    function valueByStep(value, step) {
        if (typeof step !== "number") {
            step = 1;
        }
        return +((Math.round(value / step) * step).toFixed(decimalDigitsLength(step)));
    }
    $.createBarSlider = function (options) {
        var is_options_valid = $.type(options) === 'object',
            $bs_wrap = $(document.createElement('span')),
            $bs_range_base = $(document.createElement('span')),
            $bs_range_bar = $(document.createElement('span')),
            $bs_range_cover = $(document.createElement('span')),
            $hot_swap_dummy = $(document.createElement('span')),
            hasOwnProperty = Object.prototype.hasOwnProperty,
            parts_list = [$bs_wrap, $bs_range_base, $bs_range_bar, $bs_range_cover],
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
            properties,
            prev_input_value,
            prev_change_value,
            bar_slider_object,
            $bar_slider_object;
        properties = (function () {
            var obj = {},
                temp,
                user_set = false,
                def_step = 1,
                def_min = 0,
                def_max = 100,
                def_value,
                do_median_value = true,
                step = def_step,
                min = def_min,
                max = def_max,
                value;
            if (is_options_valid) {
                if (hasOwnProperty.call(options, 'step')) {
                    temp = Number(options.step) || 1;
                    if (temp < 0) {
                        temp = 1;
                    }
                    if (Number.isFinite(temp)) {
                        def_step = temp;
                        step = def_step;
                    }
                }
                if (hasOwnProperty.call(options, 'max')) {
                    temp = Number(options.max) || 0;
                    if (Number.isFinite(temp)) {
                        def_max = temp;
                        max = def_max;
                    }
                }
                if (hasOwnProperty.call(options, 'min')) {
                    temp = Number(options.min) || 0;
                    if (Number.isFinite(temp)) {
                        def_min = temp;
                        min = def_min;
                    }
                }
                if (hasOwnProperty.call(options, 'value')) {
                    temp = Number(options.value) || 0;
                    if (Number.isFinite(temp)) {
                        def_value = temp;
                        value = def_value;
                        do_median_value = false;
                    }
                }
            }
            if (do_median_value) {
                def_value = (min >= max) ? min : (min + ((max - min) / 2));
                value = def_value;
            }
            Object.defineProperties(obj, {
                "max": {
                    get: function () {
                        var c_max = max;
                        if ((c_max < min) && (min < 100)) {
                            c_max = 100;
                        }
                        return c_max;
                    },
                    set: function (val) {
                        max = val;
                    }
                },
                "min": {
                    get: function () {
                        return min;
                    },
                    set: function (val) {
                        min = val;
                    }
                },
                "value": {
                    get: function () {
                        var c_max = this.max, val = value;
                        if (val > c_max) {
                            val = c_max;
                        }
                        if (val < min) {
                            val = min;
                        }
                        return (user_set) ? val : valueByStep(val, step);
                    },
                    set: function (val) {
                        value = val;
                        user_set = true;
                    }
                },
                "step": {
                    get: function () {
                        return step;
                    },
                    set: function (val) {
                        step = val;
                    }
                }
            });
            obj.reset = function () {
                max = def_max;
                min = def_min;
                value = def_value;
            };
            return obj;
        }());
        prev_input_value = properties.value;
        prev_change_value = prev_input_value;
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
            if (is_options_valid) {
                if (hasOwnProperty.call(options, 'width')) {
                    $bs_wrap.css('width', options.width);
                }
                if (hasOwnProperty.call(options, 'height')) {
                    $bs_wrap.css('height', options.height);
                }
            }
        }
        initializeParts();
        // Some utilities
        function removeTransitionClass() {
            $bs_range_base
                .removeClass('bs-transition')
                .off('transitionend', removeTransitionClass);
            transition_class_added = false;
        }
        function addTransitionClass() {
            $bs_range_base
                .addClass('bs-transition')
                .on('transitionend', removeTransitionClass);
            transition_class_added = true;
        }
        // Updates the slider UI
        function refreshControls(animate) {
            var rate, value_sub, max_sub, min_sub;
            if ($bs_wrap[0].parentNode === null) {
                return; // Bail out since it's not attached to the DOM
            }
            ////////////////////////////////////////////////////////////////////////
            value_sub = properties.value;
            max_sub = properties.max;
            min_sub = properties.min;
            if (max_sub <= min_sub) {
                rate = 0;
            } else {
                rate = ((value_sub - min_sub) / (max_sub - min_sub));
            }
            ////////////////////////////////////////////////////////////////////////
            //console.log('VAL: ' + value_sub + ', MAX: ' + max_sub + ', MIN: ' + min_sub);
            if (!!animate && (disabled === false) && (transition_class_added === false)) {
                addTransitionClass();
            }
            $bs_range_bar.css(css_dimension_prop, (rate * 100) + '%');
            return bar_slider_object;
        }
        // Create the jQuery-fied bar slider object (http://api.jquery.com/jQuery/#working-with-plain-objects)
        $bar_slider_object = $({
            tabIndex: function (index) {
                if (arguments.length > 0) {
                    $bs_wrap.attr('tabindex', Number.toInteger(index));
                    return bar_slider_object;
                }
                return tab_index;
            },
            step: function (val) {
                if (arguments.length > 0) {
                    val = Number(val) || 1;
                    if (val < 0) {
                        val = 1;
                    }
                    if (Number.isFinite(val)) {
                        properties.step = val;
                    }
                    return bar_slider_object;
                }
                return properties.step;
            },
            min: function (val, animate) {
                if (arguments.length > 0) {
                    val = Number(val) || 0;
                    if (Number.isFinite(val)) {
                        properties.min = val;
                        refreshControls(animate);
                    }
                    return bar_slider_object;
                }
                return properties.min;
            },
            max: function (val, animate) {
                if (arguments.length > 0) {
                    val = Number(val) || 0;
                    if (Number.isFinite(val)) {
                        properties.max = val;
                        refreshControls(animate);
                    }
                    return bar_slider_object;
                }
                return properties.max;
            },
            val: function (val, animate) {
                var max_sub, min_sub;
                if (arguments.length > 0) {
                    max_sub = properties.max;
                    min_sub = properties.min;
                    val = valueByStep(Number(val) || 0, properties.step);
                    if (val > max_sub) {
                        val = max_sub;
                    }
                    if (val < min_sub) {
                        val = min_sub;
                    }
                    properties.value = val;
                    prev_input_value = val;
                    prev_change_value = val;
                    refreshControls(animate);
                    return bar_slider_object;
                }
                return properties.value;
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
        Object.defineProperty(bar_slider_object, 'value', {
            get: function () {
                return properties.value;
            },
            set: function (val) {
                var max_sub = properties.max, min_sub = properties.min;
                val = valueByStep(Number(val) || 0, properties.step);
                if (val > max_sub) {
                    val = max_sub;
                }
                if (val < min_sub) {
                    val = min_sub;
                }
                properties.value = val;
                prev_input_value = val;
                prev_change_value = val;
                refreshControls();
            }
        });
        // Event-handling setup
        (function () {
            var genericEventHandler, docWinEventHandler, bsWrapMetaControlHandler, prevX = 0, prevY = 0, bs_do_not_trigger_map = {}, bs_wrap_do_not_trigger_map = {};
            function moveSlider(rate, animate) {
                var calculated_value, max_sub = properties.max, min_sub = properties.min;
                if (max_sub >= min_sub) {
                    prev_input_value = properties.value;
                    calculated_value = min_sub + (rate * (max_sub - min_sub));
                    calculated_value = valueByStep(calculated_value, properties.step);
                    if (disabled === false) {
                        if (calculated_value !== prev_input_value) {
                            properties.value = calculated_value;
                            trigger_param_list.push(calculated_value);
                            $bar_slider_object.triggerHandler('input', trigger_param_list);
                            trigger_param_list.length = 0;
                        }
                    }
                }
                refreshControls(animate);
            }
            /*
                The nowX-nowY-prevX-prevY tandem is a hack for browsers with stupid mousemove event implementation (Chrome, I'm looking at you!).
                What is this stupidity you're talking about?
                    Some browsers fire a single mousemove event of an element everytime a mousedown event of that same element fires.
                LINK(S):
                    http://stackoverflow.com/questions/24670598/why-does-chrome-raise-a-mousemove-on-mousedown
            */
            genericEventHandler = function (event) {
                var nowX, nowY, base, dimension, rate;
                event.preventDefault(); // This somehow disables text-selection
                //console.log(event);
                switch (event.type) {
                // 'touchstart' and 'mousedown' events belong to $bs_wrap
                case 'touchstart':
                    // http://stackoverflow.com/questions/4780837/is-there-an-equivalent-to-e-pagex-position-for-touchstart-event-as-there-is-fo
                    event.pageX = event.originalEvent.touches[0].pageX;
                    event.pageY = event.originalEvent.touches[0].pageY;
                    /* falls through */
                case 'mousedown':
                    // Prevent manual mousedown trigger and disable right-click. Manually-triggered events don't have an 'originalEvent' property
                    if (event.originalEvent === undef || event.which === 3) {
                        return;
                    }   
                    active = true;
                    nowX = event.pageX;
                    nowY = event.pageY;
                    if (transition_class_added === false) {
                        addTransitionClass();
                    }
                    $bs_range_bar.addClass('active');
                    $bs_wrap.trigger('focus');
                    prevX = nowX;
                    prevY = nowY;
                    $document
                        .on('mousemove touchmove', genericEventHandler)
                        .on('mouseup touchend', docWinEventHandler);
                    $window.on('blur', docWinEventHandler);
                    break;
                case 'touchmove':
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
                // 'width' or 'height'
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
                moveSlider(rate, true);
            };
            function changeEvent() {
                var value_sub = properties.value;
                trigger_param_list.push(value_sub);
                // 'seek' event is like a forced-change event
                $bar_slider_object.triggerHandler('seek', trigger_param_list);
                if (prev_change_value !== value_sub) {
                    $bar_slider_object.triggerHandler('change', trigger_param_list);
                    prev_change_value = value_sub;
                }
                trigger_param_list.length = 0;
            }
            docWinEventHandler = function () {
                active = false;
                if (disabled === false) {
                    changeEvent();
                }
                $bs_range_bar.removeClass('active');
                $window.off('blur', docWinEventHandler);
                $document
                    .off('mousemove touchmove', genericEventHandler)
                    .off('mouseup touchend', docWinEventHandler);
            };
            bsWrapMetaControlHandler = (function () {
                var is_default_prevented = false;
                function helper(event) {
                    is_default_prevented = event.isDefaultPrevented();
                }
                return function bsWrapMetaControlHandler(event) {
                    var rate, min_sub, event_type = event.type;
                    // trigger's extra parameters won't work with focus and blur events. See https://github.com/jquery/jquery/issues/1741}
                    if (!bs_do_not_trigger_map[event_type]) {
                        bs_wrap_do_not_trigger_map[event_type] = true;
                        $bar_slider_object.one(event_type, helper);
                        $bar_slider_object.triggerHandler(event_type);
                        bs_wrap_do_not_trigger_map[event_type] = false;
                    }
                    if (is_default_prevented) {
                        // prevent event default behaviour and propagation
                        event.stopImmediatePropagation();
                        return false;
                    }
                    switch (event_type) {
                    case 'keydown':
                        //console.log(event.which);
                        switch (event.which) {
                        case 8: // Backspace key
                        /* falls through */
                        case 36: // Home key
                            event.preventDefault();
                            moveSlider(0);
                            changeEvent();
                            break;
                        case 33: // Page up key
                        /* falls through */
                        case 38: // Up arrow key
                        /* falls through */
                        case 39: // Right arrow key
                            event.preventDefault();
                            min_sub = properties.min;
                            rate = (((properties.value + properties.step) - min_sub) / (properties.max - min_sub));
                            if (rate > 1) {
                                rate = 1;
                            }
                            moveSlider(rate);
                            changeEvent();
                            break;
                        case 34: // Page down key
                        /* falls through */
                        case 37: // Left arrow key
                        /* falls through */
                        case 40: // Down arrow key
                            event.preventDefault();
                            min_sub = properties.min;
                            rate = (((properties.value - properties.step) - min_sub) / (properties.max - min_sub));
                            if (rate < 0) {
                                rate = 0;
                            }
                            moveSlider(rate);
                            changeEvent();
                            break;
                        case 35: // End key
                            event.preventDefault();
                            moveSlider(1);
                            changeEvent();
                            break;
                        }
                        break;
                    case 'DOMMouseScroll':
                        if (event.originalEvent) {
                            min_sub = properties.min;
                            if (event.originalEvent.detail > 0) {
                                rate = (((properties.value - properties.step) - min_sub) / (properties.max - min_sub));
                                if (rate < 0) {
                                    rate = 0;
                                }
                            } else {
                                rate = (((properties.value + properties.step) - min_sub) / (properties.max - min_sub));
                                if (rate > 1) {
                                    rate = 1;
                                }
                            }
                            moveSlider(rate);
                            changeEvent();
                        }
                        break;
                    case 'mousewheel':
                        if (event.originalEvent) {
                            min_sub = properties.min;
                            if (event.originalEvent && event.originalEvent.wheelDelta < 0) {
                                rate = (((properties.value - properties.step) - min_sub) / (properties.max - min_sub));
                                if (rate < 0) {
                                    rate = 0;
                                }
                            } else {
                                rate = (((properties.value + properties.step) - min_sub) / (properties.max - min_sub));
                                if (rate > 1) {
                                    rate = 1;
                                }
                            }
                            moveSlider(rate);
                            changeEvent();
                        }
                        break;
                    }
                };
            }());
            function enableDisableAid(event) {
                switch (event.type) {
                case 'touchstart':
                    /* falls through */
                case 'mousedown':
                    event.preventDefault();
                    break;
                }
            }
            // bsEventHandler is mainly used for manually-triggered events (via the trigger / fire method)
            function bsEventHandler(event) {
                var event_type = event.type;
                // Prevent invocation when triggered manually from $bs_wrap
                if (!bs_wrap_do_not_trigger_map[event_type]) {
                    //console.log('triggered ' + event_type);
                    bs_do_not_trigger_map[event_type] = true;
                    $bs_wrap.trigger(event_type);
                    bs_do_not_trigger_map[event_type] = false;
                }
            }
            bar_slider_object.enable = function () {
                if (disabled === true) {
                    disabled = false;
                    // $bar_slider_object's attached events should also be found on $bs_wrap' bsWrapMetaControlHandler
                    $bar_slider_object.on('focus blur touchstart mousewheel DOMMouseScroll mousedown mouseup click keydown keyup keypress', bsEventHandler);
                    // Always attach bsWrapMetaControlHandler first
                    $bs_wrap
                        .removeClass('disabled')
                        .attr('tabindex', tab_index)
                        .on('focus blur touchstart mousewheel DOMMouseScroll mousedown mouseup click keydown keyup keypress', bsWrapMetaControlHandler)
                        .on('mousedown touchstart', genericEventHandler)
                        .off('mousedown', enableDisableAid);
                }
                return bar_slider_object;
            };
            bar_slider_object.disable = function () {
                if (disabled === false) {
                    disabled = true;
                    if (active) {
                        docWinEventHandler(); // Manually trigger the 'mouseup / window blur' event handler
                    }
                    $bar_slider_object.off('focus blur touchstart mousewheel DOMMouseScroll mousedown mouseup click keydown keyup keypress', bsEventHandler);
                    $bs_wrap
                        .addClass('disabled')
                        .removeAttr('tabindex')
                        .off('focus blur touchstart mousewheel DOMMouseScroll mousedown mouseup click keydown keyup keypress', bsWrapMetaControlHandler)
                        .off('mousedown touchstart', genericEventHandler)
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
            function trigger() {
                applier($_proto.trigger, $bar_slider_object, arguments);
                return bar_slider_object;
            }
            bar_slider_object.trigger = trigger;
            bar_slider_object.fire = trigger;
            function resetStructure() {
                var parentNode = $bs_wrap[0].parentNode, i, length, item;
                if (parentNode !== null) {
                    $bs_wrap.replaceWith($hot_swap_dummy);
                }
                for (i = 0, length = parts_list.length; i < length; i += 1) {
                    item = parts_list[i];
                    item.removeAttr('class').removeAttr('style');
                    if (item === $bs_wrap) {
                        item.removeAttr('tabindex');
                    }
                }
                initializeParts();
                if (parentNode !== null) {
                    $hot_swap_dummy.replaceWith($bs_wrap);
                }
            }
            bar_slider_object.reset = function (hard) {
                var i, length;
                bar_slider_object.disable();
                $bar_slider_object.off();
                if (Boolean(hard) === true) {
                    resetStructure();
                    for (i = 0, length = parts_list.length; i < length; i += 1) {
                        parts_list[i].off();
                    }
                }
                properties.reset();
                prev_input_value = properties.value;
                prev_change_value = prev_input_value;
                $bs_wrap.attr('tabindex', default_tab_index);
                refreshControls(true);
                bar_slider_object.enable();
                return bar_slider_object;
            };
        }());
        //$bs_toggle_neck.on('transitionend', function () { alert('END'); });
        $bs_wrap.data('bs:host-object', bar_slider_object).data('bar-slider-object', bar_slider_object);
        bar_slider_object.enable();
        refreshControls(false);
        return bar_slider_object;
    };
}(window, (typeof jQuery === "function" && jQuery) || (typeof module === "object" && typeof module.exports === "function" && module.exports)));