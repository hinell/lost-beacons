class ChaseCursor extends Cursor {
    
    constructor (){
        super();
        this.color = '#0f0'
        this.target // only set when the unit is selected
    }
    
    postRender() {
        const s = 1 - (G.t % CHASE_CURSOR_PERIOD) / CHASE_CURSOR_PERIOD;

        translate(this.target.x, this.target.y);

        const corner = a => () => {
            translate(cos(a) * CHASE_CURSOR_RADIUS, sin(a) * CHASE_CURSOR_RADIUS);
            rotate(a);

            beginPath();
            moveTo(-CHASE_CURSOR_SIZE, 0);
            lineTo(0, CHASE_CURSOR_SIZE);
            lineTo(0, -CHASE_CURSOR_SIZE);
            fill();
        };

        R.fillStyle = this.color;

        wrap(() => {
            R.globalAlpha = s;
            scale(s, s);
            let i = 4;
            while (i--) {
                wrap(corner((i / 4) * PI * 2 + PI / 4));
            }
        });

        this.renderLabel(this.label);
    }

    drawPositionCircles (target, duration, transparency){
        if(this.circlesDrawing) { return }
        this.circlesDrawing = true;
        // Quick effect to show where we're going
        let circle = {
            a       : duration || 2,
            'render': (e) => {
                // no render if canvas is going to be saved
                if((circle.a -= 0.1)  <= 0.1) {  R.globalAlpha = 1; W.remove(circle); return }
                // R.translate(target.x, target.y);
                // R.scale(circle.a + 0.1,circle.a + 0.1);
                R.globalAlpha = transparency || circle.a
                R.strokeStyle = this.color;
                
                R.lineWidth = 0.5;
                R.beginPath();
                R.arc(target.x, target.y, circle.a.linear(6,0,2) , 0, Math.PI2, true);
                // R.arc(0, 0, 5, 0, PI * 2, true);
                R.stroke();

            }
        };
        W.add(circle , RENDERABLE);
        
        // interp(circle, 'a', 1, 0, .6, 0, 0, i => W.remove(circle));
        this.circlesDrawing = false
    }

    setTarget(target) {
        this.target = target;
        this.x = target.x;
        this.y = target.y;
    }
    
    rightDown() { /*implement in subclasses*/ }
    
}
