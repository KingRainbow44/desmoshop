import Desmos from "@graphing/Desmos.tsx";
import Logger from "@app/Logger.ts";
import useGlobal from "@stores/Global.ts";

import { COLOR as LineColor } from "@graphing/objects/Line.ts";
import { COLOR as EllipseColor } from "@graphing/objects/Ellipse.ts";
import { COLOR as ParabolaColor } from "@graphing/objects/Parabola.ts";

/**
 * This is the indicator text that will be used to combine folders.
 */
const COMBINE_TEXT = "--- COMBINE BELOW ---";

/**
 * This regular expression is used to match a point in LaTeX.
 */
const POINT_REGEX = /\((.*),(.*)\)/;

/**
 * The LaTeX representation of a `Math.pow(2)` operation.
 */
const EXPONENT = "^{2}";

/**
 * This is a regular expression for a domain restriction.
 */
const DOMAIN_RESTRICTION = /\\left\\\{(-?[\d.]+)(\\le|\\ge|<|>)\s?([xy])(\\le|\\ge|<|>)(-?[\d.]+)\\right\\}/;

/**
 * This is a regular expression for a domain exclusion.
 */
const DOMAIN_EXCLUSION = /\\left\\\{x<(-?[\d.]+),x>(-?[\d.]+)\\right\\}/;

/**
 * This is a regular expression for a straight line.
 */
const LINE_SLOPED = /y-(-?[\d.]+)=(-?[\d.]+)\\left\(x-(-?[\d.]+)\\right\)/;

/**
 * This is a regular expression for a vertical line.
 */
const LINE_STRAIGHT = /x=(-?[\d.]+)/

/**
 * This is a regular expression for a parabola.
 */
const PARABOLA = /\(x-(-?[\d.]+)\)\^\{2}=4\\cdot(-?[\d.]+)\(y-(-?[\d.]+)\)/;

/**
 * This is a regular expression for an ellipse.
 */
const ELLIPSE = /\\frac{\\left\(x-(-?[\d.]+)\\right\)\^\{2}}{(-?[\d.]+)\^\{2}}\+\\frac{\\left\(y-(-?[\d.]+)\\right\)\^\{2}}{(-?[\d.]+)\^\{2}}=1/;

/**
 * A collection of general-purpose Desmos utilities.
 *
 * These do not quality as 'wrappers'.
 */
class Utility {
    /**
     * Combines same-named folders into one root folder.
     */
    public static combine(): void {
        const t = Desmos.transaction();

        // Find the expressions to combine.
        const [marker] = t.expressions
            .filter((expr) => expr.type == "text" && expr.text == COMBINE_TEXT);
        if (marker?.id == undefined) {
            alert("No folders to combine.");
            return;
        }

        const toCombine = t.allBelow(marker.id);

        // Iterate through all folders.
        const folders = toCombine.filter((expr) => expr.type == "folder");
        console.log("[Combine] Looking at folders:", folders);

        for (const folder of folders) {
            if (!folder.id) {
                Logger.error("Folder has no ID?");
                continue;
            }

            // Find the first root folder.
            const [rootFolder] = t.expressions
                .filter((expr) => expr.type == "folder" && expr.title == folder.title);
            if (rootFolder.type != "folder" || !rootFolder?.id) {
                Logger.error("No root folder found.");
                continue;
            }

            console.log(`[Combine] Root folder ${rootFolder.title} (${rootFolder.id}) found for ${folder.title} (${folder.id})`);

            // Move all elements to the root folder.
            const elements = t.allBelow(folder.id, false);
            console.log(`[Combine] All below ${folder.title} (${folder.id})`, elements);

            for (const element of elements) {
                if (element.id) {
                    t.parent(element.id, rootFolder.id);
                }
            }
        }

        // Remove all folders.
        for (const folder of folders) {
            if (folder.id) {
                t.remove(folder.id);
            }
        }

        // Remove the marker.
        t.remove(marker.id);

        // Commit all changes.
        t.commit();
    }

