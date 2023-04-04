import * as Tone from "tone";
import { MutableRefObject, useEffect, useRef, useState } from "react"

class Vector {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Projects the Vector onto a Line and finds its component in the direction of the Line as a scale value of the Line.
     * @param line Line to project Vector onto.
     * @returns Scale of where the Vector lies when projected onto the line, 0 is the start and 1 is the end of the line.
     */
    percentOf(line: Line): number {
        const lineX = line.end.x - line.start.x;
        const lineY = line.end.y - line.start.y;
        const lineVector = new Vector(lineX, lineY);
        return dot(this, lineVector) / Math.pow(mag(lineVector), 2);
    }
}

class Line {
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
const fuzz = (num: number, randomFactor: number = 0.1): number => {
    return num + num * (randomFactor * (Math.random() * 2 - 1));
}

/**
 * Calculates the dot product of two Vectors.
 * @param u First Vector.
 * @param v Second Vector.
 * @returns dot product scalar of the two Vector.
 */
const dot = (u: Vector, v: Vector): number => {
    return u.x * v.x + u.y * v.y;
}

/**
 * Finds the magnitude of a vector.
 * @param u Vector to find magnitude of.
 * @returns Magnitude of vector u.
 */
const mag = (u: Vector): number => {
    return Math.sqrt(Math.pow(u.x, 2) + Math.pow(u.y, 2));
}

/**
 * Finds the intersection point of two Lines.
 * @param a First Line.
 * @param b Second Line.
 * @returns Intersection point of the two lines.
 */
const intersect = (a: Line, b: Line): Vector => {
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

// interface CanvasProps {
//     draw(context: CanvasRenderingContext2D): void;
//     sound(): void;
// }

// const rng = (min: number, max: number): number => {
//     return Math.floor(Math.random() * (max - min + 1) + min);
// }

const Canvas = () => {
    const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef<HTMLCanvasElement>(null);
    const ctxRef: MutableRefObject<CanvasRenderingContext2D | null> = useRef<CanvasRenderingContext2D>(null);

    const [activeLines, setActiveLines] = useState(new Array<Line>());
    const [passiveLines, setPassiveLines] = useState(new Array<Line>());

    // The three major axes for determining sound
    var axisA: Line | null = null;
    var axisB: Line | null = null;
    var axisC: Line | null = null;

    // Initialize Canvas and Context
    useEffect(() => {
        const canvas: HTMLCanvasElement | null = canvasRef.current;
        if (canvas != null) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctxRef.current = canvas.getContext('2d');
        }
    }, [])

    // Render and play new lines
    // useEffect(() => {
    //     activeLines.forEach(line => {
    //         draw(line);
    //         sound(line);
    //     }); 
    // }, [activeLines])

    // const draw = (line: Line): void => {
    //     if (canvasRef.current != null && ctxRef.current != null) {
    //         ctxRef.current.fillStyle = '#'+(0x1000000+Math.random()*0xffffff).toString(16).substr(1,6);
    //         ctxRef.current.fillRect(rand(0, canvasRef.current.width), rand(0, canvasRef.current.height), 
    //         rand(0, 100), rand(0, 100));
    //     }
    // }

    // const sound = (line: Line): void => {
    //     const synth = new Tone.Synth().toDestination();
    //     synth.triggerAttackRelease(rand(200, 2000), "4n");
    // }

    /**
     * Spins a line of silk and sound.
     * @param line The line to be animated and played.
     * @returns Promise is resolved when the line is finished spinning.
     */
    const spinLine = (line: Line): Promise<void> => {
        const speed = 10;

        return new Promise(resolve => {
            // Make the width a little more visible for now
            if (ctxRef.current != null) {
                ctxRef.current.lineWidth = 3;
            }

            /**
             * Renders a line segment on the canvas from point a to b.
             * @param a Starting point.
             * @param b Ending point.
             */
            const drawLine = (a: Vector, b: Vector): void => {
                ctxRef.current?.beginPath();
                ctxRef.current?.moveTo(a.x, a.y);
                ctxRef.current?.lineTo(b.x, b.y);
                ctxRef.current?.stroke();
            }

            // Set up parameters to iterate through line
            var t = 0;
            var dist = Math.sqrt(Math.pow(line.end.x - line.start.x, 2) + Math.pow(line.end.y - line.start.y, 2));
            var x = line.start.x;
            var y = line.start.y;
            var prevX = line.start.x;
            var prevY = line.start.y;

            // Set up the sound generation so it happens as the line is being drawn 
            const osc = new Tone.Oscillator().toDestination();
            if (axisA != null && axisB != null && axisC != null) {
                osc.frequency.value = line.start.percentOf(axisA) * 220;
                osc.start();
            }

            // Plays one step of the animation and sound tied to the line
            const lineStep = (): void => {
                // Speed is one unit of distance per time (update?)
                if (t <= dist) {
                    // Randomize the color of every step so we can confirm it's drawing cumulatively
                    if (ctxRef.current != null) {
                        ctxRef.current.strokeStyle = '#'+(0x1000000+Math.random()*0xffffff).toString(16).substr(1,6);
                    }

                    prevX = x;
                    prevY = y;
                    // Parametric equations for the line
                    x = line.start.x + ((line.end.x - line.start.x) / dist) * t;
                    y = line.start.y + ((line.end.y - line.start.y) / dist) * t;
                    
                    // Draw the line step being spun
                    const prevPoint = new Vector(prevX, prevY);
                    const newPoint = new Vector(x, y);

                    drawLine(prevPoint, newPoint);

                    // Play the line step being spun
                    if (axisA != null && axisB != null && axisC != null) {
                        osc.frequency.rampTo(220 + newPoint.percentOf(axisA) * 880, 0);
                    }

                    // If the step size, as set by the speed, is too big and adding another step to the line will go over the actual distance...
                    if (t + speed < dist) {
                        t += speed;
                    } else if (t < dist) {
                        // ...then we figure out how much distance is left from the current step to actual distance, and add a substep of that exact size
                        var distanceLeft = dist - t;
                        t += distanceLeft;
                    } else {
                        // And finally we increment t one more time to end the loop.
                        t++;
                    }
                    window.requestAnimationFrame(lineStep);
                } else {
                    // Stop all sound when the line is finished animating
                    // TODO: Maybe hold the pitch a little bit so it doesn't sharp cut off?
                    osc.stop();
                    resolve();
                }
            }
            lineStep()
        });
    }

    const weaveLines = async (currentLines: Array<Line>): Promise<void[]> => {
        // Append active and passive lines into a new list
        setPassiveLines([...passiveLines, ...activeLines]);
        setActiveLines(currentLines);
        // Call spinLine() on all members of currentLines at the same time, wait until they're all done
        return await Promise.all(currentLines.map(spinLine));
    }

    // Actual sequence for weaving the web
    const weaveWeb = async () => {
        if (canvasRef.current != null) {
            const initY = 20;
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;

            const middleX = fuzz(width / 2, 0.25);
            const middleY = fuzz(height / 2);

            // INITIALIZE THE BASE THREADS AND THE THREE AXES
            // Points that define the triangle
            const originA = new Vector(0, initY);
            const originB = new Vector(width, initY);
            const originC = new Vector(middleX, height)
            const middle = new Vector(middleX, middleY);
            
            // Bridge Thread
            const bridge = new Line(new Vector(0, initY), new Vector(width, initY));

            // Y Shape threads and anchor threads
            const branchA = new Line(originA, middle);
            const branchB = new Line(originB, middle);
            const branchC = new Line(middle, originC);

            const anchorA = new Line(originB, originC);
            const anchorB = new Line(originA, originC);
            
            // Three main axes
            axisA = new Line(originA, intersect(branchA, anchorA));
            axisB = new Line(originB, intersect(branchB, anchorB));
            axisC = new Line(originC, intersect(branchC, bridge));

            await weaveLines([bridge]);
            
            await weaveLines([branchA, branchB]);
            await weaveLines([branchC]);

            // Frame Threads, finishing the triangle
            await weaveLines([anchorA]);
            await weaveLines([anchorB]);
        }   
    }

    // Dummy function to add to the demo button callback
    // const addLine = () => {
    //     spinLine(new Line(20, 220, 40, 440));
    // }

    // // Dummy function to see if renders active and passive line states are working properly
    // const addSquare = () => {
    //     setPassiveLines([...passiveLines, ...activeLines])
    //     setActiveLines([new Line(rand(0, 100), rand(0, 100), rand(0, 100), rand(0, 100))]);
    //     console.log(passiveLines.length);
    // }

    return (
        <div>
            <canvas ref={canvasRef}></canvas>
            <button onClick={weaveWeb}>weave</button>
        </div>
    )
}

export default Canvas