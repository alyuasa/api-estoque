const express = require('express');
const app = express();
const db = require('./mysql');

app.use(express.json());


app.get('/vw_estoque', async (req, res) => {
    try {
        const [valorEstoque] = await db.query('SELECT * FROM vw_estoque');
        res.status(200).json(valorEstoque);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar dados do banco'});
    }
});

app.use((req, res, next) => {
    const error = new Error('Rota não encontrada');
    error.status = 404;
    next(error);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
})


app.listen(3000, () => {
    console.log(`Servidor FORÇADO na porta 3000`);
});


module.exports = app;