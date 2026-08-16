<?php

// Get page parameters
$name = $_GET['name'];
$password = $_GET['password'];

// Connect to database
$servername = "localhost";
$username = "calmprep_anton";
$mysql_password = "MySQL1@bbb";
$dbname = "calmprep_hunimal";
$conn = new mysqli($servername, $username, $mysql_password, $dbname);

if ($conn->connect_error) {
	die("Connection failed: " . $conn->connect_error);
} 

// Check that password matches name
$stmt = $conn->prepare('select id,password,ext from visual_quiz_pages where name = ?');
$stmt->bind_param('s', $name);
$stmt->execute();
$res = $stmt->get_result();

// No such name
if ($res->num_rows !== 1) {
	header('Location: ' . 'create.html?err=NoSuchPageName');
	die();
}

$row = $res->fetch_assoc();

// Check that password is correct
$db_password = $row['password'];
if ($password !== $db_password) {
	header('Location: ' . 'create.html?err=IncorrectPassword');
	die();
}

// Save for later
$page_id = $row['id'];
$page_ext = $row['ext'];

// Delete image file from pages directory
unlink('pages/' . $name . '.' . $page_ext);

// Delete page and all references to page in db
$stmt = $conn->prepare('delete from visual_quiz_pages where id = ?');
$stmt->bind_param('i', $page_id);
$stmt->execute();

$stmt = $conn->prepare('delete from visual_quiz_pages_answers where page_id = ?');
$stmt->bind_param('i', $page_id);
$stmt->execute();

$stmt = $conn->prepare('delete from visual_quiz_pages_blocks where page_id = ?');
$stmt->bind_param('i', $page_id);
$stmt->execute();

$stmt = $conn->prepare('delete from visual_quiz_pages_letters where page_id = ?');
$stmt->bind_param('i', $page_id);
$stmt->execute();

header('Location: create.html');
?>
