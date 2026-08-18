<?php

// We call this page from a javascript fetch
// Therefore return json
header('Content-Type: application/json; charset=utf-8');

// Get page parameters
// Decode as nested associative arrays
$json = json_decode(file_get_contents('php://input'), true);
$name = $json['name'];
$password = $json['password'];

// Connect to database
$servername = "localhost";
$username = "calmprep_anton";
$mysql_password = "MySQL1@bbb";
$dbname = "calmprep_hunimal";
$conn = new mysqli($servername, $username, $mysql_password, $dbname);

if ($conn->connect_error) {
	$err = array('err' => $conn->connect_error);
	echo json_encode($err);
	die();
} 

// Check that password matches name
$stmt = $conn->prepare('select id,password,ext from visual_quiz_pages where name = ?');
$stmt->bind_param('s', $name);
$stmt->execute();
$res = $stmt->get_result();

// No such name
if ($res->num_rows !== 1) {
	$err = array('err' => 'NoSuchPageName');
	echo json_encode($err);
	die();
}

$row = $res->fetch_assoc();

// Check that password is correct
$db_password = $row['password'];
if ($password !== $db_password) {
	$err = array('err' => 'IncorrectPassword');
	echo json_encode($err);
	die();
}

// Save for later
$page_id = $row['id'];

// Delete all previous blocks (blocks are replaced wholesale)
$stmt = $conn->prepare('delete from visual_quiz_pages_blocks where page_id = ?');
$stmt->bind_param('i', $page_id);
$stmt->execute();

// Insert updated blocks
$blocks = $json['savBlocks'];
foreach ($blocks as $block) {
	$fromx = $block['from']['x'];
	$fromy = $block['from']['y'];
	$tox = $block['to']['x'];
	$toy = $block['to']['y'];
	$answer = $block['answer'];
	if ($answer) {
		$stmt = $conn->prepare('insert into visual_quiz_pages_blocks '
			. '(page_id, fromx, fromy, tox, toy, answer) values (?, ?, ?, ?, ?, ?)');
		$stmt->bind_param('iiiiis', $page_id, $fromx, $fromy, $tox, $toy, $answer);
	} else {
		$stmt = $conn->prepare('insert into visual_quiz_pages_blocks '
			. '(page_id, fromx, fromy, tox, toy) values (?, ?, ?, ?, ?)');
		$stmt->bind_param('iiiii', $page_id, $fromx, $fromy, $tox, $toy);
	}
	$stmt->execute();
	// Check for error
	if ($stmt->error) {
		$err = array('err' => $stmt->error);
		echo json_encode($err);
		die();
	}
}

echo json_encode('success');

?>
