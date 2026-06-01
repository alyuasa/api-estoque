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
        res.status(500).json({ erro: 'Erro ao buscar dados do banco:', erro });
    }
});

app.get('/vw_estoque', async (req, res) => {
    try {
        const [valorEstoque] = await db.query('SELECT * FROM vw_estoque');
        res.status(200).json(valorEstoque);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar dados do banco:', erro });
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
        res.status(500).json({ erro: "Erro ao cadastrar novo produto:", erro });
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
        res.status(500).json({ erro: 'Erro ao registrar entrada de produto:', erro });
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
        console.error(erro);
        
        return res.status(500).json({ erro: 'Erro ao registrar saída de produto:', erro});
    }
});

app.get('/movimentacoes/saidas', async (req, res) => {
    try {
        const [saídas] = await db.execute('SELECT * FROM movimentacoes ORDER BY data DESC;');
        res.status(200).json(saídas);    
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar saídas registradas:', erro });
    }
});

app.get('/valor-total', async (req, res) => {
    try {
        const query = `SELECT p.categoria, ROUND(SUM(v.valor_total), 2) AS valor_total_categoria, SUM(p.quantidade) AS quantidade_total_produtos FROM produtos p INNER JOIN vw_estoque v ON p.id_produto = v.id_produto GROUP BY p.categoria ORDER BY valor_total_categoria DESC;`

        const [resultados] = await db.query(query);

        return res.status(200).json(resultados);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao calcular valor total:", erro });
    }
});

app.get('/limite-estoque', async (req, res) => {
    try {
        const query = `SELECT id_produto, nome, quantidade, categoria, CASE WHEN quantidade <= 0 THEN 'Limite Mínimo Atingido (Crítico)' WHEN quantidade >= 100 THEN 'Limite Máximo Atingido (Excesso)' END AS status_limite, ROUND((quantidade / 100.0) * 100, 2) AS percentual_nivel_atingido FROM produtos WHERE quantidade <= 0 OR quantidade >= 100 ORDER BY quantidade ASC;`

        const [limiteProduto] = await db.query(query);

        return res.status(200).json(limiteProduto);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao identificar limites de estoque:", erro });
    }
});

app.get('/movimentacoes/relatorio', async (req, res) => {
    const {data_inicial, data_final} = req.query;

    if (!data_inicial || !data_final) {
        return res.status(400).json({ erro: "A data inicial e a data final são obrigatórias" });
    }

    try {

        const dtInicio = data_inicial.trim();
        const dtFim = data_final.trim();

        
        const query = `SELECT p.nome AS nome_produto, p.unidade_medida, COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.qtd_movimentacao END), 0) AS total_entradas, COALESCE(SUM(CASE WHEN m.tipo = 'saída' THEN m.qtd_movimentacao END), 0) AS total_saidas, (COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.qtd_movimentacao END), 0) - COALESCE(SUM(CASE WHEN m.tipo = 'saída' THEN m.qtd_movimentacao END), 0)) AS saldo_no_periodo, ROUND(COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.qtd_movimentacao * p.valor END), 0), 2) AS valor_total_entradas, ROUND(COALESCE(SUM(CASE WHEN m.tipo = 'saída' THEN m.qtd_movimentacao * p.valor END), 0), 2) AS valor_total_saidas FROM produtos p INNER JOIN movimentacoes m ON p.id_produto = m.id_produto_movimentado WHERE m.data BETWEEN ? AND ? GROUP BY p.id_produto, p.nome, p.unidade_medida ORDER BY p.nome ASC`
    
        const [relatorio] = await db.query(query, [`${dtInicio} 00:00:00`, `${dtFim} 00:00:00`]);

        return res.status(200).json(relatorio);

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao gerar relatório de movimentações:", erro });
    }
});

app.get('/movimentacoes/maiores-saidas', async (req, res) => {
    const {data_inicial, data_final} = req.query;

    if (!data_inicial || !data_final) {
        return res.status(400).json({ erro: "A data inicial e a data final são obrigatórias" });
    }

    try {
        const dtInicio = data_inicial.trim();
        const dtFim = data_final.trim();

        const query = `SELECT p.nome AS nome_produto, SUM(m.qtd_movimentacao) AS quantidade_total_saidas, ROUND(SUM(m.qtd_movimentacao * p.valor), 2) AS valor_total_saidas FROM produtos p INNER JOIN movimentacoes m ON p.id_produto = m.id_produto_movimentado WHERE m.tipo = 'saída' AND m.data BETWEEN ? AND ? GROUP BY p.id_produto, p.nome ORDER BY quantidade_total_saidas DESC;`

        const [volumeSaidas] = await db.query(query, [`${dtInicio} 00:00:00`, `${dtFim} 00:00:00`]);

        return res.status(200).json(volumeSaidas);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao listar produtos com maior volume de saídas:", erro });
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