const $ = q => document.querySelector(q);
const $$ = q => [...document.querySelectorAll(q)];

function Point(x, y) {
	return {x, y};
}

function Block(from, to) {
	return {from, to};
}

function isAlphaNumeric(text) {
	return text.match(/^[A-z0-9]*$/);
}

function isBlank(text) {
	return text === '';
}

// Add answer to answers-div
function addAnswer(answer) {
	const p = document.createElement('p');
	const letter = document.createElement('span');
	const answerInput = document.createElement('input');
	answerInput.type = 'text';
	answerInput.classList.add('answer-input');
	const hideButton = document.createElement('button');
	const deleteButton = document.createElement('button');
	hideButton.innerText = 'Hide';
	deleteButton.innerText = 'Delete';
	p.appendChild(letter);
	p.appendChild(answerInput);
	p.appendChild(hideButton);
	p.appendChild(deleteButton);
	// Make block a non-answer
	hideButton.addEventListener('click', e => {
		if (hideButton.innerText === 'Hide') {
			letter.style.display = 'none';
			answerInput.style.display = 'none';
			hideButton.innerText = 'Show';
		} else {
			letter.style.display = 'inline';
			answerInput.style.display = 'inline-block';
			hideButton.innerText = 'Hide';
		}
		regenLetters();
		repaint();
	});
	// Delete from blocks
	deleteButton.addEventListener('click', e => {
		// Get block index corresponding to this p, then delete that block
		const ps = $$('#answers-div p');
		for (let i=0; i<ps.length; i++) {
			if (ps[i] === p) {
				blocks.splice(i, 1);
				break;
			}
		}
		p.parentNode.removeChild(p);
		regenLetters();
		repaint();
	});
	$('#answers-div').appendChild(p);
	// If we're getting from database
	// Also need to update show-hide for answer-less blocks
	if (answer) {
		answerInput.value = answer;
	} else {
		hideButton.dispatchEvent(new Event('click'));
	}
}

let pages = [];
let name = null;
let password = null;
let img = null;
let blocks = [];
let letters = [];
let addingBlock = false;

function editPage(name, password) {
	// Fill in echo name and password
	$('#edit-page-name').innerText = name;
	if (password) {
		$('#edit-password').innerText = password;
	}
	// Get extension corresponding to name
	fetch('get-ext.php?name=' + name)
	.then(resp => resp.text())
	.then(ext => {
		if (ext === 'NameError') {
			$('#err').innerText = ext;
			$('#err').style.display = 'block';
			return;
		}
		img = new Image();
		img.src = `pages/${name}.${ext}`;
		img.addEventListener('load', e => {
			repaint();
		});
		// Get blocks
		fetch('get-blocks.php?name=' + name) 
		.then(resp => resp.json())
		.then(json => {
			if (json.err) {
				$('#err').innerText = json.err;
				$('#err').style.display = 'block';
				return;
			} 
			// Update answers-div
			$$('#answers-div p').forEach(p => {
				p.parentNode.removeChild(p);
			});
			blocks = [];
			letters = [];
			for (let i=0; i<json.length; i++) {
				const block = json[i];
				blocks.push(Block(Point(block.fromx, block.fromy), Point(block.tox, block.toy)));
				addAnswer(block.answer);
			}
			regenLetters();
			repaint();
		})
		.catch(err => {
			$('#err').innerText = err;
			$('#err').style.display = 'block';
		});
	});
}

function drawBlock(ctx, idx) {
	const block = blocks[idx];
	let sx = block.from.x;
	let sy = block.from.y;
	let ex = block.to.x;
	let ey = block.to.y;
	if (sx > ex) {
		[sx, ex] = [ex, sx];
	}
	if (sy > ey) {
		[sy, ey] = [ey, sy];
	}
	const w = ex-sx;
	const h = ey-sy;
	ctx.fillStyle = '#fff';
	ctx.fillRect(sx, sy, w, h);
	// Display "letter" on block
	if (letters[idx]) {
		ctx.font = '24px sans-serif';
		ctx.fillStyle = '#000';
		ctx.fillText(letters[idx], sx+w/2-6, sy+h/2+8);
	}
}

