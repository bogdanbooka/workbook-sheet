//Melnikov Bogdan, December 2014
//booka.friend.of.sun@gmail.com
function log(obj){
	/*console.log(obj);//*/
}

$(document).ready(function(){
	document.oncontextmenu = function() {return false;};

	var c_newCreatedShapesCount = 0;
	var c_movingLimit = 5;
	var c_cornerShapeHalfSize = 8;
	var c_cornerShapeAnimationDuration = 100;
	var c_minShapeSize = {h: 40, w: 40};
	var c_shapeWrongState = 'wrong';
	var c_shapeCreateState = 'create';
	var c_shapeSelectingState = 'selecting';
	var c_shapeSelectedState = 'selected';
	var c_areaType = 'area';
	var c_shapeType = 'shape';
	var c_cornerShapeType = 'corner_shape';
	var c_editorType = 'editor';
	var c_shapeColor_Red = "red";
	var c_shapeColor_Yellow = "yellow";
	var c_shapeColor_Green = "green";
	var c_shapeColor_Blue = "blue";
	var c_shapeColor_Default = "default";
	var c_imageEditorRelativeSize = 0.95;
	var c_colorsByCorners = {
		left_top: c_shapeColor_Red,
		left_bottom: c_shapeColor_Green,
		right_top: c_shapeColor_Blue,
		right_bottom: c_shapeColor_Yellow
	};

	var zShapes = [];
	function topZOrder(){return zShapes.length;}
	function addToZOrderedShapes(newZShape){
		zShapes.push(newZShape);
		newZShape.zOrder = topZOrder();
		newZShape.css('z-index', newZShape.zOrder);
	}
	function removeFromZOrderedShapes(zShape){
		var pos = zShapes.map(function(obj) { return obj.zOrder; }).indexOf(zShape.zOrder);
		zShapes.splice(pos, 1);
		for (var i = pos, len = zShapes.length; i < len; ++i){
			var z_Shape = zShapes[i];
			z_Shape.zOrder = i+1;
			z_Shape.css('z-index', i+1);
		}
	}
	function setLastZOrderToShape(zshape){
		var pos = zShapes.map(function(obj) { return obj.zOrder; }).indexOf(zshape.zOrder);
		var topZShape = zShapes[pos];
		zShapes.splice(pos, 1);
		for (var i = pos, len = zShapes.length; i < len; ++i){
			var zShape = zShapes[i];
			zShape.zOrder = i+1;
			zShape.css('z-index', i+1);
		}
		addToZOrderedShapes(topZShape);
	}

	var clickedObject = 0;
	function setClickedObject(obj){
		clickedObject = obj;
		clickedObject.attr('isclicked',true);
	}
	function resetClickedObject(){
		if (clickedObject.attr !== undefined){
			clickedObject.attr('isclicked',false);
		}
		clickedObject = 0;
	}
	function isClickedObject(obj){return clickedObject === obj;}
	
	var body = $(document.body);
	body.scrollLeft(3500);
	body.scrollTop(2500);
	body.mousedown(function(e){if(e.button==1)return false});

	var docWindow = $(window); 

	function showPicEditorForObject(obj){
		var alreadyHasImage = ((obj.imgObj) && (obj.imgObj.attr("src").length > 0));
		if (!alreadyHasImage) addImgObjToShape(obj);
		var windowSize = {w: docWindow.width() , h: docWindow.height()};

		var objSize = {w: obj.width(), h: obj.height()};
		if (alreadyHasImage){
			var img_element = obj.imgObj;
			var t = new Image();
			t.src = (img_element.attr ? img_element.attr("src") : false) || img_element.src;
			objSize = {w: t.width, h: t.height};
		}
		
		var heightMore = (objSize.w / windowSize.w) < (objSize.h / windowSize.h);
		var editorSize = {w: 0, h: 0};
		if (heightMore){
			editorSize.h = windowSize.h*c_imageEditorRelativeSize;
			editorSize.w = editorSize.h*objSize.w/objSize.h;
		}else{
			editorSize.w = windowSize.w*c_imageEditorRelativeSize;
			editorSize.h = editorSize.w/(objSize.w/objSize.h);
		}
		var editorPos = {x: (windowSize.w - editorSize.w) / 2 + body.scrollLeft(), y: (windowSize.h - editorSize.h) / 2 + body.scrollTop()};
		var imageEditor = $('<div id="canvasHolder" style="position:absolute; z-index:'+topZOrder()
			+';"><canvas id="imageEditor" width="'+editorSize.w
			+'" height="'+editorSize.h+'" style="cursor: crosshair; max-width: 100%; max-height: 100%;"></canvas></div>');
		body.append(imageEditor);
		var canvas = document.getElementById('imageEditor');
		var canvasObj = $(canvas);
		var ctx = canvas.getContext('2d');
		ctx.lineWidth = 5;
		var styleLeftBtn = 'rgba(0, 0, 0, 1.0)';
		//var styleRightBtn = 'rgba(200, 0, 0, 1.0)';
		ctx.strokeStyle = styleLeftBtn;
		ctx.fillStyle = styleLeftBtn;
		var is_chrome = window.chrome;
		var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
		function vectorLength(ax,ay,bx,by){
			return Math.sqrt((ax-bx)*(ax-bx)+(ay-by)*(ay-by));
		}
		imageEditor.mouseMoveHandler = function (e){
			if (!canvas.clickedObject)return;
			if (canvas.clickedObject === canvas.clearShape){
				canvas.clearShape.mouseMoveHandler(e);
				return;
			}
			else if (!canvas.clickedObject || (e.button !== 0 && e.button !== 2 && e.button !== 1) || canvas.pendingButton !== e.button){
				canvas.startPos = 0;
				canvas.endPos = 0;
				canvas.clickedObject = false;
				canvas.pendingButton = false;
				if (canvas.clearShape && canvas.clearShape.selectMode !== true){
					canvas.clearShape.remove();
					canvas.clearShape = false;
				}
				return;
			}
			e.stopPropagation();
			if (canvas.pendingButton === 0){
				var length = vectorLength(canvas.endPos.x,canvas.endPos.y,e.pageX - canvas.pos.x,e.pageY - canvas.pos.y);//505 340
				if (length < 5) return;
				ctx.beginPath();
				ctx.moveTo(canvas.endPos.x,canvas.endPos.y);
				canvas.endPos = {x: e.pageX - canvas.pos.x, y: e.pageY - canvas.pos.y};
				ctx.lineTo(canvas.endPos.x,canvas.endPos.y);
				ctx.stroke();
			}else{
				//draw rectangle for clear area upon it
				canvas.endPos = {x: e.pageX - canvas.pos.x, y: e.pageY - canvas.pos.y};
				if (!canvas.clearShape){
					//create clear rect
					canvas.clearShape = $('<div id="clearShape" style="cursor: crosshair; position: absolute; z-index: '+(topZOrder()+1)+';"></div>');
					imageEditor.append(canvas.clearShape);
				}

				canvas.clearShape.css({
					'top': Math.round(Math.min(canvas.endPos.y, canvas.startPos.y))+'px', 
					'left': Math.round(Math.min(canvas.endPos.x, canvas.startPos.x))+'px',
					'width': Math.abs(canvas.endPos.x - canvas.startPos.x)+'px', 
					'height':Math.abs(canvas.endPos.y - canvas.startPos.y)+'px'});
			}
			imageEditor.doNotEdited = false;
		};

		imageEditor.mouseDownHandler = function (e){
			if ((e.button !== 0 && e.button !== 1 && e.button !== 2) || canvas.pendingButton){
				canvas.clickedObject = false;
				canvas.pendingButton = false;
			}else{
				e.stopPropagation();
				canvas.pos = {x:canvasObj.offset().left,y:canvasObj.offset().top};
				canvas.startPos = {x: e.pageX - canvas.pos.x, y: e.pageY - canvas.pos.y};
				canvas.endPos = canvas.startPos;
				canvas.clickedObject = imageEditor;
				canvas.pendingButton = e.button;
			}
			if (canvas.clearShape){
			  //copy clearShape image to current place
			  if (canvas.clearShape.wasMoving)
			  	ctx.drawImage(canvas.clearShape.image[0], canvas.clearShape.position().left, canvas.clearShape.position().top);
			  canvas.clearShape.remove();
			  canvas.clearShape = false;
			}
			return false;
		};
		imageEditor.internalMouseUpHandler = function(e){
			if (canvas.pendingButton === 0){
				e.stopPropagation();
				if (canvas.startPos == canvas.endPos){
					ctx.beginPath();
					ctx.arc(canvas.startPos.x, canvas.startPos.y, 1, 0, 2 * Math.PI, false);
					ctx.fill();
					ctx.stroke();
					imageEditor.doNotEdited = false;
				}
			}else{
				if (!canvas.clearShape) return;
				var _w = canvas.clearShape.width();
				var _h = canvas.clearShape.height();
				var _x = canvas.clearShape.position().left;
				var _y = canvas.clearShape.position().top;
				if (canvas.pendingButton == 1){
					imageEditor.doNotEdited = false;

					ctx.clearRect(_x, _y, _w, _h);

					canvas.clearShape.remove();
					canvas.clearShape = false;
				}else{
					var imgData=ctx.getImageData(_x, _y, _w, _h);
					
					canvas.clearShape.image = $('<img id="copiedImage" src="" style="width:100%; height:100%;"/>');
					canvas.clearShape.append(canvas.clearShape.image);
					
					canvas.clearShape.image.bind({mousemove: function(e){e.preventDefault();}});
					
					canvas.clearShape.wasMoving = false;

					var oCanvas = document.createElement("canvas");
					oCanvas.width = imgData.width;
					oCanvas.height = imgData.height;
					
					var oCtx = oCanvas.getContext("2d");
					oCtx.putImageData(imgData, 0, 0);
					
					canvas.clearShape.image.attr('src',oCanvas.toDataURL('image/png'));
					canvas.clearShape.selectMode = true;
					
					canvas.clearShape.mouseMoveHandler = function(e){
						log("clearShape mousemove");
						if (!canvas.clickedObject || (e.button !== canvas.clearShape.pendingButton)){
							canvas.clearShape.pendingButton = false;
							canvas.clickedObject = false;
						}else{
							e.stopPropagation();
							if (e.ctrlKey !== true && !canvas.clearShape.wasMoving)
								ctx.clearRect(
									canvas.clearShape.position().left, canvas.clearShape.position().top,
									canvas.clearShape.width(), canvas.clearShape.height());
							canvas.clearShape.wasMoving = true;
							canvas.clearShape.endPos = {x: e.screenX, y: e.screenY};
							var newPos = {
								x:canvas.clearShape.pos.x + canvas.clearShape.endPos.x - canvas.clearShape.startPos.x,
								y:canvas.clearShape.pos.y + canvas.clearShape.endPos.y - canvas.clearShape.startPos.y
							};
							canvas.clearShape.css({'top': newPos.y+'px', 'left': newPos.x+'px'}); 
						}
					};
					canvas.clearShape.mouseUpHandler = function(e){
						log("clearShape mouseup");
						canvas.clickedObject = false;
						canvas.clearShape.pendingButton = false;
					};
					canvas.clearShape.mouseDownHandler = function(e){
						log("clearShape mousedown");
						if ((e.button !== 0 && e.button !== 1) || canvas.clearShape.pendingButton){
							canvas.clickedObject = false;
							canvas.clearShape.pendingButton = false;
						}else{
							e.stopPropagation();
							canvas.clearShape.pos = {x: canvas.clearShape.position().left, y: canvas.clearShape.position().top};
							canvas.clearShape.startPos = {x: e.screenX, y: e.screenY};
							canvas.clearShape.endPos = canvas.clearShape.startPos;
							canvas.clearShape.pendingButton = e.button;
							canvas.clickedObject = canvas.clearShape;
						}
					};
					canvas.clearShape.bind({
						mousedown: canvas.clearShape.mouseDownHandler
					});
				}
			}
		}
		imageEditor.mouseUpHandler = function (e){
			if (!canvas.clickedObject){
				clickedObject.pendingButton = false;
				return;
			}
			
			if (canvas.clickedObject === canvas.clearShape){
				canvas.clearShape.mouseUpHandler(e);
				return;
			} else if (canvas.clickedObject){
				canvas.clickedObject = false;
				imageEditor.internalMouseUpHandler(e);
				canvas.pendingButton = false;
			}
		};
		imageEditor.bind({
			mousedown: imageEditor.mouseDownHandler,
			mousemove: imageEditor.mouseMoveHandler,
			mouseup: imageEditor.mouseUpHandler
		});
		if (obj.imgObj.hasPicture()){
			var imgObjOfset = obj.imgObj.offset();
			var imgObjSize = {w:obj.imgObj.width(),h:obj.imgObj.height()};
			imageEditor.css({'top': imgObjOfset.top+'px', 'left': imgObjOfset.left+'px', 'width': imgObjSize.w+'px', 'height': imgObjSize.h+'px'});
			if (objSize.w > editorSize.w || objSize.h > editorSize.h){
				obj.imgObj.drawToCanvasScaled(ctx, editorSize);
			}else{
				obj.imgObj.drawToCanvas(ctx);
			}
		}else{
			imageEditor.css({'top': obj.offset().top+'px', 'left': obj.offset().left+'px', 'width': obj.width()+'px', 'height': obj.height()+'px'});
		}
		imageEditor.animate({top: editorPos.y, left: editorPos.x, width: editorSize.w, height: editorSize.h}, 200);

		imageEditor.doNotEdited = true;
		imageEditor.saveToObject = function(){
			function removeEditor(){
				if (imageEditor.doNotEdited){
				}else{
					var dataURL = canvas.toDataURL('image/png');
					obj.imgObj.attr('src',dataURL);
				}
				imageEditor.remove();
				area.currentActiveEditor = 0;
				area.editShapeState = false;
			}
			if (obj.imgObj.hasPicture()){
				imageEditor.animate({top: obj.imgObj.offset().top, left: obj.imgObj.offset().left, width: obj.imgObj.width(), height: obj.imgObj.height()}, 200, removeEditor);
			}	else {
				imageEditor.animate({top: obj.offset().top, left: obj.offset().left, width: obj.width(), height: obj.height()}, 200, removeEditor);
			}
		};
		area.currentActiveEditor = imageEditor;
		area.editShapeState = true;
	}
	function showTextEditorForObject(obj){
		var objText = '';
		if (obj.textObj && obj.textObj.text().length > 0){
			objText = obj.textObj.html();
			objText = objText.replace(/<br>/g,"\n");
		}
		obj.hideCornerShapes();
		var textEditor = $('<textarea id="textEditor" value="'+objText+'" style="z-index: '+topZOrder()+';"></textarea>');
		textEditor.type = c_editorType;
		$(document.body).append(textEditor);
		textEditor.css({'top':(obj.offset().top - 3)+'px', 'left':(obj.offset().left - 3)+'px', 'width':obj.width()+'px', 'height': obj.height()+'px'});
		textEditor.saveToObject = function(){
			var editorStr = textEditor.val();
			editorStr = editorStr.replace(/\n/g,"<br>");
			function linkify(inputText) {
				var replacedText, replacePattern1, replacePattern2, replacePattern3;
				//URLs starting with http://, https://, or ftp://
				replacePattern1 = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
				replacedText = inputText.replace(replacePattern1, '<a id="link" href="$1" target="_blank">Link</a>');
				//URLs starting with "www." (without // before it, or it'd re-link the ones done above).
				replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
				replacedText = replacedText.replace(replacePattern2, '$1<a id="link" href="http://$2" target="_blank">Link</a>');
				return replacedText;
			}
			obj.textObj.html(editorStr);
			textEditor.remove();
			area.currentActiveEditor = 0;
			area.editShapeState = false;
		};
		textEditor.focus();
		area.currentActiveEditor = textEditor;
		textEditor.val(objText);
		area.editShapeState = true;
	}
	function checkEditorIsOpened(){ if(area.editShapeState) area.currentActiveEditor.saveToObject();}
	var area = $('#drag_area');
	area.isPressed = false;
	area.type = c_areaType;
	area.processedShape = 0;
	area.resetState = function(){
		if (isClickedObject(area)) resetClickedObject(); 
		area.isPressed = false;
		area.startPos = {top:0, left:0};
		area.lastPos = {top:0, left:0};
		area.processedShape = 0;
		log(area.attr('id') +" reset state");
	};
	area.setClickedState = function(e){
		if (!isClickedObject(0)) return;
		setClickedObject(area);
		area.isPressed = true;
		area.startPos = {top:e.pageY, left:e.pageX};
		area.lastPos = {top:e.pageY, left:e.pageX};
	};
	function addTextObjToShape(newShape){
		var textHolder = $('<div id="textHolder"></div>');
		var textObj = $('<p id="text"></p>');

		textHolder.append(textObj);
		newShape.append(textHolder);

		newShape.textObj = textObj;
	}
	function setSelfDrawingToImageObj(imgObj){
		imgObj.drawToCanvas = function(canvasContext){
			canvasContext.drawImage(this[0],0,0);
		}
		imgObj.drawToCanvasScaled = function(canvasContext, size)
		{
			canvasContext.drawImage(this[0],0,0,this[0].naturalWidth,this[0].naturalHeight,0,0,size.w,size.h);
		}
		imgObj.hasPicture = function(){
			return imgObj.attr('src').length > 0;
		}
	}
	function addImgObjToShape(newShape){
		if (newShape.imgObj){
			return;
		}
		var imageHolder = $('<div id="imageHolder"></div>');
		var imgObj = $('<img id="image" src=""/>');

		imageHolder.append(imgObj);
		newShape.append(imageHolder);

		newShape.imgObj = imgObj;
		setSelfDrawingToImageObj(newShape.imgObj);
	};
	area.setBehaviourToShape = function(newShape){
		addToZOrderedShapes(newShape);

		setClickedFunctionsToObject(newShape);
		if (newShape.attr('index') == undefined)
			newShape.attr('index', c_newCreatedShapesCount++);
		var imgs = newShape.find('img#image');
		if (imgs.length > 0){
			newShape.imgObj = $(imgs[0]);
			setSelfDrawingToImageObj(newShape.imgObj);
		}else addImgObjToShape(newShape);
		var texts = newShape.find('p#text');
		if (texts.length > 0)
			newShape.textObj = $(texts[0]);
		else
			addTextObjToShape(newShape);
		newShape.isHover = function(){
			return newShape.is(":hover");
		};
		function addCornerShapes(obj){
			if (obj.hasCornerShapes != true){
				obj.hasCornerShapes = true;
				function updateCornerShape(shapeId){
					var corner_shape = obj.children( "div#"+shapeId+".corner_shape");
					if (corner_shape && corner_shape.length)
						obj[shapeId] = $(corner_shape[0]);
					else
						obj[shapeId] = $('<div id="'+shapeId+'" class="corner_shape"></div>');
					obj[shapeId].type = c_cornerShapeType;
					obj[shapeId].owner = obj;
					obj[shapeId].color = c_colorsByCorners[shapeId];
					obj[shapeId].animatedShow = function(){
						if (obj.animationIsBlocked)
							obj[shapeId].simpleShow();
						else
							obj[shapeId].animate({opacity: 1, width: c_cornerShapeHalfSize*2, height: c_cornerShapeHalfSize*2, left: obj[shapeId].animationEndCorner.x, top: obj[shapeId].animationEndCorner.y},c_cornerShapeAnimationDuration);
					};
					obj[shapeId].animatedHide = function(){
						if (obj.animationIsBlocked)
							obj[shapeId].simpleHide();
						else
							obj[shapeId].animate({opacity: 0, width: 0, height: 0, left: obj[shapeId].animationStartCorner.x, top: obj[shapeId].animationStartCorner.y},c_cornerShapeAnimationDuration);
					};
					obj[shapeId].simpleShow = function(){
						obj[shapeId].css({opacity: 1, width: (c_cornerShapeHalfSize*2)+'px', height: c_cornerShapeHalfSize*2+'px', left: obj[shapeId].animationEndCorner.x+'px', top: obj[shapeId].animationEndCorner.y+'px'});
					};
					obj[shapeId].simpleHide = function(){
						obj[shapeId].css({opacity: 0, width: 0+'px', height: 0+'px', left: obj[shapeId].animationStartCorner.x+'px', top: obj[shapeId].animationStartCorner.y+'px'});
					};
				};
				updateCornerShape('left_top');
				updateCornerShape('left_bottom');
				updateCornerShape('right_top');
				updateCornerShape('right_bottom');
				obj.moveCornerHapesToCorners = function(){
					function updateCornerShapePos(corner_shape){
						corner_shape.css({'top': corner_shape.leftTop.y +'px', 'left': corner_shape.leftTop.x +'px'});
					};
					obj.left_top.rightBottom = {x: 0 + c_cornerShapeHalfSize, y: 0 + c_cornerShapeHalfSize};
					obj.left_top.leftTop = {x: 0 - c_cornerShapeHalfSize, y: 0 - c_cornerShapeHalfSize};
					obj.left_top.animationStartCorner = obj.left_top.rightBottom;
					obj.left_top.animationEndCorner = obj.left_top.leftTop;
					updateCornerShapePos(obj.left_top);

					obj.left_bottom.rightBottom = {x: 0 + c_cornerShapeHalfSize, y: obj.height() + c_cornerShapeHalfSize};
					obj.left_bottom.leftTop = {x: 0 - c_cornerShapeHalfSize, y: obj.height() - c_cornerShapeHalfSize};
					obj.left_bottom.animationStartCorner = {x: obj.left_bottom.rightBottom.x, y: obj.left_bottom.leftTop.y};
					obj.left_bottom.animationEndCorner = obj.left_bottom.leftTop;
					updateCornerShapePos(obj.left_bottom);
					
					obj.right_top.rightBottom = {x: obj.width() + c_cornerShapeHalfSize, y: 0 + c_cornerShapeHalfSize};
					obj.right_top.leftTop = {x: obj.width() - c_cornerShapeHalfSize, y: 0 - c_cornerShapeHalfSize};
					obj.right_top.animationStartCorner = {x: obj.right_top.leftTop.x, y: obj.right_top.rightBottom.y};
					obj.right_top.animationEndCorner = obj.right_top.leftTop;
					updateCornerShapePos(obj.right_top);

					obj.right_bottom.rightBottom = {x: obj.width() + c_cornerShapeHalfSize, y: obj.height() + c_cornerShapeHalfSize};
					obj.right_bottom.leftTop = {x: obj.width() - c_cornerShapeHalfSize, y: obj.height() - c_cornerShapeHalfSize};
					obj.right_bottom.animationStartCorner = obj.right_bottom.leftTop;
					obj.right_bottom.animationEndCorner = obj.right_bottom.leftTop;
					updateCornerShapePos(obj.right_bottom);
				};
				obj.moveCornerHapesToCorners();

				obj.append(obj.left_top);
				obj.append(obj.left_bottom);
				obj.append(obj.right_top);
				obj.append(obj.right_bottom);
				obj.resetMustBeShowedStates = function (){
					obj.left_top.mustBeShowed = false;
					obj.left_bottom.mustBeShowed = false;
					obj.right_top.mustBeShowed = false;
					obj.right_bottom.mustBeShowed = false;
				};
				obj.updateCornerShapesVisibility = function (){
					function showHideCornerShape(shape){
						if (shape.mustBeShowed)
							shape.animatedShow();
						else
							shape.animatedHide();
					}
					showHideCornerShape(obj.left_top);
					showHideCornerShape(obj.left_bottom);
					showHideCornerShape(obj.right_top);
					showHideCornerShape(obj.right_bottom);
				};
				obj.setMustBeShowedByCorner = function (isLeft, isTop){
					obj.resetMustBeShowedStates();
					if (isLeft && isTop)
						obj.left_top.mustBeShowed = true;
					else if (isLeft && !isTop)
						obj.left_bottom.mustBeShowed = true;
					else if (!isLeft && isTop)
						obj.right_top.mustBeShowed = true;
					else if (!isLeft && !isTop)
						obj.right_bottom.mustBeShowed = true;
					obj.updateCornerShapesVisibility();
				};
			}
			obj.showCornerShapes = function(){
				obj.left_top.animatedShow();
				obj.left_bottom.animatedShow();
				obj.right_top.animatedShow();
				obj.right_bottom.animatedShow();
			};
			obj.hideCornerShapes = function(){
				obj.left_top.animatedHide();
				obj.left_bottom.animatedHide();
				obj.right_top.animatedHide();
				obj.right_bottom.animatedHide();
			};
			obj.hideCornerShapes();
			{//set onOnlyClick handlers
				function setClickBehaviourToCornerShape(cornerShape){
					cornerShape.onOnlyClick = function(){
						if (obj.attr("color") == cornerShape.color)
							obj.attr("color", c_shapeColor_Default);
						else
							obj.attr("color", cornerShape.color);
					};
				};
				setClickBehaviourToCornerShape(obj.left_top);
				setClickBehaviourToCornerShape(obj.left_bottom);
				setClickBehaviourToCornerShape(obj.right_top);
				setClickBehaviourToCornerShape(obj.right_bottom);
			}
			{//set special moving handlers
				obj.left_top.internalMoveHandler = function(currentPos){
					var currCornerShape = obj.left_top;
					var dw = currentPos.x - currCornerShape.startPos.x;
					var newW = currCornerShape.ownerStartRect.w - dw;
					var newX;
					var isLeft = true;
					if (newW <= 0){
						newX = currCornerShape.ownerStartRect.w + currCornerShape.ownerStartRect.x;
						newW = Math.abs(newW);
						isLeft = false;
					}else if (newW > 0){
						newX = currCornerShape.ownerStartRect.x + dw;
						newW = currCornerShape.ownerStartRect.w - dw;
					}
					var dh = currentPos.y - currCornerShape.startPos.y;
					var newH = currCornerShape.ownerStartRect.h - dh;
					var newY;
					var isTop = true;
					if (newH <= 0){
						newY = currCornerShape.ownerStartRect.h + currCornerShape.ownerStartRect.y;
						newH = Math.abs(newH);
						isTop = false;
					}else if (newH > 0){
						newY = currCornerShape.ownerStartRect.y + dh;
						newH = currCornerShape.ownerStartRect.h - dh;
					}
					obj.setMustBeShowedByCorner(isLeft, isTop);
					obj.css({'top': newY+'px', 'left': newX+'px', 'width': newW+'px', 'height': newH+'px'}); //*/
					obj.moveCornerHapesToCorners();
				};
				obj.left_top.hasInternalMoveHandler = true;
				obj.left_bottom.internalMoveHandler = function(currentPos){
					var currCornerShape = obj.left_bottom;
					var dw = currentPos.x - currCornerShape.startPos.x;
					var newW = currCornerShape.ownerStartRect.w - dw;
					var newX;
					var isLeft = true;
					if (newW <= 0){
						newX = currCornerShape.ownerStartRect.w + currCornerShape.ownerStartRect.x;
						newW = Math.abs(newW);
						isLeft = false;
					}else if (newW > 0){
						newX = currCornerShape.ownerStartRect.x + dw;
						newW = currCornerShape.ownerStartRect.w - dw;
					}
					var dh = currentPos.y - currCornerShape.startPos.y;
					var newH = currCornerShape.ownerStartRect.h + dh;
					var newY;
					var isTop = true;
					if (newH > 0){
						newY = currCornerShape.ownerStartRect.y;
						isTop = false;
					}else if (newH <= 0){
						newY = currCornerShape.ownerStartRect.y + newH;
						newH = Math.abs(newH);
					}
					obj.setMustBeShowedByCorner(isLeft, isTop);
					obj.css({'top': newY+'px', 'left': newX+'px', 'width': newW+'px', 'height': newH+'px'}); //*/
					obj.moveCornerHapesToCorners();
				};
				obj.left_bottom.hasInternalMoveHandler = true;
				obj.right_top.internalMoveHandler = function(currentPos){
					var currCornerShape = obj.right_top;
					var dw = currentPos.x - currCornerShape.startPos.x;
					var newW = currCornerShape.ownerStartRect.w + dw;
					var newX;
					var isLeft = true;
					if (newW > 0){
						newX = currCornerShape.ownerStartRect.x;
						isLeft = false;
					}else if (newW <= 0){
						newX = currCornerShape.ownerStartRect.x + newW;
						newW = Math.abs(newW);
					}
					var dh = currentPos.y - currCornerShape.startPos.y;
					var newH = currCornerShape.ownerStartRect.h - dh;
					var newY;
					var isTop = true;
					if (newH <= 0){
						newY = currCornerShape.ownerStartRect.h + currCornerShape.ownerStartRect.y;
						newH = Math.abs(newH);
						isTop = false;
					}else if (newH > 0){
						newY = currCornerShape.ownerStartRect.y + dh;
						newH = currCornerShape.ownerStartRect.h - dh;
					}
					obj.setMustBeShowedByCorner(isLeft, isTop);
					obj.css({'top': newY+'px', 'left': newX+'px', 'width': newW+'px', 'height': newH+'px'}); //*/
					obj.moveCornerHapesToCorners();
				};
				obj.right_top.hasInternalMoveHandler = true;
				obj.right_bottom.internalMoveHandler = function(currentPos){
					var currCornerShape = obj.right_bottom;
					var dw = currentPos.x - currCornerShape.startPos.x;
					var newW = currCornerShape.ownerStartRect.w + dw;
					var newX;
					var isLeft = true;
					if (newW > 0){
						newX = currCornerShape.ownerStartRect.x;
						isLeft = false;
					}else if (newW <= 0){
						newX = currCornerShape.ownerStartRect.x + newW;
						newW = Math.abs(newW);
					}
					var dh = currentPos.y - currCornerShape.startPos.y;
					var newH = currCornerShape.ownerStartRect.h + dh;
					var newY;
					var isTop = true;
					if (newH > 0){
						newY = currCornerShape.ownerStartRect.y;
						isTop = false;
					}else if (newH <= 0){
						newY = currCornerShape.ownerStartRect.y + newH;
						newH = Math.abs(newH);
					}
					obj.setMustBeShowedByCorner(isLeft, isTop);
					obj.css({'top': newY+'px', 'left': newX+'px', 'width': newW+'px', 'height': newH+'px'}); //*/
					obj.moveCornerHapesToCorners();
				};
				obj.right_bottom.hasInternalMoveHandler = true;
			}
			obj.setHandlersToCornerShape = function(cornerShape){
				setDraggedPropertiesToShape(cornerShape);
				cornerShape.mouseUpHandler = function(e){
					if (e.button == 0 && cornerShape.isClickedState()){
						e.preventDefault();
						if (cornerShape.startPos == cornerShape.lastPos){
							log(cornerShape.attr('id') + ' only click');
							if (cornerShape.onOnlyClick)
								cornerShape.onOnlyClick();
						}else{
							obj.showCornerShapes();
						}
						cornerShape.resetState();
						log(cornerShape.attr('id') +' mouseUp OK');
						obj.animationIsBlocked = false;
					}
				};
				cornerShape.mouseDownHandler = function(e){
					checkEditorIsOpened();
					if (e.button == 0 && isClickedObject(0)){
						e.preventDefault();
						setClickedObject(cornerShape);
						cornerShape.isPressed = true
						cornerShape.startPos = {x: e.pageX, y: e.pageY};
						cornerShape.ownerStartRect = {
							x: cornerShape.owner.offset().left, 
							y: cornerShape.owner.offset().top, 
							w: cornerShape.owner.width(),
							h: cornerShape.owner.height()
						};
						cornerShape.lastPos = cornerShape.startPos;
						log(cornerShape.attr('id') +" mouseDown OK");
						obj.animationIsBlocked = true;
					}
				};
				cornerShape.mouseMoveHandler = function(e){
					if (cornerShape.isClickedState()){//do create something
						if (e.which != 1){
							cornerShape.resetState();
							return;
						}
						var currentPos = {x: e.pageX, y: e.pageY};
						if (vectorLengthPoints(currentPos, cornerShape.startPos) < c_movingLimit && cornerShape.clickTrace < c_movingLimit)
							return;
						cornerShape.clickTrace += vectorLengthPoints(currentPos, cornerShape.lastPos);
						e.preventDefault();
						log(cornerShape.attr('id') +" mouseMove OK");
						if (cornerShape.hasInternalMoveHandler == true) cornerShape.internalMoveHandler(currentPos);
						cornerShape.lastPos = currentPos;
					}
				};
				cornerShape.bind({
					mouseenter: function(e){},
					mouseleave: function(e){},
					mousemove: function(e){},
					mousedown: cornerShape.mouseDownHandler,
					mouseup: cornerShape.mouseUpHandler
				});
			};
			obj.setHandlersToCornerShape(obj.left_top);
			obj.setHandlersToCornerShape(obj.left_bottom);
			obj.setHandlersToCornerShape(obj.right_top);
			obj.setHandlersToCornerShape(obj.right_bottom);
		}
		
		addCornerShapes(newShape);

		function setDraggedPropertiesToShape(draggedShape){
			setClickedFunctionsToObject(draggedShape);
			if (draggedShape.hasDraggedProperties) return;
			draggedShape.hasDraggedProperties = true;
			draggedShape.isPressed = false;
			draggedShape.startPos = 0;
			draggedShape.lastPos = 0;
			draggedShape.clickTrace = 0;
			draggedShape.resetState = function(){
				resetClickedObject();
				draggedShape.isPressed = false;
				draggedShape.startPos = 0;
				draggedShape.lastPos = 0;
				draggedShape.clickTrace = 0;
				log(draggedShape.attr('id') +" reset state");
			};
		};
		newShape.type = c_shapeType;
		setDraggedPropertiesToShape(newShape);
		newShape.mouseUpHandler = function(e){
			newShape.copyMode = false;
			if (e.button != newShape.pendingButton) return;
			if (!newShape.isClickedState()) return;
			if (e.button == 0 || e.button == 2){
				if (newShape.isHover()) newShape.showCornerShapes();
				e.preventDefault();
				if (newShape.startPos == newShape.lastPos){
					log(newShape.attr('id') + ' only click');
					//change Z order
					setLastZOrderToShape(newShape);
					if (e.button == 0)
						showTextEditorForObject(newShape);
					else if (e.button == 2)
						showPicEditorForObject(newShape);
				}
				newShape.resetState();
				log(newShape.attr('id') +' mouseUp OK');
				newShape.animationIsBlocked = false;
				return;
			}
			newShape.animationIsBlocked = false;
			if (newShape.clickTrace > c_movingLimit) return;
			if (e.button == 1){
				e.preventDefault();
				newShape.resetState();
				log(newShape.attr('id') +' remove OK');
				removeFromZOrderedShapes(newShape);
				newShape.remove();
			}else if (e.button == 2){
				e.preventDefault();
				newShape.resetState();
				log(newShape.attr('id') +' right click OK');
			}
		};

		newShape.mouseDownHandler = function(e){
			checkEditorIsOpened();
			if (isClickedObject(0)){
				e.preventDefault();
				setClickedObject(newShape);
				newShape.isPressed = true;
				newShape.pendingButton = e.button;
				newShape.copyMode = e.ctrlKey == true;///////////////////////////
				newShape.startPos = {x: e.pageX, y: e.pageY};
				newShape.lastPos = newShape.startPos;
				log(newShape.attr('id') +" mouseDown OK button = " + newShape.pendingButton);
				newShape.animationIsBlocked = true;
			}
		};
		newShape.mouseMoveHandler = function(e){
			if (newShape.isClickedState()){
				if (e.which != newShape.pendingButton + 1){
					newShape.resetState();
					return;
				}
				var currentPos = {x: e.pageX, y: e.pageY};
				if (vectorLengthPoints(currentPos, newShape.startPos) < c_movingLimit 
					&& newShape.clickTrace < c_movingLimit) return;
					newShape.clickTrace += vectorLengthPoints(currentPos, newShape.lastPos);
				if (e.which != 1) return;
				if (newShape.copyMode && e.ctrlKey == true){
					newShape.copyMode = false;
					var clonedShape = newShape.clone(false);
					area.append(clonedShape);
					area.setBehaviourToShape(clonedShape);
					setLastZOrderToShape(newShape);
				}
				e.preventDefault();
				log(newShape.attr('index') +" mouseMove OK");
				var shapePos = newShape.offset();
				var x = currentPos.x - newShape.lastPos.x + shapePos.left;
				var y = currentPos.y - newShape.lastPos.y + shapePos.top;
				newShape.css({'top': y+'px', 'left': x+'px'}); 
				newShape.lastPos = currentPos;
				newShape.hideCornerShapes();
			}
		};
		log(newShape);
		newShape.bind({
			mouseenter: function(e){
				if (isClickedObject(0)){
					newShape.showCornerShapes();
				}
			},
			mouseleave: function(e){
				newShape.hideCornerShapes();
			},
			mousemove: function(e){},
			mousedown: newShape.mouseDownHandler,
			mouseup: newShape.mouseUpHandler
		});
	}

	function setClickedFunctionsToObject(obj){
		if (obj.hasClickedFunctions == true) return;
		obj.hasClickedFunctions = true;

		obj.isClickedState = function(){
			return isClickedObject(obj) && obj.isPressed;
		};
	};

	setClickedFunctionsToObject(area);

	function findAndSetBehaviourToShapes(){
		var shapes = $("div#drag_area>div#draggable.moveAble");
		shapes.each( function(i) { 
			area.setBehaviourToShape($(shapes[i])); 
		});
	};

	findAndSetBehaviourToShapes();

	function vectorLength(ax, ay, bx, by){
		return Math.pow((ax-bx)*(ax-bx)+(ay-by)*(ay-by), 0.5);
	};

	function vectorLengthPoints(p1, p2){
		return vectorLength(p1.x, p1.y, p2.x, p2.y);
	};

	area.clickTrace = function (){
		var trace = {
			'top':(area.startPos.top - area.lastPos.top), 
			'left':(area.startPos.left - area.lastPos.left)
		};
		return trace;
	};

	area.traceValue = function (){
		var clickTr = area.clickTrace();
		var trace = Math.pow((clickTr.top*clickTr.top) + (clickTr.left*clickTr.left), 0.5);
		return trace;
	};

	area.startPos = {top:0, left:0};
	area.lastPos = {top:0, left:0};

	area.bind({
		mouseenter: function(e){},
		mouseleave: function(e){},
		mousemove: function(e){
			if (area.isClickedState()){//do create new shape
				if (e.which != 1 && e.which != 2 && e.which != 3){
					area.resetState();
					return;
				}

				e.preventDefault();

				if (e.which == 2){
  				var currentPos = {top:e.pageY, left:e.pageX};

				  var dx = currentPos.left - area.lastPos.left;
				  var dy = currentPos.top - area.lastPos.top;
				  
  				area.lastPos = {top:e.pageY - dy, left:e.pageX - dx};

				  body.scrollLeft(body.scrollLeft() - dx);
				  body.scrollTop(body.scrollTop() - dy);
					return;
				}

				area.lastPos = {top:e.pageY, left:e.pageX};

				if (area.traceValue() < 10) return;

				if (!area.processedShape){
					log("create shape");
					area.processedShape = $('<div id="draggable" class="moveAble" style="z-index: '+topZOrder()+';"></div>');
					area.processedShape.state = c_shapeCreateState;
					area.append(area.processedShape);
					
					addTextObjToShape(area.processedShape);
				}
				
				var shapeSize = {
					h: Math.abs(area.lastPos.top - area.startPos.top), 
					w: Math.abs(area.lastPos.left - area.startPos.left)
				};

				if(e.shiftKey && area.processedShape.state != c_shapeSelectingState){
					area.processedShape.state = c_shapeSelectingState;
					area.processedShape.attr('id','selecting_draggable');
				}else if(!e.shiftKey){
					if(area.processedShape.state != c_shapeWrongState && (shapeSize.h < c_minShapeSize.h || shapeSize.w < c_minShapeSize.w)){
						log('change id to wrong');
						area.processedShape.state = c_shapeWrongState;
						area.processedShape.attr('id','wrong_draggable');
					}else if (area.processedShape.state != c_shapeCreateState && (shapeSize.h >= c_minShapeSize.h && shapeSize.w >= c_minShapeSize.w)){
						area.processedShape.state = c_shapeCreateState;
						area.processedShape.attr('id','draggable');
					}
				}

				var shapePos = {
					top: Math.min(area.lastPos.top, area.startPos.top), 
					left: Math.min(area.lastPos.left, area.startPos.left)
				};

				area.processedShape.css({
					'top': shapePos.top+'px', 
					'left': shapePos.left+'px', 
					'width':shapeSize.w+'px', 
					'height': shapeSize.h+'px'}
					);

			}else if (clickedObject != 0){
				switch (clickedObject.type){
					case c_areaType:{
						log("error area.mousemove not clicked but clickedObject.type == c_areaType");
						break;
					}
					case c_shapeType:{
						clickedObject.mouseMoveHandler(e);
						break;
					}
					case c_cornerShapeType:{
						clickedObject.mouseMoveHandler(e);
						break;
					}
				}
			}
		},
		mouseup: function(e){
			if (e.button == 0 || e.button == 1 || e.button == 2){
				if (area.isClickedState()){
					e.preventDefault();
					if (area.processedShape){
						switch (area.processedShape.state){
							case c_shapeWrongState:{
								area.processedShape.remove();
								break;
							}
							case c_shapeCreateState:{//add handlers for moving edit resize
								area.setBehaviourToShape(area.processedShape);
								if (e.button == 0)
									showTextEditorForObject(area.processedShape);
								else if (e.button == 2)
									showPicEditorForObject(area.processedShape);
								break;
							}
							case c_shapeSelectingState:{//select all shapes under this shape
								area.processedShape.remove();
								break;
							}
							case c_shapeSelectedState:{
								break;
							}
						}
					}
					area.resetState();
					log(area.attr('id') +" mouseup OK");
				}else if (clickedObject != 0){
					switch (clickedObject.type){
						case c_areaType:{
							log("error area.mouseup not clicked but clickedObject.type == c_areaType");
							break;
						}
						case c_shapeType:{
							clickedObject.mouseUpHandler(e);
							break;
						}
						case c_cornerShapeType:{
							clickedObject.mouseUpHandler(e);
							break;
						}
						case c_editorType:{
							clickedObject.saveToObject();
							break;
						}
					}
				}
			}
		},
		mousedown: function(e){
			checkEditorIsOpened();
			if ((e.button == 0 || e.button == 1 || e.button == 2) && isClickedObject(0)){
				e.preventDefault();
				area.setClickedState(e);
				//log(area.attr('id') +" mousedown OK");
				log(e);
			}
		}
	});
});
