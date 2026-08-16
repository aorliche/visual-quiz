<?php
header('Content-Type: application/json; charset=utf-8');

$pages = scandir('pages');

$servername = "localhost";
$username = "calmprep_anton";
$password = "MySQL1@bbb";
$dbname = "calmprep_hunimal";
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
	die("Connection failed: " . $conn->connect_error);
} 

// Get existing db pages
$stmt = $conn->prepare('select name from visual_quiz_pages');
$stmt->execute();
$res = $stmt->get_result();

$db_pages = array();

while ($row = $res->fetch_assoc()) {
	array_push($db_pages, $row['name']);
}

echo json_encode($db_pages);
?>