// A, B, AA, AB, etc.
function makeLetter(idx) {
	let letter = '';
	do {
		const i = idx % 26;
		letter = String.fromCharCode(65+i) + letter;
		idx = Math.floor(idx/26) - 1;
	} while (idx >= 0);
	return letter;
}

function regenLetters() {
	const ps = $$('#answers-div p');
	letters = [];
	let letterCount = 0;
	for (let i=0; i<ps.length; i++) {
		const button = ps[i].querySelector('button');
		const span = ps[i].querySelector('span');
		if (button.innerText === 'Hide') {
			letters[i] = makeLetter(letterCount++);
			span.innerText = letters[i] + '.';
		} else {
			letters[i] = null;
		}
	}
}

function repaint() {
	if (!img) {
		return;
	}
	const canvas = $('#edit-canvas');
	const ctx = canvas.getContext('2d');
	const wRatio = canvas.width/img.width;
	const hRatio = canvas.height/img.height;
	let w, h;
	if (wRatio > hRatio) {
		w = img.width*hRatio;
		h = img.height*hRatio;
	} else {
		w = img.width*wRatio;
		h = img.height*wRatio;
	}
	const padw = (canvas.width-w)/2;
	const padh = (canvas.height-h)/2;
	ctx.drawImage(img, padw, padh, w, h);
	// Draw blocks
	for (let i=0; i<blocks.length; i++) {
		drawBlock(ctx, i);
	}
}

