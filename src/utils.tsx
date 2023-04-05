/**
 * 2D Vector.
 */
export class Vector {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Converts the vector to be in the coordinate space of a different Vector.
     * @param u Vector that serves as the origin of the new coordinate space.
     * @returns Original vector converted to be in the new coordinate space.
     */
    toSpace(u: Vector): Vector {
        return new Vector(this.x - u.x, this.y - u.y);
    }

    /**
     * Projects the Vector onto a Line and finds its component in the direction of the Line as a scale value of the Line.
     * @param line Line to project Vector onto.
     * @returns Scale of where the Vector lies when projected onto the line, 0 is the start and 1 is the end of the line.
     */
    percentOf(line: Line): number {
        const relativePoint = this.toSpace(line.start);
        const lineVector = line.end.toSpace(line.start);
        return dot(relativePoint, lineVector) / Math.pow(mag(lineVector), 2);
    }
}

/**
 * Line segment defined by two points (Vectors).
 */
export class Line {
    start: Vector;
    end: Vector;

    constructor(start: Vector, end: Vector) {
        this.start = start;
        this.end = end;
    }
}

/**
 * Scales a number up to the randomFactor.
 * @param num Number to add some randomness to.
 * @param randomFactor Maximum percent that number can be scaled up or down.
 * @returns Fuzzed number.
 */
export const fuzz = (num: number, randomFactor: number = 0.1): number => {
    return num + num * (randomFactor * (Math.random() * 2 - 1));
}

/**
 * Calculates the dot product of two Vectors.
 * @param u First Vector.
 * @param v Second Vector.
 * @returns dot product scalar of the two Vector.
 */
export const dot = (u: Vector, v: Vector): number => {
    return u.x * v.x + u.y * v.y;
}

/**
 * Finds the magnitude of a vector.
 * @param u Vector to find magnitude of.
 * @returns Magnitude of vector u.
 */
export const mag = (u: Vector): number => {
    return Math.sqrt(Math.pow(u.x, 2) + Math.pow(u.y, 2));
}

/**
 * Finds the intersection point of two Lines.
 * @param a First Line.
 * @param b Second Line.
 * @returns Intersection point of the two lines.
 */
export const intersect = (a: Line, b: Line): Vector => {
    // Use standard formulas of the two lines, ax + bx + c = 0, to solve for the intercept
    const aA = a.end.y - a.start.y;
    const aB = a.end.x - a.start.x;
    const aC = a.end.x * a.start.y - a.end.y * a.start.x;

    const bA = b.end.y - b.start.y;
    const bB = b.end.x - b.start.x;
    const bC = b.end.x * b.start.y - b.end.y * b.start.x;

    const xIntersect = (aB * bC - bB * aC) / (aA * bB - aB * bA);
    const yIntersect = - (bA * aC - aA * bC) / (bB * aA - bA * aB);

    return new Vector(xIntersect, yIntersect);
}