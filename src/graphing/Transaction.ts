/**
 * A transaction callback consumer.
 */
export type Consumer = ((t: Transaction) => void) | undefined;

/**
 * A transaction is a set of operations that can only occur during state changes.
 */
class Transaction {
    public lastId: string = "";
    private _points: Coordinates[] = [];

    constructor(
        private readonly state: GraphState,
        private readonly consumer: Consumer = undefined
    ) {
    }

    /**
     * Returns a reference to the expressions in the state.
     */
    get expr(): Array<ExpressionState> {
        return this.state.expressions.list;
    }

    /**
     * Returns a reference to the points in the transaction.
     */
    get points(): Coordinates[] {
        return this._points;
    }

    /**
     * Gets the next ID for an expression.
     *
     * This will increment the next item ID.
     */
    get nextId(): string {
        const id = Calc.controller.__nextItemId++;
        return id.toString();
    }

    /**
     * Gets the index of the expression with the given ID.
     *
     * @param id The ID of the expression.
     */
    public indexOf(id: string): number {
        return this.expr.findIndex((expr) => expr.id == id);
    }

    /**
     * Moves the expression to the parent folder.
     *
     * @param id The ID of the expression to move.
     * @param parent The new parent folder.
     */
    public parent(id: string, parent: string): Transaction {
        const targetIndex = this.indexOf(id);
        const target = this.expr[targetIndex];

        const parentIndex = this.indexOf(parent);

        if (target?.type == "expression") {
            target.folderId = parent;
            this.expr.move(targetIndex, parentIndex + 1);
        }

        return this;
    }

    /**
     * Adds an expression to the transaction.
     *
     * @param func The function to generate the expression.
     * @param parent The parent folder.
     */
    public expression(func: (nextId: string) => ExpressionState, parent?: string): Transaction {
        const id = this.lastId = Calc.controller.__nextItemId.toString();
        const expr = func(id.toString());

        if (expr) {
            // Increment the next item ID.
            Calc.controller.__nextItemId++;

            // Add the expression to the transaction.
            this.expr.push(expr);

            // If a parent was specified, move the expression to the parent folder.
            if (parent) {
                this.parent(id, parent);
            }
        }

        return this;
    }

    /**
     * Inline conditional statement for transactions.
     *
     * @param condition The condition to check.
     * @param callback The callback to execute if the condition is true.
     */
    public cond(
        condition: boolean,
        callback: (t: Transaction, lastId: string) => void | Transaction
    ): Transaction {
        if (condition) {
            callback(this, this.lastId);
        }

        return this;
    }

    /**
     * Finalizes the transaction.
     */
    public commit(): void {
        // Merge the transaction state with the current state.
        const merged = this.state;
        merged.graph = Calc.getState().graph;

        // Update the expressions.
        Calc.setState(merged, { allowUndo: true });

        if (this.consumer) {
            this.consumer(this);
        }
    }
}

export default Transaction;