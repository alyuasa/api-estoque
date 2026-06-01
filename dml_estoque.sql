INSERT INTO produtos (nome, categoria, quantidade, valor)
VALUES ("camiseta", "roupas", 150, 39.90),
	   ("condicionador", "higiene", 90, 15.70),
       ("barra chocolate", "alimentação", 120, 11.90);
       
       
CREATE VIEW vw_estoque AS
SELECT id_produto,
	   nome,
       ROUND(quantidade * valor, 2) AS valor_total
FROM produtos;

SELECT * FROM produtos;
SELECT * FROM movimentacoes ORDER BY data DESC;





