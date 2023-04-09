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
     * Adds this Vector to another and returns the new Vector.
     * @param u Summand vector.
     * @returns Sum of this vector and the summand Vector.
     */
    plus(u: Vector): Vector {
        return new Vector(this.x + u.x, this.y + u.y);
    }

    /**
     * Scales this Vector by a constant value.
     * @param scalar Scalar to multiply with vector.
     * @returns Scaled vector.
     */
    scale(scalar: number): Vector {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    /**
     * Calculates the dot product of this and another Vector.
     * @param other Second Vector.
     * @returns dot product scalar of the two Vectors.
     */
    dot(other: Vector): number {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * Finds the magnitude of this Vector.
     * @returns Magnitude of Vector u.
     */
    mag(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
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
    componentOf(line: Line): number {
        const relativePoint = this.toSpace(line.start);
        const lineVector = line.end.toSpace(line.start);
        return relativePoint.dot(lineVector) / Math.pow(lineVector.mag(), 2);
    }

    /**
     * Determines how far along a target line the Vector is after being projected onto that line parallel to a baseline.
     * @param target Line to "project" on to see where the Vector lies.
     * @param angleOfProjection Line that defines at what angle the Vector is "projected" onto the Target.
     * @returns How far along the Target line this Vector lies, with 0 - 1 correspond to the start and end of the Target line.
     */
    percentOf(target: Line, angleOfProjection: Line, round: boolean = true): number {
        // Create a new vector parallel to the baseline based off the current point
        const measuringLine = new Line(this, this.plus(angleOfProjection.end.toSpace(angleOfProjection.start)));
        const intersection = measuringLine.intersect(target);
        // Intersection lies on the target so orthogonal projection will work here
        return Math.round(intersection.componentOf(target) * 10000) / 10000;
    }

    /**
     * Gets the absolute angle of a Vector around an origin point. Default is in degrees.
     * @param origin The origin to get the angle around.
     * @param inDegrees Whether to return the angle in degrees or not (radians). Default is true.
     * @returns Angle, in degrees unless specified in radians.
     */
    getAngle(origin: Vector, inDegrees: boolean = true): number {
        const transVec = this.toSpace(origin);
        const baseAngle = radToDeg(Math.atan(transVec.y / transVec.x));
        var angle: number;
        if (transVec.x < 0) {
            angle = baseAngle + 180;
        } else if (transVec.y < 0) {
            angle = baseAngle + 360;
        } else {
            angle = baseAngle;
        }
        return inDegrees ? angle : degToRad(angle);
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

    /**
     * Finds the intersection point of this Line and another Line.
     * @param other Second Line.
     * @returns Intersection point of the two lines.
     */
    intersect(other: Line): Vector {
        // Use standard formulas of the two lines, ax + bx + c = 0, to solve for the intercept
        const aA = this.end.y - this.start.y;
        const aB = this.end.x - this.start.x;
        const aC = this.end.x * this.start.y - this.end.y * this.start.x;

        const bA = other.end.y - other.start.y;
        const bB = other.end.x - other.start.x;
        const bC = other.end.x * other.start.y - other.end.y * other.start.x;

        const xIntersect = (aB * bC - bB * aC) / (aA * bB - aB * bA);
        const yIntersect = - (bA * aC - aA * bC) / (bB * aA - bA * aB);

        return new Vector(xIntersect, yIntersect);
    }

    /**
     * Returns the Vector found along the line at the given position. 
     * @param position Position along line, with 0 being the start and 1 being the end of the line.
     */
    pointAt(position: number): Vector {
        return this.start.plus(this.end.toSpace(this.start).scale(position));
    }
}

export class Radius extends Line {
    angle: number;

    constructor(start: Vector, end: Vector, angle: number) {
        super(start, end);
        this.angle = angle;
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
 * Returns a random floating point number in between an inclusive min and exclusive max. 
 * @param min Min number (inclusive).
 * @param max Max number (exclusive).
 * @returns Random floating point number in between min and max.
 */
export const rand = (min: number, max: number): number => {
    return Math.random() * (max - min) + min
}

/**
 * Returns a random integer between an inclusive min and an exclusive max.
 * @param min Minimum bound (inclusive).
 * @param max Maximum bound (exclusive).
 * @returns Random integer between the min and max.
 */
export const randInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Shuffles an array by randomizing the order of its contents.
 * @param array Array to shuffle.
 * @returns Array with order of contents randomized.
 */
export const shuffle = (array: Array<any>): Array<any> => {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

/**
 * Converts an angle from radians to degrees. 
 * @param angle Angle to convert.
 * @returns Angle converted to degrees.
 */
export const radToDeg = (angle: number): number => {
    return angle * (180 / Math.PI);
}

/**
 * Converts an angle from degrees to radians.
 * @param angle Angle to convert.
 * @returns Angle converted to radians.
 */
export const degToRad = (angle: number): number => {
    return angle * (Math.PI / 180);
}