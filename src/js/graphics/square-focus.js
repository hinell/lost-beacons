const squareFocus = (radius, s, width = 1 ) => {
    const corner = angle => () => {
        translate(cos(angle) * radius, sin(angle) * radius);
        rotate(angle + PI * 3 / 4);
        R.fillRect(0, 0, width, s);
        R.fillRect(0, 0, s, width);
    };

    let i = 4;
    while (i--) {
        wrap(corner((i / 4) * PI * 2 + PI / 4));
    }
};
