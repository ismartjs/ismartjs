/**
 * Created by Administrator on 2015/1/8.
 */
(function ($) {
    'use strict';

    // AFFIX style DEFINITION
    // ======================

    var Affix = function (element, options) {
        this.options = $.extend({}, Affix.DEFAULTS, options)
        this.$window = $(this.options.target)
            .on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this))
            .on('click.bs.affix.data-api', $.proxy(this.checkPositionWithEventLoop, this))

        this.$element = $(element)
        this.affixed =
            this.unpin =
                this.pinnedOffset = null

        this.checkPosition()
    }

    Affix.RESET = 'affix affix-top affix-bottom'

    Affix.DEFAULTS = {
        offset: 0,
        target: window
    }

    Affix.prototype.getPinnedOffset = function () {
        if (this.pinnedOffset) return this.pinnedOffset
        this.$element.removeClass(Affix.RESET).addClass('affix')
        var scrollTop = this.$window.scrollTop()
        var position = this.$element.offset()
        return (this.pinnedOffset = position.top - scrollTop)
    }

    Affix.prototype.checkPositionWithEventLoop = function () {
        setTimeout($.proxy(this.checkPosition, this), 1)
    }

    Affix.prototype.checkPosition = function () {
        if (!this.$element.is(':visible')) return

        var scrollHeight = $(document).height()
        var scrollTop = this.$window.scrollTop()
        var position = this.$element.offset()
        var offset = this.options.offset
        var offsetTop = offset.top
        var offsetBottom = offset.bottom

        if (this.affixed == 'top') position.top += scrollTop

        if (typeof offset != 'object')         offsetBottom = offsetTop = offset
        if (typeof offsetTop == 'function')    offsetTop = offset.top(this.$element)
        if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)

        var affix = this.unpin != null && (scrollTop + this.unpin <= position.top) ? false :
            offsetBottom != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ? 'bottom' :
                offsetTop != null && (scrollTop <= offsetTop) ? 'top' : false

        if (this.affixed === affix) return
        if (this.unpin) this.$element.css('top', '')

        var affixType = 'affix' + (affix ? '-' + affix : '')
        var e = $.Event(affixType + '.bs.affix')

        this.$element.trigger(e)

        if (e.isDefaultPrevented()) return

        this.affixed = affix
        this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null

        this.$element
            .removeClass(Affix.RESET)
            .addClass(affixType)
            .trigger($.Event(affixType.replace('affix', 'affixed')))

        if (affix == 'bottom') {
            this.$element.offset({top: scrollHeight - offsetBottom - this.$element.height()})
        }
    }


    // AFFIX PLUGIN DEFINITION
    // =======================

    var old = $.fn.affix

    $.fn.smartAffix = function (option) {
        return this.each(function () {
            var $this = $(this)
            var data = $this.data('bs.affix')
            var options = typeof option == 'object' && option

            if (!data) $this.data('bs.affix', (data = new Affix(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.smartAffix.Constructor = Affix


    // AFFIX NO CONFLICT
    // =================

    $.fn.smartAffix.noConflict = function () {
        $.fn.affix = old
        return this
    }

})(jQuery);
(function ($) {
    Smart.widgetExtend({
        id: "affix",
        options: "ctx:offset,ctx:target,affixClass",
        defaultOptions: {
            affixClass: 's-ui-affix-bar'
        }
    }, {
        onPrepare: function () {
            var that = this;
            this.S.node.addClass('s-ui-affix').smartAffix({
                offset: this.options.offset || (that.S.node.offset().top - that.options.target.offset().top),
                target: this.options.target
            });
            this.S.node.on("affix.bs.affix", function (e) {
                var node = $(e.currentTarget);
                var offset = that.options.target.offset();
                node.css({
                    top: offset.top
                });
            });
            if (this.options['affixClass']) {
                var that = this;
                this.S.node.on("affixed.bs.affix", function (e) {
                    e.stopPropagation();
                    that.S.node.addClass(that.options['affixClass']);
                }).on("affixed-top.bs.affix", function (e) {
                    e.stopPropagation();
                    that.S.node.removeClass(that.options['affixClass']);
                });
            }
        }
    });
})(jQuery);
