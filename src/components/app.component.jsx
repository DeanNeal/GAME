import React from "react";
import Chat from './chat/chat.component';
import UserList from './list/list.component';
import {Game} from '../main';
import SocketService from '../socket.service';
import UserService from '../user.service';
import GlobalService from '../global.service';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      getReady: false,
      playerOptions: {
        name: ''
      },
      user: {
        health: 100
      }
    };

    this.submit = this.submit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.keyPress = this.keyPress.bind(this);
  }

  componentDidMount() {

  }

  submit(e) {
    e.preventDefault();
    this.start();
  }

  start() {
    let game = new Game(this.state.playerOptions);
    SocketService.socket.emit('add new player', this.state.playerOptions);

    // SocketService.socket.on('selfPlayer', user=> {
    //   this.setState({
    //     user: user
    //   });
    // });
    GlobalService.users.subscribe(users=> {
        this.setState({
          getReady: true,
          user: users.filter(r=> r.id === UserService.user.value.id)[0]
        });
    })

  }

  handleChange(event) {

    this.setState({playerOptions: {name: event.target.value}});
  }

  keyPress(event) {
    if (event.key == 'Enter' && this.state.playerOptions.name){
      this.start();
    }
  }
 
  render() {

    return (
      <div>      
        { !this.state.getReady ? (
          <div className="start-page">
            <div className="overlay"></div>
            <div className="popup">
              <form className="popup__content" onSubmit={this.submit}>
                 <label> Username</label>
                 <input type="text" value={this.state.playerOptions.name} onKeyDown={this.keyPress} onChange={this.handleChange} required/>
                 <button className="btn" type="submit">START</button>
              </form>
            </div> 
          </div>

          ) :  (
            <div>
              <div id="info">Controls - > WASD/RF/QE + mouse </div>
              <div id="position"></div>
              <div id="rotation"></div>
              <div id="gui">HP {this.state.user.health}</div>
              <div id="timer"></div> 
              <UserList/> 
            
            </div>
          )
        }


      </div>
    );
  }
}

export default App;