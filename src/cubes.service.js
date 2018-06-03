import { Observable, Subject, BehaviourSubject, ReplaySubject, from, of, range } from 'rxjs';
class CubesService {
    constructor() {
       this.cubes = new ReplaySubject([]);
    }
}

export default new CubesService();