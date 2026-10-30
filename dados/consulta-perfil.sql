-- GoogleSQL / BigQuery. Confira o volume estimado antes de executar.
-- Referência: RAIS 2025, vínculos ativos e remuneração positiva.
-- tempo_emprego: permanência no vínculo, em meses; não é experiência total.
WITH mapa AS (
SELECT 'professor' AS profissao, '231105' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '231110' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '231205' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '231210' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '231305' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '231310' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '231315' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '231320' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '231325' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '231330' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '231335' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '231340' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232105' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232110' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232115' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232120' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232125' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232130' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232135' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232140' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232145' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232150' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232155' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232160' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232165' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '232170' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '233105' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '233110' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '233115' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '233120' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '233125' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '233130' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '233135' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '233220' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '233225' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234105' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234110' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234115' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234120' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234125' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234205' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234210' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234215' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234305' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234310' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234315' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234320' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234405' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234410' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234415' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234420' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234425' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234430' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234435' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234440' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234445' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234450' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234455' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234460' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234505' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234510' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234515' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234520' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234604' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234608' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234612' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234616' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234620' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234624' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234628' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234632' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234636' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234640' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234644' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234648' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234652' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234656' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234660' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234664' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234668' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234672' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234676' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234680' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234684' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234689' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234705' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234710' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234715' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234720' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234725' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234730' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234735' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234740' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234745' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234750' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234755' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234760' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234765' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234770' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234805' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234810' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234815' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234905' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234910' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '234915' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '239205' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '239210' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '239215' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '239220' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '239225' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '239420' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '262830' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '331105' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '331205' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '331305' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '332105' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '332205' AS cbo
UNION ALL
SELECT 'professor' AS profissao, '333115' AS cbo
UNION ALL
SELECT 'veterinario' AS profissao, '223305' AS cbo
UNION ALL
SELECT 'advogado' AS profissao, '241005' AS cbo
UNION ALL
SELECT 'advogado' AS profissao, '241010' AS cbo
UNION ALL
SELECT 'advogado' AS profissao, '241015' AS cbo
UNION ALL
SELECT 'advogado' AS profissao, '241020' AS cbo
UNION ALL
SELECT 'advogado' AS profissao, '241025' AS cbo
UNION ALL
SELECT 'advogado' AS profissao, '241030' AS cbo
UNION ALL
SELECT 'advogado' AS profissao, '241035' AS cbo
UNION ALL
SELECT 'advogado' AS profissao, '241205' AS cbo
UNION ALL
SELECT 'cabeleireiro' AS profissao, '516110' AS cbo
UNION ALL
SELECT 'cozinheiro' AS profissao, '513205' AS cbo
UNION ALL
SELECT 'cozinheiro' AS profissao, '513210' AS cbo
UNION ALL
SELECT 'cozinheiro' AS profissao, '513215' AS cbo
UNION ALL
SELECT 'cozinheiro' AS profissao, '513220' AS cbo
UNION ALL
SELECT 'cozinheiro' AS profissao, '513225' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223505' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223510' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223515' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223520' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223525' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223530' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223535' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223540' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223545' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223550' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223555' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223560' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223565' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223580' AS cbo
UNION ALL
SELECT 'enfermeiro' AS profissao, '223585' AS cbo
UNION ALL
SELECT 'designer-grafico' AS profissao, '262410' AS cbo
UNION ALL
SELECT 'farmaceutico' AS profissao, '223405' AS cbo
UNION ALL
SELECT 'farmaceutico' AS profissao, '223415' AS cbo
UNION ALL
SELECT 'farmaceutico' AS profissao, '223420' AS cbo
UNION ALL
SELECT 'farmaceutico' AS profissao, '223425' AS cbo
UNION ALL
SELECT 'farmaceutico' AS profissao, '223430' AS cbo
UNION ALL
SELECT 'farmaceutico' AS profissao, '223435' AS cbo
UNION ALL
SELECT 'farmaceutico' AS profissao, '223440' AS cbo
UNION ALL
SELECT 'farmaceutico' AS profissao, '223445' AS cbo
UNION ALL
SELECT 'programador' AS profissao, '317105' AS cbo
UNION ALL
SELECT 'programador' AS profissao, '317110' AS cbo
UNION ALL
SELECT 'programador' AS profissao, '317120' AS cbo
UNION ALL
SELECT 'analista-sistemas' AS profissao, '212405' AS cbo
UNION ALL
SELECT 'desenvolvedor-software' AS profissao, '212405' AS cbo
UNION ALL
SELECT 'vendedor' AS profissao, '354145' AS cbo
UNION ALL
SELECT 'vendedor' AS profissao, '521105' AS cbo
UNION ALL
SELECT 'vendedor' AS profissao, '521110' AS cbo
UNION ALL
SELECT 'vendedor' AS profissao, '524105' AS cbo
UNION ALL
SELECT 'vendedor' AS profissao, '524215' AS cbo
UNION ALL
SELECT 'vendedor' AS profissao, '524305' AS cbo
UNION ALL
SELECT 'caminhoneiro' AS profissao, '782510' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '341115' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '725405' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '725410' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '725415' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '725420' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '725705' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911105' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911110' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911115' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911120' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911125' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911130' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911135' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911205' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911305' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911310' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911315' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911320' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '911325' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '913105' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '913110' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '913115' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '913120' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '914105' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '914110' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '914205' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '914305' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '914405' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '914410' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '914415' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '914420' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '914425' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '919205' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '919305' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '919310' AS cbo
UNION ALL
SELECT 'mecanico' AS profissao, '954120' AS cbo
), classificados AS (
    SELECT
        m.profissao,
        v.sigla_uf AS estado,
        CASE SAFE_CAST(v.grau_instrucao_apos_2005 AS INT64)
            WHEN 1 THEN 'sem-instrucao'
            WHEN 2 THEN 'fundamental-incompleto'
            WHEN 3 THEN 'fundamental-incompleto'
            WHEN 4 THEN 'fundamental-incompleto'
            WHEN 5 THEN 'fundamental-completo'
            WHEN 6 THEN 'medio-incompleto'
            WHEN 7 THEN 'medio-completo'
            WHEN 8 THEN 'superior-incompleto'
            WHEN 9 THEN 'superior-completo'
            WHEN 10 THEN 'superior-completo'
            WHEN 11 THEN 'superior-completo'
        END AS escolaridade,
        CASE
            WHEN v.tempo_emprego >= 0 AND v.tempo_emprego <= 12 THEN 'ate-1'
            WHEN v.tempo_emprego > 12 AND v.tempo_emprego <= 60 THEN 'mais-1-ate-5'
            WHEN v.tempo_emprego > 60 AND v.tempo_emprego <= 120 THEN 'mais-5-ate-10'
        END AS tempoEmprego,
        CAST(v.valor_remuneracao_media AS NUMERIC) AS remuneracao
    FROM `basedosdados.br_me_rais.microdados_vinculos` v
    JOIN mapa m ON m.cbo = v.cbo_2002
    JOIN `basedosdados.br_bd_diretorios_brasil.municipio` municipio
        ON municipio.id_municipio = v.id_municipio
    WHERE v.ano = 2025
        AND v.vinculo_ativo_3112 = '1'
        AND v.valor_remuneracao_media > 0
), agregados AS (
    SELECT
        2025 AS anoBase,
        profissao,
        estado,
        escolaridade,
        tempoEmprego,
        CAST(CAST(ROUND(AVG(remuneracao) * 100) AS INT64) AS STRING) AS valorCentavos,
        COUNT(*) AS vinculos
    FROM classificados
        GROUP BY GROUPING SETS (
        (profissao, estado, escolaridade, tempoEmprego),
        (profissao, escolaridade, tempoEmprego),
        (profissao, estado, escolaridade),
        (profissao, estado, tempoEmprego),
        (profissao, escolaridade),
        (profissao, tempoEmprego),
        (profissao, estado),
        (profissao)
    )
    HAVING (GROUPING(estado) = 1 OR estado IS NOT NULL)
        AND (GROUPING(escolaridade) = 1 OR escolaridade IS NOT NULL)
        AND (GROUPING(tempoEmprego) = 1 OR tempoEmprego IS NOT NULL)
        AND COUNT(*) >= 30
)
SELECT * FROM agregados
ORDER BY profissao, estado, escolaridade, tempoEmprego;
