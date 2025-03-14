import useGlobal from "@app/stores/Global.ts";

function Settings() {
    const state = useGlobal();

    return (
        <div>
            <span>Precision: {state.precision}dp</span>
        </div>
    );
}

export default Settings;