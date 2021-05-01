import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bulma/css/bulma.css';
import { Link } from 'react-router-dom';

const mqtt = require('mqtt');
const client = mqtt.connect('ws://localhost:8000');

const backendPort = 3021;

const App = () => {

    const [ data, setData ] = useState([]);

    useEffect(() => {
        client.on('connect', () => client.subscribe('/rooms'));

        fetchRooms();

        client.on('message', (topic, message) => {
            if (topic.toString() === '/rooms') {
                fetchRooms();
            }
        });
    },[]);

    const fetchRooms = () => {
        axios.get(`http://localhost:${backendPort}`)
            .then(response => setData(response.data.activeGames))
            .catch(error => console.log(error));
    };

    const newRoom = () => {
        axios.get(`http://localhost:${backendPort}/newgame`)
            .catch(error => console.log(error));
    };


    return (
        <div className={"content"}>
            <h4 className={"title is-2 has-background-primary-dark has-text-centered"}>Cups Game</h4>
            <button onClick={() => newRoom()} className={"button m-4 is-success is-focused"}>
                Add room
            </button>

            {data && data.map(game => (
                <div key={game} className={"box title is-3 has-text-link m-4"}>
                    <Link to={`/game/${game}`}>Room: #{game.substring(0, 5)}</Link>
                </div>)
            )}
        </div>
    );
};

export default App;
