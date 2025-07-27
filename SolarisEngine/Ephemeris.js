
export default class Ephemeris {
    constructor(data) {
        this.data = data;
        this.startTime = data[0].time;
    }

    /**
     * @param {Int} t - Time in hours since the beginning of the simulation
     * @returns {Array} [x, y, z]
     */
    getPositionForTime(t) {
        if (this.data.length === 0) return [0, 0, 0];

        const duration = this.data[this.data.length - 1].time - this.startTime;
        const modT = ((t - this.startTime) % duration + duration) % duration + this.startTime;

        for (let i = 0; i < this.data.length - 1; i++) {
            const current = this.data[i];
            const next = this.data[i + 1];

            if (current.time <= modT && next.time >= modT) {
                const ratio = (modT - current.time) / (next.time - current.time);
                const x = current.x + ratio * (next.x - current.x);
                const y = current.y + ratio * (next.y - current.y);
                const z = current.z + ratio * (next.z - current.z);
                return [x, y, z];
            }
        }

        return [this.data[0].x, this.data[0].y, this.data[0].z];
    }
}
