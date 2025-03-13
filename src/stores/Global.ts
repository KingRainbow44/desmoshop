import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import Transaction from "@graphing/Transaction.ts";

const excluded: (keyof SettingsStore)[] = ["working", "workingType", "t"];

type WorkingExpression = "line" | "parabola";

interface SettingsStore {
    working: Transaction | undefined;
    workingType: WorkingExpression | undefined;

    /**
     * This doubles as decimal precision.
     */
    gridSnap: number;

    /**
     * Creates a transaction.
     */
    t(type: WorkingExpression): Transaction;
}

const useSettings = create<SettingsStore>()(
    persist(
        (set, _) => ({
            working: undefined,
            workingType: undefined,
            gridSnap: 5,

            /**
             * Creates a new transaction.
             *
             * When it is committed, the working state is reset.
             */
            t(type: WorkingExpression): Transaction {
                const working = new Transaction(
                    Calc.getState(),
                    () => set({ working: undefined, workingType: undefined })
                );

                set({ working, workingType: type });

                return working;
            }
        } as SettingsStore),
        {
            name: "desmosshop-state",
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => Object.fromEntries(
                Object.entries(state)
                    .filter(([key]) => !excluded.includes(key as keyof SettingsStore))
            )
        }
    )
);

export default useSettings;