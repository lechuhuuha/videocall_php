<?php

namespace MyApp;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class Socket implements MessageComponentInterface
{

    public $users = [];

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn)
    {

        // Store the new connection in $this->clients
        $this->clients->attach($conn);

        echo "new connection from " . $conn->remoteAddress . "\n";
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        // echo "received message '$msg' from {$from->remoteAddress}\n";
        // $data = utf8_decode($msg);
        foreach ($this->clients as $client) {
            $data = json_decode(utf8_decode($msg));
            $user = $this->findUser($data->username);
            switch ($data->type) {
                case "store_user":
                    if ($user != null) {
                        return;
                    }
                    $newUser = (object)[
                        "conn" => $client,
                        "username" => $data->username
                    ];
                    array_push($this->users, $newUser);
                    echo "new user $newUser->username";
                    break;
                case "store_offer":
                    if ($user == null) {
                        return;
                    };
                    $user->offer = $data->offer;
                    break;
                case "store_candidate":
                    if ($user == null) {
                        return;
                    };
                    if ($user->candidates == null) {
                        $user->candidates = [];
                        array_push($user->candidates, $data->candidate);
                    }
                    break;
                case "send_answer":
                    if ($user == null) {
                        return;
                    };
                    $this->sendData((object)[
                        "type" => "answer",
                        "answer" => $data->answer
                    ], $user->conn);
                    break;
                case "send_candidate":
                    if ($user == null) {
                        return;
                    }
                    $this->sendData((object)[
                        "type" => "candidate",
                        "candidate" => $data->candidate
                    ], $user->conn);
                    break;
                case "join_call":
                    if ($user == null) {
                        return;
                    }
                    $this->sendData((object)[
                        "type" => "offer",
                        "offer" => $user->offer
                    ], $client);
                    foreach ($user->cadidates as $candidate) {
                        $this->sendData((object)[
                            "type" => "candidate",
                            "candidate" => $candidate
                        ], $client);
                    };
                    break;
            };
        };

        // $from->send($response);
    }

    public function onClose(ConnectionInterface $conn)
    {
        foreach ($this->users as $user) {
            if ($user->conn == $conn) {
                array_splice($this->users, array_search($user, $this->users), 1);
                return;
            }
        }
        echo "connection closed by " . $conn->remoteAddress . "\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo $conn;
    }

    public function findUser($username)
    {
        for ($i = 0; $i < count($this->users); $i++) {
            if ($this->users[$i]->username == $username) {
                return $this->users[$i];
            }
        }
    }
    public function sendData($data, $conn)
    {
        $conn->send(json_encode($data));
    }
}
