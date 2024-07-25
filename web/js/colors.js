class colors {
    // Цвет светлый или тёмный (для цвета текста)
    static isColorLight = (color) => {
        const rgb = [
            parseInt(color.substring(1, 3), 16),
            parseInt(color.substring(3, 5), 16),
            parseInt(color.substring(5), 16),
        ];
        const luminance =
            (0.2126 * rgb[0]) / 255 +
            (0.7152 * rgb[1]) / 255 +
            (0.0722 * rgb[2]) / 255;
        return luminance > 7;
    }

    // Цифра цвета RGB в двузначный HEX
    static componentToHex = (c) => {
        let hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    // rgb() to #hex
    static rgbToHex = (r, g, b) => {
        return "#" + colors.componentToHex(r) + colors.componentToHex(g) + colors.componentToHex(b);
    }

    // rgb() to hsl()
    static RGBToHSL = (r, g, b) => {
        // Make r, g, and b fractions of 1
        r /= 255;
        g /= 255;
        b /= 255;

        // Find greatest and smallest channel values
        let cmin = Math.min(r, g, b),
            cmax = Math.max(r, g, b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0;

        if (delta === 0)
            h = 0;
        // Red is max
        else if (cmax === r)
            h = ((g - b) / delta) % 6;
        // Green is max
        else if (cmax === g)
            h = (b - r) / delta + 2;
        // Blue is max
        else
            h = (r - g) / delta + 4;

        h = Math.round(h * 60);

        // Make negative hues positive behind 360°
        if (h < 0)
            h += 360;

        // Calculate lightness
        l = (cmax + cmin) / 2;

        // Calculate saturation
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

        // Multiply l and s by 100
        s = +(s * 100).toFixed(0);
        l = +(l * 100).toFixed(0);

        return {
            h: h,
            s: s,
            l: l
        };
    }

    // Вычесть значение из цвета RGB
    static rgbMinus = (color, minus) => {
        let matched = color.match(colorsMatchRegex);
        if (matched === null || matched.length !== 4) {
            return false;
        }

        let r = matched[1];
        let g = matched[2];
        let b = matched[3];

        r = parseInt(r) + parseInt(minus);
        g = parseInt(g) + parseInt(minus);
        b = parseInt(b) + parseInt(minus);

        if (r > 255) {
            r = 255;
        } else if (r < 0) {
            r = 0;
        }
        if (g > 255) {
            g = 255;
        } else if (g < 0) {
            g = 0;
        }
        if (b > 255) {
            b = 255;
        } else if (b < 0) {
            b = 0;
        }
        return "rgb(" + r + ", " + g + ", " + b + ")";
    }

    // #hex to rgb()
    static hexToRgb = (hex) => {
        hex = hex.toLowerCase();
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

}