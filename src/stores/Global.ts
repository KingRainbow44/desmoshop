import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import Transaction from "@graphing/Transaction.ts";

/**
 * This is the range of decimal precision supported.
 */
const PRECISION_BOUNDS = [0, 8];

const excluded: (keyof GlobalStore)[] = ["working", "workingType", "t"];

type WorkingExpression = "line" | "parabola";

interface GlobalStore {
    working: Transaction | undefined;
    workingType: WorkingExpression | undefined;

    /**
     * This doubles as decimal precision.
     */
    precision: number;

    /**
     * The maximum distance to snap to a nearby point.
     */
    pointSnap: number;

    /**
     * Changes the decimal precision.
     *
     * @param amount The amount to change the precision by.
     */
    changePrecision(amount: number): void;

    /**
     * Creates a transaction.
     */
    t(type: WorkingExpression): Transaction;
}

const useGlobal = create<GlobalStore>()(
    persist(
        (set, _) => ({
            working: undefined,
            workingType: undefined,
            precision: 5,
            pointSnap: 0.1,

            /**
             * @inheritDoc
             */
            changePrecision(amount: number) {
                set(({ precision }) => {
                    // Clamp the value to the bounds.
                    const value = Math.max(
                        PRECISION_BOUNDS[0],
                        Math.min(PRECISION_BOUNDS[1], precision + amount)
                    );

                    return { precision: value };
                });
            },

            /**
             * @inheritDoc
             */
            t(type: WorkingExpression): Transaction {
                const working = new Transaction(
                    Calc.getState(),
                    () => set({ working: undefined, workingType: undefined })
                );

                set({ working, workingType: type });

                return working;
            }
        } as GlobalStore),
        {
            name: "desmosshop-state",
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => Object.fromEntries(
                Object.entries(state)
                    .filter(([key]) => !excluded.includes(key as keyof GlobalStore))
            )
        }
    )
);

export default useGlobal;