window.addEventListener('load', e => {
	// Check for URI error
	const searchParams = new URLSearchParams(window.location.search);
	const err = searchParams.get('err');
	name = searchParams.get('name');
	password = searchParams.get('password');
	// Display error
	if (err) {
		$('#err').innerText = err;
		$('#err').style.display = 'block';
	}
	// Fill in name and password if they are available
	if (name) {
		$('#page-name').value = name;
	}
	if (password) {
		$('#page-password').value = password;
	}
	// If we have no error and we are in page editing mode
	if (!err && name && password) {
		editPage(name, password);
	}
	// Fill in pages from server
	fetch('get-pages.php')
	.then(resp => resp.json())
	.then(json => {
		pages = json;
		for (let i=0; i<pages.length; i++) {
			const opt = document.createElement('option');
			opt.innerText = pages[i];
			$('#page-select').appendChild(opt);
			// Check if we have name through url
			if (name && pages[i] === name) {
				$('#page-select').selectedIndex = i;
			}
		}
		// We load site for the first time and don't have name
		// but there are pages uploaded - choose the first one
		if (!name && pages.length > 0) {
			name = pages[0];
			editPage(pages[0]);
		}
		// User changes page
		$('#page-select').addEventListener('input', e => {
			name = pages[$('#page-select').selectedIndex];
			editPage(name);
		});
	})
	.catch(err => alert(err));
	// Check page name validity while typing
	$('#page-name').addEventListener('input', e => {
		const text = $('#page-name').value;
		if (!isAlphaNumeric(text) || isBlank(text)) {
			$('#page-name-warning').style.display = 'block';
		} else {
			$('#page-name-warning').style.display = 'none';
		}
		let sameName = false;
		for (let i=0; i<pages.length; i++) {
			if (pages[i] === text) {
				sameName = true;
				break;
			}
		}
		if (sameName) {
			$('#page-name-dup-warning').style.display = 'block';
		} else {
			$('#page-name-dup-warning').style.display = 'none';
		}
	});
	// Check password validity while typing
	$('#page-password').addEventListener('input', e => {
		const text = $('#page-password').value;
		if (!isAlphaNumeric(text) || isBlank(text)) {
			$('#page-password-warning').style.display = 'block';
		} else {
			$('#page-password-warning').style.display = 'none';
		}
	});
	// Check submit logic
	$('#page-upload-submit').addEventListener('click', e => {
		const name = $('#page-name').value;
		const password = $('#page-password').value;
		if (!isAlphaNumeric(name) || isBlank(name)) {
			alert('Bad page name');
			e.preventDefault();
			return;
		}
		let sameName = false;
		for (let i=0; i<pages.length; i++) {
			if (pages[i] === name) {
				sameName = true;
				break;
			}
		}
		if (sameName) {
			alert('A page with that name already exists');
			e.preventDefault();
			return;
		}
		if (!isAlphaNumeric(password) || isBlank(password)) {
			alert('Bad page password');
			e.preventDefault();
			return;
		}
		if ($('#page-upload').files.length != 1) {
			alert('Need to select one image file for upload');
			e.preventDefault();
			return;
		}
		if (!$('#page-upload').files[0].name.match(/(jpg|jpeg|png|gif)$/i)) {
			alert('Uploaded file must be in JPG, PNG, or GIF format');
			e.preventDefault();
			return;
		}
	});
	$('#delete-page').addEventListener('click', e => {
		const password = $('#edit-password').value;
		// Validate name and password (global name)
		if (!isAlphaNumeric(name) || isBlank(name)) {
			alert('Bad page name');
			return;
		}
		if (!isAlphaNumeric(password) || isBlank(password)) {
			alert('Bad page password');
			return;
		}
		// Do the delete (and redirect back)
		window.location.href = `delete.php?name=${name}&password=${password}`;
	});
	// Placing and deleting blocks and letters on the image
	$('#edit-canvas').addEventListener('mousedown', e => {
		addingBlock = true;
		const from = Point(e.offsetX, e.offsetY);
		const to = from;
		blocks.push(Block(from, to));
	});
	$('#edit-canvas').addEventListener('mouseout', e => {
		if (addingBlock) {
			blocks.pop();
			addingBlock = false;
			repaint();
		}
	});
	$('#edit-canvas').addEventListener('mousemove', e => {
		if (addingBlock) {
			const to = Point(e.offsetX, e.offsetY);
			blocks.at(-1).to = to;
			repaint();
		}
	});
	$('#edit-canvas').addEventListener('mouseup', e => {
		if (addingBlock) {
			addingBlock = false;
			addAnswer();
			regenLetters();
			repaint();
		}
	});
	// Save blocks with answers
	$('#save-page').addEventListener('click', e => {
		// Check that name and password isn't blank
		if (!isAlphaNumeric(name) || isBlank(name)) {
			alert('Bad page name');
			return;
		}
		const password = $('#edit-password').value;
		if (!isAlphaNumeric(password) || isBlank(password)) {
			alert('Bad page password');
			return;
		}
		// Check that all lettered blocks have answers
		// Pack all answers into blocks
		const savBlocks = [];
		const ps = $$('#answers-div p');
		for (let i=0; i<blocks.length; i++) {
			savBlocks.push(Block(blocks[i].from, blocks[i].to));
			if (letters[i]) {
				const answer = ps[i].querySelector('input').value;
				if (!answer.trim()) {
					alert(`Answer block ${letters[i]} is blank`);
					return;
				}
				savBlocks.at(-1).answer = answer.trim().toLowerCase();
			} else {
				savBlocks.at(-1).answer = '';
			}
		}
		const payload = {name, password, savBlocks};
		const json = JSON.stringify(payload);
		// Send to server
		fetch('save.php', {method: "POST", body: json})
		.then(resp => resp.json())
		.then(json => {
			if (json.err) {
				$('#err').innerText = json.err;
				$('#err').style.display = 'block';
			} else {
				$('#feedback').innerText = 'Save successful';
				$('#feedback').style.display = 'block';
			}
		})
		.catch(err => {
			$('#err').innerText = err;
			$('#err').style.display = 'block';
		});
	});
});
