class Cursor extends Object_ {

    constructor() {
        super()
    }

    postRender() {
        // implement in subclasses
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

class FakeCursor {

    constructor (){
        this.x = this.y = 0;
        this.width = 20;
        this.height = 20;
        this.slopeX = Math.cos(Math.PI / 4) * this.width;
        this.slopeY = Math.sin((Math.PI / 4)) * this.height;
    }
    
    postRender(t,ctx) {
        ctx.translate(this.x, this.y);
        if(FakeCursor.image) {
            ctx.drawImage(FakeCursor.image,0,0);
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
    
    static getDataUrl (cb){
    if(this.dataUrl) { return cb(this.dataUrl) }
    this.rendered        = new Canvas()
        .render(20,20,ctx => new FakeCursor().postRender(0,ctx) );
        
    this.rendered.toBlob((blob) => {
        let image = new Image();
            image.width  = this.rendered.width;
            image.height = this.rendered.height;
            image.src = this.dataUrl = URL.createObjectURL(blob);
            this.image = image;
        cb(this.dataUrl)
    },'image/png');
    }

}