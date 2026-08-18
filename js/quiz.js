const $ = q => document.querySelector(q);
const $$ = q => [...document.querySelectorAll(q)];

function Point(x, y) {
	return {x, y};
}

function Block(from, to) {
	return {from, to};
}

let img = null;
let pages = [];
let blocks = [];
let letters = [];

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

function loadPage(name) {
	// Get extension corresponding to name
	fetch('get-ext.php?name=' + name)
	.then(resp => resp.text())
	.then(ext => {
		if (ext === 'NameError') {
			alert(ext);
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
				alert(json.err);
				return;
			} 
			// Update answers-div
			$$('#answers-div p').forEach(p => {
				p.parentNode.removeChild(p);
			});
			blocks = [];
			letters = [];
			let letterCount = 0;
			for (let i=0; i<json.length; i++) {
				const block = json[i];
				blocks.push(Block(Point(block.fromx, block.fromy), Point(block.tox, block.toy)));
				if (block.answer) {
					letters[i] = makeLetter(letterCount++);
					addAnswer(letters[i], block.answer);
				} else {
					letters[i] = null;
				}
			}
			repaint();
		})
		.catch(err => {
			alert(err);
		});
	});
}

function addAnswer(letter, answer) {
	const p = document.createElement('p');
	const letterSpan = document.createElement('span');
	const answerInput = document.createElement('input');
	const correctImg = document.createElement('img');
	const wrongImg = document.createElement('img');
	const showButton = document.createElement('button');
	const answerSpan = document.createElement('span');
	letterSpan.innerText = letter + '.';
	correctImg.src = 'images/correct.png';
	correctImg.width = 20;
	correctImg.height = 20;
	correctImg.classList.add('hidden');
	wrongImg.src = 'images/wrong.png';
	wrongImg.width = 20;
	wrongImg.height = 20;
	wrongImg.classList.add('hidden');
	showButton.innerText = 'Show';
	answerSpan.innerText = answer;
	answerSpan.classList.add('hidden');
	showButton.addEventListener('click', e => {
		if (showButton.innerText === 'Show') {
			showButton.innerText = 'Hide';
			answerSpan.style.display = 'inline';
		} else {
			showButton.innerText = 'Show';
			answerSpan.style.display = 'none';
		}
	});
	answerInput.addEventListener('input', e => {
		if (answerInput.value.trim().toLowerCase() === answer) {
			correctImg.style.display = 'inline-block';
			wrongImg.style.display = 'none';
		} else {
			correctImg.style.display = 'none';
			wrongImg.style.display = 'inline-block';
		}
	});
	p.appendChild(letterSpan);
	p.appendChild(answerInput);
	p.appendChild(correctImg);
	p.appendChild(wrongImg);
	p.appendChild(showButton);
	p.appendChild(answerSpan);
	$('#answers-div').appendChild(p);
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

function repaint() {
	if (!img) {
		return;
	}
	const canvas = $('#quiz-canvas');
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
	// Get list of all pages
	fetch('get-pages.php')
	.then(resp => resp.json())
	.then(json => {
		pages = json;
		for (let i=0; i<pages.length; i++) {
			const opt = document.createElement('option');
			opt.innerText = pages[i];
			$('#page-select').appendChild(opt);
		}
		// We load site for the first time, default to first page
		if (pages.length > 0) {
			loadPage(pages[0]);
		}
		// User changes page
		$('#page-select').addEventListener('input', e => {
			const name = pages[$('#page-select').selectedIndex];
			loadPage(name);
		});
	})
	.catch(err => alert(err));
});
