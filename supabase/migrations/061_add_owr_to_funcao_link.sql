-- Migration 061: adiciona OWR ao enum funcao_link
-- OWR = Other Writer (autor não controlado — OWT no CWR)
-- Necessário para armazenar autores não controlados com funcao_no_link = 'OWR'

ALTER TYPE funcao_link ADD VALUE IF NOT EXISTS 'OWR';
