import React from "react";
import ReactDOM from "react-dom";
import UserService from '../../user.service.js';

class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        users: []
    };

  }

  componentDidMount() {
    let self = this;
    window.socket.on('selfPlayer', function(params) {
        let users = params.users;
        let curUser = params.currentPlayer;
        UserService.setUser(curUser);
        let a = self.state.users.slice();
        users.forEach(r=> a.push(r));
        self.setState({
          users: a
        });
    });
  }

  render() {
    const listItems = this.state.users.map((item, i) =>
      <li key={i} className="new-message">{item.playerName}</li>
    );
    return (

      <div className="sidebar">
        <div id="users">
          <span className="title"> Online:</span>
          <ul>
            {listItems}
          </ul>
        </div>
      </div>
    );
  }
}

export default UserList;