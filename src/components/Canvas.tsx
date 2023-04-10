import * as Tone from "tone";
import { MutableRefObject, useEffect, useRef, useState } from "react"
import { Vector, Line, fuzz, Radius, rand, degToRad, shuffle, randInt } from "../utils";

const Canvas = () => {
    const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef<HTMLCanvasElement>(null);
    const ctxRef: MutableRefObject<CanvasRenderingContext2D | null> = useRef<CanvasRenderingContext2D>(null);

    const [activeLines, setActiveLines] = useState(new Array<Line>());
    const [passiveLines, setPassiveLines] = useState(new Array<Line>());

    // The three major axes for determining sound
    var axisA: Line | null = null;
    var axisB: Line | null = null;
    var axisC: Line | null = null;
    var anchorA: Line | null = null;
    var anchorB: Line | null = null;
    var bridge: Line | null = null;

    // CHANGE FOLLOWING PARAMETERS TO AFFECT HOW THE WEB GENERATION LOOKS

    // Y value to start spinning the web from, so that it's not at the top of the screen
    const initY = (window.innerHeight - 50) / 30;

    // Maximum gap in degrees between two radii
    const maxRadiusAngle = 30;
    
    // Determines how close thread can be generated to another, larger values mean more spaced out
    const minRadiusAngleFactor = 0.25;

    // Determines the number of rings in the auxiliary spiral
    const auxRings = 5;

    // Determines how fast threads are spun
    const speed = 10;

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
        return new Promise(resolve => {
            // Make the width a little more visible for now
            if (ctxRef.current != null) {
                ctxRef.current.lineWidth = 1;
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

            if (axisA && axisB && axisC && anchorA && anchorB && bridge) {
                const startPoint = new Vector(line.start.x, line.start.y);
                // Initialize pitch
                osc1.frequency.value = startPoint.percentOf(axisA, anchorA) * 220;
                osc2.frequency.value = startPoint.percentOf(axisA, anchorA) * 220;
                // Initialize volume
                gain1.gain.value = 1 - startPoint.percentOf(axisB, anchorB);
                gain2.gain.value = startPoint.percentOf(axisB, anchorB);
                // Initialize rhythm (tremolo)
                // +1 to account for axis 3 going from bottom up, so percents will be negative from 0 to -1
                tremolo1.frequency.value = (startPoint.percentOf(axisC, bridge)) * 20;
                tremolo2.frequency.value = (startPoint.percentOf(axisC, bridge)) * 20;
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
                if (axisA && axisB && axisC && anchorA && anchorB && bridge) {
                    // Axis A: Pitch
                    osc1.frequency.rampTo(220 + p.percentOf(axisA, anchorA) * 220, 0);
                    osc2.frequency.rampTo(220 + p.percentOf(axisA, anchorA) * 220, 0);
                    // Axis B: Timbre
                    gain1.gain.rampTo(1 - p.percentOf(axisB, anchorB));
                    gain2.gain.rampTo(p.percentOf(axisB, anchorB));
                    // Axis C: Rhythm
                    tremolo1.frequency.rampTo((p.percentOf(axisC, bridge)) * 20, 0);
                    tremolo2.frequency.rampTo((p.percentOf(axisC, bridge)) * 20, 0);
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

            // GENERATE ALL THREADS AND POINTS BEFORE RENDERING

            // Points that define the triangle
            const originA = new Vector(0, fuzz(initY, 1));
            const originB = new Vector(width, fuzz(initY, 1));
            const originC = new Vector(fuzz(width / 2), height)

            const bisectorAAngle = (originC.getAngle(originA) - originB.getAngle(originA)) / 2 + originB.getAngle(originA);
            const bisectorA = new Line(originA, new Vector(Math.cos(degToRad(bisectorAAngle)), Math.sin(degToRad(bisectorAAngle))).plus(originA));
            const bisectorBAngle = (originC.getAngle(originB) - originA.getAngle(originB)) / 2 + originA.getAngle(originB);
            const bisectorB = new Line(originB, new Vector(Math.cos(degToRad(bisectorBAngle)), Math.sin(degToRad(bisectorBAngle))).plus(originB));

            // Incenter of the triangle based on intersection of the angle bisectors
            const incenter = bisectorA.intersect(bisectorB);

            // Bridge thread, sides of the triangle
            bridge = new Line(originA, originB);
            anchorA = new Line(originB, originC);
            anchorB = new Line(originA, originC);

            const middle = new Vector(fuzz(incenter.x), fuzz(incenter.y));

            // Y Shape threads and anchor threads
            const branchA = new Line(originA, middle);
            const branchB = new Line(originB, middle);
            const branchC = new Line(middle, originC);
            
            // Three main axes
            axisA = new Line(originA, branchA.intersect(anchorA));
            axisB = new Line(originB, branchB.intersect(anchorB));
            axisC = new Line(originC, branchC.intersect(bridge));

            // Frame threads
            const framePos = 0.2;
            const frameFuzz = 0.1;
            const frameA = Math.random() < 0.5 ? 
                            new Line(bridge.pointAt(fuzz(framePos, frameFuzz)), anchorB.pointAt(fuzz(framePos, frameFuzz))) 
                            : new Line(anchorB.pointAt(fuzz(framePos, frameFuzz)), bridge.pointAt(fuzz(framePos, frameFuzz)));
            const frameB = Math.random() < 0.5 ? 
                            new Line(bridge.pointAt(fuzz(1 - framePos, frameFuzz)), anchorA.pointAt(fuzz(framePos, frameFuzz))) 
                            : new Line(anchorA.pointAt(fuzz(framePos, frameFuzz)), bridge.pointAt(fuzz(1 - framePos, frameFuzz)));
            const frameC = Math.random() < 0.5 ? 
                            new Line(anchorB.pointAt(fuzz(1 - framePos, frameFuzz)), anchorA.pointAt(fuzz(1 - framePos, frameFuzz))) 
                            : new Line(anchorA.pointAt(fuzz(1 - framePos, frameFuzz)), anchorB.pointAt(fuzz(1 - framePos, frameFuzz)));

            // Array containing the outmost border threads where radius threads will stop
            const borderThreads = [bridge, anchorA, anchorB, frameA, frameB, frameC];

            /**
             * Comparison function to sort radii by their angles.
             * @param r1 First radius.
             * @param r2 Second radius.
             * @returns Comparison value.
             */
            const sortByAngle = (r1: Radius, r2: Radius): number => {
                return Math.sign(r1.angle - r2.angle);  
            }

            /**
             * Comparison function to sort lines by their length.
             * @param l1 First line.
             * @param r2 Second line.
             * @returns Comparison value.
             */
            const sortByLength = (l1: Line, l2: Line): number => {
                return Math.sign(l1.length - l2.length);
            }

            var radii = new Array<Radius>();
            // Spokes are the radii but also include the branches
            const outwardsA = new Line(middle, originA);
            const outwardsB = new Line(middle, originB);
            const outwardsC = new Line(middle, originC);
            var spokes = radii.concat([new Radius(middle, outwardsA.intersect(frameA), originA.getAngle(middle)), 
                                       new Radius(middle, outwardsB.intersect(frameB), originB.getAngle(middle)), 
                                       new Radius(middle, outwardsC.intersect(frameC), originC.getAngle(middle))]);

            // ADD SPOKES RANDOMLY UNTIL THERE IS NO SPACE LEFT, DEPENDING ON GAP SIZE
            spokes.sort(sortByAngle);
            var hasSpace = true;
            var i = 0;
            const startingRadius = spokes[0];

            while (hasSpace) {
                const currRadius = spokes[i % spokes.length];
                const nextRadius = spokes[(i + 1) % spokes.length];

                // Checks against next radius in list in a circular fashion, when sorted ascending
                if  (currRadius && nextRadius) {

                    const angleDifference = (nextRadius.end.getAngle(middle) - currRadius.end.getAngle(middle) + 360) % 360;

                    // If there's still enough space in between two adjacent radii, we add a new one
                    if (angleDifference > maxRadiusAngle) {

                        // Keep generating a new random angle until it's not too close to either bordering radius
                        var newAngle = rand(currRadius.angle, currRadius.angle + angleDifference);
                        var angleCurrNew = (newAngle - currRadius.end.getAngle(middle) + 360) % 360;
                        var angleNextCurr = (nextRadius.end.getAngle(middle) - newAngle + 360) % 360;

                        while (angleCurrNew < angleDifference * minRadiusAngleFactor || angleNextCurr < angleDifference * minRadiusAngleFactor) {
                            newAngle = rand(currRadius.angle, currRadius.angle + angleDifference);
                            angleCurrNew = (newAngle - currRadius.end.getAngle(middle) + 360) % 360;
                            angleNextCurr = (nextRadius.end.getAngle(middle) - newAngle + 360) % 360;
                        }

                        const unitRadiusLine = new Line(middle, new Vector(Math.cos(degToRad(newAngle)), Math.sin(degToRad(newAngle))).plus(middle));

                        // Find the border thread that the new radius will first intersect
                        var border = borderThreads[0];
                        var minDist = unitRadiusLine.intersect(border).toSpace(middle).mag();
                        
                        for (let j = 0; j < borderThreads.length; j++) {
                            const intersectPoint = unitRadiusLine.intersect(borderThreads[j]);

                            const nextDist = intersectPoint.toSpace(middle).mag();
                            const relInter = intersectPoint.toSpace(middle);
                            const relUnitEnd = unitRadiusLine.end.toSpace(middle);

                            if (Math.sign(relInter.x) === Math.sign(relUnitEnd.x) && Math.sign(relInter.y) === Math.sign(relUnitEnd.y) && nextDist < minDist) {
                                minDist = nextDist;
                                border = borderThreads[j];
                            }
                        }

                        const newRadius = new Radius(middle, unitRadiusLine.intersect(border), newAngle);
                        // Adds a new radius after the current radius
                        spokes.splice((i + 1) % spokes.length, 0, newRadius);
                        radii.push(newRadius);

                    } else {
                        // Terminate adding radii if we have looped around back to the start and there is no space from the last radii to the starting radii
                        if (nextRadius === startingRadius) {
                            hasSpace = false;
                        }
                        // Only move on to the next gap if the space between the current radius and the next one is below the max gap size
                        i++;
                    }
                }
            }

            // GENERATE THE AUXILIARY SPIRAL
            var auxiliarySpiral = new Array<Line>();

            spokes.sort(sortByAngle);
            var spokesByLength = spokes.slice();

            // Get spacing by shortest spoke to ensure we don't get cut off too early
            spokesByLength.sort(sortByLength);
            const shortestSpokeLength = spokesByLength[0].length;


            const startSpokeIndex = randInt(0, spokes.length);
            const auxDir = Math.random() < 0.5 ? true : false;
            var auxWidth = 1 / auxRings;
            var auxIncrement = (auxWidth / spokes.length) * shortestSpokeLength;

            var auxIndex = startSpokeIndex;
            var pointOnSpiral = auxWidth * shortestSpokeLength;
            var prevPoint = spokes[auxIndex].pointAtAbs(pointOnSpiral);
            spokes[auxIndex].auxPoints.push(prevPoint);

            var auxI = auxIndex;

            while (pointOnSpiral < spokes[auxI].length) {
                // Direction of spiral iteration is random
                auxDir === true ? auxIndex++ : auxIndex--;
                pointOnSpiral += auxIncrement;

                // Circularly iterates through array regardless of positive or negative indices
                auxI = ((auxIndex % spokes.length) + spokes.length) % spokes.length;

                var fuzzedPoint = fuzz(pointOnSpiral, 0.05);

                // If spiral point goes over, set it to the length
                // TODO: HANDLE EDGE CASE OF LIMITING FUZZED POINT TO UNDER LENGTH OF Y LINES, WHICH GO PAST FRAMES, AS WELL
                if (fuzzedPoint > spokes[auxI].length) fuzzedPoint = spokes[auxI].length;

                const nextPoint = spokes[auxI].pointAtAbs(fuzzedPoint);
                spokes[auxI].auxPoints.push(nextPoint);

                const auxLine = new Line(prevPoint, nextPoint);
                prevPoint = nextPoint;
                auxiliarySpiral.push(auxLine);
            }
            

            // GENERATE CAPTURE SPIRAL

            // Randomize the order that we draw the radii in
            shuffle(radii);
            
            // ACTUAL RENDERING OF ALL THE THREADS 

            // Renders all the radii at once, useful for testing
            await weaveLines(radii);

            // Renders aux spiral all at once
            await weaveLines(auxiliarySpiral);

            await weaveLines([bridge]);
            
            await weaveLines([branchA, branchB]);
            await weaveLines([branchC]);

            await weaveLines([anchorA]);
            await weaveLines([anchorB]);

            await weaveLines([frameA]);
            await weaveLines([frameB]);
            await weaveLines([frameC]);

            // for (let i = 0; i < radii.length; i++) {
            //     // Randomize direction of radius threads
            //     const randRadius = Math.random() < 0.5 ? radii[i] : new Radius(radii[i].end, radii[i].start, radii[i].angle);
            //     await weaveLines([randRadius]);
            // }

            // for (let i = 0; i < auxiliarySpiral.length; i++) {
            //     await weaveLines([auxiliarySpiral[i]]);
            // }
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