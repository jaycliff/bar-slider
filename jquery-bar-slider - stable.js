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
                def_min = 0,
                def_max = 100,
                def_value,
                do_median_value = true,
                min = def_min,
                max = def_max,
                value;
            if (is_options_valid) {
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
                        return val;
                    },
                    set: function (val) {
                        value = val;
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
        // Updates the slider UI
        function refreshControls(animate) {
            var rate, value_sub = properties.value, max_sub = properties.max, min_sub = properties.min;
            if ($bs_wrap[0].parentNode === null) {
                return; // Bail out since it's not attached to the DOM
            }
            if (max_sub <= min_sub) {
                rate = 0;
            } else {
                rate = ((value_sub - min_sub) / (max_sub - min_sub));
            }
            //console.log('VAL: ' + value_sub + ', MAX: ' + max_sub + ', MIN: ' + min_sub);
            if (!!animate && (disabled === false) && (transition_class_added === false)) {
                addTransitionClass();
            }
            $bs_range_bar.css(css_dimension_prop, (rate * 100) + '%');
            return bar_slider_object;
        }
        function value(val, animate) {
            var max_sub = properties.max, min_sub = properties.min;
            if (arguments.length > 0) {
                val = Number(val) || 0;
                if (val > max_sub) {
                    val = max_sub;
                }
                if (val < min_sub) {
                    val = min_sub;
                }
                properties.value = val;
                prev_input_value = val;
                prev_change_value = val;
                refreshControls(Boolean(animate));
                return bar_slider_object;
            }
            return properties.value;
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
                    val = Number(val) || 0;
                    if (Number.isFinite(val)) {
                        properties.min = val;
                        refreshControls(true);
                    }
                    return bar_slider_object;
                }
                return properties.min;
            },
            max: function (val) {
                if (arguments.length > 0) {
                    val = Number(val) || 0;
                    if (Number.isFinite(val)) {
                        properties.max = val;
                        refreshControls(true);
                    }
                    return bar_slider_object;
                }
                return properties.max;
            },
            value: value,
            val: value,
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
            var genericEventHandler, docWinEventHandler, prevX = 0, prevY = 0;
            function moveSlider(rate, animate) {
                var calculated_value, max_sub = properties.max, min_sub = properties.min;
                if (rate < 0) {
                    rate = 0;
                } else if (rate > 1) {
                    rate = 1;
                }
                //$bs_range_bar.css(css_dimension_prop, (rate * 100) + '%');
                if (max_sub >= min_sub) {
                    prev_input_value = properties.value;
                    calculated_value = min_sub + (rate * (max_sub - min_sub));
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
                        .on('mousemove touchmove', genericEventHandler)
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
                moveSlider(rate, true);
            };
            function changeEvent() {
                var value_sub = properties.value;
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
            }
            docWinEventHandler = function () {
                //console.log('docWinEventHandler');
                changeEvent();
                $bs_range_bar.removeClass('active');
                $window.off('blur', docWinEventHandler);
                $document
                    .off('mousemove touchmove', genericEventHandler)
                    .off('mouseup touchend', docWinEventHandler);
            };
            function bsWrapMetaControlHandler(event) {
                var rate, value_sub = properties.value, max_sub = properties.max, min_sub = properties.min;
                switch (event.type) {
                case 'keydown':
                    switch (event.which) {
                    case 38:
                    /* falls through */
                    case 39:
                        event.preventDefault();
                        rate = ((value_sub - min_sub) / (max_sub - min_sub));
                        moveSlider(rate + 0.01);
                        changeEvent();
                        break;
                    case 37:
                    /* falls through */
                    case 40:
                        event.preventDefault();
                        rate = ((value_sub - min_sub) / (max_sub - min_sub));
                        moveSlider(rate - 0.01);
                        changeEvent();
                        break;
                    case 8:
                        event.preventDefault();
                        moveSlider(0);
                        changeEvent();
                        break;
                    }
                    break;
                case 'keyup':
                    switch (event.which) {
                    case 37:
                    /* falls through */
                    case 38:
                    /* falls through */
                    case 39:
                    /* falls through */
                    case 40:
                    /* falls through */
                    case 8:
                        $bs_range_bar.removeClass('active');
                        break;
                    }
                    break;
                case 'DOMMouseScroll':
                    rate = ((value_sub - min_sub) / (max_sub - min_sub));
                    if (event.originalEvent.detail > 0) {
                        moveSlider(rate - 0.01);
                    } else {
                        moveSlider(rate + 0.01);
                    }
                    changeEvent();
                    break;
                case 'mousewheel':
                    rate = ((value_sub - min_sub) / (max_sub - min_sub));
                    if (event.originalEvent.wheelDelta < 0) {
                        moveSlider(rate - 0.01);
                    } else {
                        moveSlider(rate + 0.01);
                    }
                    changeEvent();
                    break;
                }
            }
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
                        .on('keydown keyup mousewheel DOMMouseScroll', bsWrapMetaControlHandler)
                        .on('mousedown touchstart', genericEventHandler);
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
                        .off('keydown keyup mousewheel DOMMouseScroll', bsWrapMetaControlHandler)
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
            function resetStructure() {
                var parentNode = $bs_wrap[0].parentNode, i, length, item;
                if (parentNode !== null) {
                    //$bs_wrap.detach();
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
                    //$bs_wrap.appendTo(parentNode);
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
        refreshControls(false);
        return bar_slider_object;
    };
}(window, (typeof jQuery === "function" && jQuery) || (typeof module === "object" && typeof module.exports === "function" && module.exports)));