    /**
     * Reduces all decimal values to the current precision.
     */
    public static simplify(): void {
        const t = Desmos.transaction();

        // Fetch the current precision.
        const { precision } = useGlobal.getState();

        // Iterate through all expressions.
        for (const expr of t.expressions) {
            if (expr.type != "expression") {
                continue;
            }

            // Match the expression against the regex.
            const { latex } = expr;
            if (latex == undefined) {
                continue;
            }

            let newExpression = "";

            if (LINE_SLOPED.test(latex)) {
                const matches = latex.match(LINE_SLOPED);
                if (matches == null) {
                    Logger.error("Failed to match line expression.");
                    continue;
                }

                let [, y1, m, x1] = matches;

                // Round all values to the current precision.
                y1 = Desmos.toPrecision(y1, precision);
                m = Desmos.toPrecision(m, precision);
                x1 = Desmos.toPrecision(x1, precision);

                newExpression = `y-${y1}=${m}\\left(x-${x1}\\right)`;
                expr.color = LineColor;
            } else if (LINE_STRAIGHT.test(latex) && !latex.includes(EXPONENT)) {
                const matches = latex.match(LINE_STRAIGHT);
                if (matches == null) {
                    Logger.error("Failed to match line expression.");
                    continue;
                }

                let [, x1] = matches;

                // Round all values to the current precision.
                x1 = Desmos.toPrecision(x1, precision);

                newExpression = `x=${x1}`;
                expr.color = LineColor;
            } else if (PARABOLA.test(latex)) {
                const matches = latex.match(PARABOLA);
                if (matches == null) {
                    Logger.error("Failed to match parabola expression.");
                    continue;
                }

                let [, x1, p, y1] = matches;

                // Round all values to the current precision.
                x1 = Desmos.toPrecision(x1, precision);
                p = Desmos.toPrecision(p, precision);
                y1 = Desmos.toPrecision(y1, precision);

                newExpression = `(x-${x1})^2=4\\cdot${p}\\left(y-${y1}\\right)`;
                expr.color = ParabolaColor;
            } else if (ELLIPSE.test(latex)) {
                const matches = latex.match(ELLIPSE);
                if (matches == null) {
                    Logger.error("Failed to match ellipse expression.");
                    continue;
                }

                let [, h, a, k, b] = matches;

                // Round all values to the current precision.
                h = Desmos.toPrecision(h, precision);
                a = Desmos.toPrecision(a, precision);
                k = Desmos.toPrecision(k, precision);
                b = Desmos.toPrecision(b, precision);

                newExpression = `\\frac{\\left(x-${h}\\right)^{2}}{${a}^{2}}+\\frac{\\left(y-${k}\\right)^{2}}{${b}^{2}}=1`;
                console.log(newExpression);

                expr.color = EllipseColor;
            } else {
                newExpression = latex;
                continue;
            }

            // Check for domain restrictions.
            if (DOMAIN_RESTRICTION.test(latex)) {
                const matches = latex.match(DOMAIN_RESTRICTION);
                if (matches == null) {
                    Logger.error("Failed to match domain restriction.");
                    continue;
                }

                let [, min, leftSymbol, variable, rightSymbol, max] = matches;

                // Round all values to the current precision.
                min = Desmos.toPrecision(min, precision);
                max = Desmos.toPrecision(max, precision);

                newExpression += `\\left\\{${min}${leftSymbol} ${variable}${rightSymbol}${max}\\right\\}`;
            }

            // Check for domain exclusions.
            if (DOMAIN_EXCLUSION.test(latex)) {
                const matches = latex.match(DOMAIN_EXCLUSION);
                if (matches == null) {
                    Logger.error("Failed to match domain exclusion.");
                    continue;
                }

                let [, min, max] = matches;

                // Round all values to the current precision.
                min = Desmos.toPrecision(min, precision);
                max = Desmos.toPrecision(max, precision);

                newExpression += `\\left\\{x<${min},x>${max}\\right\\}`;
            }

            expr.latex = newExpression;
        }

        // Commit all changes.
        t.commit();
    }

    /**
     * Moves an expression to the correct folder.
     *
     * @param expr An expression.
     */
    public static moveExpression(expr: ExpressionState): void {
        // Check if the expression is an expression.
        if (expr.type != "expression") return;

        // Get the expression's LaTeX.
        const { id, folderId, latex } = expr;
        if (!id || !latex) return;

        // Validate the expression against the regular expressions.
        const t = Desmos.transaction();
        if (POINT_REGEX.test(latex) && folderId != "reference-points") {
            t
                .update({ id, color: "#c74440" })
                .parent(id, "reference-points");

            // Check if the point is stored in the cache.
            const point = Desmos.parsePoint(latex);
            if (point == undefined) return;

            Desmos.cachePoint(point, id);
        } else {
            return;
        }

        // Commit the changes.
        t.commit();
    }
}

export default Utility;