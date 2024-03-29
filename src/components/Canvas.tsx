import * as Tone from "tone";
import { MutableRefObject, useEffect, useRef, useState } from "react"
import { Vector, Line, fuzz, Radius, rand, degToRad, shuffle, randInt, ColorMode, RGBColor, clamp, numToScale, Scale, octave, randHexColor, randNote } from "../utils";
import { Button } from "./styled/Button.styled";
import { Label } from "./styled/Label.styled";
import { Container } from "./styled/Container.styled";

const Canvas = () => {
    const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef<HTMLCanvasElement>(null);
    const ctxRef: MutableRefObject<CanvasRenderingContext2D | null> = useRef<CanvasRenderingContext2D>(null);
    
    const reverbRef: MutableRefObject<Tone.Reverb | null> = useRef<Tone.Reverb>(null);
    const gainRef: MutableRefObject<Tone.Gain | null> = useRef<Tone.Gain>(null);
    const panRef: MutableRefObject<Tone.Panner3D | null> = useRef<Tone.Panner3D>(null);
    const synthRef: MutableRefObject<Tone.PolySynth | null> = useRef<Tone.PolySynth>(null);

    const synths: MutableRefObject<Array<Tone.Synth> | null> = useRef<Array<Tone.Synth>>(null);

    const [activeLines, setActiveLines] = useState(new Array<Line>());
    const [passiveLines, setPassiveLines] = useState(new Array<Line>());
    const [playing, setPlaying] = useState(false);
    const [display, setDisplay] = useState(false);
    const [hover, setHover] = useState(false);

    // The three major axes for determining sound
    var axisA: Line | null = null;
    var axisB: Line | null = null;
    var axisC: Line | null = null;
    var anchorA: Line | null = null;
    var anchorB: Line | null = null;
    var bridge: Line | null = null;

    // CHANGE FOLLOWING PARAMETERS TO AFFECT HOW THE WEB GENERATION LOOKS

    // Y value to start spinning the web from, so that it's not at the top of the screen
    var initY = (window.innerHeight - 50) / 30;
    var initY2 = (window.innerHeight - 50) / 30;

    // How to color the steps of the web
    var colorMode: ColorMode = Math.random() > 0.5 ? ColorMode.RANDOM : ColorMode.MONOCHROME;

    // Main color in MONOCHROME color mode
    var mainColor = new RGBColor(randHexColor());

    // How much to vary the main color in MONOCHROME mode
    var colorFuzz = 0.1;

    // Width of all threads
    var threadWidth = 5;

    // Maximum gap in degrees between two radii
    var maxRadiusAngle = 30;
    
    // Determines how close thread can be generated to another, larger values mean more spaced out
    var minRadiusAngleFactor = 0.25;

    // Determines the number of rings in the auxiliary spiral
    var auxRings = 5;

    // How many capture rings should be between two adjacent arms of the auxiliary spiral
    var capCapacity = 1;

    // Determines how fast threads are spun
    var speed = 30;

    // Initialize Canvas and Context
    useEffect(() => {
        const canvas: HTMLCanvasElement | null = canvasRef.current;
        if (canvas != null) {
            canvas.width = window.innerWidth - 50;
            canvas.height = window.innerHeight - 150;
            ctxRef.current = canvas.getContext('2d');

            // Initialize the canvas
            if (ctxRef.current != null) {
                ctxRef.current.fillStyle = "white";
                ctxRef.current.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Initialize sounds
            Tone.Transport.start();
            gainRef.current = new Tone.Gain().toDestination();
            panRef.current = new Tone.Panner3D().connect(gainRef.current)
            reverbRef.current = new Tone.Reverb(3).connect(gainRef.current);
            synths.current = [];
        }
    }, []);

    const initWeb = () => {
        // Y value to start spinning the web from, so that it's not at the top of the screen
        initY = (window.innerHeight - 50) / randInt(4, 12);
        initY2 = (window.innerHeight - 50) / randInt(4, 12);

        // How to color the steps of the web
        colorMode = Math.random() > 0.5 ? ColorMode.RANDOM : ColorMode.MONOCHROME;

        // Main color in MONOCHROME color mode
        mainColor = new RGBColor(randHexColor());

        // How much to vary the main color in MONOCHROME mode
        colorFuzz = Math.random() * 0.5;

        // Width of all threads
        threadWidth = randInt(1, 11);

        // Maximum gap in degrees between two radii
        maxRadiusAngle = randInt(10, 60);
        
        // Determines how close thread can be generated to another, larger values mean more spaced out
        minRadiusAngleFactor = (Math.random() * 0.5) + .1;

        // Determines the number of rings in the auxiliary spiral
        auxRings = randInt(2, 8);

        // How many capture rings should be between two adjacent arms of the auxiliary spiral
        capCapacity = randInt(1, 4);

        // Determines how fast threads are spun
        speed = randInt(2, 30);
    }

    // THESE FUNCTIONS CONTROL ALL THE ACTIVE SONIFICATION

    /**
     * Initializes line for playing sound.
     * @param line The line that's being sonified
     * @param soundType Type/phase of the sonification/composition to play
     */
    const startLineSound = (line: Line, soundType: number) => {
        if (reverbRef.current && ctxRef.current && panRef.current && synths.current) {
            let normLine = line.length / ctxRef.current.canvas.width;
            let maxDimension = Math.max(ctxRef.current.canvas.width, ctxRef.current.canvas.height)
            let minDimension = Math.min(ctxRef.current.canvas.width, ctxRef.current.canvas.height)
            let normX = (((line.start.x / ctxRef.current.canvas.width) * 2) - 1) * (maxDimension / minDimension);
            let normY = (((line.start.y / ctxRef.current.canvas.height) * 2) - 1);

            switch (soundType) {
                case 0:
                    let synth = new Tone.Synth({volume: -12, oscillator: {type: "sine"}}).connect(reverbRef.current);
                    synths.current.push(synth);
                    let note = octave(randNote(2), -1);

                    Tone.Transport.scheduleRepeat(time => {
                        synth.triggerAttackRelease(note, 1 / Math.max((normLine * speed), 0.1));
                    }, 10 / (normLine * speed))
    
                    break;
                case 1:
                    let synth1= new Tone.Synth({volume: -15, oscillator: {type: "triangle"}}).connect(reverbRef.current);
                    synths.current.push(synth1);
                    let note1 = randNote(2);

                    Tone.Transport.scheduleRepeat(time => {
                        synth1.triggerAttackRelease(note1, 1 / Math.max((normLine * speed), 0.1));
                    }, 10 / (normLine * speed))
                    break;
                case 2:
                    if (!synthRef.current) {
                        console.log("setting synth ref");
                        synthRef.current = new Tone.PolySynth({volume: -15}).connect(panRef.current);
                    }
                    synthRef.current.set({oscillator: {type: "sine"}});

                    let note2 = octave(randNote(2), 1);
                    synthRef.current.triggerAttackRelease(note2, 1 / Math.max((normLine * speed), 0.1));
                    break;
                case 3:
                    if (synthRef.current) {
                        console.log("changing synth ref");
                        synthRef.current.set({volume: -30, oscillator: {type: "sawtooth"}});
                        let note3 = octave(randNote(2), 1);

                        panRef.current.positionX.value = normX;
                        panRef.current.positionY.value = normY;
                        synthRef.current.triggerAttackRelease(note3, 0.1);
                    }
                    
                    break;
                default:
                    if (synthRef.current) {
                        console.log("changing synth ref 2");
                        synthRef.current.set({volume: -30, oscillator: {type: "square"}});
                        let note4 = octave(randNote(4), 1);

                        panRef.current.positionX.value = normX;
                        panRef.current.positionY.value = normY;
                        synthRef.current.triggerAttackRelease(note4, 0.1);
                    }
                    break;
            }
        }
    }

    /**
     * Sonifies a point p.
     * @param p Point to sonify.
     * @param soundType Type/phase of the sonification/composition to play
     */
    const soundPoint = (point: Vector, soundType: number): void => {
        // Account for the starting Y
        const p = new Vector(point.x, point.y);
    }

    /**
     * Cleans up and ends the line's sound.
     * @param line The line that's being sonified
     * @param soundType Type/phase of the sonification/composition to play
     */
    const endLineSound = (line: Line, soundType: number) => {
        switch (soundType) {
            case 0:
                if (synthRef.current) {
                    // osc1Ref.current.stop();
                }
                break;
            case 1:
                if (synthRef.current) {
                    // osc1Ref.current.stop();
                }
                break;
            default:
        }
    }

    const startSound = () => {
        Tone.Transport.start();
        if (gainRef.current) {
            gainRef.current.gain.rampTo(1, 0.1);
        }
    }

    /**
     * Stop and clean up all sounds at the end of the composition.
     */
    const endSound = () => {
        Tone.Transport.stop();
        if (gainRef.current) {
            gainRef.current.gain.rampTo(0, 1);
        }
        if (synths.current) {
            synths.current.forEach(node => {
                node.dispose();
            });
        }
    }

    /**
     * Spins a line of silk and sound.
     * @param line The line to be animated and played.
     * @returns Promise is resolved when the line is finished spinning.
     */
    const spinLine = (line: Line, soundType: number = 1): Promise<void> => {
        return new Promise(async resolve => {
            // Make the width a little more visible for now
            if (ctxRef.current != null) {
                ctxRef.current.lineWidth = threadWidth;
            }

            // Set up parameters to iterate through line
            var t = 0;
            var dist = Math.sqrt(Math.pow(line.end.x - line.start.x, 2) + Math.pow(line.end.y - line.start.y, 2));
            var x = line.start.x;
            var y = line.start.y;
            var prevX = line.start.x;
            var prevY = line.start.y;

            startLineSound(line, soundType);

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
             * Steps through line, rendering and generating sound for each step.
             */
            const lineStep = async (): Promise<void> => {
                // Speed is one unit of distance per time (update?)
                if (t <= dist) {
                    // Randomize the color of every step so we can confirm it's drawing cumulatively
                    if (ctxRef.current != null) {
                        switch (colorMode) {
                            case ColorMode.RANDOM:
                                ctxRef.current.strokeStyle = randHexColor();
                                break;
                            case ColorMode.MONOCHROME:
                                ctxRef.current.strokeStyle = `rgb(
                                    ${clamp(fuzz(mainColor.r, colorFuzz), 0, 255)},
                                    ${clamp(fuzz(mainColor.g, colorFuzz), 0, 255)},
                                    ${clamp(fuzz(mainColor.b, colorFuzz), 0, 255)}
                                )`;
                                break;
                        }
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

                    // Play the line step being spun if activeSound on
                    soundPoint(newPoint, soundType);

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
                    endLineSound(line, soundType);
                    resolve();
                }
            }
            lineStep()
        });
    }

    const weaveLines = async (currentLines: Array<Line>, soundType: number = 0): Promise<void[]> => {
        // Append active and passive lines into a new list
        setPassiveLines([...passiveLines, ...activeLines]);
        setActiveLines(currentLines);

        // Play the line passively throughout the piece
        
        // currentLines.forEach(line => {
        //     // soundPassive(line);
        // });
        
        // DRAWS AND ACTIVELY SOUNDS ALL LINES ONE AT A TIME
        // Call spinLine() on all members of currentLines at the same time, wait until they're all done
        return await Promise.all(currentLines.map((currentLine) => spinLine(currentLine, soundType)));
    }

    // Actual sequence for weaving the web
    const weaveWeb = async () => {
        startSound();
        initWeb();

        // Web is based off a different point on the line each time

        if (canvasRef.current != null) {
            canvasRef.current.width = window.innerWidth - 50;
            canvasRef.current.height = window.innerHeight - 150;
            ctxRef.current = canvasRef.current.getContext('2d');

            const width = canvasRef.current.width;
            const height = canvasRef.current.height;

            // Erase previous canvas
            if (ctxRef.current) {
                ctxRef.current.fillStyle = "white";
                ctxRef.current.fillRect(0, 0, width, height);
            }

            // GENERATE ALL THREADS AND POINTS BEFORE RENDERING

            // Points that define the triangle
            const originA = new Vector(0, fuzz(initY, 1));
            const originB = new Vector(width, fuzz(initY2, 1));
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
            const branchC = new Line(originC, middle);
            
            // Three main axes
            axisA = new Line(originA, branchA.intersect(anchorA));
            axisB = new Line(originB, branchB.intersect(anchorB));
            axisC = new Line(originC, branchC.intersect(bridge));

            // Frame threads

            const axisLeftA = new Line(middle, axisA.end);
            const axisLeftB = new Line(middle, axisB.end);
            const axisLeftC = new Line(middle, axisC.end);

            // Radius of largest circle that be inscribed within the triangle, which approximates the size of the spiral
            const incircleRadius = [axisLeftA.length, axisLeftB.length, axisLeftC.length].sort((a, b) => {return a - b})[0];

            const axisAFramePoint = branchA.reverse().pointAtAbs(incircleRadius);
            const axisAPara = middle.toSpace(axisAFramePoint);
            // Line perpendicular to axis A at the incircle radius point
            const axisAPerpVec = new Vector(axisAPara.y, - axisAPara.x).plus(axisAFramePoint);
            const aPerp = new Line(axisAFramePoint, axisAPerpVec);

            const axisBFramePoint = branchB.reverse().pointAtAbs(incircleRadius);
            const axisBPara = middle.toSpace(axisBFramePoint);
            const axisBPerpVec = new Vector(axisBPara.y, - axisBPara.x).plus(axisBFramePoint);
            const bPerp = new Line(axisBFramePoint, axisBPerpVec);

            const axisCFramePoint = branchC.reverse().pointAtAbs(incircleRadius);
            const axisCPara = middle.toSpace(axisCFramePoint);
            const axisCPerpVec = new Vector(axisCPara.y, - axisCPara.x).plus(axisCFramePoint);
            const cPerp = new Line(axisCFramePoint, axisCPerpVec);

            const framePointAB = fuzz(new Line(originA, aPerp.intersect(anchorB)).length / anchorB.length);
            const framePointAC = fuzz(new Line(originA, aPerp.intersect(bridge)).length / bridge.length);

            const framePointBA = fuzz(new Line(originB, bPerp.intersect(anchorA)).length / anchorA.length);
            const framePointBC = fuzz(new Line(originB, bPerp.intersect(bridge)).length / bridge.length);

            const framePointCA = fuzz(new Line(originC, cPerp.intersect(anchorA)).length / anchorA.length);
            const framePointCB = fuzz(new Line(originC, cPerp.intersect(anchorB)).length / anchorB.length);

            const frameA = new Line(anchorB.pointAt(framePointAB), bridge.pointAt(framePointAC));
            const frameB = new Line(anchorA.pointAt(framePointBA), bridge.reverse().pointAt(framePointBC));
            const frameC = new Line(anchorB.reverse().pointAt(framePointCB), anchorA.reverse().pointAt(framePointCA));

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
            /**
             * Radial threads including branches that go from the middle to the frames of the web.
             */
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

                    const angleDifference = (nextRadius.angle - currRadius.angle + 360) % 360;

                    // If there's still enough space in between two adjacent radii, we add a new one
                    if (angleDifference > maxRadiusAngle) {

                        // Keep generating a new random angle until it's not too close to either bordering radius
                        var newAngle = rand(currRadius.angle, currRadius.angle + angleDifference); // 387 
                        // Angle from current to newly generated radius
                        var angleCurrNew = (newAngle - currRadius.end.getAngle(middle) + 360) % 360;
                        // Angle from next newly generated radius to next angle
                        var angleNextNew = (nextRadius.end.getAngle(middle) - newAngle + 360) % 360; // = 115 for the 330 to 85 case

                        while (angleCurrNew < angleDifference * minRadiusAngleFactor || angleNextNew < angleDifference * minRadiusAngleFactor) {
                            newAngle = rand(currRadius.angle, currRadius.angle + angleDifference);
                            angleCurrNew = (newAngle - currRadius.end.getAngle(middle) + 360) % 360;
                            angleNextNew = (nextRadius.end.getAngle(middle) - newAngle + 360) % 360;
                        }

                        const newAngle360 = (newAngle + 360) % 360;

                        const unitRadiusLine = new Line(middle, new Vector(Math.cos(degToRad(newAngle360)), Math.sin(degToRad(newAngle360))).plus(middle));

                        // Find the border thread that the new radius will first intersect
                        var border = borderThreads[0];
                        var minDist: number | null = null;
                        var relInter = unitRadiusLine.intersect(borderThreads[0]).toSpace(middle);
                        
                        for (let j = 0; j < borderThreads.length; j++) {
                            const intersectPoint = unitRadiusLine.intersect(borderThreads[j]);

                            const nextDist = intersectPoint.toSpace(middle).mag();
                            relInter = intersectPoint.toSpace(middle);
                            const relUnitEnd = unitRadiusLine.end.toSpace(middle);

                            if (Math.sign(relInter.x) === Math.sign(relUnitEnd.x) && Math.sign(relInter.y) === Math.sign(relUnitEnd.y) && (minDist == null || nextDist < minDist)) {
                                minDist = nextDist;
                                border = borderThreads[j];
                            }
                        }

                        const newRadius = new Radius(middle, unitRadiusLine.intersect(border), newAngle360);
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
            var terminalSpoke = spokes[auxIndex];
            var terminalSpokeIndex = auxI;

            while (pointOnSpiral < spokes[auxI].length) {
                // Direction of spiral iteration is random
                auxDir === true ? auxIndex++ : auxIndex--;
                pointOnSpiral += auxIncrement;

                // Circularly iterates through array regardless of positive or negative indices
                auxI = ((auxIndex % spokes.length) + spokes.length) % spokes.length;

                var fuzzedPoint = fuzz(pointOnSpiral, 0.05);

                // If spiral point goes over, set it to the length
                if (fuzzedPoint > spokes[auxI].length) fuzzedPoint = spokes[auxI].length;

                const nextPoint = spokes[auxI].pointAtAbs(fuzzedPoint);
                spokes[auxI].auxPoints.unshift(nextPoint);

                const auxLine = new Line(prevPoint, nextPoint);
                prevPoint = nextPoint;
                auxiliarySpiral.push(auxLine);

                if (pointOnSpiral >= spokes[auxI].length) {
                    terminalSpoke = spokes[auxI];
                    terminalSpokeIndex = auxI;
                }
            }

            // GENERATE CAPTURE SPIRAL
            var captureSpiral = new Array<Line>();
            var ringEnds = new Array<Vector>();

            const startOutBound = terminalSpoke.auxPoints[0];
            const startInBound = terminalSpoke.auxPoints[1];
            const startOutPoint = terminalSpoke.lineValueAt(startOutBound);
            const startInPoint = terminalSpoke.lineValueAt(startInBound);
            var startAuxZone;

            if (startOutPoint && startInPoint) {
                startAuxZone = startOutPoint - startInPoint
                for (let i = 0; i < capCapacity; i++) {
                    const startRingEnd = ((capCapacity - i) * (startAuxZone / (capCapacity + 1))) + startInPoint;
                    ringEnds.push(terminalSpoke.pointAt(startRingEnd));
                }
            };

            var currSpoke = terminalSpoke;
            
            // Keep adding capture threads so long as the active ring, where the threads are going inside, has one more auxiliary ring above it
            // I.e. terminate the capture threads above the last auxiliary ring on the spoke where the auxiliary ring terminates
            for (let currRing = 0; currRing < currSpoke.auxPoints.length - 1; currRing++) {

                for (let capCount = 0; capCount < capCapacity; capCount++) {

                    var prevCapPoint: Vector | undefined = ringEnds.shift();
                    var spokeCounter = terminalSpokeIndex;
                    // Iterate through spokes opposite the direction of the auxiliary spiral until back at starting spoke
                    for (let i = 0; i <= spokes.length; i++) {

                        var spokeI = ((spokeCounter % spokes.length) + spokes.length) % spokes.length;
                        currSpoke = spokes[spokeI];

                        if (currRing >= currSpoke.auxPoints.length - 1) break;

                        var outBound = currSpoke.auxPoints[currRing];
                        var inBound = currSpoke.auxPoints[currRing + 1];

                        if (i === spokes.length) {
                            outBound = currSpoke.auxPoints[currRing + 1];
                            inBound = currSpoke.auxPoints[currRing + 2];
                        }

                        const outPoint = currSpoke.lineValueAt(outBound);
                        const inPoint = currSpoke.lineValueAt(inBound);

                        if (outPoint && inPoint) {
                            const auxZone = outPoint - inPoint;
                            // Split auxZone into equal segments based on how many capture rings we want, represented as capCapacity
                            // Then iterate backwards from capCapacity to make rings from the outside in (e.g. 3/4, 2/4, 1/4), as radii go from the middle of the web outwards
                            // Finally add the fraction to the inner boundary to get the total lineValue of the new point
                            const pointLocation = fuzz((capCapacity - capCount) * (auxZone / (capCapacity + 1))) + inPoint;
    
                            const capPoint = spokes[spokeI].pointAt(pointLocation);
                            spokes[spokeI].capPoints.push(capPoint);
                            
                            if (prevCapPoint !== undefined) {
                                const capSegment = new Line(prevCapPoint, capPoint);
                                if (capSegment.length !== 0) {
                                    captureSpiral.push(capSegment);
                                }
                            }
                            prevCapPoint = capPoint;
                            if (i === spokes.length) {
                                ringEnds.push(capPoint);
                                prevCapPoint = undefined;
                            }
                        }
                        auxDir === true ? spokeCounter-- : spokeCounter++;
                    }
                }
            }

            // Randomize the order that we draw the radii in
            shuffle(radii);

            const drawAnchorA = anchorA;
            const drawAnchorB = anchorB;
            const drawBridge = bridge;

            // Randomize the sound axes after establishing the frames to randomize how sounds are mapped
            var axes = [{axis: axisA, anchor: anchorA}, {axis: axisB, anchor: anchorB}, {axis: axisC, anchor: bridge}];
            shuffle(axes);
            axisA = axes[0].axis;
            axisB = axes[1].axis;
            axisC = axes[2].axis;
            anchorA = axes[0].anchor;
            anchorB = axes[1].anchor;
            bridge = axes[2].anchor;
            
            // ACTUAL RENDERING OF ALL THE THREADS 

            await weaveLines([drawBridge], 0);
            
            await weaveLines([branchA], 0);
            await weaveLines([branchB], 0);
            await weaveLines([branchC.reverse()], 0);

            await weaveLines([drawAnchorA], 0);
            await weaveLines([drawAnchorB], 0);

            Math.random() < 0.5 ? await weaveLines([frameA], 1) : await weaveLines([frameA.reverse()], 1);
            Math.random() < 0.5 ? await weaveLines([frameB], 1) : await weaveLines([frameB.reverse()], 1);
            Math.random() < 0.5 ? await weaveLines([frameC], 1) : await weaveLines([frameC.reverse()], 1);

            for (let i = 0; i < radii.length; i++) {
                // Randomize direction of radius threads
                const randRadius = Math.random() < 0.5 ? radii[i] : new Radius(radii[i].end, radii[i].start, radii[i].angle);
                await weaveLines([randRadius], 2);
            }

            for (let i = 0; i < auxiliarySpiral.length; i++) {
                await weaveLines([auxiliarySpiral[i]], 3);
            }

            for (let i = 0; i < captureSpiral.length; i++) {
                await weaveLines([captureSpiral[i]], 4);
            }

            endSound();
            setPlaying(false);
        }   
    }

    const openCanvas = () => {
        setPlaying(true);
        setDisplay(true);
        weaveWeb();
    }

    return (
        <div>
            {"ORB WEAVER".split("").map((item, key) => {
                return <Label key={key} size={"60pt"}>{item}</Label>
            })}
            <div onClick={() => {if (!playing) setHover(!hover)}} style={{cursor: !playing ? `pointer` : `auto`}}>
                {hover && display && !playing && <Container height={window.innerHeight - 150}>
                    <Button onClick={() => {
                            setDisplay(false);
                            setHover(false);
                        }}>reset?</Button>
                </Container>}
                <canvas ref={canvasRef} style={{display: display && !hover ? `block` : `none`}}></canvas>
            </div>
            {!display && !playing && <Container height={window.innerHeight - 150}>
                <Button onClick={openCanvas}>weave</Button>
            </Container>}
        </div>
    )
}

export default Canvas