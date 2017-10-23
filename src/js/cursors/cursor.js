class Cursor extends Object_ {

    constructor(elem) {
        super()
        this.elem = elem;
        this.pointer = new DefaultPointer()
        this.styleCursor;
    }
    
    // Set up cursor's style. If no argument provided then style is default
    // @param style {string|undefined} - css cursor style
    style(style){
        if(style){ this.elem.style['cursor'] = style  }
        else {
            if(this.styleCursor) {
                this.elem.style['cursor'] = this.styleCursor
            } else {
                this.pointer.preRender(url => { this.styleCursor = this.elem.style['cursor'] = `url(${url}) -1 -1, not-allowed` })
            }
            
        }
    }
    
    postRender(t,ctx,c) {
    
    }

    down(p) {
        this.downPosition = p;
    }

    wheelDown(p) {
        // TODO
    }
    
    rightDown() {
        // implement in subclasses
    }

    move(p) {
        this.x = p.x;
        this.y = p.y;

        if (this.downPosition) {
            G.cursor = G.selectionCursor;
            G.cursor.down(this.downPosition);
            G.cursor.move(this);

            this.downPosition = null;
        }
    }

    up() {
        this.downPosition = null;
    }

    renderLabel(s,relativePoint) {
        function sign(x) {
            return x > 0 ? 1 : x < 0 ? - 1 : 0;
        }

        const center = relativePoint || V.center;
        let a = -PI / 3;

        if (center.x > this.x) {
            a = -PI / 2 - PI / 6;
        } else {
            a = -PI / 3;
        }

        if (center.y < this.y) {
            a *= -1;
        }

        const angleCos = cos(a);

        const r1 = 30;
        const r2 = 60;
        const r3 = 30;

        R.lineWidth = 2;
        R.strokeStyle = R.fillStyle = this.color;
        R.font = 'bold 10pt Courier New';
        R.textAlign = angleCos > 0 ? 'left' : 'right';
        R.textBaseline = 'middle';
        R.shadowColor = '#000';
        R.shadowOffsetY = 1;

        beginPath();
        moveTo(angleCos * r1, sin(a) * r1);
        lineTo(angleCos * r2, sin(a) * r2);
        lineTo(angleCos * r2 + sign(angleCos) * r3, sin(a) * r2);
        stroke();

        fillText(s, angleCos * r2 + sign(angleCos) * (r3 + 10), sin(a) * r2);
    }
}

class DefaultPointer {

    constructor (){
        this.x = this.y = 0;
        this.width = 20;
        this.height = 20;
        this.slopeX = Math.cos(Math.PI / 4) * this.width;
        this.slopeY = Math.sin((Math.PI / 4)) * this.height;
        this.canvas // cached render
        this.image  // cached render in image format
        this.url
    }
    
    preRender(cb){
        if(this.url) { return cb(this.url,this.image,this) }
        this.canvas = new Canvas()
            .render(20,20,ctx => new DefaultPointer().postRender(0,ctx) );
            
        this.canvas.toBlob((blob) => {
            let image = new Image();
                image.width  = this.canvas.width;
                image.height = this.canvas.height;
                image.src = this.url = URL.createObjectURL(blob);
                this.image = image;
            cb(this.url,image,this)
        },'image/png');
    
    }
    
    postRender(t,ctx) {
        ctx.translate(this.x, this.y);
        if(this.image) {
            ctx.drawImage(this.image,0,0);
            return
        }
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.height);
        ctx.lineTo(this.slopeX,this.slopeY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
}