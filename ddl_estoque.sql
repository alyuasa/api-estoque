-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema estoque
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `estoque` ;

-- -----------------------------------------------------
-- Schema estoque
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `estoque` DEFAULT CHARACTER SET utf8 ;
USE `estoque` ;

-- -----------------------------------------------------
-- Table `estoque`.`produtos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `estoque`.`produtos` ;

CREATE TABLE IF NOT EXISTS `estoque`.`produtos` (
  `id_produto` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `categoria` VARCHAR(255) NOT NULL,
  `quantidade` INT NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id_produto`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `estoque`.`movimentacoes`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `estoque`.`movimentacoes` ;

CREATE TABLE IF NOT EXISTS `estoque`.`movimentacoes` (
  `id_movimentacao` INT NOT NULL AUTO_INCREMENT,
  `data` DATETIME NOT NULL,
  `tipo` VARCHAR(10) NOT NULL,
  `qtd_movimentacao` INT NOT NULL,
  `id_produto_movimentado` INT NOT NULL,
  PRIMARY KEY (`id_movimentacao`),
  INDEX `fk_movimentacoes_produtos_idx` (`id_produto_movimentado` ASC) VISIBLE,
  CONSTRAINT `fk_movimentacoes_produtos`
    FOREIGN KEY (`id_produto_movimentado`)
    REFERENCES `estoque`.`produtos` (`id_produto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
