/**
 * Created by Administrator on 2014/6/21.
 */
(function(){
    Smart.UI.contextmenu = {
        target: null
    };

    var DISABLED_CLASS = "disabled";

    var CURRENT_SHOWN_CONTEXTMENU;

    Smart.widgetExtend({
        id: "contextmenu",
        options: "ctx:target,ctx:filter,delegate"
    },{
        onPrepare: function(){
            var target = this.options['target'];
            var that = this;
            if(target)
                this.S.bindTarget(target);
            this.S.node.delegate("li", "click", function(e){
                if($("ul", $(this)).size() > 0){
                    return;
                }
                that.S.hide();
            });
            $(document).click(function(e){
                that.S.hide();
            });
            this.S.node.find("li ul").each(function(e){
                var ul = $(this);
                var parentLi = ul.parent();
                parentLi.mouseover(function(){
                    if($(this).hasClass(DISABLED_CLASS)){
                        return;
                    }
                    ul.css("z-index",Smart.UI.zIndex()).show().position({
                        of: parentLi,
                        my: "left top",
                        at: "right-3 top+3",
                        collision: "flip flip"
                    });
                });
                parentLi.mouseleave(function(){
                    ul.fadeOut();
                });
            });
        }
    },{
        bindTarget: function(node, options){
            var that = this;
            options && (this.widget.contextmenu.options = options);
            if(this.widget.contextmenu.options.delegate){
                node.delegate(this.widget.contextmenu.options.delegate, "contextmenu", function(e){
                    that.show(e, $(e.currentTarget));
                    return false;
                })
            } else {
                node.bind("contextmenu", function(e){
                    that.show(e, $(this));
                    return false;
                });
            }

        },
        show: function(e, el){
            if(CURRENT_SHOWN_CONTEXTMENU && CURRENT_SHOWN_CONTEXTMENU != this){
                CURRENT_SHOWN_CONTEXTMENU.hide();
            }
            CURRENT_SHOWN_CONTEXTMENU = this;
            Smart.UI.contextmenu.target = Smart.of(el);
            Smart.UI.contextmenu.node = $(e.target);
            //过滤菜单
            if(this.widget.contextmenu.options.filter){
                var menuNodes = this.node.find("li[menuId]");
                var that = this;
                if(menuNodes.size()){
                    menuNodes.each(function(){
                        //如果filter的返回值是false，则说明该菜单不可用。
                        var node = $(this);
                        var menuId = node.attr("menuId");
                        if(that.widget.contextmenu.options.filter(menuId, node) == false){
                            that._disableMenu(node);
                        } else {
                            that._enableMenu(node);
                        }
                    });
                }
            }
            $(this.node).show().css({
                zIndex:Smart.UI.zIndex(),
                position: "absolute"
            }).position({
                of: e,
                my: "left top",
                at: "left top",
                collision: "flip flip"
            });
        },
        hide: function(){
            this.node.fadeOut(200);
        },
        disableMenuById: function(id){
            this._disableMenu(this.node.find("li[menuId='"+id+"']"));
        },
        _disableMenu: function(menu){
            menu.addClass(DISABLED_CLASS);
            $("i, span", menu).click(function(e){
                e.stopPropagation();
            });
        },
        enableMenuById: function(id){
            this._enableMenu(this.node.find("li[menuId='"+id+"']"));
        },
        _enableMenu: function(menu){
            menu.removeClass(DISABLED_CLASS);
            $("i, span", menu).unbind("click");
        }
    });
})();