<?php

// Get POST parameters
$name = $_POST['page-name'];
$password = $_POST['page-password'];

// Check for alphanumeric name
if (!ctype_alnum($name) or $name === '') {
	header('Location: ' . 'create.html?err=BadName&name=' 
		. urlencode($name) 
		. '&password=' 
		. urlencode($password));
	die();
}

// Check for alphanumeric password
if (!ctype_alnum($password) or $password === '') {
	header('Location: ' . 'create.html?err=BadPassword&name=' 
		. urlencode($name) 
		. '&password=' 
		. urlencode($password));
	die();
}

// Check page upload is a valid image
$im_size = getimagesize($_FILES['page-upload']['tmp_name']);
if ($im_size === false) {
	header('Location: ' . 'create.html?err=NotImage&name=' . $name . '&password=' . $password);
	die();
}

// Check that image is not too large
if ($_FILES['page-upload']['size'] > 5000000) {
	header('Location: ' . 'create.html?err=ImageTooLarge&name=' . $name . '&password=' . $password);
	die();
}

$servername = "localhost";
$username = "calmprep_anton";
$mysql_password = "MySQL1@bbb";
$dbname = "calmprep_hunimal";
$conn = new mysqli($servername, $username, $mysql_password, $dbname);

if ($conn->connect_error) {
	die("Connection failed: " . $conn->connect_error);
} 

// Get existing db pages
$stmt = $conn->prepare('select name from visual_quiz_pages');
$stmt->execute();
$res = $stmt->get_result();

// Check for duplicate name
while ($row = $res->fetch_assoc()) {
	if ($name === $row['name']) {
		header('Location: ' . 'create.html?err=DuplicateName&name=' . $name . '&password=' . $password);
		die();
	}
}

// Get extension
$ext = strtolower(pathinfo($_FILES['page-upload']['name'], PATHINFO_EXTENSION));

// Check extension is allowed
if (!in_array($ext, array('jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'gif', 'GIT'))) {
	header('Location: ' . 'create.html?err=BadExtension&name=' . $name . '$password=' . $password);
	die();
}

// Insert into db
$stmt = $conn->prepare('insert into visual_quiz_pages (name, password, ext) values (?, ?, ?)');
$stmt->bind_param('sss', $name, $password, $ext);
$stmt->execute();

// Move file
move_uploaded_file($_FILES['page-upload']['tmp_name'], 'pages/' . $name . '.' . $ext);

// Redirect back to create page on the file
header('Location: ' . 'create.html?name=' . $name . '&password=' . $password);
die();

?>
