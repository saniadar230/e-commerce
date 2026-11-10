export const removeResponseFields = (data) => {
  const fieldsToRemove = [
    "is_deleted",
    "deleted_at",
    "deleted_by",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ];

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < fieldsToRemove.length; j++) {
        delete data[i][fieldsToRemove[j]];
      }
    }
  }

  return data;
};
