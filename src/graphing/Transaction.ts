type Consumer = ((t: Transaction) => void) | undefined;

const LINE = `y-{{Y_START}}={{SLOPE}}\\left(x-{{X_MIN}}\\right)\\left\\{{{X_MIN}}\\le x\\le{{X_MAX}}\\right\\}`;

/**
 * A transaction is a set of operations that can only occur during state changes.
 */
class Transaction {
    private lastId: string = "";
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
    public cond(condition: boolean, callback: (t: Transaction, lastId: string) => void | Transaction): Transaction {
        if (condition) {
            callback(this, this.lastId);
        }

        return this;
    }

    /**
     * Adds a point to the transaction.
     *
     * @param x The x-coordinate of the point.
     * @param y The y-coordinate of the point.
     */
    public point(x: number, y: number): Transaction {
        this._points.push({ x, y });
        return this;
    }

    /**
     * Creates a line from the points in the transaction.
     *
     * @param parent The parent folder.
     */
    public line(parent?: string): Transaction {
        // Throw an error if there are not enough points.
        if (this._points.length < 2) {
            throw new Error("Not enough points to create a line.");
        }

        // Calculate values needed to create the line.
        const m = (
            (this._points[1].y - this._points[0].y) /
            (this._points[1].x - this._points[0].x)
        ).toFixed(3);

        // Create the line expression.
        const xMin = Math.min(this._points[0].x, this._points[1].x);
        const xMax = Math.max(this._points[0].x, this._points[1].x);

        const expr = LINE
            .replaceAll("{{X_MIN}}", xMin.toString())
            .replaceAll("{{X_MAX}}", xMax.toString())
            .replaceAll("{{Y_START}}", this._points[0].y.toString())
            .replaceAll("{{SLOPE}}", m);

        // Add the expression to the transaction.
        this.expression((id) => ({
            type: "expression",
            id,
            latex: expr,
            color: "#000000"
        }));

        // Set the parent.
        if (parent) {
            this.parent(this.lastId, parent);
        }

        // Clear the points array.
        this._points.length = 0;

        return this;
    }

    /**
     * Finalizes the transaction.
     */
    public commit(): void {
        Calc.setState(this.state, { allowUndo: true });

        if (this.consumer) {
            this.consumer(this);
        }
    }
}

export default Transaction;