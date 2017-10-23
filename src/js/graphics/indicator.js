INDICATOR_MARGIN          = 80;
INDICATOR_LABEL_CELL_SIZE = 2;
INDICATOR_PADDING         = 10;
INDICATOR_ARROW_SIZE      = 10;

class Indicator extends Object_ {

    constructor(target) {
        super()
        this.target = target;
        // Owner will set color and label
        this.indicateDuration = 0;
        this.radius = CANVAS_WIDTH / 2 - INDICATOR_MARGIN;
    }

    indicate(label, color, duration = 4) {
        if (label !== this.label) {
            this.indicateTime = G.t;
        }

        this.label = label;
        this.color = color;
        this.indicateDuration = duration;
    }

    clear() {
        this.indicateDuration = 0;
    }

    postRender() {
        const t = G.t - (this.indicateTime || -99);
        
        if (t > this.indicateDuration || this.target.distanceTo(V.center) < this.radius) {
            return;
        }
        
        const angle = V.center.angleTo(this.target);
        const cells = requiredCells(this.label);

        const labelWidth = cells * INDICATOR_LABEL_CELL_SIZE;
        const labelHeight = 5 * INDICATOR_LABEL_CELL_SIZE;

        const minX = min(V.center.x - labelWidth / 2, V.center.x - abs(cos(angle) * this.radius));
        const maxX = max(V.center.x + labelWidth / 2, V.center.x + abs(cos(angle) * this.radius));

        const minY = min(V.center.x - labelWidth / 2, V.center.y - abs(sin(angle) * this.radius));
        const maxY = max(V.center.y + labelWidth / 2, V.center.y + abs(sin(angle) * this.radius));

        const labelX = between(minX, V.center.x + cos(angle) * this.radius, maxX - labelWidth);
        const labelY = between(minY, V.center.y + sin(angle) * this.radius, maxY - labelHeight);

        let label = this.label.substr(0, ~~(t * 30));
        if ((t % 0.5) > 0.25) {
            label += '?';
        }
        drawText(label, labelX, labelY, INDICATOR_LABEL_CELL_SIZE, this.color, true);

        translate(
            // TODO: OPTIMIZE
            V.center.x + cos(angle) * (this.radius + INDICATOR_ARROW_SIZE * 2),
            V.center.y + sin(angle) * (this.radius + INDICATOR_ARROW_SIZE * 2)
        );
        rotate(angle);

        R.fillStyle = this.color;
        beginPath();
        moveTo(0, 0);
        lineTo(-INDICATOR_ARROW_SIZE, -INDICATOR_ARROW_SIZE);
        lineTo(-INDICATOR_ARROW_SIZE, INDICATOR_ARROW_SIZE);
        fill();
    }

}
