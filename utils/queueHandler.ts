type Task = () => Promise<void>;

class ActionQueue {
    private queue: Task[] = [];
    private running = false;

    enqueue<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            });
            this.runNext();
        });
    }

    private async runNext(): Promise<void> {
        if (this.running || this.queue.length === 0) return;
        this.running = true;
        const task = this.queue.shift()!;
        await task();
        this.running = false;
        this.runNext();
    }
}

const globalQueue = new ActionQueue();

export default globalQueue;
