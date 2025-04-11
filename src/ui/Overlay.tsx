import useGlobal from "@app/stores/Global.ts";
import Actions from "@graphing/Actions.ts";
import Utility from "@graphing/Utility.ts";

function Overlay() {
    const state = useGlobal();

    return (
        <div className={"p-2 flex flex-col bg-blue-400 rounded-xl text-white"}>
            <span className={"mb-2 text-center"}>Precision: {state.precision}dp</span>

            <div className={"flex flex-col gap-1"}>
                <button onClick={Actions.table}>
                    Make Table
                </button>

                <button onClick={Utility.combine}>
                    Combine Expressions
                </button>

                <button onClick={Utility.simplify}>
                    Simplify Expressions
                </button>
            </div>
        </div>
    );
}

export default Overlay;