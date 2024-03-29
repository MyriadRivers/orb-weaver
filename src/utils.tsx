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
    
    /**
     * Gets the distance from this vector to the given point.
     * @param point Point to calculate the distance to.
     * @returns The distance from this vector to the point.
     */
    distanceTo(point: Vector): number {
        return Math.sqrt(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2));
    }
}

/**
 * Line segment defined by two points (Vectors).
 */
export class Line {
    start: Vector;
    end: Vector;
    length: number;

    constructor(start: Vector, end: Vector) {
        this.start = start;
        this.end = end;
        this.length = end.toSpace(start).mag();
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
     * Returns the Vector found along the line at the given position from 0 to 1. 
     * @param position Position along line, with 0 being the start and 1 being the end of the line.
     */
    pointAt(position: number): Vector {
        return this.start.plus(this.end.toSpace(this.start).scale(position));
    }

    /**
     * Returns the Vector found along the line at the given absolute position. 
     * @param position Position along line in pixels.
     */
    pointAtAbs(position: number): Vector {
        const percentPos = position / this.length;
        return this.start.plus(this.end.toSpace(this.start).scale(percentPos));
    }

    /**
     * Checks if a given point lies on the line.
     * @param point Point to check.
     * @param extendedLine Whether to check if point is on the line extended to infinity or just on the finite line segment. Default is false (must lie on segment).
     * @returns Boolean value representing if the specified point lies on this line, inclusive of ends.
     */
    contains(point: Vector, extendedLine: boolean = false): boolean {
        const withinBounds = Math.sign(round(this.start.distanceTo(point), 5)) === 0 || Math.sign(round(point.distanceTo(this.end), 5)) === 0 
        || Math.sign(this.start.distanceTo(point)) === Math.sign(point.distanceTo(this.end));
        const equalDistance = round(this.start.distanceTo(point) + point.distanceTo(this.end), 5) === round(this.length, 5);
        return extendedLine ? equalDistance : equalDistance && withinBounds;
    }

    /**
     * Finds where a given point is on the line relative to the line's length. 
     * @param point Vector to check.
     * @returns Number from 0 to 1 representing where the point is on the line, or null if the point is not on the line.
     */
    lineValueAt(point: Vector): number | null {
        if (this.contains(point)) {
            return new Line(this.start, point).length / this.length;
        }
        return null;
    }

    /**
     * Returns a reversed copy of the line.
     * @returns Line going in the opposite direction, from original end to original start.
     */
    reverse(): Line {
        return new Line(this.end, this.start);
    }
}

/**
 * Radial thread on a spider web, which holds the auxiliary and capture spiral threads.
 */
export class Radius extends Line {
    angle: number;
    // Points on the auxiliary spiral
    auxPoints: Array<Vector>;
    // Points on the capture spiral
    capPoints: Array<Vector>;

    constructor(start: Vector, end: Vector, angle: number) {
        super(start, end);
        this.angle = angle;
        this.auxPoints = new Array<Vector>();
        this.capPoints = new Array<Vector>();
    }
}

interface RGB {
    r: number;
    g: number;
    b: number;
}

export class RGBColor {
    r: number;
    g: number;
    b: number;

    constructor(rgb: RGB);
    constructor(hex: string);
    constructor(color: string | RGB) {
        if (typeof color === "string") {
            this.r = parseInt(color.substring(1, 3), 16);
            this.g = parseInt(color.substring(3, 5), 16);
            this.b = parseInt(color.substring(5, 7), 16);
        } else {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
        }
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
 * Clamp a number so it doesn't exceed a defined range.
 * @param num Number to be clamped.
 * @param min If the number is below this value, it will be set to it.
 * @param max If the number is above this value, it will be set to it.
 * @returns The clamped number.
 */
export const clamp = (num: number, min: number, max: number): number => {
    return Math.min(max, Math.max(min, num));
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
 * Generates a random color as a hex code.
 * @returns Hex code for a random color.
 */
export const randHexColor = () => {
    return '#' + (0x1000000+Math.random() * 0xffffff).toString(16).slice(1, 7);
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

/**
 * Rounds a number to a specified number of decimal points.
 * @param num Number to round.
 * @param decimals Decimal points to round to.
 * @returns Rounded number.
 */
export const round = (num: number, decimals: number): number => {
    const magnitude = Math.pow(10, decimals);
    return Math.round(num * magnitude) / magnitude;
}

export enum ColorMode {
    RANDOM = "RANDOM",
    MONOCHROME = "MONOCHROME"
}

const pc = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export enum Scale {
    CHROMATIC = "CHROMATIC",
    DIATONIC = "DIATONIC",
    PENTATONIC = "PENTATONIC",
}

/**
 * Turns a float from 0 to 1 to the corresponding note on a given number of scales
 * @param num Number between 0 and 1
 * @param scale Type of scale to use
 * @param octaves How many octaves of the scale to append to each other
 * @returns The specific note between the first and last notes of the total scales corresponding to the number as a percentage
 */
export const numToScale = (num: number, scale: Scale, octaves: number): string => {
    const chromatic = [pc[0], pc[1], pc[2], pc[3], pc[4], pc[5], pc[6], pc[7], pc[8], pc[9], pc[10], pc[11]];
    const diatonic = [pc[0], pc[2], pc[4], pc[5], pc[7], pc[9], pc[11]];
    const pentatonic = [pc[0], pc[2], pc[4], pc[7], pc[9]];

    var pcs;

    switch (scale) {
        case "CHROMATIC":
            pcs = chromatic;
            break;
        case "DIATONIC":
            pcs = diatonic;
            break;
        case "PENTATONIC":
            pcs = pentatonic;
            break;
        default:
            pcs = chromatic;
    }

    var notes = new Array<string>();
    
    for (let i = 0; i < octaves; i++) {
        // Centers the octaves around the 4th octave
        var octave = i + 5 - Math.ceil(octaves / 2);
        for (let j = 0; j < pcs.length; j++) {
            notes.push(pcs[j] + octave)
        }
    }
    var note = Math.round(num * (notes.length - 1));
    return notes[note];
}

/**
 * Moves a note up or down a given number of octaves.
 * @param note Note to change pitch.
 * @param mod How many octaves to adjust the note's pitch.
 * @returns Note in the new octave.
 */
export const octave = (note: string, mod: number) => {
    let baseNote = note.substring(0, note.length - 1);
    let baseOct = note.substring(note.length - 1);
    let newOct = parseInt(baseOct) + mod;

    return baseNote + newOct;
}

export const randNote = (octaves: number, scale: Scale = Scale.PENTATONIC) => {
    return numToScale(Math.random(), scale, octaves);
}