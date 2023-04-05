import * as Tone from "tone";
import { MutableRefObject, useEffect, useRef, useState } from "react"
import { Vector, Line, fuzz, intersect } from "../utils";

const Canvas = () => {
    const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef<HTMLCanvasElement>(null);
    const ctxRef: MutableRefObject<CanvasRenderingContext2D | null> = useRef<CanvasRenderingContext2D>(null);

    const [activeLines, setActiveLines] = useState(new Array<Line>());
    const [passiveLines, setPassiveLines] = useState(new Array<Line>());

    // The three major axes for determining sound
    var axisA: Line | null = null;
    var axisB: Line | null = null;
    var axisC: Line | null = null;

    // Y value to start spinning the web from, so that it's not at the top of the screen
    const initY = 20;

    // Initialize Canvas and Context
    useEffect(() => {
        const canvas: HTMLCanvasElement | null = canvasRef.current;
        if (canvas != null) {
            canvas.width = window.innerWidth - 50;
            canvas.height = window.innerHeight - 50;
            ctxRef.current = canvas.getContext('2d');
        }
    }, [])

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

            // Set up parameters to iterate through line
            var t = 0;
            var dist = Math.sqrt(Math.pow(line.end.x - line.start.x, 2) + Math.pow(line.end.y - line.start.y, 2));
            var x = line.start.x;
            var y = line.start.y;
            var prevX = line.start.x;
            var prevY = line.start.y;

            // Initialize oscillators and sound parameters
            const osc1 = new Tone.Oscillator();
            const osc2 = new Tone.Oscillator();

            osc1.type = "sine";
            osc2.type = "sawtooth";

            const gain1 = new Tone.Gain(0);
            const gain2 = new Tone.Gain(0);

            const tremolo1 = new Tone.Tremolo(0, 1.0);
            const tremolo2 = new Tone.Tremolo(0, 1.0);

            // Set up pipeline of effects
            osc1.connect(tremolo1);
            osc2.connect(tremolo2);
            tremolo1.connect(gain1);
            tremolo2.connect(gain2);
            gain1.toDestination();
            gain2.toDestination();

            if (axisA != null && axisB != null && axisC != null) {
                const startPoint = new Vector(line.start.x, line.start.y);
                // Initialize pitch
                osc1.frequency.value = startPoint.percentOf(axisA) * 220;
                osc2.frequency.value = startPoint.percentOf(axisA) * 220;
                // Initialize volume
                gain1.gain.value = 1 - startPoint.percentOf(axisB);
                gain2.gain.value = startPoint.percentOf(axisB);
                // Initialize rhythm (tremolo)
                console.log("Line start: " + startPoint.x + ", " + startPoint.y);
                console.log("Line end: " + line.end.x + ", " + line.end.y);
                console.log("Axis C start: " + axisC.start.x +", " + axisC.start.y + ", end: " + axisC.end.x + ", " + axisC.end.y);
                console.log("Line start percent of axis C: " + (startPoint.percentOf(axisC)));
                console.log("Axis B start: " + axisB.start.x +", " + axisB.start.y + ", end: " + axisB.end.x + ", " + axisB.end.y);
                console.log("Line end percent of axis B: " + line.end.percentOf(axisB));
                console.log("Line end percent of axis A: " + line.end.percentOf(axisA));
                console.log("\n");
                // +1 to account for axis 3 going from bottom up, so percents will be negative from 0 to -1
                tremolo1.frequency.value = (startPoint.percentOf(axisC)) * 20;
                tremolo2.frequency.value = (startPoint.percentOf(axisC)) * 20;
                tremolo1.start();
                tremolo2.start();
                
                osc1.start();
                osc2.start();
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

            /**
             * Sonifies a point p.
             * @param p Point to sonify.
             */
            const soundPoint = (point: Vector): void => {
                // Account for the starting Y
                const p = new Vector(point.x, point.y);
                if (axisA != null && axisB != null && axisC != null) {
                    // Axis A: Pitch
                    osc1.frequency.rampTo(220 + p.percentOf(axisA) * 220, 0);
                    osc2.frequency.rampTo(220 + p.percentOf(axisA) * 220, 0);
                    // Axis B: Timbre
                    gain1.gain.rampTo(1 - p.percentOf(axisB));
                    gain2.gain.rampTo(p.percentOf(axisB));
                    // Axis C: Rhythm
                    tremolo1.frequency.rampTo((p.percentOf(axisC)) * 20, 0);
                    tremolo2.frequency.rampTo((p.percentOf(axisC)) * 20, 0);
                }
            }

            /**
             * Steps through line, rendering and generating sound for each step.
             */
            const lineStep = (): void => {
                // Speed is one unit of distance per time (update?)
                if (t <= dist) {
                    // Randomize the color of every step so we can confirm it's drawing cumulatively
                    if (ctxRef.current != null) {
                        ctxRef.current.strokeStyle = '#'+(0x1000000+Math.random()*0xffffff).toString(16).substr(1,6);
                    }

                    // BREAK THE LINE INTO STEPS TO CUMULATIVELY PLAY AND ANIMATE
                    prevX = x;
                    prevY = y;
                    // Parametric equations for the line
                    x = line.start.x + ((line.end.x - line.start.x) / dist) * t;
                    y = line.start.y + ((line.end.y - line.start.y) / dist) * t;
                    
                    // ACTUAL PLAYING OF THE POINTS
                    const prevPoint = new Vector(prevX, prevY);
                    const newPoint = new Vector(x, y);

                    // Draw the line step being spun
                    drawLine(prevPoint, newPoint);

                    // Play the line step being spun
                    soundPoint(newPoint);

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
                    osc1.stop();
                    osc2.stop();
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
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;

            const middleX = fuzz(width / 2);
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
            console.log(intersect(branchC, bridge));
            axisC = new Line(originC, intersect(branchC, bridge));

            await weaveLines([bridge]);
            
            await weaveLines([branchA, branchB]);
            await weaveLines([branchC]);

            // Frame Threads, finishing the triangle
            await weaveLines([anchorA]);
            await weaveLines([anchorB]);
        }   
    }

    return (
        <div>
            <canvas ref={canvasRef}></canvas>
            <button onClick={weaveWeb}>weave</button>
        </div>
    )
}

export default Canvas