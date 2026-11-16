import format from "pg-format";

export function formatForUpdate(data) {
  const columns = Object.keys(data);

  const setClause = columns
    .map((key) => format("%I = %L", key, data[key]))
    .join(", ");

  return setClause;
}
