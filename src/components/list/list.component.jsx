import React from "react";
import ReactDOM from "react-dom";
import UserService from '../../user.service.js';
import CubesService from '../../cubes.service.js';
import SocketService from '../../socket.service';

class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        users: [],
        cubes: []
    };

  }

  componentDidMount() {
    let self = this;
    SocketService.socket.on('selfPlayer', function(params) {
        let curUser = params.currentPlayer;
        UserService.setUser(curUser);
    });

    SocketService.socket.on('otherNewPlayer', function(params) {
        self.setState({
          users: params.users
        });
    });

    SocketService.socket.on('deletePlayer', function(userId) {
        let a = self.state.users.slice();
        a = a.filter(r=> r.id !== userId);
        self.setState({
          users: a
        });
    });

    SocketService.socket.on('updateUsersData', function(users) {
        self.setState({
          users: users
        });
    });

    CubesService.cubes.subscribe(cubes=>{
      self.setState({
        cubes: cubes
      });
    })
  }

  render() {
    const listItems = this.state.users.map((item, i) => {
      let className = UserService.getUser().id === item.id ? 'current-player' : ''; 
      // let msg = UserService.getUser().id === item.id ? ' - you' : '';
      return (
        <li key={i} className={className}>{item.playerName}<span>Scores: {item.scores} </span></li>
        )

    });

    
    return (

      <div className="sidebar">
        <div className="sidebar__users">
          <span className="title">Players:</span>
          <span className="sidebar__left-count">Left: {this.state.cubes.length}</span>  
          <ul>
            {listItems}
          </ul>
        </div>
      </div>
    );
  }
}

export default UserList;