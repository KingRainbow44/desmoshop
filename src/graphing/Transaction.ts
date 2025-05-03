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
        public readonly state: GraphState,
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
     * Returns all expressions in the transaction.
     */
    get expressions(): ExpressionState[] {
        return this.state.expressions.list;
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
     * Finds all expressions below a given element.
     * This is not inclusive of the element.
     *
     * @param id The ID of the expression to find below.
     * @param folders Should folders be included? This will stop at the first folder seen if not.
     */
    public allBelow(id: string, folders: boolean = true): ExpressionState[] {
        const index = this.indexOf(id);
        const elements = this.expressions.slice(index + 1);

        // If we are including folders, return the list as-is.
        if (folders) {
            console.log(`[Transaction] Returning as-is, all below ${id}`, elements);
            return elements;
        }

        // Otherwise, get the ID of the next folder.
        const nextFolder = elements.find((expr) => expr.type == "folder");
        if (nextFolder?.id) {
            const nextIndex = elements
                .findIndex((expr) => expr.id == nextFolder?.id);
            const excluded = elements.slice(0, nextIndex);

            console.log(`[Transaction] Next folder found: ${nextFolder.id}`, excluded);

            return excluded;
        }

        // Return elements if there are no folders next.
        console.log(`[Transaction] No folders found, returning all below ${id}`, elements);
        return elements;
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
     * Updates the expression in the transaction.
     *
     * @param expr The expression to update.
     */
    public update(expr: ExpressionState): Transaction {
        // Check if an ID was specified.
        if (!expr.id) {
            throw new Error("No ID specified for update.");
        }

        const selected = this.expr
            .filter((e) => e.id == expr.id)
            .pop();

        if (selected) {
            // Update the expression.
            Object.assign(selected, expr);

            // Update the expression in the transaction.
            const index = this.indexOf(expr.id);
            if (index >= 0) {
                this.expr[index] = selected;
            }
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
     * Removes an expression from the transaction.
     *
     * @param id The ID of the expression to remove.
     */
    public remove(id: string): Transaction {
        const index = this.indexOf(id);
        if (index >= 0) {
            this.expr.splice(index, 1);
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