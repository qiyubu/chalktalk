/*
    Examples for June 26, 2014 talk.

    cup() shows a coffee cup and swirling cream that illustrates the onset of turbulence.

    Noises/noise1D allows copies 1D noise to be successively frequency doubled.
    Then they can all be dragged together to show the fractal sum of 1/f noise.
*/

   registerGlyph("cup()", [
      [ [ -1,-1 ], [ -1,1 ], [ 1,1 ], [1,-1 ] ],
      [ [ 1,-1], [-1,-1], [1,-1] ],
      makeOval(-1.6,-.6, 1.2, 1.2, 20, 0, PI),
      makeOval(-1.4,-.4, 0.8, 0.8, 20, 0, PI),
   ]);

   function cup() {
      var node = root.addNode();
      var body = node.addLathe( [
         [ 0.00, 0, -1.00],
         [ 0.90, 0, -1.00],
         [ 1.00, 0, -0.90],
	 [ 1.00, 0,  1.00],
	 [ 0.90, 0,  1.00],
	 [ 0.90, 0, -0.90],
	 [ 0.00, 0, -0.90],
      ], 32);

      var handle = node.addTorus(.3, 8, 24);
      handle.getMatrix().translate(-1,0,0).rotateX(PI/2).scale(.5);

      var coffee = node.addCylinder();
      coffee.getMatrix().translate(0,0,.9).scale(.95,.95,.01);

      node.setMaterial(whiteMaterial);
      coffee.setMaterial(new phongMaterial().setAmbient(.07,0,0));

      var sketch = geometrySketch(node, [0.1,0,0,-PI/2,0.9]);
      sketch.swirlMode = -1;

      sketch.coffee = coffee;

      sketch.cream = [];
      for (var i = 0 ; i < 10000 ; i++) {
         var t = i / 10000;
         sketch.cream.push( [ lerp(t, -1, 1) , 0 ] );
      }

      sketch.mouseDown = function(x, y) {
         this.mx = x;
         this.my = y;
      }
      sketch.mouseDrag = function(x, y) {
      }
      sketch.mouseUp = function(x, y) {
         if (len(x - this.mx, y - this.my) > 2 * clickSize) {
	    this.swirlMode = pieMenuIndex(x - this.mx, y - this.my, 4);
	    this.swirlStartTime = time;
         }
      }

      sketch.update = function(elapsed) {

	 if (this.swirlMode == 0) {
	    var x0 = (this.xlo + this.xhi) / 2;
	    var y0 = (this.ylo + this.yhi) / 2;
	    var r  = (this.xhi - this.xlo) / 2;

	    var dt = (time - this.swirlStartTime) * 0.6;
	    if (dt > 5)
	       dt = 5 + .1 * (dt - 5);

	    var fade = 1 - sCurve(max(0, 1 - dt / 8));

	    var amp = lerp(fade*fade, .2, .15);
	    var freq = 2 * pow(2, max(0, (dt - 4)));
	    var eps = .01;

	    for (var i = 0 ; i < this.cream.length ; i++) {
	       var cx = this.cream[i][0];
	       var cy = this.cream[i][1];

	       var n00 = noise2(freq * cx      , freq * cy       + 100);
	       var n10 = noise2(freq * cx + eps, freq * cy       + 100);
	       var n01 = noise2(freq * cx      , freq * cy + eps + 100);
	       var dx = (n01 - n00) / eps;
	       var dy = (n00 - n10) / eps;

	       cx += amp * elapsed * dx;
	       cy += amp * elapsed * dy;

	       var rr = cx * cx + cy * cy;
	       if (rr > .8) {
	          var f = lerp((1 - rr) / (1 - .8), .98, 1);
	          cx *= f;
	          cy *= f;
	       }

	       this.cream[i][0] = cx;
	       this.cream[i][1] = cy;
            }

	    this.cream = resampleStroke(this.cream, this.cream.length);

            _g.save();
	    _g.lineWidth = (this.xhi - this.xlo) * lerp(fade * fade, .0025, .005);
	    _g.strokeStyle = 'rgba(255,255,255,' + (1-fade) + ')';
            _g.beginPath();

	    for (var i = 0 ; i < this.cream.length ; i++) {
	       var x = x0 + r * this.cream[i][0] * 0.6;
	       var y = y0 + r * this.cream[i][1] * 0.6;
	       if (i == 0)
	          _g.moveTo(x, y);
	       else if (i/this.cream.length < dt)
	          _g.lineTo(x, y);
	    }

            sketch.coffee.setMaterial(new phongMaterial().setAmbient(lerp(fade*fade,.07,.16),0,0));

            _g.stroke();
            _g.restore();
         }
      }
   }

   function Noises() {
      this.labels = "noise1D".split(' ');

      this.mouseX = 0;
      this.mouseY = 0;
      this.mode = "none";
      this.freqs = [1];
      this.t0 = 0;

      this.hitOnUp = function(sketch) {
	 if (sketch instanceof Noises) {
	    this.freqs = this.freqs.concat(sketch.freqs);
	    deleteSketch(sketch);
	 }
      }

      this.mouseDown = function(x, y) {
         this.mouseX = x;
         this.mouseY = y;
	 this.isClick = true;
      }

      this.mouseDrag = function(x, y) {
         if (! this.isClick) {
	    if (this.mode == "none")
	       this.mode = abs(x - this.mouseX) > abs(y - this.mouseY) ? "x" : "y";
	    if (this.mode == "x") {
	       this.t0 -= 2 * (x - this.mouseX) / (this.xhi - this.xlo);
	       this.mouseX = x;
	       this.mouseY = y;
	    }
         }
      }

      this.mouseUp = function(x, y) {
         if (! this.isClick && this.mode == "y") {
	    var factor = y < this.mouseY ? 2 : 0.5;
	    for (var n = 0 ; n < this.freqs.length ; n++)
	       this.freqs[n] *= factor;
	 }
	 this.mode = "none";
      }

      this.render = function(elapsed) {
         m.save();
            m.scale(this.size / 350);

	    color(140,140,140);
	    mLine([-1,0],[1,0]);
	    color(this.color);

	    var maxFreq = 1;
	    for (var n = 0 ; n < this.freqs.length ; n++)
	       maxFreq = max(maxFreq, this.freqs[n]);
            var stepSize = 0.1 / maxFreq;

	    var c = [];
	    for (var t = -1 ; t < 1 + stepSize ; t += stepSize) {
	       if (t > 1)
	          t = 1;
	       var signal = 0;
	       for (var n = 0 ; n < this.freqs.length ; n++) {
	          var freq = this.freqs[n];
	          signal += noise2((this.t0 + t) * freq, 200 * freq) / freq;
               }
	       c.push([t, signal]);
	    }
	    mCurve(c);

         m.restore();
      }
   }
   Noises.prototype = new Sketch;

/*
   Things to work on:
   	Coffee cup:
		profile view morphs into
		3/4 view morphs into
		top view.
		Pour line of cream.
		Swirling cream folds over.
		Swirls more then folds over a second time.
		Mention Feigenbaum,onset of turbulence and powers of two.
	Marble principle
		show stripes (show code for this)
		add phase shift (show code for this)
		use turbulence instead of fractal sum.
	Add gesture to set to a particular page (with its attendant sketch definitions).
	Flame -> corona
	Clouds
	Smoke
	Principle of endless cycle for noise.
	List of movies.
	nVideo, etc., -> WebGL
	Animated creature:  Add noise to movement.
	Trees waving in the wind.
		- build as a fractal.
		- add noise to each node (show code).
	Slice through a 3D block.
	To make a marble vase:
		- draw a contour.
		- draw a circle.
		- drag circle to contour to create 3D shape.
		- add texture (show code).
*/

