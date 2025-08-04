class ActionQueue {
    constructor() {
        this.queue = [];
        this.running = false;
    }

    enqueue(fn) {
        return new Promise((resolve, reject) => {
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

    async runNext() {
        if (this.running || this.queue.length === 0) return;
        this.running = true;
        const task = this.queue.shift();
        await task();
        this.running = false;
        this.runNext();
    }
}

// Create one shared global queue
const globalQueue = new ActionQueue();

export default globalQueue;