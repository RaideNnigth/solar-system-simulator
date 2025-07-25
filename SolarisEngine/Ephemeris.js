export default class Ephemeris {
    constructor(data) {
        this.data = data;
        this.startTime = data[0].time;
    }

    /**
     * 
     * @param {Int} t - Time in hours since the beginning of the simulation
     * @returns 
     */
    getPositionForTime(t) {
        if (this.data.length === 0) return [0, 0, 0];
        if (t <= this.startTime) return null;
        if (t >= this.data[this.data.length - 1].time) {
            const last = this.data[this.data.length - 1];
            return [last.x, last.y, last.z];
        }

        // Find interval
        for (let i = 0; i < this.data.length - 1; i++) {
            const current = this.data[i];
            const next = this.data[i + 1];

            if (current.time <= t && next.time >= t) {
                // Linear interpolation
                const ratio = (t - current.time) / (next.time - current.time);
                const x = current.x + ratio * (next.x - current.x);
                const y = current.y + ratio * (next.y - current.y);
                const z = current.z + ratio * (next.z - current.z);
                return [x, y, z];
            }
        }
        return [0, 0, 0];
    }
}