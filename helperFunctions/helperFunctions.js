export const removeResponseFields = (data) => {
  let newUpdatedArr = []

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    newUpdatedArr.push(data);
  } else {
    newUpdatedArr = data;
  }

  const fieldsToRemove = [
    "is_deleted",
    "deleted_at",
    "deleted_by",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ];

  console.log(data, "------------")

  if (Array.isArray(newUpdatedArr)) {
    for (let i = 0; i < newUpdatedArr.length; i++) {
      for (let j = 0; j < fieldsToRemove.length; j++) {
        delete newUpdatedArr[i][fieldsToRemove[j]];
      }
    }
  }

  return data;
};
