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
        let curUser = params.currentPlayer;
        UserService.setUser(curUser);
    });

    window.socket.on('otherNewPlayer', function(params) {
        self.setState({
          users: params.users
        });
    });

    window.socket.on('deletePlayer', function(userId) {
        let a = self.state.users.slice();
        a = a.filter(r=> r.id !== userId);
        self.setState({
          users: a
        });
    });

    window.socket.on('updateUsersData', function(users) {
        self.setState({
          users: users
        });
    });
  }

  render() {
    const listItems = this.state.users.map((item, i) =>
      <li key={i} className="new-message">{item.playerName} <span>Scores: {item.scores} </span></li>
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