
    SELECT *
    FROM (
      SELECT 5 AS number, 1 AS second, foo AS third
      UNION
      SELECT 5 AS number, 4 AS second, 'foo' AS third
    ) sub_query
    LEFT JOIN, (
      SELECT * FROM UNNEST(ARRAY[1,2,3])
    );
  