(function() {
	"use strict";
		
	/**
	 *	NATIVE
	 */
	var NAT_DOC = document,
		NAT_ARR = Array,
		NAT_IS_ARR = function(a){return a instanceof NAT_ARR};
		
	/**
	 *	SUPPORT
	 */
	var SPT_gEBCN = !!NAT_DOC.getElementsByClassName,
		SPT_qSA = !!NAT_DOC.querySelectorAll && false;
		
	/**
	 *	TYPES
	 */
	var TYP_CLASSNAME = 'className',
		TYP_TAGNAME = 'tagName';
		
	/**
	 * TEMPS
	 */
	var TMP_CONTEXT = null;
		
	/**
	 *	NATIVE QUERIES
	 */
	var QRY_CLASSNAME = SPT_gEBCN
		? function(s){
			return TMP_CONTEXT.root.getElementsByClassName(s);
		}
		: function(s,t){
			var matches = TMP_CONTEXT.root.getElementsByTagName(t || '*'),
				regexp = new RegExp("\\b"+s+"\\b");
				
			for (var index = 0, length = matches.length, stack = []; index < length; index++)
				if (regexp.test(matches[index][TYP_CLASSNAME]))
					stack.push(matches[index]);
					
			return stack;
		},
		QRY_ID = function(s){
			return TMP_CONTEXT.root.getElementById(s);
		},
		QRY_TAGNAME = function(s){
			return TMP_CONTEXT.root.getElementsByTagName(s);
		},
		QRY_NAME = function(s){
			return TMP_CONTEXT.root.getElementsByName(s);
		};
		
	/**
	 *	REGULAR EXPRESSIONS
	 */
	var REX_QUICK_ID = /#[^#]*$/,
		REX_QUICK_PATTERN = /^(\w+|\*)?(?:#([\w\-_]+))?(?:\.([\w\-_]+))?$/,
		REX_SPLIT_PATTERN = /[^,]+(\[[^\]]+\])[^,]*|[^,]+/g,
		REX_SELECT_PATTERN = /\S+(\[[^\]]*\])\S*|\S+/g,
		REX_NS_ID = /#([\w\-_]+)/,
		REX_NS_TAG = /^(?:\w+|\*)/,
		REX_NS_CLASS = /\.([\w\-_]+)/g,
		REX_NS_ATTR = /\[([^\]]*)\]/g,
		REX_NS_ATTR_OP = /([\w\-_]+)([~^$*|]?=)?(?:"?([^"\]]+)"?)?/g,
		REX_NS_STATE = /:([\w\-_]+)/g;
		
	/**
	 * NODE METHODS
	 */
	var NDE_INDEX = 1,
		NDE_REGLABEL = 'data-nde-idx',
		NDE_REG = function(a){
			return a[NDE_REGLABEL] || (a[NDE_REGLABEL]=NDE_INDEX++);
		},
		NDE_DBL = null,
		NDE_STACK = null,
		NDE_CONCATX = function(a,index){
			for (var current,id; index--;)				
				if (NDE_DBL[id = NDE_REG(current = a[index])]!=current)
					NDE_STACK.push(NDE_DBL[id]=current);
		},
		NDE_CONCAT = function(a,b){
			var ida,idb;
			
			if (!(ida = a.length)) return b;
			if (!(idb = b.length)) return a;
			
			NDE_DBL = []; NDE_STACK = [];
			NDE_CONCATX(a,ida);
			NDE_CONCATX(b,idb);
			
			return NDE_STACK;
		},
		NDE_CONTEXT = function(root){
			return {
				cache : null,
				root : root || document,
				exec : function(type,string,x1,x2,x3){					
					this.exec = function(type,string,x1,x2,x3){		
						return (TMP_CONTEXT = this).cache = NDE_CMPHANDLER[type](string,x1,x2,x3);
					};
					
					return (TMP_CONTEXT = this).cache = NDE_DOMHANDLER[type](string,x1,x2,x3);
				}
			};
		},
		NDE_DOMHANDLER = {
			className : QRY_CLASSNAME,
			tagName : QRY_TAGNAME
		},
		NDE_CMPHANDLER = {
			className : function(s){
				var object = TMP_CONTEXT.cache, stack = [], index = 0, match;
							
				while (match = object[index++])
					if (match[TYP_CLASSNAME].toLowerCase().indexOf(s)>-1)
						stack.push(match);
			
				return stack;
			},
			tagName : function(s){
				var object = TMP_CONTEXT.cache, stack = [], index = 0, match;
							
				while (match = object[index++])
					if (match[TYP_TAGNAME].toLowerCase().indexOf(s)>-1)
						stack.push(match);
			
				return stack;
			}
		};

	/**
	 * TOKEN METHODS
	 */
	var TKN_SHORT_REF = {},
		TKN_SINGLE_REF = {},
		TKN_MULTIPLE_REF = {},
		TKN_EXEC = function (selector){
			if (TKN_SINGLE_REF[selector]) return TKN_SINGLE_REF[selector];
			
			var match;
			
			if (match = REX_QUICK_ID.exec(selector)) selector = match[0];
			if (match = REX_QUICK_PATTERN.exec(selector))
			{
				if (match[2]) return TKN_SINGLE_REF[selector] = {res : [{ id : match[2]}]};
				
				return TKN_SINGLE_REF[selector] = {res : [{
					tagName 	: 	match[1],
					className	:	match[3]
				}]};
			}
			
			if (SPT_qSA) return TKN_SINGLE_REF[selector] = {qSA : selector};
			
			var res = [], current, scan;
			
			while (match = REX_SELECT_PATTERN.exec(selector))
			{
				current = match[0];
				
				if (TKN_SHORT_REF[current])
					res.push(TKN_SHORT_REF[current]);
				else
				{
					if (scan = REX_NS_ID.exec(current))
					{
						res.push(TKN_SHORT_REF[current] = {id : scan[1]});
						continue;
					}
					
					var obj = {};
					
					if (scan = REX_NS_TAG.exec(current)) obj.tagName = scan[0];
					if (scan = REX_NS_CLASS.exec(current)) for (var stack = obj.className = []; scan; scan = REX_NS_CLASS.exec(current)) stack.push(scan[1]);
					if (scan = REX_NS_ATTR.exec(current))
					{
						var deep;
					
						for (var stack = obj.attr = []; scan; scan = REX_NS_ATTR.exec(current)) 
						{
							deep = REX_NS_ATTR_OP.exec(scan[1]);
						
							deep[2] && deep[3] 
								? 	stack.push({
										name : deep[1],
										operation : deep[2],
										value : deep[3]
									})
								:	stack.push({
										name : deep[1],
										operation : 'has'
									});
						}
					}
					if (scan = REX_NS_STATE.exec(current)) for (var stack = obj.state = []; scan; scan = REX_NS_STATE.exec(current)) stack.push(scan[1]);

					res.push(TKN_SHORT_REF[current] = obj);
				}
			}
			
			return {res : res};
		},
		TKN_GET = function (selector){
			if (TKN_MULTIPLE_REF[selector]) return TKN_MULTIPLE_REF[selector];
			
			var all = selector.match(REX_SPLIT_PATTERN), length = all.length;
			
			if (length > 1 && SPT_qSA)
				return TKN_MULTIPLE_REF[selector] = {qSA : selector};
				
			for (var res=[]; length--; res.push(TKN_EXEC(all[length])));
			
			return TKN_MULTIPLE_REF[selector] = {res : res};
		};
		
	/**
	 *	QUERY SELECT
	 */
	 
	var QRY_NEXT = function(token,context,pos){
			var index = pos || 0, 
				info = token[index], 
				match, current;
				
			if (current = info.id) context.cache = [QRY_ID(current,context.root)];
			else
			{
				if (current = info.className) 
				{
					if (NAT_IS_ARR(current))
						for (var amount = current.length; amount--;context.exec(TYP_CLASSNAME,current[amount],info.tagName));
					else
						context.exec(TYP_CLASSNAME,current,info.tagName);
				}
				if ((SPT_gEBCN || !current) && (current = info.tagName)) context.exec(TYP_TAGNAME,current);
			}
			
			var length = context.cache.length, res=[], nindex = index+1;
			
			if (token[nindex])
			{
				while (length--)
					if ((current = context.cache[length]).childNodes.length > 0)
						res = NDE_CONCAT(res,QRY_NEXT(token,new NDE_CONTEXT(current),nindex));
			}
			else
				return context.cache;
			
			return res;
		},
		QRY_ALL = function(string,context){
			var token = TKN_GET(string),
				live = token.res,
				index = live ? live.length : 0,
				res = [],
				root = context || NAT_DOC,
				current, found;
				
			if (found = token.qSA) return root.querySelectorAll(found);
			
			while (current = live[--index])
			{
				if (found = token.qSA)
					res = NDE_CONCAT(res,root.querySelectorAll(found));
				else if (found = QRY_NEXT(current.res,new NDE_CONTEXT(root)))
					res = NDE_CONCAT(res,found);
			}
			
			return res;
		};
	
	window.finder = {
		get : QRY_ALL
	};
}).call(this);