import { Observable, Subject, ReplaySubject, BehaviorSubject, from, of, range } from 'rxjs';

class UserService {
	public user: any = new BehaviorSubject(null);
    constructor() {

    }
}

export default new UserService();