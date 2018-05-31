class UserService {
    constructor() {
        this.user = undefined;
    }
    setUser(user) {
        this.user = user;
    }

    getUser() {
        return this.user;
    }
}

export default new UserService();