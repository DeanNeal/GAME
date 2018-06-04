import { Observable, Subject, ReplaySubject,BehaviorSubject, from, of, range } from 'rxjs';
class UserService {
	public user: any = new BehaviorSubject();
    constructor() {

    }
}

export default new UserService();