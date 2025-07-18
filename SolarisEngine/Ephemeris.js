export default class Ephemeris {
    constructor(data) {
        this.data = data;
        this.startYear = data[0].year || 2023;
        this.startDay = data[0].day || 1;
        this.startHour = data[0].hour || 0;
    }

    /**
     * 
     * @param {Int} t - Time in hours since the beginning of the simulation
     * @returns 
     */
    getPositionForTime(t) {
        if (this.data.length === 0) return [0, 0, 0];
        if (t <= this.data[0].time) return [this.data[0].x, this.data[0].y, this.data[0].z];
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