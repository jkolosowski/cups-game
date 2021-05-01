import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const mqtt = require('mqtt');

const backendPort = 3021;

const GameRoom = () => {

    let { id } = useParams();

    const client = mqtt.connect('ws://localhost:8000');

    const [ canPlay, setCanPlay ] = useState(false);
    const [ nick, setNick ] = useState('');
    const [ wrongNick, setWrongNick ] = useState(false);

    const [ chat, setChat ] = useState([]);
    const [ message, setMessage ] = useState('');

    const [ privateChat, setPrivateChat ] = useState([]);
    const [ privateMessage, setPrivateMessage ] = useState('');

    const [ busyTeam1, setBusyTeam1 ] = useState(null);
    const [ busyTeam2, setBusyTeam2 ] = useState(null);

    const [ round, setRound ] = useState(null);
    const [ pointsTeam1, setPointsTeam1 ] = useState(null);
    const [ pointsTeam2, setPointsTeam2 ] = useState(null);

    const [ gameEnd, setGameEnd ] = useState(false);


    const sendNick = () => {
        axios.post(`http://localhost:${backendPort}/join/${id}`, { nick })
            .then(response => {
                setCanPlay(response.data.success);
                setWrongNick(!response.data.success);
            })
            .catch(error => console.log(error));
    };

    useEffect(() => {
        client.on('connect', () => {
            client.subscribe(`/chat/${id}`);
            client.subscribe(`/privatechat/${id}`);
            client.subscribe(`/setteams/${id}`);
            client.subscribe(`/update/${id}`);
        });
        client.on('message', (topic, message) => {
            if (topic.toString() === `/chat/${id}`) {
                setChat([...chat, message.toString()]);
            } if (topic.toString() === `/privatechat/${id}`) {
                setPrivateChat([...privateChat, message.toString()]);
            } if (topic.toString() === `/setteams/${id}`) {
                const player = JSON.parse(message.toString())
                if (!player.team1) {
                    setBusyTeam2(player.team2);
                } else {
                    setBusyTeam1(player.team1);
                }
            } if (topic.toString() === `/update/${id}`) {
                const game = JSON.parse(message.toString());
                setRound(game.round);
                if (game.points1) {
                    setGameEnd(!gameEnd);
                    setPointsTeam1(game.points1);
                    setPointsTeam2(game.points2);
                }
            }
        });
        axios.get(`http://localhost:${backendPort}/game/${id}`)
            .then(response => {
                setBusyTeam1(response.data.team1);
                setBusyTeam2(response.data.team2);
                if (response.data.team1 && response.data.team2) {
                    setRound(response.data.round);
                }
                if (response.data.end) {
                    setGameEnd(!gameEnd);
                    setPointsTeam1(response.data.points1);
                    setPointsTeam2(response.data.points2);
                }
            })
            .catch(error => console.log(error));
    }, [chat, privateChat]);

    const handleMessage = (event) => {
        setMessage(event.target.value);
    };

    const sendMessage = (message) => {
        client.publish(`/chat/${id}`, nick + ": " + message );
    };

    const handlePrivateMessage = (event) => {
        setPrivateMessage(event.target.value);
    };

    const sendPrivateMessage = (privateMessage) => {
        client.publish(`/privatechat/${id}`, nick + ": " + privateMessage);
    };

    const sendTeam1 = (nick) => {
        axios.post(`http://localhost:${backendPort}/setteams/${id}`, { team1: nick })
            .then(response => setBusyTeam1(nick))
            .catch(error => console.log(error));
    };

    const sendTeam2 = (nick) => {
        axios.post(`http://localhost:${backendPort}/setteams/${id}`, { team2: nick })
            .then(response => setBusyTeam2(nick))
            .catch(error => console.log(error));
    };

    const chosenCup = (number) => {
        axios.post(`http://localhost:${backendPort}/cups/${id}`, { number, nick })
            .catch(error => console.log(error));
    };

    const results = () => {
        if (pointsTeam1 > pointsTeam2) {
            return (<div>
                <h5 className={"title has-text-danger has-text-centered is-size-3"}>WINNER {busyTeam1}: {pointsTeam1}</h5>
                <h5 className={"title has-text-danger has-text-centered is-size-3"}>{busyTeam2}: {pointsTeam2}</h5>
            </div>)
        } else if (pointsTeam1 < pointsTeam2) {
            return (<div>
                <h5 className={"title has-text-danger has-text-centered is-size-3"}>WINNER {busyTeam2}: {pointsTeam2}</h5>
                <h5 className={"title has-text-danger has-text-centered is-size-3"}>{busyTeam1}: {pointsTeam1}</h5>
            </div>)
        } else if (pointsTeam1 === pointsTeam2) {
            return (<div>
                <h5 className={"title has-text-danger has-text-centered is-size-3"}>Tie!</h5>
                <h5 className={"title has-text-danger has-text-centered is-size-3"}>{busyTeam2}: {pointsTeam2}</h5>
                <h5 className={"title has-text-danger has-text-centered is-size-3"}>{busyTeam1}: {pointsTeam1}</h5>
            </div>)
        }
    };


    return (
        <div className={"content"}>
            {!canPlay ?
                <div className={"content"}>
                    <h4 className={"title is-2 has-background-primary-dark has-text-centered"}>Cups Game - #{id.substring(0, 5)}</h4>

                    <Link to={"/"} className={"button m-3 p-5 is-danger is-outlined"}>Go back</Link>

                    <div className={"field column is-5 is-centered"}>
                        <input
                            onChange={(event) => setNick(event.target.value)}
                            value={nick}
                            className={"input"}
                            placeholder={"Type your nick..."}
                        />
                    </div>
                    <button onClick={() => sendNick()} className={"button is-success mt-3 ml-3 p-5"}>Save</button>

                    {wrongNick &&
                    <div className={"notification is-danger is-2 m-3 p-5"}>Nick taken</div>}
                </div>
                :
                <div>
                    <h4 className={"title is-2 has-background-primary-dark has-text-centered"}>Cups Game - #{id.substring(0, 5)}</h4>

                    <div className={"column is-2 ml-5"}>
                        <Link to={"/"} className={"button mt-3 p-5 is-danger is-outlined"}>Go back</Link>

                        {busyTeam1 ? <div className={"subtitle has-text-info mt-4"}>{busyTeam1} joined Team 1!</div> :
                            <div>
                                <button
                                    className={"button ml-6 mt-3 p-5 is-success"}
                                    onClick={() => sendTeam1(nick)}
                                >
                                    Join Team 1
                                </button>
                            </div>}

                        {busyTeam2 ? <div className={"subtitle has-text-info"}>{busyTeam2} joined Team 2!</div> :
                            <div>
                                <button
                                    className={"button ml-6 mt-3 p-5 is-success"}
                                    onClick={() => sendTeam2(nick)}
                                >
                                    Join Team 2
                                </button>
                            </div>}
                    </div>

                    {!gameEnd &&
                    <div className={"field column is-6 ml-5"}>
                        <div className={"subtitle has-text-primary-dark"}>General chat</div>
                        {chat && chat.map((message, id) => (
                            <div key={id} className={"box"}>
                                <p>{message}</p>
                            </div>
                        ))}

                        <input
                        type='text'
                        value={message}
                        onChange={handleMessage}
                        placeholder='Type message...'
                        className={"input is-rounded"}
                        />
                        <button onClick={() => sendMessage(message)} className={"button is-primary is-outlined mt-1 is-rounded"}>
                            Send
                        </button>
                    </div>}

                    {round && !gameEnd &&
                    <div>
                        {nick === busyTeam1 || nick === busyTeam2 ?
                            <div>
                                <div className={"field column is-3 ml-5"}>
                                    <div className={"subtitle has-text-danger-dark"}>Private chat</div>
                                    {privateChat && privateChat.map((message, id) => (
                                        <div key={id} className={"box"}>
                                            <p>{message}</p>
                                        </div>
                                    ))}

                                    <input
                                        type='text'
                                        value={privateMessage}
                                        onChange={handlePrivateMessage}
                                        placeholder='Type message to your oponent...'
                                        className={"input is-rounded"}
                                    />
                                    <button onClick={() => sendPrivateMessage(privateMessage)} className={"button is-danger is-outlined mt-1 is-rounded"}>
                                        Send
                                    </button>
                                </div>

                                <h4 className={"title has-text-info has-text-centered is-size-1"}>Round: {round}</h4>
                                <h5 className={"title has-text-danger has-text-centered is-size-3"}>Choose the correct cup!</h5>
                                <div className={"columns m-4"}>
                                    <button onClick={() => chosenCup(0)} className={"button is-link is-outlined column m-4 is-large"}>
                                        Cup 1
                                    </button>
                                    <button onClick={() => chosenCup(1)} className={"button is-link is-outlined column m-4 is-large"}>
                                        Cup 2
                                    </button>
                                    <button onClick={() => chosenCup(2)} className={"button is-link is-outlined column m-4 is-large"}>
                                        Cup 3
                                    </button>
                                </div>
                            </div>
                            :
                            <div>
                                <h4 className={"title has-text-info has-text-centered is-size-1"}>Round: {round}</h4>
                                <h5 className={"title has-text-danger has-text-centered is-size-3"}>The game is on!</h5>
                            </div>}
                    </div>}

                    {gameEnd &&
                        <div>
                            <h4 className={"title has-text-info has-text-centered is-size-1"}>Finish! Results:</h4>
                            {results()}
                        </div>}
                </div>}
        </div>
    );
}

export default GameRoom;