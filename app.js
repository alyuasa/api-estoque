const express = require('express');
const app = express();
const db = require('./mysql');

app.use(express.json());

app.get('/produtos', async (req, res) => {
    try {
        const [produtos] = await db.query('SELECT * FROM produtos');
        res.status(200).json(produtos);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar dados do banco' });
    }
});

app.get('/vw_estoque', async (req, res) => {
    try {
        const [valorEstoque] = await db.query('SELECT * FROM vw_estoque');
        res.status(200).json(valorEstoque);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar dados do banco' });
    }
});

app.post('/novo-produto', async (req, res) => {
    const { nome, categoria, quantidade, valor } = req.body;

    if (categoria.length <= 1) {
        return res.status(400).json({ erro: 'A categoria do produto é obrigatória' });
    } else if (Number(quantidade) <= 0) {
        return res.status(400).json({ erro: 'A quantidade do produto é obrigatória' });
    } else if (valor === undefined || typeof valor !== 'number' || valor <= 0) {
        return res.status(400).json({ erro: 'O valor do produto é obrigatório' });
    }

    try {
        const query = 'INSERT INTO produtos (nome, categoria, quantidade, valor) VALUES (?, ?, ?, ?)';
        await db.execute(query, [nome, categoria, quantidade, valor]);
        res.status(201).json("Produto cadastrado com sucesso!");
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar novo produto' });
    }
});

app.post('/movimentacoes/entrada', async (req, res) => {
    const {qtd_movimentacao, id_produto_movimentado} = req.body;

    try {
    const atualizarEstoque = 'UPDATE produtos SET quantidade = quantidade + ? WHERE id_produto = ?';
    const [estoqueAtualizado] = await db.execute(atualizarEstoque, [qtd_movimentacao, id_produto_movimentado]);

    if (estoqueAtualizado.affectedRows === 0) {
        return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    const query = 'INSERT INTO movimentacoes (data, tipo, id_produto_movimentado, qtd_movimentacao) VALUES (NOW(), "entrada", ?, ?)'
    await db.execute(query, [id_produto_movimentado, qtd_movimentacao]);
    res.status(201).json("Entrada de produto registrada com sucesso");
    
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao registrar entrada de produto' });
    }
});

app.post('/movimentacoes/saida', async (req, res) => {
    const {qtd_movimentacao, id_produto_movimentado} = req.body;

    try {
        const atualizarEstoque = 'UPDATE produtos SET quantidade = quantidade - ? WHERE id_produto = ?';
        const [estoqueAtualizado] = await db.execute(atualizarEstoque, [qtd_movimentacao, id_produto_movimentado]);
        
        if (estoqueAtualizado.affectedRows === 0) {
            return res.status(200).json({ erro: 'Produto não encontrado' });
        }

        const query = 'INSERT INTO movimentacoes (data, tipo, qtd_movimentacao, id_produto_movimentado) VALUES (NOW(), "saída", ?, ?)';
        await db.query(query, [qtd_movimentacao, id_produto_movimentado]);
        res.status(201).json("Saída de produto registrado com sucesso");

    } catch (erro) {
        // Adicione esta linha para ver o erro no terminal do VS Code/Prompt:
        console.error("ERRO REAL DO BANCO:", erro);
        
        // Altere esta linha para o Postman te mostrar o motivo exato:
        return res.status(500).json({ 
            erro: 'Erro ao registrar saída de produto', 
            detalhes: erro.message,
            codigo_mysql: erro.code 
        });
    }
});

app.get('/movimentacoes/saidas', async (req, res) => {
    try {
        const [saídas] = await db.execute('SELECT * FROM movimentacoes ORDER BY data DESC;');
        res.status(200).json(saídas);    
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar saídas registradas' });
    }
});

app.use((req, res, next) => {
    const error = new Error('Rota não encontrada');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500).json({ erro: error.message });
});

module.exports = app;