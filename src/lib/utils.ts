
export function formatUptime(): string {
    const uptimeInSeconds = process.uptime();
    const minutes = uptimeInSeconds / 60;
    const formatted = minutes.toFixed(2); 
    return `${formatted} minutes`;
}



export function measureRuntime<T>(fn: () => T): { result: T, runtime: string } {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    const runtimeSeconds = (end - start) / 1000;
    const days = Math.floor(runtimeSeconds / (60 * 60 * 24));
    const hours = Math.floor((runtimeSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((runtimeSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(runtimeSeconds % 60);

    return {
        result,
        runtime: `${days}days, ${hours}hours, ${minutes}minutes, ${seconds}seconds`
    };
}
