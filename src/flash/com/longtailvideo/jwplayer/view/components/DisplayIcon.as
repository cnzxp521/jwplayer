package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.utils.Animations;
	import com.longtailvideo.jwplayer.utils.Draw;
	import com.longtailvideo.jwplayer.utils.RootReference;
	
	import flash.display.*;
	import flash.events.*;
	import flash.external.*;
	import flash.geom.*;
	import flash.text.*;
	import flash.utils.*;
	
	public class DisplayIcon extends Sprite {
		// Skin elements
		private var _icon:DisplayObject;
		private var _iconOver:DisplayObject;
		private var _background:DisplayObject;
		private var _backgroundOver:DisplayObject;
		private var _capRight:DisplayObject;
		private var _capRightOver:DisplayObject;
		private var _capLeft:DisplayObject;
		private var _capLeftOver:DisplayObject;

		private var _iconFade:Animations;
		private var _iconOverFade:Animations;
		private var _bgFade:Animations;
		private var _bgOverFade:Animations;
		private var _capLeftFade:Animations;
		private var _capLeftOverFade:Animations;
		private var _capRightFade:Animations;
		private var _capRightOverFade:Animations;
	
		private var _text:String;
		private var _textFormat:TextFormat;
		private var _textFormatOver:TextFormat;
		private var _textField:TextField;
		private var _textContainer:Sprite;
		
		private var _defaultBGWidth:Number;
		
		private var _container:Sprite;
		private var _iconContainer:Sprite;
		
		private var _rotationTimer:Timer;
		private var _rotationAngle:Number = 0;
		
		private var _noText:Boolean = false;
		
		public function DisplayIcon(elements:Object, textFormat:TextFormat, overFormat:TextFormat=null) {
			_icon = elements.icon ? elements.icon : new Sprite(),
			_iconOver = elements.iconOver;
			
			_background = elements.background ? elements.background : new Sprite();
			_backgroundOver = elements.backgroundOver;
			
			_capLeft = elements.capLeft ? elements.capLeft : new Sprite();
			_capLeftOver = elements.capLeftOver;

			_capRight = elements.capRight ? elements.capRight : new Sprite();
			_capRightOver = elements.capRightOver;

			_textFormat = textFormat;
			_textFormatOver = overFormat ? overFormat : new TextFormat(textFormat.font, textFormat.size, textFormat.color, textFormat.bold);

			if (elements.icon && !(elements.capRight || elements.capLeft)) {
				_noText = true;
			}
			
			_container = new Sprite();
			_container.mouseChildren = false;
			_container.buttonMode = true;
			this.mouseEnabled = false;
			this.mouseChildren = true;

			_iconFade = new Animations(_icon);
			_iconOverFade = new Animations(_iconOver);
			_bgFade = new Animations(_background);
			_bgOverFade = new Animations(_backgroundOver);
			_capLeftFade = new Animations(_capLeft);
			_capLeftOverFade = new Animations(_capLeftOver);
			_capRightFade = new Animations(_capRight);
			_capRightOverFade = new Animations(_capRightOver);
			
			buildIcon();

			RootReference.stage.addEventListener(MouseEvent.MOUSE_MOVE, _overHandler);
			RootReference.stage.addEventListener(Event.MOUSE_LEAVE, _outHandler);
		}
		
		private function buildIcon():void {
			_iconContainer = new Sprite();
			_textContainer = new Sprite();
			
			_defaultBGWidth = _icon.width;
			
			_container.addChild(_capLeft);
			if (_capLeftOver) _container.addChild(_capLeftOver);
			
			_container.addChild(_background);
			if (_backgroundOver) _container.addChild(_backgroundOver);
			
			_container.addChild(_capRight);
			if (_capRightOver) _container.addChild(_capRightOver);
			
			_iconContainer.addChild(_icon);
			if (_iconOver) _iconContainer.addChild(_iconOver);
			
			_textField = new TextField();
			_textFormat.align = TextFormatAlign.CENTER;
			_textField.selectable = false;
			_textField.defaultTextFormat = _textFormat;
			_container.addChild(_textField);
			
			_container.addChild(_iconContainer);
			_container.cacheAsBitmap = true;
			addChild(_container);
			
			
			_rotationTimer = new Timer(100);
			_rotationTimer.addEventListener(TimerEvent.TIMER, rotationInterval);
			
			hover(false);
		}
		
		private function redraw():void {
			positionText();
			_background.x = _capLeft.width;
			_textField.x = _background.x;
			
			_icon.x = _icon.width / -2;
			_icon.y = _icon.height / -2;
			align(_icon, _iconOver);

			_iconContainer.y = _background.height / 2;
			
			if (_noText) {
				_iconContainer.x = _background.x + _background.width / 2;
			} else {
				_iconContainer.x = _textField.x + _textField.width + _icon.width / 2;
				_background.width = Math.max(_defaultBGWidth, _textField.width + _iconContainer.width);
			}
			_capRight.x = _background.x + _background.width;
			
			align(_background, _backgroundOver);
			align(_capRight, _capRightOver);
			align(_capLeft, _capLeftOver);
		}
		
		private function align(disp1:DisplayObject, disp2:DisplayObject):void {
			if (disp1 && disp2) {
				disp2.x = disp1.x;
				disp2.y = disp1.y;
				disp2.width = disp1.width;
				disp2.height = disp1.height;
			}			
		}
		
		public function set text(newText:String):void {
			_text = newText;
			if (!_text || _noText) {
				_textField.visible = false;
				_textField.width = _textField.height = 0;
				redraw();
				return;
			}
			
			_textField.visible = true;
			_textField.wordWrap = true;
			_textField.width = 300;
			_textField.text = _text.substr(0, 500).replace(":",":\n");

			var elipses:Boolean = false;
			if (_textField.numLines > 2) {
				while(_textField.numLines > 2) {
					elipses = true;
					_textField.text = _textField.text.replace(/(.*).$/, "$1");
				}
				if (elipses) {
					_textField.text = _textField.text.substr(0, _textField.text.length-3);
					_textField.text = _textField.text.substr(0, _textField.text.lastIndexOf(" ")) + "...";
				}
			}

			redraw();
		}
		
		public function get text():String {
			return _text;
		}
		
		private function positionText():void {
			if (!_textField.text) return;
			
			var maxX:Number = -1;
			var maxY:Number = -1;
			var minX:Number = Number.MAX_VALUE;
			var minY:Number = Number.MAX_VALUE;
			for (var i:Number = 0; i < _textField.text.length; i++) {
				var charDims:Rectangle = _textField.getCharBoundaries(i);
				if (charDims && charDims.width * charDims.height > 0) {
					maxX = Math.max(maxX, (charDims.x + charDims.width));
					maxY = Math.max(maxY, (charDims.y + charDims.height));
					minX = Math.min(minX, charDims.x);
					minY = Math.min(minY, charDims.y);
				}
			}
			
			if (maxX > 0 && maxY > 0) {
				_textField.width = Math.round(maxX - minX + 5);
				_textField.height = Math.round(maxY + 5);
				_textField.y = Math.round((_background.height - maxY) / 2 - minY);
			} else {
				_textField.height = _textField.textHeight;
			}
		}
		
		private function _overHandler(evt:MouseEvent):void {
			hover(true);
		}

		private function _outHandler(evt:Event):void {
			hover(false);
		}

		private function hover(state:Boolean):void {
			if (_iconOver) {
				_iconFade.cancelAnimation();
				_iconOverFade.cancelAnimation();
				_iconFade.fade(state ? 0 : 1);
				_iconOverFade.fade(state ? 1 : 0);
			}
			if (_backgroundOver) { 
				_bgFade.cancelAnimation();
				_bgOverFade.cancelAnimation();
				_bgFade.fade(state ? 0 : 1);
				_bgOverFade.fade(state ? 1 : 0);
			}
			if (_capLeftOver) { 
				_capLeftFade.cancelAnimation();
				_capLeftOverFade.cancelAnimation();
				_capLeftFade.fade(state ? 0 : 1);
				_capLeftOverFade.fade(state ? 1 : 0);
			}
			if (_capRightOver) { 
				_capRightFade.cancelAnimation();
				_capRightOverFade.cancelAnimation();
				_capRightFade.fade(state ? 0 : 1);
				_capRightOverFade.fade(state ? 1 : 0);
			}
			_textField.textColor = Number(state ? _textFormatOver.color : _textFormat.color);
		}

		public function setRotation(angle:Number, interval:Number=100):void {
			_rotationTimer.stop();
			_iconContainer.rotation = 0;
			_rotationAngle = angle;
			if (angle > 0) {
				_rotationTimer.delay = interval;
				_rotationTimer.start();
			}
			redraw();
		}
		
		private function rotationInterval(evt:TimerEvent):void {
			_iconContainer.rotation = (_iconContainer.rotation + _rotationAngle) % 360;
		}
		
	}
}