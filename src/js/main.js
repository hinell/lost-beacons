// Make Math global
const m = Math;
Object.getOwnPropertyNames(m).forEach(n => w[n] = w[n] || m[n]);

onload = () => {
   /* console.log();
    let {innerWidth: width, innerHeight: height} = w;*/
    C = D.querySelector('canvas');
    C.width = CANVAS_WIDTH      /*= width;*/
    C.height = CANVAS_HEIGHT    /*= height;*/
    R = C.getContext('2d',{ alpha: false });


    // Shortcut for all canvas methods
    const p = CanvasRenderingContext2D.prototype;
    p.wrap = function(f) {
        this.save();
        f();
        this.restore();

    };
    
    p.fr = p.fillRect;
    // assign canvas rendering context method to global variables
    // wrap = p.wrap
    Object.getOwnPropertyNames(p).forEach(n => {
        if (R[n] && R[n].call) {
            w[n] = p[n].bind(R);
        }
    });

    onresize();
    new Game({renderingContext: R, canvas: C});
};

onresize = () => {
    let mw = innerWidth,
        mh = innerHeight,

        ar = mw / mh, // available ratio
        br = CANVAS_WIDTH / CANVAS_HEIGHT, // base ratio
        // CH = CW / br
        width,
        height,
        style = D.getElementById('viewport').style;
    if (ar <= br) {
        width = mw;
        height = width / br;
    } else {
        height = mh;
        width = height * br;
    }

    style.width = width + 'px';
    style.height = height + 'px';
};
