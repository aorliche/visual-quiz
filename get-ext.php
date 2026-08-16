<?php

// Get page parameters
$name = $_GET['name'];

// Connect to database
$servername = "localhost";
$username = "calmprep_anton";
$mysql_password = "MySQL1@bbb";
$dbname = "calmprep_hunimal";
$conn = new mysqli($servername, $username, $mysql_password, $dbname);

if ($conn->connect_error) {
	die("Connection failed: " . $conn->connect_error);
} 

$stmt = $conn->prepare('select ext from visual_quiz_pages where name = ?');
$stmt->bind_param('s', $name);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows !== 1) {
	die('NameError');
}

$row = $res->fetch_assoc();
echo $row['ext'];

?>
