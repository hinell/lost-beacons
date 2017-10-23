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
    this.rendered        = document.createElement('canvas');
    this.rendered.width  = 20;
    this.rendered.height = 20;
    new FakeCursor().postRender(0,this.rendered.getContext('2d'));
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




    // document.body.appendChild(canvas_);
