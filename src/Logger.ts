class Logger {
    /**
     * Log an info message to the console.
     *
     * @param message The message to log.
     * @param args Additional arguments to log.
     */
    public static info(message: string, ...args: any[]): void {
        console.log(`[desmosshop] [INFO] ${message}`, ...args);
    }

    /**
     * Log an error message to the console.
     *
     * @param message The message to log.
     * @param args Additional arguments to log.
     */
    public static error(message: string, ...args: any[]): void {
        console.error(`[desmosshop] [ERROR] ${message}`, ...args);
    }
}

export default Logger;