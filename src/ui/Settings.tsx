import useGlobal from "@app/stores/Global.ts";

function Settings() {
    const state = useGlobal();

    return (
        <div>
            <span>Precision: {state.gridSnap}dp</span>
        </div>
    );
}

export default Settings;