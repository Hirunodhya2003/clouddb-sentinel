// Owner: Member 02
// Backend contract:
//   GET /api/v1/schema/tables        -> [{ table_name, primary_key: [..],
//                                          columns: [{ column_name, data_type, nullable, default,
//                                                      is_primary_key, is_foreign_key, is_unique, auto_increment }] }]
//   GET /api/v1/schema/relationships -> [{ constraint_name, table_name, column_name,
//                                          referenced_table, referenced_column, on_update, on_delete }]
import api from "./api.js";

const schemaViewerService = {
  tables: () => api.get("/schema/tables"),
  relationships: () => api.get("/schema/relationships"),
};

export default schemaViewerService;
