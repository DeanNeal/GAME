import React from "react";
import Chat from './chat/chat.component.jsx';
import UserList from './list/list.component.jsx';
// import socketIoInit from '../main';
import {Game} from '../main';
import SocketService from '../socket.service';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      getReady: false,
      playerOptions: {
        name: ''
      }
    };

    this.submit = this.submit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.keyPress = this.keyPress.bind(this);
  }

  componentDidMount() {

  }

  submit() {
    this.start();
  }

  start() {
    this.setState({
      getReady: true
    });
    // socketIoInit(this.state.playerOptions);
    let game = new Game(this.state.playerOptions);
    SocketService.socket.emit('add new player', this.state.playerOptions);

    // setInterval(()=>{
    //   window.socket.emit('add new player', {name: Math.random(100,200)});
    // }, 4000);
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
              <UserList/> 
              <Chat/>
            </div>
          )
        }

        <div id="timer"></div> 
        <div id="info">Controls - > WASD/RF/QE + mouse </div>
        <div id="position"></div>
        <div id="rotation"></div>
      </div>
    );
  }
}

export default App;