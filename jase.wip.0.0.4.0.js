(function(global){
	'use strict';

	var /**
		 * Variables
		 * --
		 */

		/**
		 * General Globals
		 */
		author = 'swe',
		version = '0.0.4.0',
		_context = null,

		/**
		 * Global Shortcuts
		 */
		rx = RegExp,
		doc = document,
		slice = [].slice,
		push = [].push,
		stringClassName = 'className',
		stringTagName = 'tagName',
		stringAttribute = 'attribute',
		stringAttributeRef = {
			'has' : stringAttribute+'Has',
			'=' : stringAttribute+'Equal',
			'~=' : stringAttribute+'Like',
			'|=' : stringAttribute+'Seperator',
			'^=' : stringAttribute+'First',
			'$=' : stringAttribute+'Last',
			'*=' : stringAttribute+'Like'
		},
		stringState = 'state',
		stringStateRef = {
			'active' : stringStateRef+'Active',
			'hover' : stringStateRef+'Hover',
			'visited' : stringStateRef+'Visited'
		},
		supportGetElementsByClassName = !!doc.getElementsByClassName,
		supportQuerySelectorAll = !!doc.querySelectorAll,

		/**
		 *	Regular Expressions
		 */
		rxAgent = /(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i,
		rxVersion = /version\/([\.\d]+)/i,
		rxQuickID = /^#\w+$/,
		rxQuickPattern = /^(\w+|\*)?(?:#([\w\-_]+))?(?:\.([\w\-_]+))?$/,
		rxSplitPattern = /[^,]+(\[[^\]]+\])[^,]*|[^,]+/g,
		rxSelectPattern = /\S+(\[[^\]]*\])\S*|\S+/g,
		rxFilterID = /#([\w\-_]+)/g,
		rxFilterTagName = /^(\w+|\*)/g,
		rxFilterClassName = /\.([\w\-_]+)/g,
		rxFilterAttribute = /\[([^\]]*)\]/g,
		rxFilterAttributeOperation = /^([\w\-_]+)([~^$*|]?=)?(?:"?([^"\]]+)"?)?$/g,
		rxFilterState = /:([\w\-_]+)/g,
		
		/**
		 * Static Functions
		 * --
		 */
		browser = (function(){
			var obj = {},
			agent = navigator.userAgent,
			app = agent.match(rxAgent), ver;
			
			if (app || (ver = agent.match(rxVersion)))
			{
				obj[app[1]] = true;
				obj.version = ver ? ver[1] : app[2];
				
				return obj;
			}
			
			obj[navigator.appName] = true;
			obj.version = navigator.appVersion;
			
			return obj;
		})(),

		/**
		 * Loops through arrays and objects.
		 * 
		 * @param Object/Array obj Current context to go through
		 * @param Function callback Current char
		 * @param Object pre Predefine result value (optional)
		 * @return result object
		 */
		forEach = function(obj, callback, pre) {
			if (obj == null) {
				return null;
			}
			
			var t, d = {
				result: pre,
				skip: false
			};
			
			if (typeof obj == 'function') {
				while ((t = obj.call(d)) && !d.skip) {
					callback.call(d, t);
				}
			} else if (t = obj.length) {
				for (var k = 0; k < t && !d.skip; callback.call(d, k, obj[k++]));
			} else {
				for (var k in obj) {
					typeof obj[k] != 'unknown' && callback.call(d, k, obj[k]);
					
					if (d.skip) {
						break;
					}
				}
			}
			
			return d.result;
		},

		/**
		 * Convert objects to an array.
		 * 
		 * @param Object obj Object to convert
		 * @return converted object
		 */
		toArray = (!browser.MSIE || parseInt(browser.version) > 7) && slice ? function(obj) {
			return slice.call(obj);
		} : function(obj) {
			var toSlice = [];
			
			push.apply(toSlice,obj);
			
			return toSlice;
		},
		
		concat = function(a,b){
			if (getType(a) == 'array'){
				push.apply(a,b);
				
				return a;
			}
			
			var concated = [];
			
			push.apply(concated,a);
			push.apply(concated,b);
			
			return concated;
		},

		/**
		 * Unite two arrays to an object.
		 * 
		 * @param Array keys Later object keys
		 * @param Array values Later object values
		 * @param Function get Modify loop pointer (optional)
		 * @return united object
		 */
		unite = function(keys, values, get) { 
			!! get || (get = function(i) {
				return i;
			});
			
			return forEach(keys, function(index, item) { 
				!! item && (this.result[item] = values[get(index)]);
			}, {});
		},

		/**
		 * Extend multiple objects.
		 * 
		 * @param Object[] All objects which you want to unite
		 * @return extended object
		 */
		extend = function() {
			var args = toArray(arguments),
				last = args.length - 1,
				nil = true,
				src = args.shift() || {};
			
			getType(args[last]) === 'boolean' && (nil = args.pop());
			
			return forEach(args, function(index, item) {
				getType(item) === 'object' && (this.result = forEach(item, function(prop, child) { 
					!! (nil || (child != null && child.length)) && item.hasOwnProperty(prop) && (this.result[prop] = child);
				}, this.result));
			}, src);
		},

		/**
		 * Get the type of an object.
		 * 
		 * @param Object obj Object you want to know the type of
		 * @return type of object
		 */
		getType = function(obj) {
			return !!typeifier ? typeifier.compile(obj) : typeof obj;
		},
		
		getByClassName = supportGetElementsByClassName ? function(className){
			return _context.root.getElementsByClassName(className);
		} : (supportQuerySelectorAll ? function(className,tagName){
			return _context.root.querySelectorAll(tagName+'.'+className);
		} : function(className,tagName){
			var matches = _context.root.getElementsByTagName(tagName || '*'),
				pattern = new RegExp("\\b"+className+"\\b");
				
			return forEach(matches,function(_,item){
				pattern.test(item[stringClassName]) && this.result.push(item);
			},[]);
		}),
		getByID = function(id,root){
			return (root || _context.root).getElementById(id);
		},
		getByTagName = function(tagName){
			return _context.root.getElementsByTagName(tagName);
		},
		getByName = function(name){
			return _context.root.getElementsByName(name);
		},
		getByAttributeHas = supportQuerySelectorAll ? function(name,tagName){
			return _context.root.querySelectorAll(tagName+'['+name+']');
		} : function(name,tagName){
			var matches = _context.root.getElementsByTagName(tagName || '*');
			
			return forEach(matches,function(_,item){
				item['hasAttribute'] && item.hasAttribute(name) && this.result.push(item);
			},[]);
		},
		getByAttributeEqual = supportQuerySelectorAll ? function(name,value,tagName){
			return _context.root.querySelectorAll(tagName+'['+name+'="'+value+'"]');
		} : function(name,value,tagName){
			var matches = _context.root.getElementsByTagName(tagName || '*');
			
			return forEach(matches,function(_,item){
				item['getAttribute'] && item.getAttribute(name) == value && this.result.push(item);
			},[]);
		},
		getByAttributeLike = supportQuerySelectorAll ? function(name,value,tagName){
			return _context.root.querySelectorAll(tagName+'['+name+'~="'+value+'"]');
		} : function(name,value,tagName){
			var matches = _context.root.getElementsByTagName(tagName || '*'),
				content;	
			
			return forEach(matches,function(_,item){
				item['getAttribute'] && (content = item.getAttribute(name)) && content.indexOf(value) != -1 && this.result.push(item);
			},[]);
		},
		getByAttributeSeperator = supportQuerySelectorAll ? function(name,value,tagName){
			return _context.root.querySelectorAll(tagName+'['+name+'|="'+value+'"]');
		} : function(name,value,tagName){
			var matches = _context.root.getElementsByTagName(tagName || '*'),
				pattern = new RegExp("(^|-)"+value),
				content;
			
			return forEach(matches,function(_,item){
				item['getAttribute'] && (content = item.getAttribute(name)) && pattern.test(content) && this.result.push(item);
			},[]);
		},
		getByAttributeFirst = supportQuerySelectorAll ? function(name,value,tagName){
			return _context.root.querySelectorAll(tagName+'['+name+'|="'+value+'"]');
		} : function(name,value,tagName){
			var matches = _context.root.getElementsByTagName(tagName || '*'),
				content;	
			
			return forEach(matches,function(_,item){
				item['getAttribute'] && (content = item.getAttribute(name)) && content.indexOf(value) == 0 && this.result.push(item);
			},[]);
		},
		getByAttributeLast = supportQuerySelectorAll ? function(name,value,tagName){
			return _context.root.querySelectorAll(tagName+'['+name+'$="'+value+'"]');
		} : function(name,value,tagName){
			var matches = _context.root.getElementsByTagName(tagName || '*'),
				length = value.length,
				content;	
			
			return forEach(matches,function(_,item){
				item['getAttribute'] && (content = item.getAttribute(name)) && content.indexOf(value) + length == content.length && this.result.push(item);
			},[]);
		},

		/**
		 * Basic class creator.
			*
		 * @package Class
		 * @author swe <soerenwehmeier@googlemail.com>
		 * @version 0.8.2.2
		 */
		Class = function() {
			return forEach(arguments, function(_, module) {
				var create = module.create;
				
				if (create) {
					var old = this.result.prototype.create;
					
					this.result.prototype.create = old ? function() {
						return forEach([create.apply(this, arguments), old.apply(this, arguments)], function(_, item) {
							item && (item instanceof Array ? this.result.concat(item) : this.result.push(item));
						}, []);
						} : function() {
						return create.apply(this, arguments);
					};
					
					delete module.create;
				}
				
				if (module.static) {
					extend(this.result, module.static);
					delete module.static;
				}
				
				extend(this.result.prototype, module);
				}, function() {
				return !!this.create ? this.create.apply(this, arguments) : this;
			});
		},

		/**
		 * Handling object types.
			*
		 * @package Type
		 * @author swe <soerenwehmeier@googlemail.com>
		 * @version 0.8.2.2
		 */
		Type = new Class({
			/**
			 * Constructor
			 * 
			 * @param Object handler Special handler for different object subtypes
			 * @return Type
			 */
			create: function(handler) {
				this.handler = handler;
			},
			
			/**
			 * Compile native object types to their subtype.
			 * 
			 * @param Object obj Object you want to know the type of
			 * @return Type
			 */
			compile: function(obj) {
				var type = typeof obj,
				func = this.handler[type];
				
				return func ? func(obj) : type;
			}
		}),

		/**
		 * GetType helper.
		 */
		typeifier = new Type({
			object: (function(parents) {
				var length = parents.length;
				
				return function(object) {
					return forEach(parents, function(index, item) {
						if (object instanceof global[item]) {
							this.result = item.toLowerCase();
							this.skip = true;
						}
					}) || 'object';
				};
			})(['Array', 'Number', 'Date', 'RegExp'])
		}),
		
		DOMHandler = new (new Class({
			className : getByClassName,
			tagName : getByTagName,
			attributeHas : getByAttributeHas,
			attributeEqual : getByAttributeEqual,
			attributeLike : getByAttributeLike,
			attributeSeperator : getByAttributeSeperator,
			attributeFirst : getByAttributeFirst,
			attributeLast : getByAttributeLast
		}))(),
		
		CMPHandler = new (new Class({
			className : function(string){
				return forEach(_context.cache,function(_,item){
					item[stringClassName].toLowerCase().indexOf(string) != -1 && this.result.push(item);
				},[]);
			},
			tagName : function(string){
				return forEach(_context.cache,function(_,item){
					item[stringTagName].toLowerCase().indexOf(string) != -1 && this.result.push(item);
				},[]);
			},
			attributeHas : function(string){
				return forEach(_context.cache,function(_,item){
					item['hasAttribute'] && item.hasAttribute(string) && this.result.push(item);
				},[]);
			},
			attributeEqual : function(string,value){
				return forEach(_context.cache,function(_,item){
					item['getAttribute'] && item.getAttribute(string) == value && this.result.push(item);
				},[]);
			},
			attributeLike : function(string,value){
				var content;
				
				return forEach(_context.cache,function(_,item){
					item['getAttribute'] && (content = item.getAttribute(string)) && content.indexOf(value) != -1 && this.result.push(item);
				},[]);
			},
			attributeSeperator : function(string,value){
				var pattern = new RegExp("(^|-)"+value),
					content;
				
				return forEach(_context.cache,function(_,item){
					item['getAttribute'] && (content = item.getAttribute(string)) && pattern.test(content) && this.result.push(item);
				},[]);
			},
			attributeFirst : function(string,value){
				var content;
				
				return forEach(_context.cache,function(_,item){
					item['getAttribute'] && (content = item.getAttribute(string)) && content.indexOf(value) == 0 && this.result.push(item);
				},[]);
			},
			attributeLast : function(string,value){
				var length = value.length,
					content;	
				
				return forEach(_context.cache,function(_,item){
					item['getAttribute'] && (content = item.getAttribute(string)) && content.indexOf(value) + length == content.length && this.result.push(item);
				},[]);
			}
		}))(),
		
		NodeContext = new Class({
			create : function(root){
				this.cache = null,
				this.root = root || doc;
			},
			exec : function(type,string,x1,x2,x3){
				this.exec = function(type,string,x1,x2,x3){
					return (_context = this).cache = CMPHandler[type](string,x1,x2,x3);
				};
				
				return (_context = this).cache = DOMHandler[type](string,x1,x2,x3);
			}
		}),
		
		TokenContext = new Class({
			create : function(options){
				extend(this,options);
			},
			has : function(value){
				return !!this[value];
			}
		}),
		
		TokenManager = new Class({
			create : function(ctx){
				this[getType(ctx) === 'string' ? 'qSA' : 'found'] = ctx;
			}
		}),
		
		Token = new (new Class({
			create : function(){
				extend(this,{
					shortRef : {},
					singleRef : {},
					multiRef : {}
				});
			},
			exec : function(selector){
				var self = this;
				
				if (self.singleRef[selector]) {
					return self.singleRef[selector];
				}

				if (rxQuickID.test(selector)){
					return new TokenManager([new TokenContext({
						id : selector.substring(1)
					})]);
				}
				if (rxQuickPattern.exec(selector)) {					
					if (rx.$2) {
						return self.singleRef[selector] = new TokenManager(
							[new TokenContext({
								id : rx.$2
							})]
						);
					}
					
					return self.singleRef[selector] = new TokenManager(
						[new TokenContext({
							tagName : rx.$1,
							className : rx.$3
						})]
					);
				}
				
				if (supportQuerySelectorAll)
				{
					return self.singleRef[selector] = new TokenManager(selector);
				}
				
				return new TokenManager(
					forEach(selector.match(rxSelectPattern),function(_,current){
						if (self.shortRef[current]) {
							this.result.push(self.shortRef[current]);
							this.skip = true;
						} else {
							var token = new TokenContext();
							
							if (rxFilterID.exec(current)){
								token.id = rx.$1;
								this.result.push(self.shortRef[current] = token);
								return;
							}
							
							rxFilterTagName.exec(current) && (token.tagName = rx.$1);
							
							rxFilterClassName.exec(current) && (token.className = forEach(function(){
								return rxFilterClassName.exec(current);
							},function(){
								this.result.push(rx.$1);
							},[rx.$1]));
							
							rxFilterAttribute.exec(current) && (token.attr = forEach(function(){
								rxFilterAttributeOperation.exec(rx.$1);
								
								this.result.push(
									rx.$2 && rx.$3
									? {
										name : rx.$1,
										operation : rx.$2,
										value : rx.$3
									}
									: {
										name : rx.$1,
										operation : 'has'
									}
								);
								
								return rxFilterAttribute.exec(current);
							},function(){},[]));
							
							rxFilterState.exec(current) && (token.state = forEach(function(){
								this.result.push(rx.$1);
								
								return rxFilterState.exec(current);
							},function(){},[]));
							
							this.result.push(self.shortRef[current] = token);
						}
					},[])
				);
			},
			get : function(selector){
				var self = this;
				
				if (self.multiRef[selector]){
					return self.multiRef[selector];
				}
				
				var all = selector.match(rxSplitPattern);
					
				if (all.length > 1 && supportQuerySelectorAll){
					return self.multiRef[selector] = new TokenManager(selector);
				}
				
				return self.multiRef[selector] = new TokenManager(
					forEach(all,function(_,selector){
						this.result.push(self.exec(selector));
					},[])
				);
			}
		}))();
	
	function next(tokens,context,offset){
		var index = offset || 0,
			token = tokens[index],
			selector;
			
		if (selector = token.id){
			(_context = context).cache = [getByID(selector)];
		} else {
			if (selector = token.className){
				if (getType(selector) === 'array'){
					forEach(selector,function(_,item){
						context.exec(stringClassName,item,token.tagName);
					});
				} else {
					context.exec(stringClassName,selector,token.tagName);
				}
			}
			if ((supportGetElementsByClassName || !selector) && (selector = token.tagName)) {
				context.exec(stringTagName,selector);
			}
			if (selector = token.attr){
				forEach(selector,function(_,item){
					context.exec(stringAttributeRef[item.operation],item.name,item.value,token.tagName);
				});
			}
			if (selector = token.state){
				forEach(selector,function(_,item){
					context.exec(stringStateRef[selector]);
				});
			}
		}
		
		var nextIndex = index + 1;
		
		return tokens[nextIndex] ? forEach(context.cache,function(_,item){
			!!item && !!item.childNodes.length && (this.result = concat(this.result,next(tokens,new NodeContext(item),nextIndex)));
		},[]) : context.cache;
	}
	
	function all(string,context){
		var root = (context || doc);

		if (!rxQuickID.test(string)){
			var token = Token.get(string),
				selector = token.qSA,
				current;
				
			if (!!selector){
				return root.querySelectorAll(selector);
			}
			
			return forEach(token.found,function(_,item){
				if (selector = item.qSA){
					this.result = concat(this.result,root.querySelectorAll(selector));
				} else if (selector = next(item.found,new NodeContext(root))) {
					this.result = concat(this.result,selector);
				}
			},[]);
		}
		
		return [getByID(string.substring(1),root)];
	}
	
	window.get = all;
})(window || this);
