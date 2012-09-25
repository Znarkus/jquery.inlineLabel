/* jquery.alignTo - License https://github.com/Znarkus/jquery.inlineLabel */

(function ($) {
	
	function _disable_selection($elements) {
		var $e;
		return $elements.each(function() { 
			$e = $(this);
	        this.onselectstart = function () { return false; }; 
	        this.unselectable = "on"; 
	        $e.css('user-select', 'none'); 
	        $e.css('-o-user-select', 'none'); 
	        $e.css('-moz-user-select', 'none'); 
	        $e.css('-khtml-user-select', 'none'); 
	        $e.css('-webkit-user-select', 'none'); 
	    }); 
	}
	
	function _input_in_label($label) {
		return !$label.attr('for');
	}
	
	function _labels_input($label) {
		if (_input_in_label($label)) {
			return $('input', $label);
		} else {
			return $('#' + $label.attr('for'));
		}
	}
	
	/**
	* @param namespace border/margin/padding/etc
	* @param property width/color/etc
	*/
	function _css_sides(namespace, property) {
		var sides = ['top', 'right', 'bottom', 'left'];
		
		$.each(sides, function (i) {
			sides[i] = namespace + '-' + this + (property ? '-' + property : '');
		});
		
		return sides;
	}
	
	function _copy_css_properties($from, $to, properties) {
		$.each(properties, function (i, prop) {
			$to.css(prop, $from.css(prop));
		});
	}
	
	function _copy_input_style($label, $input, options) {
		var properties = ['font-family', 'font-size', 'font-weight', 
						  'font-style', 'line-height', 'text-align',
						  'colour'];
		
		properties = properties
			.concat(_css_sides('padding'))
			.concat(_css_sides('margin'))
			.concat(_css_sides('border', 'width'));
		
		$label.css({
			border: '0 solid transparent',
			cursor: 'text',
			overflow: 'hidden',
			background: 'transparent',
			whiteSpace: 'nowrap'
		});
		
		_copy_css_properties($input, $label, properties);
		
		if (options && options.css) {
			$label.css(options.css);
		}
	}
	
	function _position_label($label, $input) {
		var pos;
		
		$label.css({
			position: 'absolute',
			width: $input.width() + 'px',
			height: $input.height() + 'px'
		});
		
		pos = $input.position();
		
		$label.css({
			left: pos.left + 'px',
			top: pos.top + 'px'
		});
	}
	
	function _setup_label_click($label, $input) {
		//var mouse_down = false;
		
		_disable_selection($label).mousedown(function () {
			//mouse_down = true;
			// Since mouse down focuses the $label, we must 
			// delay the $input focusing
			setTimeout(function () {
				$input.focus();
			}, 1);
		})/*.mouseup(function () {
			$input.focus();
			mouse_down = false;
		}).mouseleave(function () {
			if (mouse_down) {
				$input.focus();
			}
			
			mouse_down = false;
		})*/;
	}
	
	function _label_show_invisibly($label) {
		if ($label.is(':hidden')) {
			$label.css('opacity', 0).show();
		}
	}
	
	function _label_tone_down($label) {
		_label_show_invisibly($label);
		$label.stop().animate({ opacity: 0.2 }, 100);
	}
	
	function _label_activate($label) {
		_label_show_invisibly($label);
		$label.stop().animate({ opacity: 0.5 }, 100);
	}
	
	function _label_hide($label) {
		$label.stop().css('opacity', 0.5).hide();
	}
	
	function _hidden($e) {
		return $e.css('display') === 'none' /*|| !$e.width() || !$e.height()*/;
	}
	
	function _check_input_value($input, $label, options) {
		if (_hidden($input)) {
			_label_hide($label);
		} else if ($.trim($input.val()) !== '') {
			_label_hide($label);
		} else {
			if (options && options.override_focus) {
				_label_tone_down($label);
			} else if ($input.is(':focus')) {
				_label_tone_down($label);
			} else {
				_label_activate($label);
			}
		}
	}
	
	function _special_key(e) {
		// Tab, shift, ctrl, alt
		return e.which == 9
			|| e.which == 16
			|| e.which == 17
			|| e.which == 18;
	}
	
	function InlineLabel($label, options) {
		var $input = _labels_input($label);
		
		if (_input_in_label($label)) {
			$label = $('span', $label);
		}
		
		_copy_input_style($label, $input, options);
		_position_label($label, $input);
		_setup_label_click($label, $input);
		
		$input.focus(function () {
			// Must override focus detection, because $input
			// actually doesn't have focus yet
			_check_input_value($input, $label, { override_focus: true });
			
		}).blur(function () {
			_check_input_value($input, $label);
			
		// Quickly hide label on key down..
		}).keydown(function (e) {
			// Skip tab, shift, alt and ctrl
			if (!_special_key(e)) {
				_label_hide($label);
			}
			
		// ..then check value and correct if we made a mistake
		}).keyup(function () {
			_check_input_value($input, $label);
			
		});
		
		// Check initial values
		// Timer needed for IE9
		setTimeout(function () {
			// Don't show if it is set to be hidden (with external JS or whatnot)
			//var was_hidden = $label.css('display') === 'hidden' || !$label.width() || !$label.height();
			_check_input_value($input, $label);
			
			/*if (was_hidden) {
				$label.hide();
			}*/
			//}
		}, 1);
		
		
		return {
			update_position: function () {
				_position_label($label, $input);
			},
			$label: function () {
				return $label;
			}
		};
	}
	
	var _inline_labels = [];
	
	$.fn.inlineLabel = function (options) {
		return this.each(function () {
			_inline_labels.push(
				new InlineLabel($(this), options)
			);
		});
	};
	
	$.inlineLabel = {
		updateAll: function () {
			$.each(_inline_labels, function () {
				//if (_hidden(this.$label())) {
					this.update_position();
				//}
			});
		}
	};
	
	var _resize_timer;
	
	$(window).resize(function () {
		var $l;
		
		if (!_resize_timer) {
			$.each(_inline_labels, function () {
				$l = this.$label()
				$l.data('was_hidden', _hidden($l))
					.hide();
			});
		}
		
		clearTimeout(_resize_timer);
		_resize_timer = setTimeout(function () {
			_resize_timer = null;
			
			$.each(_inline_labels, function () {
				$l = this.$label();
				
				if (!$l.data('was_hidden')) {
					$l.show();
				}
				
				this.update_position();
			});
		}, 200);
	});
	
}(jQuery));