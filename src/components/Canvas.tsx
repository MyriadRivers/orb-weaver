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
    useEffect(() => {
        activeLines.forEach(line => {
            draw(line);
            sound(line);
        }); 
    }, [activeLines])

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

    const animateLine = (line: Line): void => {

        // Draws a line from (x1, y1) to (x2, y2) in the canvas
        const drawLine = (x1: number, y1: number, x2: number, y2: number): void => {
            ctxRef.current?.beginPath();
            ctxRef.current?.moveTo(x1, y1);
            ctxRef.current?.lineTo(x2, y2);
            ctxRef.current?.stroke();
        }

        var t = 0;
        var dist = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2));

        var x = line.x1;
        var y = line.y1;
        var prevX = line.x1;
        var prevY = line.y1;

        const animateStep = (): void => {
            // Speed is one unit of distance per time (update?)
            if (t < dist) {
                if (ctxRef.current != null) {
                    ctxRef.current.strokeStyle = '#'+(0x1000000+Math.random()*0xffffff).toString(16).substr(1,6);
                }
                prevX = x;
                prevY = y;
                x = line.x1 + ((line.x2 - line.x1) / dist) * t;
                y = line.y1 + ((line.y2 - line.y1) / dist) * t;
                drawLine(prevX, prevY, x, y);
                t++;
                window.requestAnimationFrame(animateStep);
            }
        }
        animateStep()
        
    }

    const addLine = () => {
        animateLine(new Line(20, 20, 600, 600));
    }

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
        </div>
    )
}

export default Canvas