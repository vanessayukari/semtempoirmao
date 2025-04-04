const video = document.getElementById('video');
const cobrinhaContainer = document.getElementById('cobrinha-container');
const resultado = document.getElementById('resultado');
const textoResultado = document.getElementById('texto-resultado');
const novaBusca = document.getElementById('nova-busca');

video.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(video);

    cobrinhaContainer.style.display = 'flex';
    video.style.display = 'none';

    const response = await fetch('/analise', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    setTimeout(() => {
        cobrinhaContainer.style.display = 'none';
        resultado.style.display = 'block';
        textoResultado.innerHTML = convertMarkdownToHTML(data.analysis);
    }, 3000);
};

function resetPage() {
    resultado.style.display = 'none';
    video.style.display = 'block';
    document.getElementById('url').value = '';
}

// Jogo da cobrinha
var canvas = document.getElementById('cobrinha');
var context = canvas.getContext('2d');
var grid = 16;
var count = 0;
var snake = {
    x: 160,
    y: 160,
    dx: grid,
    dy: 0,
    cells: [],
    maxCells: 4
};
var apple = {
    x: 320,
    y: 320
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function loop() {
    requestAnimationFrame(loop);

    if (++count < 8) {
        return;
    }

    count = 0;
    context.clearRect(0, 0, canvas.width, canvas.height);

    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0) {
        snake.x = canvas.width - grid;
    } else if (snake.x >= canvas.width) {
        snake.x = 0;
    }

    if (snake.y < 0) {
        snake.y = canvas.height - grid;
    } else if (snake.y >= canvas.height) {
        snake.y = 0;
    }

    snake.cells.unshift({x: snake.x, y: snake.y});

    if (snake.cells.length > snake.maxCells) {
        snake.cells.pop();
    }

    context.fillStyle = 'black';
    context.fillRect(apple.x, apple.y, grid - 1, grid - 1);

    context.fillStyle = 'black';
    snake.cells.forEach(function(cell, index) {
        context.fillRect(cell.x, cell.y, grid - 1, grid - 1);

        if (cell.x === apple.x && cell.y === apple.y) {
            snake.maxCells++;
            apple.x = getRandomInt(0, 25) * grid;
            apple.y = getRandomInt(0, 25) * grid;
        }

        for (var i = index + 1; i < snake.cells.length; i++) {
            if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
                snake.x = 160;
                snake.y = 160;
                snake.cells = [];
                snake.maxCells = 4;
                snake.dx = grid;
                snake.dy = 0;

                apple.x = getRandomInt(0, 25) * grid;
                apple.y = getRandomInt(0, 25) * grid;
            }
        }
    });
}

document.addEventListener('keydown', function(e) {
    if (e.which === 37 && snake.dx === 0) {
        snake.dx = -grid;
        snake.dy = 0;
    } else if (e.which === 38 && snake.dy === 0) {
        snake.dy = -grid;
        snake.dx = 0;
    } else if (e.which === 39 && snake.dx === 0) {
        snake.dx = grid;
        snake.dy = 0;
    } else if (e.which === 40 && snake.dy === 0) {
        snake.dy = grid;
        snake.dx = 0;
    }
});

requestAnimationFrame(loop);

// Função para formatar resposta do Chat GPT
function convertMarkdownToHTML(markdownText) {
    let htmlText = markdownText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    htmlText = htmlText.replace(/\n/g, '<br>');
    htmlText = htmlText.replace(/^(#{1,6})\s*(.*?)$/gm, (match, p1, p2) => {
    const level = p1.length;
    return `<h${level}>${p2}</h${level}>`;
});
    return htmlText;
}
