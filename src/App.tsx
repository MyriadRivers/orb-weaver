// import * as Tone from 'tone';

import Canvas from "./components/Canvas";
// import { useEffect } from 'react';

// interface Line {
//     startX: number;
//     startY: number;
// }

function App() {

    // useEffect(() => {
    //     draw(activeLines);
    //     sound(activeLines);
    // }, [activeLines])



    // const draw = (ctx: CanvasRenderingContext2D): void => {
    //     var activeLines: Array<Line> = [];
    //     var finishedLines: Array<Line> = [];

    //     ctx.fillStyle = "#d12f4e";
    //     ctx.fillRect(10, 10, 100, 100)
    // }

    // const sound = (): void => {
    //     const synth = new Tone.Synth().toDestination();
    //     synth.triggerAttackRelease("C4", "8n");
    // }

    return (
        <div className="App">
            <Canvas />
        </div>
    );
}

export default App;
