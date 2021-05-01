import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import GameRoom from './GameRoom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
      <Router>
          <Switch>
              <Route path="/" exact component={ App }/>
              <Route path="/game/:id" component={ GameRoom }/>
          </Switch>
      </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
