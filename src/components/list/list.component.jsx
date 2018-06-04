import React from "react";
import ReactDOM from "react-dom";
import UserService from '../../user.service';
import CubesService from '../../cubes.service';
import SocketService from '../../socket.service';
import GlobalService from '../../global.service';

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

    GlobalService.users.subscribe(users=> {
          self.setState({
            users: users
          });
    })

    SocketService.socket.on('deletePlayer', function(userId) {
        let a = self.state.users.slice();
        a = a.filter(r=> r.id !== userId);
        self.setState({
          users: a
        });
    });

    // SocketService.socket.on('updateUsersData', function(users) {
    //     self.setState({
    //       users: users
    //     });
    // });

    CubesService.cubes.subscribe(cubes=>{
      self.setState({
        cubes: cubes
      });
    })
  }

  render() {
    const listItems = this.state.users.map((item, i) => {
      let className = (UserService.user.value && UserService.user.value.id === item.id) ? 'current-player' : ''; 
      return (
        <li key={i} className={className}>{item.playerName}<span>Health: {item.health} Scores: {item.scores}</span></li>
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