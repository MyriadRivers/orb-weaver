import * as Tone from "tone";
import { MutableRefObject, useEffect, useRef, useState } from "react"

class Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(startX: number, startY: number, endX: number, endY: number) {
        this.x1 = startX;
        this.y1 = startY;
        this.x2 = endX;
        this.y2 = endY;
    }
}

// interface CanvasProps {
//     draw(context: CanvasRenderingContext2D): void;
//     sound(): void;
// }

const rand = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const Canvas = () => {
    const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef<HTMLCanvasElement>(null);
    const ctxRef: MutableRefObject<CanvasRenderingContext2D | null> = useRef<CanvasRenderingContext2D>(null);

    const [activeLines, setActiveLines] = useState(new Array<Line>());
    const [passiveLines, setPassiveLines] = useState(new Array<Line>());

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

    const draw = (line: Line): void => {
        if (canvasRef.current != null && ctxRef.current != null) {
            ctxRef.current.fillStyle = '#'+(0x1000000+Math.random()*0xffffff).toString(16).substr(1,6);
            ctxRef.current.fillRect(rand(0, canvasRef.current.width), rand(0, canvasRef.current.height), 
            rand(0, 100), rand(0, 100));
        }
    }

    const sound = (line: Line): void => {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease(rand(200, 2000), "4n");
    }

    // Animates a line cumulatively
    const spinLine = (line: Line): Promise<void> => {
        return new Promise(resolve => {
            // Make the width a little more visible for now
            if (ctxRef.current != null) {
                ctxRef.current.lineWidth = 3;
            }

            // Draws a line segment from (x1, y1) to (x2, y2) in the canvas
            const drawLine = (x1: number, y1: number, x2: number, y2: number): void => {
                ctxRef.current?.beginPath();
                ctxRef.current?.moveTo(x1, y1);
                ctxRef.current?.lineTo(x2, y2);
                ctxRef.current?.stroke();
            }

            // Set up parameters to iterate through line
            var t = 0;
            var dist = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2));
            var x = line.x1;
            var y = line.y1;
            var prevX = line.x1;
            var prevY = line.y1;

            // Set up the sound generation so it happens as the line is being drawn
            const osc = new Tone.Oscillator().toDestination();
            osc.frequency.value = line.y1;
            osc.start();

            // Plays one step of the animation and sound tied to the line
            const animateStep = (): void => {
                // Speed is one unit of distance per time (update?)
                if (t < dist) {
                    // Randomize the color of every step so we can confirm it's drawing cumulatively
                    if (ctxRef.current != null) {
                        ctxRef.current.strokeStyle = '#'+(0x1000000+Math.random()*0xffffff).toString(16).substr(1,6);
                    }

                    prevX = x;
                    prevY = y;
                    // Parametric equations for the line
                    x = line.x1 + ((line.x2 - line.x1) / dist) * t;
                    y = line.y1 + ((line.y2 - line.y1) / dist) * t;
                    
                    drawLine(prevX, prevY, x, y);
                    // sonify the line as it's being drawn
                    osc.frequency.rampTo(y, 0);

                    t++;
                    window.requestAnimationFrame(animateStep);
                } else {
                    // Stop all sound when the line is finished animating
                    // TODO: Maybe hold the pitch a little bit so it doesn't sharp cut off?
                    osc.stop();
                    resolve();
                }
            }
            animateStep()
        });
    }

    const scheduleLines = async (currentLines: Array<Line>): Promise<void[]> => {
        // Append active and passive lines into a new list
        setPassiveLines([...passiveLines, ...activeLines]);
        setActiveLines(currentLines);
        // Call spinLine() on all members of currentLines at the same time, wait until they're all done
        return await Promise.all(currentLines.map(spinLine));
    }

    const weaveWeb = () => {
        scheduleLines([new Line(0, 0, 200, 200)])
            .then((result) => scheduleLines([new Line(200, 0, 0, 200), new Line(0, 100, 200, 100)]))
    }

    // Dummy function to add to the demo button callback
    const addLine = () => {
        spinLine(new Line(20, 220, 40, 440));
    }

    // Dummy function to see if renders active and passive line states are working properly
    const addSquare = () => {
        setPassiveLines([...passiveLines, ...activeLines])
        setActiveLines([new Line(rand(0, 100), rand(0, 100), rand(0, 100), rand(0, 100))]);
        console.log(passiveLines.length);
    }

    return (
        <div>
            <canvas ref={canvasRef}></canvas>
            <button onClick={addSquare}>Add Square</button>
            <button onClick={addLine}>Add Line</button>
            <button onClick={weaveWeb}>weave</button>
        </div>
    )
}

export default Canvas