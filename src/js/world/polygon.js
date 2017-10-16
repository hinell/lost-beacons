function avgProp(array, property) {
    return array.reduce((t, e) => {
        return t + e[property];
    }, 0) / array.length;
}

class Polygon {

    constructor(x,y,pts, renderCondition) {
        this.x = x;
        this.y = y;
        this.pts = pts;
        this.color = 'hsl(0,0%,50%)';
        this.stroke = '#fff';
        this.alpha = 1;
        this.renderCondition = renderCondition;

        this.center = {
            'x': avgProp(pts, 'x'),
            'y': avgProp(pts, 'y'),
            'z': avgProp(pts, 'z'),
        };

        this.perspective = PERSPECTIVE || 400;
    }

    // Returns the 2D coordinates of a 3D point
    pointCoords(pt) {
        return {
            'x': pt.x + (pt.x - V.center.x) / this.perspective * pt.z,
            'y': pt.y + (pt.y - V.center.y) / this.perspective * pt.z
        };
    }

    hash() {
        return this.center.x + ',' + this.center.y + ',' + this.center.z;
    }

    render() {
        wrap(() => {
            R.globalAlpha = this.alpha;
            R.fillStyle = this.color;
            R.strokeStyle = this.stroke;
            R.lineWidth = 1;
            R.lineJoin = 'round';
            beginPath();
            this.pts.map(p => this.pointCoords(p)).forEach((p, i) => {
                if (!i) moveTo(p.x, p.y);
                else lineTo(p.x, p.y);
            });
            closePath();
            fill();
            stroke();
        });
    }

}
