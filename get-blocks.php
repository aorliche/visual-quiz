<?php
header('Content-Type: application/json; charset=utf-8');

$servername = "localhost";
$username = "calmprep_anton";
$password = "MySQL1@bbb";
$dbname = "calmprep_hunimal";
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
	die("Connection failed: " . $conn->connect_error);
} 

// Get page id
$name = $_GET['name'];
$stmt = $conn->prepare('select id from visual_quiz_pages where name = ?');
$stmt->bind_param('s', $name);
$stmt->execute();
$res = $stmt->get_result();

// Bad name
if ($res->num_rows !== 1) {
	$err = array('err' => 'NoSuchPageName');
	echo json_encode($err);
	die();
}

$row = $res->fetch_assoc();
$page_id = $row['id'];

// Get blocks
$stmt = $conn->prepare('select fromx,fromy,tox,toy,answer '
	. 'from visual_quiz_pages_blocks where page_id = ?');
$stmt->bind_param('i', $page_id);
$stmt->execute();
$res = $stmt->get_result();

$blocks = array();

while ($row = $res->fetch_assoc()) {
	array_push($blocks, $row);
}

echo json_encode($blocks);

?>
